import type { ContactResult, ContactResultInput } from "./domain.js";
import { clampScore, createId, toIsoString } from "./utils.js";

export function recordContactResult(input: ContactResultInput, now: Date = new Date()): ContactResult {
  if (input.summary.trim().length < 4) {
    throw new Error("Contact result summary must contain at least 4 characters");
  }

  return {
    ...input,
    qualityScore: input.qualityScore === undefined ? undefined : clampScore(input.qualityScore),
    id: createId("result"),
    recordedAt: toIsoString(now)
  };
}
