import assert from "node:assert/strict";
import test from "node:test";

import { Pool } from "pg";

import {
  createClarificationForNeed,
  createNeedFromSchema,
  type VersionedNeed
} from "@cifedra/core";

import { getRuntimeDatabaseUrl } from "../src/config.ts";
import { PostgresNeedRepository } from "../src/need-repository.ts";

const databaseUrl = process.env.CIFEDRA_DATABASE_URL;

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
  }, new Date("2026-06-26T09:00:00.000Z"));
}
