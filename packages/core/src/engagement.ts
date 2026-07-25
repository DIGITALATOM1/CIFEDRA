import type { ContactRequest } from "./contact-request.js";
import type {
  Conversation,
  ConversationBrief,
  Engagement,
  EngagementResultArtifact,
  EngagementStatus,
  Need
} from "./domain.js";
import { createId, toIsoString } from "./utils.js";

export interface CreateEngagementInput {
  readonly need: Need;
  readonly contactRequest: ContactRequest;
  readonly conversation?: Conversation;
  readonly brief?: ConversationBrief;
  readonly resultArtifactFormat?: Engagement["resultArtifactFormat"];
}

export interface CompleteEngagementInput {
  readonly summary: string;
  readonly nextStep: string;
  readonly resultArtifact?: EngagementResultArtifact;
}

export class EngagementError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

const terminalStatuses: readonly EngagementStatus[] = ["completed", "cancelled"];

export function createEngagementFromAcceptedContactRequest(
  input: CreateEngagementInput,
  now: Date = new Date()
): Engagement {
  validateCreateEngagementInput(input);

  const timestamp = toIsoString(now);
  const executionBrief = buildExecutionBrief(input.need, input.brief, input.conversation);

  return {
    id: createId("engagement"),
    needId: input.need.id,
    profileId: input.contactRequest.profileId,
    contactRequestId: input.contactRequest.id,
    conversationId: input.conversation?.id,
    clientUserProfileId: input.contactRequest.clientUserProfileId,
    providerProfileId: input.contactRequest.providerProfileId,
    status: "planned",
    title: input.need.title,
    expectedResult: input.need.expectedResult,
    executionBrief,
    resultArtifactFormat: input.resultArtifactFormat ?? "structured_markdown",
    plannedAt: timestamp,
    aggregateVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function startEngagement(
  engagement: Engagement,
  now: Date = new Date()
): Engagement {
  assertCanTransition(engagement, "in_progress");

  return {
    ...engagement,
    status: "in_progress",
    startedAt: toIsoString(now),
    aggregateVersion: engagement.aggregateVersion + 1,
    updatedAt: toIsoString(now)
  };
}

export function completeEngagement(
  engagement: Engagement,
  input: CompleteEngagementInput,
  now: Date = new Date()
): Engagement {
  assertCanTransition(engagement, "completed");
  validateCompleteEngagementInput(input);

  return {
    ...engagement,
    status: "completed",
    executionBrief: {
      ...engagement.executionBrief,
      summary: input.summary.trim(),
      nextStep: input.nextStep.trim()
    },
    resultArtifact: input.resultArtifact ?? buildMarkdownResultArtifact(engagement, input),
    completedAt: toIsoString(now),
    aggregateVersion: engagement.aggregateVersion + 1,
    updatedAt: toIsoString(now)
  };
}

export function cancelEngagement(
  engagement: Engagement,
  reason: string,
  now: Date = new Date()
): Engagement {
  assertCanTransition(engagement, "cancelled");

  const normalizedReason = reason.trim();

  if (!normalizedReason) {
    throw new EngagementError(
      "ENGAGEMENT_CANCEL_REASON_REQUIRED",
      "Engagement cancellation reason is required"
    );
  }

  return {
    ...engagement,
    status: "cancelled",
    cancellationReason: normalizedReason,
    cancelledAt: toIsoString(now),
    aggregateVersion: engagement.aggregateVersion + 1,
    updatedAt: toIsoString(now)
  };
}

export function isActiveEngagement(engagement: Engagement): boolean {
  return engagement.status === "planned" || engagement.status === "in_progress";
}

function validateCreateEngagementInput(input: CreateEngagementInput): void {
  if (input.contactRequest.status !== "accepted") {
    throw new EngagementError(
      "ENGAGEMENT_CONTACT_REQUEST_NOT_ACCEPTED",
      "Engagement requires accepted ContactRequest"
    );
  }

  if (input.need.id !== input.contactRequest.needId) {
    throw new EngagementError(
      "ENGAGEMENT_NEED_MISMATCH",
      "Engagement Need does not match ContactRequest"
    );
  }

  if (input.need.ownerUserProfileId !== input.contactRequest.clientUserProfileId) {
    throw new EngagementError(
      "ENGAGEMENT_CLIENT_MISMATCH",
      "Engagement client does not match Need owner"
    );
  }

  if (
    input.conversation &&
    (input.conversation.needId !== input.need.id ||
      input.conversation.profileId !== input.contactRequest.profileId ||
      input.conversation.decisionId !== input.contactRequest.decisionId)
  ) {
    throw new EngagementError(
      "ENGAGEMENT_CONVERSATION_MISMATCH",
      "Engagement conversation does not match accepted ContactRequest"
    );
  }

  if (
    input.brief &&
    (input.brief.needId !== input.need.id ||
      input.brief.profileId !== input.contactRequest.profileId)
  ) {
    throw new EngagementError(
      "ENGAGEMENT_BRIEF_MISMATCH",
      "Engagement brief does not match accepted ContactRequest"
    );
  }
}

function assertCanTransition(
  engagement: Engagement,
  nextStatus: EngagementStatus
): void {
  if (terminalStatuses.includes(engagement.status)) {
    throw new EngagementError(
      "ENGAGEMENT_TERMINAL",
      `Engagement ${engagement.id} is ${engagement.status}`
    );
  }

  if (engagement.status === nextStatus) {
    throw new EngagementError(
      "ENGAGEMENT_DUPLICATE_TRANSITION",
      `Engagement ${engagement.id} is already ${nextStatus}`
    );
  }

  if (nextStatus === "in_progress" && engagement.status === "planned") {
    return;
  }

  if (nextStatus === "completed" && engagement.status === "in_progress") {
    return;
  }

  if (nextStatus === "cancelled") {
    return;
  }

  throw new EngagementError(
    "ENGAGEMENT_INVALID_TRANSITION",
    `Cannot move engagement ${engagement.id} from ${engagement.status} to ${nextStatus}`
  );
}

function validateCompleteEngagementInput(input: CompleteEngagementInput): void {
  if (!input.summary.trim()) {
    throw new EngagementError(
      "ENGAGEMENT_RESULT_SUMMARY_REQUIRED",
      "Engagement completion summary is required"
    );
  }

  if (!input.nextStep.trim()) {
    throw new EngagementError(
      "ENGAGEMENT_RESULT_NEXT_STEP_REQUIRED",
      "Engagement completion next step is required"
    );
  }

  if (input.resultArtifact && input.resultArtifact.format !== "structured_markdown") {
    throw new EngagementError(
      "ENGAGEMENT_RESULT_ARTIFACT_FORMAT_UNSUPPORTED",
      `Unsupported Engagement artifact format: ${input.resultArtifact.format}`
    );
  }
}

function buildExecutionBrief(
  need: Need,
  brief?: ConversationBrief,
  conversation?: Conversation
): Engagement["executionBrief"] {
  return {
    summary: need.description,
    context: brief?.context ?? conversation?.context ?? [],
    risks: brief?.risks ?? conversation?.risks ?? [],
    nextStep: brief?.nextStep ?? "Согласовать первый шаг выполнения в CIFEDRA messenger."
  };
}

function buildMarkdownResultArtifact(
  engagement: Engagement,
  input: CompleteEngagementInput
): EngagementResultArtifact {
  return {
    format: "structured_markdown",
    title: `${engagement.title}: result`,
    content: [
      `# ${engagement.title}`,
      "",
      "## Summary",
      input.summary.trim(),
      "",
      "## Expected Result",
      engagement.expectedResult,
      "",
      "## Next Step",
      input.nextStep.trim()
    ].join("\n")
  };
}
