# Within: agent observability ticket view

Read `PROJECT_KNOWLEDGE_BASE.md` first. It holds the brief, users, status model and open questions.

## Roles

The main Claude session is the **orchestrator**. It plans, delegates, integrates, and keeps the contract consistent. It does not build large features inline.

| Agent (`.claude/agents/`) | Owns | Output |
|---|---|---|
| `product-designer` | UX specs | `docs/specs/*.md` |
| `data-modeler` | Domain contract + fixtures | `src/domain/`, `src/lib/status.ts`, `src/mocks/` |
| `frontend-engineer` | UI implementation | `src/app/`, `src/components/` |
| `brief-reviewer` | Independent check against the brief | review report (read-only) |

## Flow per feature

1. **Spec**: product-designer writes `docs/specs/<feature>.md`.
2. **Contract**: if the spec lists contract changes, data-modeler applies them and updates fixtures.
3. **Build**: frontend-engineer implements the feature against the spec and fixtures.
4. **Review**: brief-reviewer checks the work, and the orchestrator decides what gets fixed.
5. Record any non-obvious choice in `docs/decisions/`.

Run spec and contract work in parallel when they're independent. Never have two agents edit the same files at once.

## Agent context (`agents/`)

There's one in-app agent for now: **Atlas**, the code agent. `agents/atlas/` holds `agent.json`, `system-prompt/`, `tools/` (shared + code), `input/<TICKET>.json`, `output/<TICKET>/run.json`, and `evals/`. The contract is in `agents/README.md`. Run `python3 agents/atlas/evals/run_evals.py` after any change to a run or prompt. `run.json` mirrors the ticket fields in `web/src/data.js` and adds a `trace` of tool calls with their input and output. Keep the two in sync: when a ticket changes in `data.js`, update its `run.json`, and the reverse.

## Structure

```
agents/atlas/       the in-app agent: system-prompt/ tools/ input/ output/ evals/
web/                Vite + React app (the UI)
.claude/agents/     subagent definitions
docs/specs/         UX specs (one per screen/component)
docs/decisions/     ADRs, seeded from KB §9 open questions
src/domain/         agent-run.ts: THE contract (agent, system prompt, tools, run, steps, tool calls I/O, blockers, approvals, outputs, human actions)
src/lib/            status.ts: transitions, actions per status, labels
src/mocks/          one typed fixture per run status + board
src/app/            board/ (Kanban), ticket/[id]/ (agent at work)
src/components/     board/ ticket/ observability/ intervention/ ui/
```

## Rules

- `src/domain/agent-run.ts` is the single source of truth. Change it there first, then update fixtures, then components.
- Human actions shown in the UI come from `ACTIONS_BY_STATUS`.
- Stack: Next.js App Router, TypeScript, Tailwind. Import alias `@/*` → `src/*`.
