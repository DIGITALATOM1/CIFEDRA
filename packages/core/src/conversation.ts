import type {
  CandidateDecision,
  Conversation,
  ConversationBrief,
  ConversationChannel,
  ConversationExternalRef,
  ConversationState,
  MatchCandidate,
  Need
} from "./domain.js";
import { createId, toIsoString } from "./utils.js";

export const conversationStateOrder = [
  "draft",
  "opened",
  "assigned",
  "waiting_user",
  "waiting_operator",
  "resolved",
  "failed"
] as const satisfies readonly ConversationState[];

export const allowedConversationStateTransitions = {
  draft: ["opened", "failed"],
  opened: ["assigned", "waiting_user", "waiting_operator", "resolved", "failed"],
  assigned: ["waiting_user", "waiting_operator", "resolved", "failed"],
  waiting_user: ["waiting_operator", "resolved", "failed"],
  waiting_operator: ["waiting_user", "resolved", "failed"],
  resolved: [],
  failed: []
} as const satisfies Record<ConversationState, readonly ConversationState[]>;

export interface ConversationDraftInput {
  readonly need: Need;
  readonly candidate: MatchCandidate;
  readonly decision: CandidateDecision;
  readonly brief: ConversationBrief;
  readonly channel?: ConversationChannel;
}

export function createConversationDraft(
  input: ConversationDraftInput,
  now: Date = new Date()
): Conversation {
  validateConversationDraftInput(input);

  const timestamp = toIsoString(now);
  const channel = input.channel ?? "chatwoot_concierge";

  return {
    id: createId("conversation"),
    needId: input.need.id,
    profileId: input.candidate.profile.id,
    decisionId: input.decision.id,
    channel,
    state: "draft",
    goal: input.brief.goal,
    context: input.brief.context,
    questions: input.brief.questions,
    risks: input.brief.risks,
    firstMessage: buildFirstMessage(input.need, input.brief),
    externalRef: {
      provider: channel === "chatwoot_concierge" ? "chatwoot" : "cifedra"
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function canTransitionConversationState(
  from: ConversationState,
  to: ConversationState
): boolean {
  return (
    from === to ||
    (allowedConversationStateTransitions[from] as readonly ConversationState[]).includes(to)
  );
}

export function transitionConversationState(
  conversation: Conversation,
  nextState: ConversationState,
  now: Date = new Date(),
  externalRef?: ConversationExternalRef
): Conversation {
  if (conversation.state === nextState && externalRef === undefined) {
    return conversation;
  }

  if (!canTransitionConversationState(conversation.state, nextState)) {
    throw new Error(
      `Cannot move conversation ${conversation.id} from ${conversation.state} to ${nextState}`
    );
  }

  return {
    ...conversation,
    state: nextState,
    externalRef: externalRef ?? conversation.externalRef,
    updatedAt: toIsoString(now)
  };
}

export function markConversationOpened(
  conversation: Conversation,
  externalRef?: ConversationExternalRef,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "opened", now, externalRef);
}

export function markConversationAssigned(
  conversation: Conversation,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "assigned", now);
}

export function markConversationWaitingUser(
  conversation: Conversation,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "waiting_user", now);
}

export function markConversationWaitingOperator(
  conversation: Conversation,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "waiting_operator", now);
}

export function markConversationResolved(
  conversation: Conversation,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "resolved", now);
}

export function markConversationFailed(
  conversation: Conversation,
  now: Date = new Date()
): Conversation {
  return transitionConversationState(conversation, "failed", now);
}

function validateConversationDraftInput(input: ConversationDraftInput): void {
  if (input.decision.decision !== "requested_contact") {
    throw new Error("Conversation draft requires requested_contact decision");
  }

  if (input.decision.needId !== input.need.id) {
    throw new Error("Conversation decision does not belong to need");
  }

  if (input.decision.profileId !== input.candidate.profile.id) {
    throw new Error("Conversation decision does not belong to candidate profile");
  }

  if (input.brief.needId !== input.need.id) {
    throw new Error("Conversation brief does not belong to need");
  }

  if (input.brief.profileId !== input.candidate.profile.id) {
    throw new Error("Conversation brief does not belong to candidate profile");
  }
}

function buildFirstMessage(need: Need, brief: ConversationBrief): string {
  return [
    `Здравствуйте. Есть задача: ${need.title}.`,
    `Ожидаемый результат: ${need.expectedResult}.`,
    "",
    "Контекст:",
    ...brief.context,
    "",
    "Вопросы:",
    ...brief.questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    `Следующий шаг: ${brief.nextStep}`
  ].join("\n");
}
