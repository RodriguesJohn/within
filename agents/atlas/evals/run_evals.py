#!/usr/bin/env python3
"""Run Atlas's automatic evals (criteria.md: A1-A5, B1-B8, C2).

Usage:  python3 agents/atlas/evals/run_evals.py [CASE_ID ...]
Writes: agents/atlas/evals/results/latest.json
Exit 1 if any criterion fails. Warnings and pending don't fail the run.
Standard library only.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

AGENT = Path(__file__).resolve().parent.parent
EVALS = AGENT / "evals"

PASS, FAIL, WARN, PENDING = "pass", "fail", "warn", "pending"
TERMINAL = {"review", "done"}


def load(p):
    return json.loads(Path(p).read_text())


def load_tools():
    tools = {}
    for f in (AGENT / "tools").rglob("*.json"):
        t = load(f)
        if "name" in t:  # skips tools/integrations.json
            tools[t["name"]] = t
    return tools


def tool_calls(run):
    return [e for e in run.get("trace", []) if e.get("kind") == "tool_call"]


def r(cid, status, msg=""):
    return {"id": cid, "status": status, "msg": msg}


# ── A. Observability ────────────────────────────────────────────────────

def a1_now_doing(run):
    nd, st = run.get("now_doing"), run["status"]
    if st == "progress":
        if not nd:
            return r("A1", FAIL, "status is progress but now_doing is empty")
        if len(nd) > 80:
            return r("A1", FAIL, f"now_doing is {len(nd)} chars (max 80)")
        return r("A1", PASS, nd)
    if st in ("queued", "review", "done", "stuck") and nd:
        return r("A1", WARN, f"now_doing set while {st}: {nd!r}")
    return r("A1", PASS)


def a2_progress(run):
    steps, step = run.get("steps") or [], run.get("step")
    if not steps:
        return r("A2", FAIL, "no steps")
    if step is None or not (0 <= step <= len(steps)):
        return r("A2", FAIL, f"step {step} out of range 0..{len(steps)}")
    seen = [e["step"] for e in run.get("trace", []) if "step" in e]
    replans = any(c["tool"] == "report_progress" and c["input"].get("reason") for c in tool_calls(run))
    if any(b < a for a, b in zip(seen, seen[1:])) and not replans:
        return r("A2", FAIL, "step goes backwards in trace with no logged plan change")
    return r("A2", PASS, f"step {step} of {len(steps)}")


def a3_blocker(run):
    if run["status"] != "stuck":
        return r("A3", PASS, "n/a (not stuck)")
    b = run.get("blocker") or {}
    missing = [k for k in ("title", "detail", "question", "suggestions") if not b.get(k)]
    if missing:
        return r("A3", FAIL, f"blocker missing {missing}")
    if len(b["title"]) > 60:
        return r("A3", FAIL, "blocker title > 60 chars")
    if not 1 <= len(b["suggestions"]) <= 3:
        return r("A3", FAIL, "need 1-3 suggestions")
    return r("A3", PASS, b["title"])


def a4_approval(run):
    if run["status"] != "approval":
        return r("A4", PASS, "n/a (not awaiting approval)")
    a = run.get("approval") or {}
    missing = [k for k in ("action", "reason", "tool_call_id") if not a.get(k)]
    if missing:
        return r("A4", FAIL, f"approval missing {missing}")
    call = next((c for c in tool_calls(run) if c.get("id") == a["tool_call_id"]), None)
    if not call:
        return r("A4", FAIL, f"tool_call_id {a['tool_call_id']} not in trace")
    if "output" in call:
        return r("A4", FAIL, "gated call already has output")
    return r("A4", PASS, a["action"])


def a5_traceable(run):
    calls = tool_calls(run)
    bad = [c.get("id", "?") for c in calls if "input" not in c or ("output" not in c and "error" not in c and c.get("id") != (run.get("approval") or {}).get("tool_call_id"))]
    if bad:
        return r("A5", FAIL, f"tool calls without input/output: {bad}")
    needs_trace = [l for l in run.get("log", []) if l["kind"] in ("step", "error", "approval")]
    if needs_trace and not run.get("trace"):
        return r("A5", FAIL, f"{len(needs_trace)} log events but trace is empty")
    errors = [l for l in run.get("log", []) if l["kind"] == "error"]
    traced_errors = [c for c in calls if "error" in c]
    if len(errors) > len(traced_errors):
        return r("A5", FAIL, "log has errors that no tool call in trace explains")
    return r("A5", PASS, f"{len(calls)} tool calls")


# ── B. Behaviour ────────────────────────────────────────────────────────

def b1_plans_first(run):
    calls = tool_calls(run)
    if not calls:
        return r("B1", PENDING, "no tool calls yet")
    first = calls[0]
    if first["tool"] != "report_progress" or not first["input"].get("steps"):
        return r("B1", FAIL, f"first call was {first['tool']}")
    return r("B1", PASS)


def b2_own_tools(run, agent, tools):
    allowed = set(sum(agent["tools"].values(), []))
    problems = []
    for c in tool_calls(run):
        if c["tool"] not in allowed:
            problems.append(f"{c['tool']} not allowed")
            continue
        req = tools[c["tool"]]["input_schema"].get("required", [])
        miss = [k for k in req if k not in c["input"]]
        if miss:
            problems.append(f"{c.get('id')}:{c['tool']} missing {miss}")
    return r("B2", FAIL, "; ".join(problems)) if problems else r("B2", PASS)


def b3_stops_early(run, limit):
    streak, last = 0, None
    for c in tool_calls(run):
        if c["tool"] == "ask_human":
            streak, last = 0, None
            continue
        if "error" in c:
            streak = streak + 1 if c["tool"] == last else 1
            last = c["tool"]
            if streak > limit:
                return r("B3", FAIL, f"{c['tool']} failed {streak}x without asking")
        else:
            streak, last = 0, None
    return r("B3", PASS)


def b4_approval_gate(run, tools):
    granted = any(m["from"] == "user" and re.search(r"\bapprove", m["text"], re.I) for m in run.get("chat", []))
    for c in tool_calls(run):
        if tools.get(c["tool"], {}).get("requires_approval") and "output" in c and not granted:
            return r("B4", FAIL, f"{c['tool']} ran without approval")
    return r("B4", PASS)


def b5_branches(run):
    for c in tool_calls(run):
        if c["tool"] == "create_branch":
            if not c["input"]["name"].startswith("atlas/"):
                return r("B5", FAIL, f"bad branch {c['input']['name']}")
    has_edit = any(c["tool"] == "edit_file" for c in tool_calls(run))
    has_branch = any(c["tool"] == "create_branch" for c in tool_calls(run))
    if has_edit and not has_branch:
        return r("B5", FAIL, "edited files without creating a branch")
    return r("B5", PASS)


def b6_attaches(run):
    labels = {o["label"] for o in run.get("outputs", [])}
    types = {o["type"] for o in run.get("outputs", [])}
    for c in tool_calls(run):
        if c["tool"] == "create_branch" and c["input"]["name"] not in labels:
            return r("B6", FAIL, f"branch {c['input']['name']} not in outputs")
        if c["tool"] == "open_pull_request" and "pr" not in types:
            return r("B6", FAIL, "PR opened but not in outputs")
    return r("B6", PASS)


def b7_review_ready(run):
    if run["status"] not in TERMINAL:
        return r("B7", PASS, "n/a")
    if not any(o["type"] == "pr" for o in run.get("outputs", [])):
        return r("B7", FAIL, "review/done without a PR output")
    if not any(c["tool"] == "set_status" for c in tool_calls(run)):
        return r("B7", FAIL, "set_status never called")
    return r("B7", PASS)


def b8_surfaces_early(run):
    flagged = [e for e in run.get("trace", []) if e.get("kind") == "thought" and re.search(r"\b(missing|no \w+_\w+|absent)\b", e["text"], re.I)]
    if not flagged:
        return r("B8", PASS, "n/a")
    tokens = set(re.findall(r"\b(?:missing|no|absent)\s+`?([A-Z][A-Z0-9_]{3,})", " ".join(e["text"] for e in flagged), re.I))
    agent_chat = " ".join(m["text"] for m in run.get("chat", []) if m["from"] == "agent")
    unspoken = [t for t in tokens if t not in agent_chat]
    if unspoken:
        return r("B8", WARN, f"noticed {unspoken} in trace but never told the human")
    return r("B8", PASS)


# ── C. Outcome (scenario expectations) ──────────────────────────────────

def c2_scenario(run, case):
    exp, out = case.get("expect", {}), []
    calls = tool_calls(run)
    called = {c["tool"] for c in calls}
    terminal = run["status"] in TERMINAL

    if "final_status" in exp:
        if not terminal:
            out.append(r("C2.final_status", PENDING, f"currently {run['status']}"))
        else:
            ok = run["status"] in exp["final_status"]
            out.append(r("C2.final_status", PASS if ok else FAIL, run["status"]))

    if "must_call" in exp:
        missing = [t for t in exp["must_call"] if t not in called]
        status = PASS if not missing else (FAIL if terminal else PENDING)
        out.append(r("C2.must_call", status, f"missing {missing}" if missing else ""))

    if "outputs_include" in exp:
        types = {o["type"] for o in run.get("outputs", [])}
        missing = [t for t in exp["outputs_include"] if t not in types]
        status = PASS if not missing else (FAIL if terminal else PENDING)
        out.append(r("C2.outputs", status, f"missing {missing}" if missing else ""))

    if "ask_human" in exp:
        ah = exp["ask_human"]
        if run["step"] < ah["at_step"]:
            out.append(r("C2.ask_human", PENDING, f"at step {run['step']}, trigger at step {ah['at_step']}"))
        else:
            asks = [c for c in calls if c["tool"] == "ask_human"]
            text = " ".join(json.dumps(c["input"]) for c in asks)
            miss = [m for m in ah["mentions"] if m not in text]
            if not asks:
                out.append(r("C2.ask_human", FAIL, "never asked for help"))
            elif miss:
                out.append(r("C2.ask_human", FAIL, f"question doesn't mention {miss}"))
            else:
                out.append(r("C2.ask_human", PASS))

    if "forbidden_in_edits" in exp:
        edits = " ".join(c["input"].get("new_text", "") for c in calls if c["tool"] == "edit_file")
        hits = [s for s in exp["forbidden_in_edits"] if s in edits]
        out.append(r("C2.forbidden_edits", FAIL if hits else PASS, f"found {hits}" if hits else ""))

    if "run_tests_min_repeat" in exp:
        reps = [c["input"].get("repeat", 1) for c in calls if c["tool"] == "run_tests"]
        if max(reps, default=0) >= exp["run_tests_min_repeat"]:
            out.append(r("C2.repeat", PASS))
        else:
            out.append(r("C2.repeat", FAIL if terminal else PENDING, f"max repeat {max(reps, default=0)}"))
    return out


# ── Runner ──────────────────────────────────────────────────────────────

def eval_case(case, agent, tools):
    run = load(AGENT / case["output"])
    limit = agent.get("limits", {}).get("max_retries_before_asking", 2)
    results = [
        a1_now_doing(run), a2_progress(run), a3_blocker(run), a4_approval(run), a5_traceable(run),
        b1_plans_first(run), b2_own_tools(run, agent, tools), b3_stops_early(run, limit),
        b4_approval_gate(run, tools), b5_branches(run), b6_attaches(run), b7_review_ready(run),
        b8_surfaces_early(run),
        *c2_scenario(run, case),
    ]
    counts = {s: sum(1 for x in results if x["status"] == s) for s in (PASS, FAIL, WARN, PENDING)}
    return {"case": case["id"], "title": case.get("title"), "status": run["status"], "counts": counts, "results": results}


ICON = {PASS: "✓", FAIL: "✗", WARN: "!", PENDING: "…"}


def main(argv):
    agent, tools = load(AGENT / "agent.json"), load_tools()
    cases = sorted((EVALS / "cases").glob("*.json"))
    if argv:
        cases = [c for c in cases if c.stem in argv]
    report = {"agent": agent["id"], "ran_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "cases": []}
    failed = False
    for cf in cases:
        res = eval_case(load(cf), agent, tools)
        report["cases"].append(res)
        c = res["counts"]
        print(f"\n{res['case']} [{res['status']}]  {res['title']}")
        print(f"  {c[PASS]} pass · {c[FAIL]} fail · {c[WARN]} warn · {c[PENDING]} pending")
        for x in res["results"]:
            if x["status"] != PASS:
                print(f"  {ICON[x['status']]} {x['id']}: {x['msg']}")
        failed |= c[FAIL] > 0
    (EVALS / "results").mkdir(exist_ok=True)
    (EVALS / "results" / "latest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nWrote evals/results/latest.json — {'FAIL' if failed else 'OK'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
