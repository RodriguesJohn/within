# Within — Project Knowledge Base

> Source: FigJam whiteboard **"design within"**, the "Mind map — Agent at work" section and the brief text. Pulled 2026-11-23.

## 1. The brief

**Agent at work.** A ticket has been assigned to an AI agent, and the agent is now working it on its own. Design the **ticket view** that shows:

1. What the agent is doing **right now**
2. **How far along** it is
3. **Where it's stuck**
4. **How a human steps in**

## 2. Problem

When an agent works a ticket on its own, the people around it can't see what's happening:

- They can't see what it's doing right now.
- They can't tell how far along it is.
- They don't know where it's stuck.
- It's unclear how a human steps in.

## 3. Users

| User | What they likely need from the ticket view |
|---|---|
| Developers | Live trace, diffs and PRs, a quick way to take over |
| Engineers | Blockers and errors, what's running and where |
| Designers | Outputs to review, a way to give feedback |
| Product managers | Status at a glance, progress, approvals |

*(The "need" column is inferred. The board only lists the roles.)*

## 4. Product context: Trello × Linear

- A **Kanban board** of tickets.
- Tickets can be assigned to **humans or agents**.
- **Ticket view = agent at work.** When an agent owns a ticket, the ticket view becomes its live workspace.
- A **side panel** holds the agent detail.

## 5. Status model

The lifecycle of a ticket the agent is working:

```
Queued → In progress → Done
              │
              ├─→ Stuck / blocked ──(human unblocks)──→ In progress
              ├─→ Needs approval ──(approve / reject)──→ In progress
              └─→ In review (PR) ──(merged)──→ Done
```

| Status | Meaning |
|---|---|
| Queued | Assigned, not started yet |
| In progress | Agent is working |
| Stuck / blocked | Agent can't continue without help (an issue or an error) |
| Needs approval | Agent is waiting for a human to approve an action |
| In review (PR) | Work is done and waiting on code review |
| Done | Finished |

*(The arrows between states are a proposed flow. The board only lists the states.)*

## 6. Agent observability (what the ticket view shows)

- **Now doing:** the live, current step
- **Progress:** step *x* of *n*
- **Blocker + reason:** what it's stuck on (an issue or an error)
- **Activity log / trace:** history of the steps it has taken
- **Outputs:** PRs, diffs, files

## 7. Human in the loop (how a person steps in)

- **Approve / reject** an action
- **Answer the agent's question**
- **Take over or reassign**
- **Pause / resume**
- **Leave feedback**

## 8. How the brief maps to features

| Brief question | Covered by |
|---|---|
| What is it doing right now? | Now doing (live step), activity log |
| How far along is it? | Progress (step x of n), status |
| Where is it stuck? | Stuck / blocked status, blocker + reason |
| How does a human step in? | Approve/reject, answer, take over/reassign, pause/resume, feedback |

## 9. Open questions

- What counts as a "step"? Is *n* known up front or estimated, and can it change?
- Does the agent ask for approval itself, or do set rules trigger it (deploys, destructive actions)?
- When a human takes over, does the agent's context and trace go with the ticket?
- How are agents shown on the Kanban card itself (avatar, live pulse, blocker badge)?
- Notifications: how does a human find out an agent is stuck or needs approval?

## 10. Board notes

- The board also has a **hand-drawn sketch** (about 78 freehand vectors, left of the mind map) that looks like an early wireframe. The MCP only returns it as raw vector shapes, so it isn't transcribed here. Check the board to see it.
