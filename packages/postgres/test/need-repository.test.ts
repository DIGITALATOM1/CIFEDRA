import assert from "node:assert/strict";
import test from "node:test";

import { Pool } from "pg";

import {
  acceptContactRequest,
  buildRecommendedDecisions,
  createContactRequestFromLatestDecision,
  createClarificationForNeed,
  createNeedFromSchema,
  demoProfiles,
  rankProfilesForNeed,
  type ContactRequest,
  type VersionedNeed
} from "@cifedra/core";

import { PostgresContactRequestRepository } from "../src/contact-request-repository.ts";
import { getRuntimeDatabaseUrl } from "../src/config.ts";
import { PostgresNeedRepository, RepositoryConflictError } from "../src/need-repository.ts";

const databaseUrl = process.env.CIFEDRA_DATABASE_URL;
const now = new Date("2026-06-26T09:00:00.000Z");

test("persists and reads a Need aggregate when PostgreSQL is configured", {
  skip: databaseUrl ? false : "CIFEDRA_DATABASE_URL is not configured"
}, async () => {
  const pool = new Pool({
    connectionString: getRuntimeDatabaseUrl()
  });
  const repository = new PostgresNeedRepository(pool);

  try {
    const need = createIncompleteWorkNeed();
    const clarification = createClarificationForNeed({
      need,
      target: {
        fieldId: "systemContext"
      },
      requester: {
        type: "system",
        id: "system"
      },
      question: "Describe the system boundary.",
      reason: "missing",
      blocking: true,
      originalLanguage: "en",
      expectedNeedVersion: need.aggregateVersion
    });

    await repository.saveNeedAggregate({
      need: clarification.need,
      clarifications: [clarification.clarification]
    });

    const persisted = await repository.findNeedAggregateById(clarification.need.id);

    assert.equal(persisted?.need.id, clarification.need.id);
    assert.equal(persisted?.need.aggregateVersion, 2);
    assert.equal(persisted?.clarifications.length, 1);
    assert.equal(persisted?.clarifications[0]?.status, "open");
  } finally {
    await pool.end();
  }
});

test("persists and reads a ContactRequest when PostgreSQL is configured", {
  skip: databaseUrl ? false : "CIFEDRA_DATABASE_URL is not configured"
}, async () => {
  const pool = new Pool({
    connectionString: getRuntimeDatabaseUrl()
  });
  const needRepository = new PostgresNeedRepository(pool);
  const contactRequestRepository = new PostgresContactRequestRepository(pool);

  try {
    const need = createCompleteWorkNeed();
    const request = createSyntheticContactRequest(need);

    await needRepository.saveNeedAggregate({
      need,
      clarifications: []
    });
    await contactRequestRepository.saveContactRequest(request);

    const persisted = await contactRequestRepository.findContactRequestById(request.id);
    const byIdempotencyKey =
      await contactRequestRepository.findContactRequestByIdempotencyKey(
        request.idempotencyKey ?? ""
      );
    const byNeed = await contactRequestRepository.listContactRequestsByNeedId(need.id);

    assert.equal(persisted?.id, request.id);
    assert.equal(persisted?.status, "requested");
    assert.equal(persisted?.aggregateVersion, 1);
    assert.equal(persisted?.needId, need.id);
    assert.equal(persisted?.decisionId, request.decisionId);
    assert.equal(persisted?.disclosureSnapshot.hiddenFields.includes("contact.email"), true);
    assert.equal(
      Object.hasOwn(persisted?.disclosureSnapshot.publicBrief.serviceRegion ?? {}, "latitude"),
      false
    );
    assert.equal(byIdempotencyKey?.id, request.id);
    assert.equal(byNeed.some((item) => item.id === request.id), true);

    const accepted = await contactRequestRepository.updateContactRequest(
      request.id,
      1,
      (current) =>
        acceptContactRequest(
          current,
          current.providerProfileId,
          new Date("2026-06-26T10:00:00.000Z")
        )
    );

    const acceptedPersisted = await contactRequestRepository.findContactRequestById(request.id);

    assert.equal(accepted.status, "accepted");
    assert.equal(acceptedPersisted?.status, "accepted");
    assert.equal(acceptedPersisted?.aggregateVersion, 2);
    await assert.rejects(
      () =>
        contactRequestRepository.updateContactRequest(
          request.id,
          1,
          (current) =>
            acceptContactRequest(
              current,
              current.providerProfileId,
              new Date("2026-06-26T10:05:00.000Z")
            )
        ),
      RepositoryConflictError
    );
  } finally {
    await pool.end();
  }
});

function createIncompleteWorkNeed(): VersionedNeed {
  return createNeedFromSchema({
    ownerUserProfileId: "user_profile_owner",
    schemaId: "work.srs-review",
    schemaVersion: 1,
    title: "Synthetic SRS review",
    description: "Repository-owned synthetic persistence test input.",
    answers: {
      reviewType: "quick_review",
      requesterRole: "analyst",
      artifactType: "srs",
      artifactStage: "pre_development",
      documentAudience: ["business", "development", "testing"],
      reviewGoal: "Check whether requirements are ready for implementation.",
      expectedResult: "List of findings, risks and clarification questions.",
      artifactSizeValue: 20,
      artifactSizeUnit: "pages",
      reviewFocus: "completeness",
      desiredDeadline: "2026-06-27T10:00:00.000Z",
      dataMode: "synthetic",
      serviceFormat: "online"
    },
    originalContentLanguage: "en",
    communicationLanguage: "en",
    preferredResultLanguage: "en",
    tags: ["synthetic", "repository", "test"]
  }, now);
}

function createCompleteWorkNeed(): VersionedNeed {
  return createNeedFromSchema({
    ownerUserProfileId: "user_profile_owner",
    schemaId: "work.srs-review",
    schemaVersion: 1,
    title: "Synthetic SRS review",
    description: "Repository-owned synthetic contact request persistence test input.",
    answers: {
      reviewType: "quick_review",
      requesterRole: "analyst",
      artifactType: "srs",
      artifactStage: "pre_development",
      documentAudience: ["business", "development", "testing"],
      reviewGoal: "Check whether requirements are ready for implementation.",
      systemContext: "Synthetic matching platform for Life, Work and Skills.",
      expectedResult: "List of findings, risks and clarification questions.",
      artifactSizeValue: 20,
      artifactSizeUnit: "pages",
      reviewFocus: "completeness",
      desiredDeadline: "2026-06-27T10:00:00.000Z",
      dataMode: "synthetic",
      serviceFormat: "online"
    },
    originalContentLanguage: "en",
    communicationLanguage: "en",
    preferredResultLanguage: "en",
    location: {
      remoteAllowed: true
    },
    tags: ["synthetic", "repository", "contact-request", "srs", "review"]
  }, now);
}

function createSyntheticContactRequest(need: VersionedNeed): ContactRequest {
  const matches = rankProfilesForNeed(need, demoProfiles, {
    limit: 5,
    minScore: 25
  });
  const firstMatch = matches[0];

  assert.ok(firstMatch);

  return createContactRequestFromLatestDecision(
    {
      need,
      candidate: firstMatch,
      decisions: buildRecommendedDecisions(need, matches, now),
      actorUserProfileId: need.ownerUserProfileId,
      idempotencyKey: `postgres-test-contact-${need.id}`,
      expiresAt: new Date("2026-06-28T09:00:00.000Z")
    },
    now
  );
}
