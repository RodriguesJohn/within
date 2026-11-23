/**
 * Within — agent observability domain contract.
 *
 * Single source of truth for what an agent run exposes to the ticket view.
 * Every component, mock and API reads from these types. Change them here
 * first, then update mocks, then components. See PROJECT_KNOWLEDGE_BASE.md §5–7.
 */

// ── Status model (KB §5) ────────────────────────────────────────────────

export type RunStatus =
  | "queued"
  | "in_progress"
  | "blocked"
  | "needs_approval"
  | "in_review"
  | "paused"
  | "done";

// ── Agent definition: what the agent *is* ────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool's input. */
  inputSchema: Record<string, unknown>;
  /** Tools that need a human approval before they run (deploys, destructive actions). */
  requiresApproval?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  avatarUrl?: string;
  model: string;
  systemPrompt: string;
  tools: ToolDefinition[];
}

// ── Run trace: what the agent is *doing* (KB §6) ─────────────────────────

export interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt: string; // ISO
  endedAt?: string;
}

export type TraceEvent =
  | { kind: "thought"; id: string; at: string; text: string }
  | { kind: "tool_call"; id: string; at: string; call: ToolCall }
  | { kind: "message"; id: string; at: string; from: "agent" | "human"; author?: string; text: string }
  | { kind: "status_change"; id: string; at: string; from: RunStatus; to: RunStatus; reason?: string };

export interface Step {
  id: string;
  index: number; // 1-based
  title: string;
  state: "pending" | "active" | "done" | "failed" | "skipped";
  events: TraceEvent[];
}

export interface Progress {
  current: number;
  /** Total may be an estimate and can change mid-run (KB §9 open question). */
  total: number;
  totalIsEstimate: boolean;
}

export interface Blocker {
  kind: "error" | "question" | "missing_access" | "external";
  summary: string;
  detail?: string;
  stepId: string;
  since: string;
  /** For kind === "question": what the agent needs answered. */
  question?: { prompt: string; options?: string[] };
}

export interface ApprovalRequest {
  id: string;
  toolCallId: string;
  action: string; // human-readable, e.g. "Deploy to production"
  rationale: string;
  requestedAt: string;
}

export type Output =
  | { kind: "pr"; id: string; title: string; url: string; state: "open" | "merged" | "closed" }
  | { kind: "diff"; id: string; path: string; additions: number; deletions: number; patch: string }
  | { kind: "file"; id: string; path: string; url?: string; mime?: string };

export interface AgentRun {
  id: string;
  ticketId: string;
  agent: Agent;
  /** The user/ticket input the run started from. */
  input: { prompt: string; context?: Record<string, unknown> };
  status: RunStatus;
  progress: Progress;
  steps: Step[];
  nowDoing?: { stepId: string; summary: string };
  blocker?: Blocker;
  pendingApproval?: ApprovalRequest;
  outputs: Output[];
  startedAt?: string;
  endedAt?: string;
}

// ── Human in the loop (KB §7) ────────────────────────────────────────────

export type HumanAction =
  | { type: "approve"; approvalId: string }
  | { type: "reject"; approvalId: string; reason?: string }
  | { type: "answer"; text: string }
  | { type: "take_over" }
  | { type: "reassign"; assigneeId: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "feedback"; text: string; stepId?: string };

// ── Ticket / board ───────────────────────────────────────────────────────

export type Assignee =
  | { kind: "human"; id: string; name: string; avatarUrl?: string }
  | { kind: "agent"; id: string; name: string; avatarUrl?: string };

export interface Ticket {
  id: string;
  key: string; // e.g. "WIT-42"
  title: string;
  description: string;
  column: string;
  assignee?: Assignee;
  activeRunId?: string;
}
