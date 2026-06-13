import type {
  ContactOutcome,
  ContactResult,
  ContactResultInput,
  Conversation,
  MatchQualityImpact,
  MatchQualitySignal,
  Need
} from "./domain.js";
import { markNeedConnected, markNeedResolved } from "./lifecycle.js";
import { clampScore, createId, toIsoString } from "./utils.js";

export function recordContactResult(input: ContactResultInput, now: Date = new Date()): ContactResult {
  if (input.summary.trim().length < 4) {
    throw new Error("Contact result summary must contain at least 4 characters");
  }

  return {
    ...input,
    summary: input.summary.trim(),
    matchScore: input.matchScore === undefined ? undefined : clampScore(input.matchScore),
    nextStep: input.nextStep?.trim() || getDefaultNextStepForOutcome(input.outcome),
    qualityScore:
      input.qualityScore === undefined
        ? getDefaultQualityScoreForOutcome(input.outcome)
        : clampScore(input.qualityScore),
    id: createId("result"),
    recordedAt: toIsoString(now)
  };
}

export function buildMatchQualitySignal(
  result: ContactResult,
  now: Date = new Date()
): MatchQualitySignal {
  return {
    id: createId("quality"),
    resultId: result.id,
    needId: result.needId,
    profileId: result.profileId,
    conversationId: result.conversationId,
    decisionId: result.decisionId,
    outcome: result.outcome,
    matchScore: result.matchScore,
    qualityScore: result.qualityScore,
    impact: getMatchQualityImpact(result),
    createdAt: toIsoString(now)
  };
}

export function resolveNeedFromContactResult(
  need: Need,
  conversation: Conversation,
  result: ContactResult,
  now: Date = new Date()
): Need {
  validateResultLinks(need, conversation, result);

  if (conversation.state !== "resolved") {
    throw new Error("Cannot resolve need from unresolved conversation");
  }

  if (need.status === "resolved") {
    return need;
  }

  if (need.status === "connected") {
    return markNeedResolved(need, now);
  }

  if (need.status === "matched") {
    return markNeedResolved(markNeedConnected(need, now), now);
  }

  throw new Error(`Cannot resolve need ${need.id} from status ${need.status}`);
}

export function getDefaultNextStepForOutcome(outcome: ContactOutcome): string {
  if (outcome === "agreed") {
    return "Зафиксировать договоренность и следующий операционный шаг.";
  }

  if (outcome === "needs_follow_up") {
    return "Запланировать follow-up и уточнить недостающий контекст.";
  }

  if (outcome === "needs_another_person") {
    return "Вернуться к shortlist и подобрать другого кандидата.";
  }

  if (outcome === "no_response") {
    return "Повторить контакт позже или выбрать другого кандидата.";
  }

  return "Зафиксировать причину нерелевантности и улучшить правила подбора.";
}

function getDefaultQualityScoreForOutcome(outcome: ContactOutcome): number {
  if (outcome === "agreed") {
    return 90;
  }

  if (outcome === "needs_follow_up") {
    return 70;
  }

  if (outcome === "needs_another_person") {
    return 45;
  }

  if (outcome === "no_response") {
    return 30;
  }

  return 20;
}

function getMatchQualityImpact(result: ContactResult): MatchQualityImpact {
  if (result.qualityScore >= 75 || result.outcome === "agreed") {
    return "positive";
  }

  if (result.qualityScore >= 50 || result.outcome === "needs_follow_up") {
    return "neutral";
  }

  return "negative";
}

function validateResultLinks(
  need: Need,
  conversation: Conversation,
  result: ContactResult
): void {
  if (conversation.needId !== need.id || result.needId !== need.id) {
    throw new Error("Contact result does not belong to need");
  }

  if (conversation.profileId !== result.profileId) {
    throw new Error("Contact result does not belong to conversation profile");
  }

  if (result.conversationId !== conversation.id) {
    throw new Error("Contact result does not belong to conversation");
  }

  if (result.decisionId !== conversation.decisionId) {
    throw new Error("Contact result does not belong to conversation decision");
  }
}
