import type { Need, NeedStatus } from "./domain.js";
import { toIsoString } from "./utils.js";

export const needStatusOrder = [
  "draft",
  "needs_clarification",
  "ready_for_match",
  "matched",
  "connected",
  "resolved"
] as const satisfies readonly NeedStatus[];

export const allowedNeedStatusTransitions = {
  draft: ["needs_clarification", "ready_for_match"],
  needs_clarification: ["draft", "ready_for_match"],
  ready_for_match: ["matched"],
  matched: ["connected"],
  connected: ["resolved"],
  resolved: []
} as const satisfies Record<NeedStatus, readonly NeedStatus[]>;

export function canTransitionNeedStatus(from: NeedStatus, to: NeedStatus): boolean {
  return (
    from === to || (allowedNeedStatusTransitions[from] as readonly NeedStatus[]).includes(to)
  );
}

export function transitionNeedStatus(
  need: Need,
  nextStatus: NeedStatus,
  now: Date = new Date()
): Need {
  if (need.status === nextStatus) {
    return need;
  }

  if (!canTransitionNeedStatus(need.status, nextStatus)) {
    throw new Error(`Cannot move need ${need.id} from ${need.status} to ${nextStatus}`);
  }

  return {
    ...need,
    status: nextStatus,
    updatedAt: toIsoString(now)
  };
}

export function markNeedReadyForMatch(need: Need, now: Date = new Date()): Need {
  return transitionNeedStatus(need, "ready_for_match", now);
}

export function markNeedNeedsClarification(need: Need, now: Date = new Date()): Need {
  return transitionNeedStatus(need, "needs_clarification", now);
}

export function markNeedMatched(need: Need, now: Date = new Date()): Need {
  return transitionNeedStatus(need, "matched", now);
}

export function markNeedConnected(need: Need, now: Date = new Date()): Need {
  return transitionNeedStatus(need, "connected", now);
}

export function markNeedResolved(need: Need, now: Date = new Date()): Need {
  return transitionNeedStatus(need, "resolved", now);
}

export function isNeedStatusAtLeast(status: NeedStatus, threshold: NeedStatus): boolean {
  return needStatusRank(status) >= needStatusRank(threshold);
}

function needStatusRank(status: NeedStatus): number {
  return needStatusOrder.indexOf(status);
}
