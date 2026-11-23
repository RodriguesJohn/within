# Spec: always-on agent chat + Inbox home

Status: draft · 2026-11-23

## Why

Agents surface the things a human has to do: answer a question, approve an action, review a PR. Today that only shows up in the chat inside the ticket side panel, which exists only while a ticket is open. "Needs me" is just a board filter. So a person has to go looking for the work an agent is waiting on. That works against the brief's "how does a human step in?"

Two changes:

1. **Chat is always available**, on every view, whether or not a ticket is open.
2. **Inbox is a real home**, the default landing view, listing every action that agents are waiting on.

Both read from one list of **action items**. Resolving an item in one place clears it everywhere.

## Action items (the shared model)

An action item is an open request from an agent to a human. It's derived from ticket state, not stored separately.

| Ticket state | Item kind | Ask | Primary actions |
|---|---|---|---|
| `stuck` | `answer` | `blocker.question` | Suggestions as one-tap replies, Retry, Take over |
| `approval` | `approve` | `approval.action` + `approval.reason` | Approve, Reject, Take over |
| `review` with a PR output | `review` | "PR #n is ready for review" | Open PR, Leave feedback |
| `queued` and agent-assigned | `start` | "Ready to start" | Start |

Fields: `id`, `ticketId`, `agent`, `kind`, `title`, `detail`, `since` (when the agent started waiting), `priority`, `suggestions?`.

**Order:** `approve` and `answer` first (the agent is blocked), then `review`, then `start`. Within a group, sort by ticket priority (urgent → low), then oldest `since` first.

Actions come from `ACTIONS_BY_STATUS`. This spec doesn't add new actions.

## 1. Always-on chat dock

A right-hand dock on every view (board, Inbox, agent filters). It replaces the chat block inside `AgentPanel`, so there's one chat surface, not two.

**Scope follows context:**

- **Ticket open:** the ticket's thread with its agent, as it works today. The header shows agent, ticket ID and status. A pinned card above the composer shows that ticket's open action item, if there is one.
- **No ticket open:** the **All agents** thread, a merged timeline of agent messages across tickets. Each message is tagged with ticket ID and agent. Messages that carry an open action item render as **action cards** with the inline actions above.
- A scope switcher in the dock header moves between **All agents** and recent ticket threads.

**Composer:**

- In a ticket thread, messages go to that agent, as they do today.
- In All agents, the composer defaults to **Within**, the board-wide assistant. It answers "What needs me?" (from the same action items, most urgent first), "What's Atlas doing?" and "Summarize the sprint", and replies with ticket rows you can open.
- Clicking **Reply** on an action card, or picking a ticket in the "To" menu, routes the next message to that ticket's agent.

**Always reachable:**

- The dock can collapse to a 44px rail. It can't be fully hidden.
- The rail shows a badge with the open action item count, and a live dot when any agent is working.
- `⌘J` toggles the dock. `Esc` collapses it when the composer is empty.
- A new action item while collapsed bumps the badge and briefly highlights the rail. It doesn't pop the dock open on its own.

**Ticket detail:** `AgentPanel` keeps now-doing, progress, blocker, trace and outputs. Chat moves to the dock. With a ticket open, the layout is board, then ticket panel, then dock. On narrow screens the ticket panel and dock share one column, with tabs for Details and Chat.

## 2. Inbox home

The sidebar's first item is **Inbox**, with an open-item count. It's the default view on load and replaces the "Needs me" segment.

**Layout:** a list, not a board. Groups: **Blocked on you** (`approve` and `answer`), **Ready for review**, **Ready to start**. Each group shows its count. Empty groups are hidden.

**Row:**

- Agent avatar, ticket ID and title, priority icon
- The ask in one line: blocker question or approval action, with inline code rendered
- Wait time ("waiting 14m"), from `since`
- Inline primary actions: Approve/Reject, suggestion chips, Retry, Start, Open PR
- Clicking the row body opens the ticket and scopes the chat dock to its thread

**Resolving:**

- When an item resolves (approved, answered, started), the row collapses out with a short "Done · Undo" toast (5s).
- Answering through a suggestion chip posts that text into the ticket thread as the user's message, the same path as typing it in chat.
- Destructive approvals (`approval.action` containing DROP, DELETE, deploy-to-prod) need a second click ("Confirm approve") inline. No modal.

**Empty state:** "Nothing needs you. Agents are working on N tickets." with a link to the Agents view.

## Contract changes (data-modeler)

1. Add `since` to `blocker` and `approval` (the time the agent began waiting). Add `reviewSince` for `review` tickets. Update fixtures in `web/src/data.js` and the matching `agents/*/output/<TICKET>/run.json`.
2. Add a pure `getActionItems(tickets)` selector next to the status helpers. It returns sorted items per the table above. It's the only source for the Inbox, chat action cards and the badge count.
3. Chat messages that open an item (the existing `kind: 'question'` messages) carry `actionItemId`, so the dock can render them as action cards and grey them out once resolved.

## Out of scope

- Notifications outside the app (email, Slack). This is still KB §9's open notifications question. The Inbox and badge are the in-app answer.
- Items from humans: mentions, review requests between people.
- Snooze and assign-to-someone-else on Inbox rows.

## Open questions

- Should `review` items go to everyone, or only to the ticket's requester or a reviewer group? For now: everyone.
- Should `start` items appear at all, or should agents auto-start queued work? For now: show them, lowest priority.
- On All agents, should non-action agent messages (progress chatter) be shown, or only action cards? For now: show them, but collapse runs of progress messages per ticket.
