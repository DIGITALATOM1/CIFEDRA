import { directionIds, type Need, type NeedInput } from "./domain.js";
import { isKnownCategory } from "./catalog.js";
import { createId, toIsoString, uniqueTokens } from "./utils.js";

export function createNeed(input: NeedInput, now: Date = new Date()): Need {
  validateNeedInput(input);

  const timestamp = toIsoString(now);

  return {
    ...input,
    id: createId("need"),
    status: "ready_for_match",
    priority: input.priority ?? "normal",
    tags: uniqueTokens(input.tags),
    constraints: input.constraints?.filter(Boolean) ?? [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function validateNeedInput(input: NeedInput): void {
  if (!directionIds.includes(input.direction)) {
    throw new Error(`Unknown direction: ${input.direction}`);
  }

  if (!isKnownCategory(input.categoryId)) {
    throw new Error(`Unknown category: ${input.categoryId}`);
  }

  if (!input.categoryId.startsWith(`${input.direction}.`)) {
    throw new Error(`Category ${input.categoryId} does not belong to ${input.direction}`);
  }

  if (input.title.trim().length < 4) {
    throw new Error("Need title must contain at least 4 characters");
  }

  if (input.description.trim().length < 12) {
    throw new Error("Need description must contain at least 12 characters");
  }

  if (input.expectedResult.trim().length < 4) {
    throw new Error("Expected result must contain at least 4 characters");
  }
}
