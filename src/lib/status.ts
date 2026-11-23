import type { HumanAction, RunStatus } from "@/domain/agent-run";

/** Allowed transitions (KB §5). Proposed flow — revisit in docs/decisions. */
export const TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  queued: ["in_progress", "paused"],
  in_progress: ["blocked", "needs_approval", "in_review", "paused", "done"],
  blocked: ["in_progress", "paused"],
  needs_approval: ["in_progress", "paused"],
  in_review: ["in_progress", "done"],
  paused: ["in_progress"],
  done: [],
};

export const canTransition = (from: RunStatus, to: RunStatus) =>
  TRANSITIONS[from].includes(to);

/** Which human actions are available in each status. Drives the intervention UI. */
export const ACTIONS_BY_STATUS: Record<RunStatus, HumanAction["type"][]> = {
  queued: ["take_over", "reassign", "pause", "feedback"],
  in_progress: ["pause", "take_over", "reassign", "feedback"],
  blocked: ["answer", "take_over", "reassign", "feedback"],
  needs_approval: ["approve", "reject", "take_over", "feedback"],
  in_review: ["feedback", "take_over"],
  paused: ["resume", "take_over", "reassign", "feedback"],
  done: ["feedback"],
};

export const STATUS_LABEL: Record<RunStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  blocked: "Stuck",
  needs_approval: "Needs approval",
  in_review: "In review",
  paused: "Paused",
  done: "Done",
};
