import { assertSupportedLanguageCode, type LanguageCode } from "./language.js";
import {
  evaluateNeedCompleteness,
  localNeedSchemas,
  requirePublishedSchema,
  type NeedSchema,
  type VersionedNeed
} from "./intake.js";
import { createId, toIsoString } from "./utils.js";

export type ClarificationStatus = "open" | "answered" | "resolved" | "waived" | "cancelled";
export type ClarificationReason = "missing" | "ambiguous" | "conflicting" | "policy" | "out_of_scope";
export type ClarificationActorType = "system" | "operator" | "client";
export type ClarificationPermission = "need.assist.clarify" | "clarification.waive";

export interface ClarificationActor {
  readonly type: ClarificationActorType;
  readonly id: string;
  readonly permissions?: readonly ClarificationPermission[];
}

export interface ClarificationTarget {
  readonly fieldId?: string;
  readonly topic?: string;
}

export interface ClarificationAnswerRecord {
  readonly value: unknown;
  readonly originalLanguage: LanguageCode;
  readonly answeredByUserProfileId: string;
  readonly answeredAt: string;
  readonly appliedNeedVersion?: number;
}

export interface Clarification {
  readonly id: string;
  readonly needId: string;
  readonly target: ClarificationTarget;
  readonly requester: ClarificationActor;
  readonly question: string;
  readonly reason: ClarificationReason;
  readonly blocking: boolean;
  readonly status: ClarificationStatus;
  readonly originalLanguage: LanguageCode;
  readonly answerHistory: readonly ClarificationAnswerRecord[];
  readonly aggregateVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
  readonly waivedAt?: string;
  readonly cancelledAt?: string;
  readonly reopenedAt?: string;
  readonly waiver?: {
    readonly actor: ClarificationActor;
    readonly reason: string;
  };
}

export interface ClarificationResult {
  readonly need: VersionedNeed;
  readonly clarification: Clarification;
}

export interface CreateClarificationInput {
  readonly need: VersionedNeed;
  readonly target: ClarificationTarget;
  readonly requester: ClarificationActor;
  readonly question: string;
  readonly reason: ClarificationReason;
  readonly blocking: boolean;
  readonly originalLanguage: string;
  readonly expectedNeedVersion?: number;
  readonly relatedClarifications?: readonly Clarification[];
}

export interface ApplyClarificationAnswerInput {
  readonly need: VersionedNeed;
  readonly clarification: Clarification;
  readonly actorUserProfileId: string;
  readonly value: unknown;
  readonly originalLanguage: string;
  readonly expectedNeedVersion: number;
  readonly expectedClarificationVersion: number;
  readonly relatedClarifications?: readonly Clarification[];
  readonly schemaRegistry?: readonly NeedSchema[];
}

export interface ReopenClarificationInput {
  readonly need: VersionedNeed;
  readonly clarification: Clarification;
  readonly actor: ClarificationActor;
  readonly expectedNeedVersion: number;
  readonly expectedClarificationVersion: number;
  readonly relatedClarifications?: readonly Clarification[];
}

export interface WaiveClarificationInput {
  readonly need: VersionedNeed;
  readonly clarification: Clarification;
  readonly actor: ClarificationActor;
  readonly reason: string;
  readonly expectedNeedVersion: number;
  readonly expectedClarificationVersion: number;
  readonly relatedClarifications?: readonly Clarification[];
}

export class ClarificationError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

export function createClarificationForNeed(
  input: CreateClarificationInput,
  now: Date = new Date()
): ClarificationResult {
  assertExpectedNeedVersion(input.need, input.expectedNeedVersion);
  assertCanCreateClarification(input.requester);
  validateClarificationTarget(input.target);

  const timestamp = toIsoString(now);
  const clarification: Clarification = {
    id: createId("clarification"),
    needId: input.need.id,
    target: normalizeTarget(input.target),
    requester: input.requester,
    question: normalizeText("question", input.question),
    reason: input.reason,
    blocking: input.blocking,
    status: "open",
    originalLanguage: assertSupportedLanguageCode(input.originalLanguage),
    answerHistory: [],
    aggregateVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const need = reassessNeedAfterClarificationChange(
    input.need,
    [clarification, ...(input.relatedClarifications ?? [])],
    now
  );

  return {
    need,
    clarification
  };
}

export function applyClarificationAnswer(
  input: ApplyClarificationAnswerInput,
  now: Date = new Date()
): ClarificationResult {
  assertExpectedNeedVersion(input.need, input.expectedNeedVersion);
  assertExpectedClarificationVersion(input.clarification, input.expectedClarificationVersion);

  if (input.need.ownerUserProfileId !== input.actorUserProfileId) {
    throw new ClarificationError(
      "CLARIFICATION_NOT_ANSWERABLE",
      "Only Need owner can answer clarification"
    );
  }

  if (input.clarification.status !== "open") {
    throw new ClarificationError(
      "CLARIFICATION_NOT_ANSWERABLE",
      "Clarification is not open for answer"
    );
  }

  const schema = requirePublishedSchema(
    input.need.schemaId,
    input.need.schemaVersion,
    input.schemaRegistry ?? localNeedSchemas
  );
  const nextNeedVersion = input.need.aggregateVersion + 1;
  const answer: ClarificationAnswerRecord = {
    value: cloneValue(input.value),
    originalLanguage: assertSupportedLanguageCode(input.originalLanguage),
    answeredByUserProfileId: input.actorUserProfileId,
    answeredAt: toIsoString(now),
    appliedNeedVersion: input.clarification.target.fieldId ? nextNeedVersion : undefined
  };

  if (!input.clarification.target.fieldId) {
    const answeredClarification = {
      ...input.clarification,
      status: "answered" as const,
      answerHistory: [...input.clarification.answerHistory, answer],
      aggregateVersion: input.clarification.aggregateVersion + 1,
      updatedAt: toIsoString(now)
    };

    return {
      need: reassessNeedAfterClarificationChange(
        input.need,
        replaceClarification(input.relatedClarifications, answeredClarification),
        now
      ),
      clarification: answeredClarification
    };
  }

  const answers = {
    ...input.need.answers,
    [input.clarification.target.fieldId]: cloneValue(input.value)
  };
  const completeness = evaluateNeedCompleteness(schema, answers, now);

  if (
    completeness.missingFieldIds.includes(input.clarification.target.fieldId) ||
    completeness.invalidFieldIds.includes(input.clarification.target.fieldId)
  ) {
    throw new ClarificationError("NEED_ANSWER_INVALID", "Clarification answer is invalid");
  }

  const resolvedClarification: Clarification = {
    ...input.clarification,
    status: "resolved",
    answerHistory: [...input.clarification.answerHistory, answer],
    aggregateVersion: input.clarification.aggregateVersion + 1,
    updatedAt: toIsoString(now),
    resolvedAt: toIsoString(now)
  };
  const relatedClarifications = replaceClarification(
    input.relatedClarifications,
    resolvedClarification
  );
  const needWithAnswer = withNeedReassessment(input.need, answers, relatedClarifications, now);

  return {
    need: {
      ...needWithAnswer,
      aggregateVersion: nextNeedVersion
    },
    clarification: resolvedClarification
  };
}

export function reopenClarificationForNeed(
  input: ReopenClarificationInput,
  now: Date = new Date()
): ClarificationResult {
  assertExpectedNeedVersion(input.need, input.expectedNeedVersion);
  assertExpectedClarificationVersion(input.clarification, input.expectedClarificationVersion);
  assertCanCreateClarification(input.actor);

  if (!["resolved", "waived", "cancelled"].includes(input.clarification.status)) {
    throw new ClarificationError(
      "CLARIFICATION_INVALID_TRANSITION",
      "Only terminal clarification can be reopened"
    );
  }

  const reopenedClarification: Clarification = {
    ...input.clarification,
    status: "open",
    aggregateVersion: input.clarification.aggregateVersion + 1,
    updatedAt: toIsoString(now),
    reopenedAt: toIsoString(now)
  };
  const need = reassessNeedAfterClarificationChange(
    input.need,
    replaceClarification(input.relatedClarifications, reopenedClarification),
    now
  );

  return {
    need,
    clarification: reopenedClarification
  };
}

export function waiveClarification(
  input: WaiveClarificationInput,
  now: Date = new Date()
): ClarificationResult {
  assertExpectedNeedVersion(input.need, input.expectedNeedVersion);
  assertExpectedClarificationVersion(input.clarification, input.expectedClarificationVersion);

  if (!hasPermission(input.actor, "clarification.waive")) {
    throw new ClarificationError("FORBIDDEN", "clarification.waive is required");
  }

  if (input.clarification.blocking || input.clarification.target.fieldId) {
    throw new ClarificationError(
      "CLARIFICATION_WAIVER_FORBIDDEN",
      "Required or field-bound clarification cannot be waived"
    );
  }

  if (input.clarification.status !== "open" && input.clarification.status !== "answered") {
    throw new ClarificationError(
      "CLARIFICATION_INVALID_TRANSITION",
      "Clarification cannot be waived from current status"
    );
  }

  const waivedClarification: Clarification = {
    ...input.clarification,
    status: "waived",
    aggregateVersion: input.clarification.aggregateVersion + 1,
    updatedAt: toIsoString(now),
    waivedAt: toIsoString(now),
    waiver: {
      actor: input.actor,
      reason: normalizeText("waiver reason", input.reason)
    }
  };
  const need = reassessNeedAfterClarificationChange(
    input.need,
    replaceClarification(input.relatedClarifications, waivedClarification),
    now
  );

  return {
    need,
    clarification: waivedClarification
  };
}

function reassessNeedAfterClarificationChange(
  need: VersionedNeed,
  clarifications: readonly Clarification[],
  now: Date
): VersionedNeed {
  return withNeedReassessment(need, need.answers, clarifications, now, true);
}

function withNeedReassessment(
  need: VersionedNeed,
  answers: Record<string, unknown>,
  clarifications: readonly Clarification[],
  now: Date,
  forceVersionIncrement = false
): VersionedNeed {
  const schema = requirePublishedSchema(need.schemaId, need.schemaVersion);
  const completeness = evaluateNeedCompleteness(schema, answers, now);
  const hasOpenBlockingClarification = clarifications.some(
    (clarification) => clarification.blocking && clarification.status === "open"
  );
  const status = completeness.complete && !hasOpenBlockingClarification
    ? "ready_for_match"
    : "needs_clarification";
  const answersClone = cloneAnswers(answers);
  const expectedResult = typeof answersClone.expectedResult === "string" &&
    answersClone.expectedResult.trim().length >= 4
    ? answersClone.expectedResult.trim()
    : need.expectedResult;

  return {
    ...need,
    answers: answersClone,
    completeness,
    status,
    expectedResult,
    aggregateVersion: forceVersionIncrement
      ? need.aggregateVersion + 1
      : need.aggregateVersion,
    updatedAt: toIsoString(now)
  };
}

function assertCanCreateClarification(actor: ClarificationActor): void {
  if (actor.type === "system") {
    return;
  }

  if (actor.type === "operator" && hasPermission(actor, "need.assist.clarify")) {
    return;
  }

  throw new ClarificationError("FORBIDDEN", "Clarification requires system or assigned operator");
}

function assertExpectedNeedVersion(
  need: VersionedNeed,
  expectedNeedVersion: number | undefined
): void {
  if (expectedNeedVersion !== undefined && need.aggregateVersion !== expectedNeedVersion) {
    throw new ClarificationError("VERSION_CONFLICT", "Need version is stale");
  }
}

function assertExpectedClarificationVersion(
  clarification: Clarification,
  expectedClarificationVersion: number
): void {
  if (clarification.aggregateVersion !== expectedClarificationVersion) {
    throw new ClarificationError("VERSION_CONFLICT", "Clarification version is stale");
  }
}

function hasPermission(
  actor: ClarificationActor,
  permission: ClarificationPermission
): boolean {
  return actor.permissions?.includes(permission) ?? false;
}

function replaceClarification(
  relatedClarifications: readonly Clarification[] | undefined,
  clarification: Clarification
): Clarification[] {
  const related = relatedClarifications ?? [];
  const filtered = related.filter((item) => item.id !== clarification.id);

  return [clarification, ...filtered];
}

function validateClarificationTarget(target: ClarificationTarget): void {
  const hasField = Boolean(target.fieldId);
  const hasTopic = Boolean(target.topic);

  if (hasField === hasTopic) {
    throw new ClarificationError(
      "CLARIFICATION_TARGET_INVALID",
      "Clarification must target exactly one field or topic"
    );
  }
}

function normalizeTarget(target: ClarificationTarget): ClarificationTarget {
  if (target.fieldId) {
    return {
      fieldId: normalizeText("fieldId", target.fieldId)
    };
  }

  return {
    topic: normalizeText("topic", target.topic ?? "")
  };
}

function normalizeText(name: string, value: string): string {
  const text = value.trim();

  if (!text) {
    throw new ClarificationError("CLARIFICATION_INVALID", `${name} is required`);
  }

  return text;
}

function cloneAnswers(answers: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(answers)) as Record<string, unknown>;
}

function cloneValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  const serialized = JSON.stringify(value);

  return serialized === undefined ? undefined : JSON.parse(serialized);
}
