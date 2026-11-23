#!/usr/bin/env python3
"""Build handoff/src/data/sessions.json from the saved Claude Code and Cursor sessions.

Keeps only what a reader needs: each message John sent and the assistant's final reply
to it. Tool calls, tool output, system reminders and file dumps are dropped. Home-folder
paths are shortened and screenshot paths become "[screenshot]".

Run from anywhere:  python3 handoff/scripts/build-chat-log.py
"""

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

HOME = Path.home()
CLAUDE_DIR = HOME / ".claude/projects/-Users-johnrodrigues-Projects-Active-Projects-Within"
CURSOR_DIR = HOME / ".cursor/projects/Users-johnrodrigues-Projects-Active-Projects-Within/agent-transcripts"
OUT = Path(__file__).resolve().parent.parent / "src/data/sessions.json"
PST = timezone(timedelta(hours=-8))
MAX_REPLY = 1800

# Session titles, written by hand so each tab reads as what it was about.
TITLES = {
    "5f2ead4e": "Project knowledge base",
    "e3329335": "Atlas agent: prompt, tools, evals",
    "fa4c40b7": "Interview page kickoff",
    "275bec13": "Interview page",
    "ba6cf24b": "Board, agents and the FigJam brief",
    "5d5bd905": "Always-on chat and inbox",
}


def clean(text: str) -> str:
    text = re.sub(r"<pasted_content[^>]*>|</pasted_content[^>]*>", "", text)
    text = re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)\s*", "", text)  # screenshots referenced in replies
    text = re.sub(r"'/(?:var|private)/folders/[^']+?\.(?:png|jpe?g)'", " [screenshot] ", text)
    text = re.sub(r"'?/(?:var|private)/folders/\S+?\.(?:png|jpe?g)'?", " [screenshot] ", text)
    text = re.sub(r"'?/(?:var|private)/folders/\S+", "[temp file]", text)
    text = text.replace(str(HOME), "~")
    # One-time sign-in and approval links: expired, but never worth publishing.
    text = re.sub(r"https://[\w.-]*vercel\.com/sso/\S+", "[sign-in link]", text)
    text = re.sub(r"https://github\.com/login/device\S*", "[sign-in link]", text)
    text = re.sub(r"/private/tmp/claude-\d+/\S+", "[temp file]", text)
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[email]", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clip(text: str) -> str:
    if len(text) <= MAX_REPLY:
        return text
    cut = text[:MAX_REPLY]
    cut = cut[: max(cut.rfind("\n\n"), cut.rfind(". ") + 1, MAX_REPLY // 2)]
    return cut.rstrip() + "\n\n…"


def local_time(iso: str) -> str:
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(PST)
    return dt.strftime("%-I:%M %p")


def is_real_prompt(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    skip = (
        "<command-",
        "<local-command",
        "<system-reminder",
        "<task-notification",
        "Caveat:",
        "[Request interrupted",
        "Briefly inform the user about the task result",
    )
    return not t.startswith(skip)


MAX_PROMPT = 700


def tidy_prompt(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text).strip()
    if text.startswith("---\ntitle:") or text.startswith("--- title:"):
        title = re.search(r"title:\s*(.+)", text)
        return f"[Pasted docs: {title.group(1).strip() if title else 'reference page'}]"
    if len(text) > MAX_PROMPT:
        return text[:MAX_PROMPT].rsplit(" ", 1)[0] + " …"
    return text


def claude_sessions():
    for f in sorted(CLAUDE_DIR.glob("*.jsonl")):
        turns, current, started = [], None, None
        for line in f.open():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("isSidechain"):
                continue
            ts = d.get("timestamp")
            started = started or ts
            msg = d.get("message") or {}
            content = msg.get("content")
            if d.get("type") == "user" and not d.get("isMeta"):
                text = content if isinstance(content, str) else " ".join(
                    b.get("text", "") for b in content or [] if isinstance(b, dict) and b.get("type") == "text"
                )
                if is_real_prompt(text):
                    current = {"time": local_time(ts) if ts else "", "prompt": clean(text), "reply": ""}
                    turns.append(current)
            elif d.get("type") == "assistant" and current is not None and isinstance(content, list):
                texts = [b["text"] for b in content if b.get("type") == "text" and b.get("text", "").strip()]
                if texts:
                    current["reply"] = texts[-1]  # the last thing said in the turn is the summary
        yield "Claude Code", f.stem, started, turns


def cursor_sessions():
    for f in sorted(CURSOR_DIR.glob("*/*.jsonl")):
        turns, current, started = [], None, None
        for line in f.open():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            blocks = (d.get("message") or {}).get("content") or []
            texts = [b.get("text", "") for b in blocks if isinstance(b, dict) and b.get("type") == "text"]
            if d.get("role") == "user":
                raw = "\n".join(texts)
                q = re.search(r"<user_query>\s*(.*?)\s*</user_query>", raw, flags=re.S)
                if not q or not is_real_prompt(q.group(1)):
                    continue
                stamp = re.search(r"<timestamp>.*?(\d{1,2}:\d{2} [AP]M)", raw)
                when = re.search(r"<timestamp>(.*?)\s\(", raw)
                if when and not started:
                    started = when.group(1)
                current = {"time": stamp.group(1) if stamp else "", "prompt": clean(q.group(1)), "reply": ""}
                turns.append(current)
            elif d.get("role") == "assistant" and current is not None:
                said = [t for t in texts if t.strip()]
                if said:
                    current["reply"] = said[-1]
        yield "Cursor", f.stem, started, turns


def sort_key(started):
    if not started:
        return ""
    try:
        return datetime.fromisoformat(started.replace("Z", "+00:00")).astimezone(PST).strftime("%H:%M")
    except ValueError:
        return datetime.strptime(started, "%A, %b %d, %Y, %I:%M %p").strftime("%H:%M")


def main():
    sessions = []
    for tool, sid, started, turns in [*claude_sessions(), *cursor_sessions()]:
        kept = []
        for t in turns:
            prompt = tidy_prompt(t["prompt"])
            if not prompt:
                continue
            if kept and kept[-1]["prompt"] == prompt:  # sent twice: keep the later reply
                kept[-1]["reply"] = clip(clean(t["reply"])) or kept[-1]["reply"]
                continue
            kept.append({"time": t["time"], "prompt": prompt, "reply": clip(clean(t["reply"]))})
        turns = kept
        if not turns:
            continue
        sessions.append(
            {
                "tool": tool,
                "id": sid[:8],
                "title": TITLES.get(sid[:8], "Session"),
                "started": turns[0]["time"],
                "sortKey": sort_key(started),
                "turns": turns,
            }
        )
    sessions.sort(key=lambda s: s["sortKey"])
    OUT.write_text(json.dumps({"date": "Nov 23, 2026", "sessions": sessions}, indent=2, ensure_ascii=False) + "\n")
    for s in sessions:
        print(f'{s["tool"]:11} {s["started"]:>8}  {len(s["turns"]):>2} turns  {s["title"]}')
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
