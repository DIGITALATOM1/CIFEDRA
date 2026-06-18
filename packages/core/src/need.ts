import {
  directionIds,
  type Need,
  type NeedInput,
  type NeedMatchingContext,
  type NeedStatus
} from "./domain.js";
import { isKnownCategory } from "./catalog.js";
import { createId, toIsoString, uniqueTokens } from "./utils.js";

export function createNeed(input: NeedInput, now: Date = new Date()): Need {
  return createNeedWithStatus(input, "ready_for_match", now);
}

export function createDraftNeed(input: NeedInput, now: Date = new Date()): Need {
  return createNeedWithStatus(input, "draft", now);
}

function createNeedWithStatus(input: NeedInput, status: NeedStatus, now: Date): Need {
  validateNeedInput(input);

  const timestamp = toIsoString(now);

  return {
    ...input,
    id: createId("need"),
    status,
    priority: input.priority ?? "normal",
    tags: uniqueTokens(input.tags),
    constraints: input.constraints?.filter(Boolean) ?? [],
    matching: normalizeMatchingContext(input.matching),
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

  validateMatchingContext(input);
}

function validateMatchingContext(input: NeedInput): void {
  if (!input.matching) {
    return;
  }

  for (const direction of directionIds) {
    if (direction !== input.direction && input.matching[direction] !== undefined) {
      throw new Error(
        `Matching context ${direction} does not belong to direction ${input.direction}`
      );
    }
  }

  const maxDistanceKm = input.matching.life?.maxDistanceKm;
  if (maxDistanceKm !== undefined && (!Number.isFinite(maxDistanceKm) || maxDistanceKm <= 0)) {
    throw new Error("Life maxDistanceKm must be a positive number");
  }

  const minimumExperienceYears = input.matching.work?.minimumExperienceYears;
  if (
    minimumExperienceYears !== undefined &&
    (!Number.isFinite(minimumExperienceYears) || minimumExperienceYears < 0)
  ) {
    throw new Error("Work minimumExperienceYears must be a non-negative number");
  }
}

function normalizeMatchingContext(
  matching: NeedMatchingContext | undefined
): NeedMatchingContext | undefined {
  if (!matching) {
    return undefined;
  }

  return {
    life: matching.life ? { ...matching.life } : undefined,
    work: matching.work
      ? {
          ...matching.work,
          requiredRoles: uniqueTokens(matching.work.requiredRoles),
          projectContext: uniqueTokens(matching.work.projectContext)
        }
      : undefined,
    skills: matching.skills
      ? {
          ...matching.skills,
          goals: uniqueTokens(matching.skills.goals),
          preferredFormats: [...new Set(matching.skills.preferredFormats ?? [])]
        }
      : undefined
  };
}
