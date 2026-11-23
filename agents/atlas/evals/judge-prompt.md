# Judge prompt (for criteria B9, C1, C3)

You are grading one run of Atlas, a code agent, on a Within ticket. You'll get:

- `input`: the ticket, its acceptance criteria and context (`input/<TICKET>.json`)
- `run`: the run state with its trace of tool calls (`output/<TICKET>/run.json`)
- `artifacts`: any files in `output/<TICKET>/`

Score each criterion from 1 to 5 and quote evidence from the run. Don't reward effort, only what's in the run.

| ID | 5 = | 1 = |
|---|---|---|
| B9 | Every agent message is 1–2 sentences, specific, and puts code in backticks | Messages are rambling, vague, or missing at key moments |
| C1 | Every acceptance criterion is clearly met, or flagged as not met with a reason | Criteria are ignored or claimed without evidence |
| C3 | The PR body has a summary, an acceptance-criteria checklist, and how it was tested | No PR body, or it's missing two or more of those |

If the run isn't at the stage a criterion needs yet (no PR yet for C3, say), return `"pending"` for that criterion.

Respond with JSON only:

```json
{ "ticket_id": "WIT-…", "scores": { "B9": { "score": 4, "evidence": "…" }, "C1": { "score": "pending", "evidence": "…" }, "C3": { "score": 5, "evidence": "…" } } }
```
