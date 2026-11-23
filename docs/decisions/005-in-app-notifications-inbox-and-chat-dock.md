# 005: In-app notifications through the Inbox and an always-on chat dock

## Context

Agents surface the actions humans need to take: answer a blocker, approve a risky action, review a PR, start queued work. Before this, those requests only lived in the ticket panel's chat, which exists only while a ticket is open. "Needs me" was a board filter. Two sessions also built competing chat surfaces at the same time: a per-ticket chat dock, and a floating "Within agent" that answers board-wide questions.

## Decision

- **One derived list of action items** (`web/src/lib/action-items.js`, `getActionItems`). Items come from ticket state (`stuck`, `approval`, `review` with a PR, agent `queued`). They aren't stored, so nothing can drift. The wait time comes from the matching activity-log entry, so the ticket fixtures and `run.json` files are unchanged.
- **Inbox is the default view.** It groups items into Blocked on you, Ready for review and Ready to start, with actions on each row.
- **A chat dock on every view.** It can collapse to a rail with a count badge but can't be hidden. `⌘J` toggles it. It shows the open ticket's thread, or an All agents feed where requests render as cards you can act on.
- **The Within agent lives inside the dock**, as the default recipient in All agents, not as a second floating chat. Its "What needs me?" answer reads from `getActionItems`, so it always matches the Inbox and badge.
- Destructive approvals need a second inline click. Approve, reject, retry, start and merge from the Inbox or chat offer a 5-second Undo.

## Consequences

- One `⌘J` target and one chat surface. The floating `WithinAgent` component in `within-agent.jsx` is no longer used. Its `reply` logic and `TicketRow` are reused by the dock.
- Below 1536px wide, the ticket's chat moves into a Chat tab in the ticket panel rather than a second column.
- Still open: notifications outside the app (Slack, email). Atlas's Slack integration is being designed separately.
