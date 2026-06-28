import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { Pool } from "pg";

import {
  buildRecommendedDecisions,
  createContactRequestFromLatestDecision,
  createClarificationForNeed,
  createNeedFromSchema,
  demoProfiles,
  rankProfilesForNeed,
  type ContactRequest,
  type VersionedNeed
} from "@cifedra/core";

import { getRuntimeDatabaseUrl, localPostgres } from "./config.js";
import { PostgresContactRequestRepository } from "./contact-request-repository.js";
import { PostgresNeedRepository } from "./need-repository.js";

const now = new Date("2026-06-26T09:00:00.000Z");

export async function runLocalPostgresSmoke(): Promise<void> {
  await verifyRuntimeRoleCannotRunDdl();

  const created = await persistSyntheticAggregate();
  const contact = await persistSyntheticContactRequest();

  if (process.env.CIFEDRA_DB_SKIP_RESTART !== "1") {
    restartLocalPostgres();
    await waitForPostgresHealth();
  }

  await verifySyntheticAggregate(created.need.id, created.clarificationId);
  await verifySyntheticContactRequest(contact.need.id, contact.contactRequestId);
  console.log(
    `PostgreSQL repository smoke passed for Need ${created.need.id} and ContactRequest ${contact.contactRequestId}.`
  );
}

async function verifyRuntimeRoleCannotRunDdl(): Promise<void> {
  const pool = createRuntimePool();

  try {
    await pool.query("CREATE TABLE need.runtime_role_ddl_probe (id text)");
  } catch (error) {
    if (isPgErrorCode(error, "42501")) {
      return;
    }

    throw error;
  } finally {
    await pool.end();
  }

  throw new Error("Runtime role unexpectedly created a table in schema need");
}

async function persistSyntheticContactRequest(): Promise<{
  readonly need: VersionedNeed;
  readonly contactRequestId: string;
}> {
  const need = createCompleteWorkNeed();
  const contactRequest = createSyntheticContactRequest(need);
  const pool = createRuntimePool();
  const needRepository = new PostgresNeedRepository(pool);
  const contactRequestRepository = new PostgresContactRequestRepository(pool);

  try {
    await needRepository.saveNeedAggregate({
      need,
      clarifications: []
    });
    await contactRequestRepository.saveContactRequest(contactRequest);
  } finally {
    await pool.end();
  }

  return {
    need,
    contactRequestId: contactRequest.id
  };
}

async function persistSyntheticAggregate(): Promise<{
  readonly need: VersionedNeed;
  readonly clarificationId: string;
}> {
  const need = createIncompleteWorkNeed();
  const created = createClarificationForNeed(
    {
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
    },
    now
  );
  const pool = createRuntimePool();
  const repository = new PostgresNeedRepository(pool);

  try {
    await repository.saveNeedAggregate({
      need: created.need,
      clarifications: [created.clarification]
    });
  } finally {
    await pool.end();
  }

  return {
    need: created.need,
    clarificationId: created.clarification.id
  };
}

async function verifySyntheticAggregate(needId: string, clarificationId: string): Promise<void> {
  const pool = createRuntimePool();
  const repository = new PostgresNeedRepository(pool);

  try {
    const aggregate = await repository.findNeedAggregateById(needId);

    if (!aggregate) {
      throw new Error(`Need ${needId} was not found after PostgreSQL restart`);
    }

    if (aggregate.need.status !== "needs_clarification") {
      throw new Error(`Unexpected Need status after restart: ${aggregate.need.status}`);
    }

    if (!aggregate.clarifications.some((clarification) => clarification.id === clarificationId)) {
      throw new Error(`Clarification ${clarificationId} was not found after restart`);
    }
  } finally {
    await pool.end();
  }
}

async function verifySyntheticContactRequest(
  needId: string,
  contactRequestId: string
): Promise<void> {
  const pool = createRuntimePool();
  const repository = new PostgresContactRequestRepository(pool);

  try {
    const contactRequest = await repository.findContactRequestById(contactRequestId);
    const byNeed = await repository.listContactRequestsByNeedId(needId);

    if (!contactRequest) {
      throw new Error(`ContactRequest ${contactRequestId} was not found after PostgreSQL restart`);
    }

    if (contactRequest.status !== "requested") {
      throw new Error(`Unexpected ContactRequest status after restart: ${contactRequest.status}`);
    }

    if (!byNeed.some((request) => request.id === contactRequestId)) {
      throw new Error(`ContactRequest ${contactRequestId} was not listed by Need ${needId}`);
    }
  } finally {
    await pool.end();
  }
}

function createRuntimePool(): Pool {
  return new Pool({
    connectionString: getRuntimeDatabaseUrl(),
    max: 2
  });
}

function restartLocalPostgres(): void {
  execFileSync(
    "docker",
    ["compose", "-f", localPostgres.composeFile, "restart", localPostgres.serviceName],
    {
      cwd: resolve(import.meta.dirname, "../../.."),
      stdio: "inherit"
    }
  );
}

async function waitForPostgresHealth(): Promise<void> {
  const rootDir = resolve(import.meta.dirname, "../../..");

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      execFileSync(
        "docker",
        [
          "compose",
          "-f",
          localPostgres.composeFile,
          "exec",
          "-T",
          localPostgres.serviceName,
          "pg_isready",
          "-U",
          "cifedra_root",
          "-d",
          localPostgres.database
        ],
        {
          cwd: rootDir,
          stdio: "ignore"
        }
      );
      return;
    } catch {
      await delay(1000);
    }
  }

  throw new Error("PostgreSQL did not become healthy after restart");
}

function createIncompleteWorkNeed(): VersionedNeed {
  const answers = {
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
  };

  return createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_owner",
      schemaId: "work.srs-review",
      schemaVersion: 1,
      title: "Synthetic SRS review",
      description: "Repository-owned synthetic persistence smoke input.",
      answers,
      originalContentLanguage: "en",
      communicationLanguage: "en",
      preferredResultLanguage: "en",
      tags: ["synthetic", "repository", "smoke"]
    },
    now
  );
}

function createCompleteWorkNeed(): VersionedNeed {
  const answers = {
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
  };

  return createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_owner",
      schemaId: "work.srs-review",
      schemaVersion: 1,
      title: "Synthetic SRS review",
      description: "Repository-owned synthetic ContactRequest persistence smoke input.",
      answers,
      originalContentLanguage: "en",
      communicationLanguage: "en",
      preferredResultLanguage: "en",
      location: {
        remoteAllowed: true
      },
      tags: ["synthetic", "repository", "contact-request", "srs", "review"]
    },
    now
  );
}

function createSyntheticContactRequest(need: VersionedNeed): ContactRequest {
  const matches = rankProfilesForNeed(need, demoProfiles, {
    limit: 5,
    minScore: 25
  });
  const firstMatch = matches[0];

  if (!firstMatch) {
    throw new Error(`No synthetic match found for Need ${need.id}`);
  }

  return createContactRequestFromLatestDecision(
    {
      need,
      candidate: firstMatch,
      decisions: buildRecommendedDecisions(need, matches, now),
      actorUserProfileId: need.ownerUserProfileId,
      idempotencyKey: `postgres-smoke-contact-${need.id}`,
      expiresAt: new Date("2026-06-28T09:00:00.000Z")
    },
    now
  );
}

function isPgErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { readonly code?: string }).code === code;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  runLocalPostgresSmoke().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
