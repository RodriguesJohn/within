# Components

Each folder maps to one part of the brief. Components take domain types as props and own no data fetching.

```
board/          Kanban board (Trello × Linear)
  KanbanBoard, Column, TicketCard, AgentPresence (avatar + live pulse + blocker badge)

ticket/         Ticket view = the agent's live workspace
  TicketView, TicketHeader, AgentSidePanel

observability/  "What is it doing / how far / where stuck" (KB §6)
  NowDoing, RunProgress, StatusBadge, BlockerCard,
  ActivityTrace, TraceStep, ToolCallItem (input/output expandable),
  AgentDefinition (system prompt + tools), OutputsList (PRs, diffs, files)

intervention/   "How a human steps in" (KB §7)
  ActionBar (driven by ACTIONS_BY_STATUS), ApprovalPrompt, AnswerQuestion,
  TakeOverMenu, PauseResume, FeedbackBox

ui/             Primitives: Button, Badge, Avatar, Disclosure, CodeBlock, Timestamp
```
