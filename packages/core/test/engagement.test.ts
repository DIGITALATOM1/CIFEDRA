import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptContactRequest,
  buildConversationBrief,
  buildRecommendedDecisions,
  completeEngagement,
  createContactRequestFromLatestDecision,
  createConversationDraft,
  createEngagementFromAcceptedContactRequest,
  createNeed,
  demoProfiles,
  EngagementError,
  isActiveEngagement,
  markNeedMatched,
  rankProfilesForNeed,
  startEngagement,
  cancelEngagement
} from "../src/index.ts";

test("creates and completes an Engagement from accepted ContactRequest", () => {
  const { acceptedContactRequest, brief, conversation, need } = createAcceptedContactRequest();
  const engagement = createEngagementFromAcceptedContactRequest(
    {
      need,
      contactRequest: acceptedContactRequest,
      conversation,
      brief
    },
    new Date("2026-07-26T08:00:00.000Z")
  );

  assert.equal(engagement.status, "planned");
  assert.equal(engagement.needId, need.id);
  assert.equal(engagement.contactRequestId, acceptedContactRequest.id);
  assert.equal(engagement.conversationId, conversation.id);
  assert.equal(engagement.clientUserProfileId, acceptedContactRequest.clientUserProfileId);
  assert.equal(engagement.providerProfileId, acceptedContactRequest.providerProfileId);
  assert.equal(engagement.resultArtifactFormat, "structured_markdown");
  assert.equal(engagement.aggregateVersion, 1);
  assert.equal(engagement.plannedAt, "2026-07-26T08:00:00.000Z");
  assert.equal(isActiveEngagement(engagement), true);

  const started = startEngagement(engagement, new Date("2026-07-26T08:15:00.000Z"));

  assert.equal(started.status, "in_progress");
  assert.equal(started.startedAt, "2026-07-26T08:15:00.000Z");
  assert.equal(started.aggregateVersion, 2);

  const completed = completeEngagement(
    started,
    {
      summary: "Markdown review delivered and discussed.",
      nextStep: "Client updates SRS and requests follow-up review."
    },
    new Date("2026-07-26T09:00:00.000Z")
  );

  assert.equal(completed.status, "completed");
  assert.equal(completed.completedAt, "2026-07-26T09:00:00.000Z");
  assert.equal(completed.aggregateVersion, 3);
  assert.equal(completed.resultArtifact?.format, "structured_markdown");
  assert.match(completed.resultArtifact?.content ?? "", /Markdown review delivered/);
  assert.equal(isActiveEngagement(completed), false);
});

test("rejects Engagement creation before provider accepts ContactRequest", () => {
  const { requestedContactRequest, need } = createAcceptedContactRequest();

  assert.throws(
    () =>
      createEngagementFromAcceptedContactRequest({
        need,
        contactRequest: requestedContactRequest
      }),
    (error) =>
      error instanceof EngagementError &&
      error.code === "ENGAGEMENT_CONTACT_REQUEST_NOT_ACCEPTED"
  );
});

test("guards Engagement lifecycle transitions", () => {
  const { acceptedContactRequest, need } = createAcceptedContactRequest();
  const planned = createEngagementFromAcceptedContactRequest({
    need,
    contactRequest: acceptedContactRequest
  });

  assert.throws(
    () =>
      completeEngagement(planned, {
        summary: "Done",
        nextStep: "Follow up"
      }),
    (error) =>
      error instanceof EngagementError &&
      error.code === "ENGAGEMENT_INVALID_TRANSITION"
  );

  const cancelled = cancelEngagement(planned, "Provider no longer available.");

  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.cancellationReason, "Provider no longer available.");
  assert.equal(cancelled.aggregateVersion, 2);

  assert.throws(
    () => startEngagement(cancelled),
    (error) => error instanceof EngagementError && error.code === "ENGAGEMENT_TERMINAL"
  );
});

function createAcceptedContactRequest() {
  const createdNeed = createNeed({
    direction: "work",
    categoryId: "work.expert-help",
    title: "Нужно ревью SRS",
    description: "Нужно проверить требования перед передачей в разработку.",
    expectedResult: "Markdown список замечаний и вопросов.",
    ownerUserProfileId: "client_profile_1",
    tags: ["srs", "requirements", "review"],
    location: {
      remoteAllowed: true
    }
  });
  const need = markNeedMatched(createdNeed);
  const matches = rankProfilesForNeed(need, demoProfiles, {
    limit: 1,
    minScore: 25
  });
  const candidate = matches[0];

  assert.ok(candidate, "Expected demo Work candidate");

  const decisions = buildRecommendedDecisions(need, matches);
  const requestedContactRequest = createContactRequestFromLatestDecision({
    need,
    candidate,
    decisions,
    actorUserProfileId: "client_profile_1",
    expiresAt: new Date("2026-07-28T08:00:00.000Z")
  });
  const acceptedContactRequest = acceptContactRequest(
    requestedContactRequest,
    requestedContactRequest.providerProfileId,
    new Date("2026-07-26T08:00:00.000Z")
  );
  const brief = buildConversationBrief(need, candidate);
  const conversation = createConversationDraft({
    need,
    candidate,
    decision: decisions[0],
    brief,
    channel: "direct_product_chat"
  });

  return {
    acceptedContactRequest,
    brief,
    conversation,
    need,
    requestedContactRequest
  };
}
