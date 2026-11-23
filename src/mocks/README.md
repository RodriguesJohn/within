# Mocks

One fixture per run status, all typed against `src/domain/agent-run.ts`. The UI is built against these before any real backend exists.

Planned fixtures (owned by the `data-modeler` agent):

| File | Status | Exercises |
|---|---|---|
| `run-queued.ts` | queued | empty trace, unknown total |
| `run-in-progress.ts` | in_progress | live "now doing", tool calls with input/output |
| `run-blocked-error.ts` | blocked | failed tool call, error blocker |
| `run-blocked-question.ts` | blocked | agent question with options |
| `run-needs-approval.ts` | needs_approval | approval-gated tool (deploy) |
| `run-in-review.ts` | in_review | open PR + diffs |
| `run-done.ts` | done | full trace, merged PR |
| `board.ts` | — | tickets across columns, mixed human/agent assignees |

Use realistic content: real-looking system prompts, tool names, and failure messages. Use no lorem ipsum.
