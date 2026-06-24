import assert from "node:assert/strict";
import test from "node:test";

import {
  applyClarificationAnswer,
  createClarificationForNeed,
  createNeedFromSchema,
  reopenClarificationForNeed,
  waiveClarification,
  type ClarificationActor,
  type VersionedNeed
} from "../src/index.ts";

const now = new Date("2026-06-25T12:00:00.000Z");
const systemActor: ClarificationActor = {
  type: "system",
  id: "system"
};
const operatorActor: ClarificationActor = {
  type: "operator",
  id: "operator_1",
  permissions: ["need.assist.clarify", "clarification.waive"]
};

test("answers a field-bound clarification and atomically reassesses Need readiness", () => {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed(
    {
      need,
      target: {
        fieldId: "systemContext"
      },
      requester: systemActor,
      question: "Опишите границы системы.",
      reason: "missing",
      blocking: true,
      originalLanguage: "ru",
      expectedNeedVersion: 1
    },
    now
  );

  assert.equal(created.need.status, "needs_clarification");
  assert.equal(created.need.aggregateVersion, 2);
  assert.equal(created.clarification.status, "open");
  assert.equal(created.clarification.aggregateVersion, 1);

  const answered = applyClarificationAnswer(
    {
      need: created.need,
      clarification: created.clarification,
      actorUserProfileId: "user_profile_owner",
      value: "Синтетическая платформа подбора исполнителей Life, Work и Skills.",
      originalLanguage: "ru",
      expectedNeedVersion: 2,
      expectedClarificationVersion: 1,
      relatedClarifications: [created.clarification]
    },
    new Date("2026-06-25T12:10:00.000Z")
  );

  assert.equal(answered.need.status, "ready_for_match");
  assert.equal(answered.need.aggregateVersion, 3);
  assert.equal(answered.need.answers.systemContext, "Синтетическая платформа подбора исполнителей Life, Work и Skills.");
  assert.equal(answered.need.completeness.complete, true);
  assert.equal(answered.clarification.status, "resolved");
  assert.equal(answered.clarification.aggregateVersion, 2);
  assert.equal(answered.clarification.answerHistory.length, 1);
  assert.equal(answered.clarification.answerHistory[0]?.appliedNeedVersion, 3);
});

test("rejects non-owner clarification answer without mutating state", () => {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });

  assert.throws(
    () =>
      applyClarificationAnswer({
        need: created.need,
        clarification: created.clarification,
        actorUserProfileId: "other_user_profile",
        value: "Wrong owner answer",
        originalLanguage: "ru",
        expectedNeedVersion: created.need.aggregateVersion,
        expectedClarificationVersion: created.clarification.aggregateVersion,
        relatedClarifications: [created.clarification]
      }),
    /CLARIFICATION_NOT_ANSWERABLE/
  );
  assert.equal(created.need.answers.systemContext, undefined);
  assert.equal(created.clarification.status, "open");
  assert.equal(created.clarification.answerHistory.length, 0);
});

test("rejects invalid clarification answer without mutating state", () => {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });

  assert.throws(
    () =>
      applyClarificationAnswer({
        need: created.need,
        clarification: created.clarification,
        actorUserProfileId: "user_profile_owner",
        value: "",
        originalLanguage: "ru",
        expectedNeedVersion: created.need.aggregateVersion,
        expectedClarificationVersion: created.clarification.aggregateVersion,
        relatedClarifications: [created.clarification]
      }),
    /NEED_ANSWER_INVALID/
  );
  assert.equal(created.need.answers.systemContext, undefined);
  assert.equal(created.clarification.status, "open");
  assert.equal(created.clarification.answerHistory.length, 0);
});

test("rejects stale Need or Clarification versions atomically", () => {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });

  assert.throws(
    () =>
      applyClarificationAnswer({
        need: created.need,
        clarification: created.clarification,
        actorUserProfileId: "user_profile_owner",
        value: "Valid but stale.",
        originalLanguage: "ru",
        expectedNeedVersion: 1,
        expectedClarificationVersion: created.clarification.aggregateVersion,
        relatedClarifications: [created.clarification]
      }),
    /VERSION_CONFLICT/
  );
  assert.throws(
    () =>
      applyClarificationAnswer({
        need: created.need,
        clarification: created.clarification,
        actorUserProfileId: "user_profile_owner",
        value: "Valid but stale.",
        originalLanguage: "ru",
        expectedNeedVersion: created.need.aggregateVersion,
        expectedClarificationVersion: 99,
        relatedClarifications: [created.clarification]
      }),
    /VERSION_CONFLICT/
  );
  assert.equal(created.need.answers.systemContext, undefined);
  assert.equal(created.clarification.answerHistory.length, 0);
});

test("keeps Need blocked while another blocking clarification remains open", () => {
  const need = createIncompleteWorkNeed();
  const systemContext = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });
  const deadline = createClarificationForNeed({
    need: systemContext.need,
    target: {
      fieldId: "desiredDeadline"
    },
    requester: systemActor,
    question: "Уточните будущий срок.",
    reason: "conflicting",
    blocking: true,
    originalLanguage: "ru",
    expectedNeedVersion: systemContext.need.aggregateVersion,
    relatedClarifications: [systemContext.clarification]
  });
  const answered = applyClarificationAnswer({
    need: deadline.need,
    clarification: systemContext.clarification,
    actorUserProfileId: "user_profile_owner",
    value: "Синтетическая платформа подбора исполнителей Life, Work и Skills.",
    originalLanguage: "ru",
    expectedNeedVersion: deadline.need.aggregateVersion,
    expectedClarificationVersion: systemContext.clarification.aggregateVersion,
    relatedClarifications: [systemContext.clarification, deadline.clarification]
  });

  assert.equal(answered.need.status, "needs_clarification");
  assert.deepEqual(answered.need.completeness.missingFieldIds, []);
  assert.equal(deadline.clarification.status, "open");
});

test("prevents waiver of required field blocker but allows non-blocking ambiguity waiver", () => {
  const need = createIncompleteWorkNeed();
  const blocking = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });

  assert.throws(
    () =>
      waiveClarification({
        need: blocking.need,
        clarification: blocking.clarification,
        actor: operatorActor,
        reason: "Cannot bypass required field.",
        expectedNeedVersion: blocking.need.aggregateVersion,
        expectedClarificationVersion: blocking.clarification.aggregateVersion,
        relatedClarifications: [blocking.clarification]
      }),
    /CLARIFICATION_WAIVER_FORBIDDEN/
  );

  assert.throws(
    () =>
      waiveClarification({
        need: blocking.need,
        clarification: blocking.clarification,
        actor: {
          type: "operator",
          id: "operator_without_permission",
          permissions: ["need.assist.clarify"]
        },
        reason: "Missing permission.",
        expectedNeedVersion: blocking.need.aggregateVersion,
        expectedClarificationVersion: blocking.clarification.aggregateVersion,
        relatedClarifications: [blocking.clarification]
      }),
    /FORBIDDEN/
  );

  const topicClarification = createClarificationForNeed({
    need: blocking.need,
    target: {
      topic: "tone_preference"
    },
    requester: operatorActor,
    question: "Уточнить тон коммуникации.",
    reason: "ambiguous",
    blocking: false,
    originalLanguage: "ru",
    expectedNeedVersion: blocking.need.aggregateVersion,
    relatedClarifications: [blocking.clarification]
  });
  const waived = waiveClarification({
    need: topicClarification.need,
    clarification: topicClarification.clarification,
    actor: operatorActor,
    reason: "Non-blocking preference is not required for readiness.",
    expectedNeedVersion: topicClarification.need.aggregateVersion,
    expectedClarificationVersion: topicClarification.clarification.aggregateVersion,
    relatedClarifications: [blocking.clarification, topicClarification.clarification]
  });

  assert.equal(waived.clarification.status, "waived");
  assert.equal(waived.clarification.waiver?.reason, "Non-blocking preference is not required for readiness.");
});

test("reopens a blocker and preserves answer history while revoking readiness", () => {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed({
    need,
    target: {
      fieldId: "systemContext"
    },
    requester: systemActor,
    question: "Опишите границы системы.",
    reason: "missing",
    blocking: true,
    originalLanguage: "ru"
  });
  const answered = applyClarificationAnswer({
    need: created.need,
    clarification: created.clarification,
    actorUserProfileId: "user_profile_owner",
    value: "Синтетическая платформа подбора исполнителей Life, Work и Skills.",
    originalLanguage: "ru",
    expectedNeedVersion: created.need.aggregateVersion,
    expectedClarificationVersion: created.clarification.aggregateVersion,
    relatedClarifications: [created.clarification]
  });

  assert.equal(answered.need.status, "ready_for_match");

  assert.throws(
    () =>
      applyClarificationAnswer({
        need: answered.need,
        clarification: answered.clarification,
        actorUserProfileId: "user_profile_owner",
        value: "Second answer must require reopen.",
        originalLanguage: "ru",
        expectedNeedVersion: answered.need.aggregateVersion,
        expectedClarificationVersion: answered.clarification.aggregateVersion,
        relatedClarifications: [answered.clarification]
      }),
    /CLARIFICATION_NOT_ANSWERABLE/
  );

  const reopened = reopenClarificationForNeed({
    need: answered.need,
    clarification: answered.clarification,
    actor: systemActor,
    expectedNeedVersion: answered.need.aggregateVersion,
    expectedClarificationVersion: answered.clarification.aggregateVersion,
    relatedClarifications: [answered.clarification]
  });

  assert.equal(reopened.need.status, "needs_clarification");
  assert.equal(reopened.clarification.status, "open");
  assert.equal(reopened.clarification.answerHistory.length, 1);

  const answeredAgain = applyClarificationAnswer({
    need: reopened.need,
    clarification: reopened.clarification,
    actorUserProfileId: "user_profile_owner",
    value: "Синтетическая платформа CIFEDRA для направлений Life, Work и Skills.",
    originalLanguage: "ru",
    expectedNeedVersion: reopened.need.aggregateVersion,
    expectedClarificationVersion: reopened.clarification.aggregateVersion,
    relatedClarifications: [reopened.clarification]
  });

  assert.equal(answeredAgain.need.status, "ready_for_match");
  assert.equal(answeredAgain.clarification.answerHistory.length, 2);
});

function createIncompleteWorkNeed(): VersionedNeed {
  const answers = completeWorkAnswers();
  delete answers.systemContext;

  return createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_owner",
      schemaId: "work.srs-review",
      schemaVersion: 1,
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      answers,
      originalContentLanguage: "ru",
      communicationLanguage: "ru",
      preferredResultLanguage: "ru",
      tags: ["srs", "requirements", "review"]
    },
    now
  );
}

function completeWorkAnswers(): Record<string, unknown> {
  return {
    reviewType: "quick_review",
    requesterRole: "analyst",
    artifactType: "srs",
    artifactStage: "pre_development",
    documentAudience: ["business", "development", "testing"],
    reviewGoal: "Понять, можно ли отдавать требования в разработку.",
    systemContext: "Синтетический сервис matching для проверки требований.",
    expectedResult: "Список замечаний, рисков и уточнений.",
    artifactSizeValue: 20,
    artifactSizeUnit: "pages",
    reviewFocus: "completeness",
    desiredDeadline: "2026-06-26T10:00:00.000Z",
    dataMode: "synthetic",
    serviceFormat: "online"
  };
}
