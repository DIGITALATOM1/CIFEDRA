import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRecommendedDecisions,
  createContactRequestFromLatestDecision,
  createLocalIdentityRef,
  createNeed,
  demoProfiles,
  markNeedMatched,
  rankProfilesForNeed,
  type AuthPrincipal,
  type AuthRole,
  type ContactRequest
} from "@cifedra/core";

import {
  ContactRequestApplicationError,
  ContactRequestApplicationService,
  type ContactRequestTransactionalRepository
} from "../src/contact-request-service.ts";

const now = new Date("2026-06-28T10:00:00.000Z");

test("transitions contact request through application service using auth actor", async () => {
  const acceptRepository = new FakeContactRequestRepository(createSyntheticContactRequest());
  const acceptService = new ContactRequestApplicationService(acceptRepository);
  const accepted = await acceptService.accept({
    requestId: acceptRepository.current.id,
    expectedAggregateVersion: 1,
    actor: principal(acceptRepository.current.providerProfileId, ["helper"]),
    now: new Date("2026-06-28T11:00:00.000Z")
  });

  assert.equal(accepted.contactRequest.status, "accepted");
  assert.equal(accepted.contactRequest.aggregateVersion, 2);
  assert.equal(accepted.audit.actorUserId, acceptRepository.current.providerProfileId);
  assert.equal(accepted.audit.action, "accept");
  assert.equal(accepted.audit.expectedAggregateVersion, 1);
  assert.equal(accepted.audit.resultingAggregateVersion, 2);

  const cancelRepository = new FakeContactRequestRepository(createSyntheticContactRequest());
  const cancelService = new ContactRequestApplicationService(cancelRepository);
  const cancelled = await cancelService.cancel({
    requestId: cancelRepository.current.id,
    expectedAggregateVersion: 1,
    actor: principal(cancelRepository.current.clientUserProfileId, ["client"]),
    now: new Date("2026-06-28T11:05:00.000Z")
  });

  assert.equal(cancelled.contactRequest.status, "cancelled");
  assert.equal(cancelled.audit.action, "cancel");
});

test("rejects unsafe contact request actors and stale versions", async () => {
  const request = createSyntheticContactRequest();
  const service = new ContactRequestApplicationService(
    new FakeContactRequestRepository(request)
  );

  await assert.rejects(
    () =>
      service.accept({
        requestId: request.id,
        expectedAggregateVersion: 1,
        actor: principal(request.clientUserProfileId, ["client"])
      }),
    (error: unknown) =>
      error instanceof ContactRequestApplicationError &&
      error.statusCode === 403 &&
      error.code === "CONTACT_REQUEST_FORBIDDEN"
  );

  await assert.rejects(
    () =>
      service.cancel({
        requestId: request.id,
        expectedAggregateVersion: 1,
        actor: principal("operator_user", ["operator"])
      }),
    (error: unknown) =>
      error instanceof ContactRequestApplicationError &&
      error.statusCode === 403 &&
      error.code === "CONTACT_REQUEST_FORBIDDEN"
  );

  await assert.rejects(
    () =>
      service.cancel({
        requestId: request.id,
        expectedAggregateVersion: 99,
        actor: principal(request.clientUserProfileId, ["client"])
      }),
    (error: unknown) =>
      error instanceof ContactRequestApplicationError &&
      error.statusCode === 409 &&
      error.code === "CONTACT_REQUEST_VERSION_CONFLICT"
  );

  await assert.rejects(
    () =>
      service.cancel({
        requestId: request.id,
        expectedAggregateVersion: Number.NaN,
        actor: principal(request.clientUserProfileId, ["client"])
      }),
    (error: unknown) =>
      error instanceof ContactRequestApplicationError &&
      error.statusCode === 400 &&
      error.code === "CONTACT_REQUEST_EXPECTED_VERSION_REQUIRED"
  );
});

test("maps missing contact request to safe application error", async () => {
  const request = createSyntheticContactRequest();
  const service = new ContactRequestApplicationService(
    new FakeContactRequestRepository(request)
  );

  await assert.rejects(
    () =>
      service.cancel({
        requestId: "contact_request_missing",
        expectedAggregateVersion: 1,
        actor: principal(request.clientUserProfileId, ["client"])
      }),
    (error: unknown) =>
      error instanceof ContactRequestApplicationError &&
      error.statusCode === 404 &&
      error.code === "CONTACT_REQUEST_NOT_FOUND"
  );
});

class FakeContactRequestRepository implements ContactRequestTransactionalRepository {
  constructor(public current: ContactRequest) {}

  async updateContactRequest(
    requestId: string,
    expectedAggregateVersion: number,
    transition: (current: ContactRequest) => ContactRequest
  ): Promise<ContactRequest> {
    if (requestId !== this.current.id) {
      throw new RepositoryNotFoundError(`ContactRequest ${requestId} was not found`);
    }

    if (expectedAggregateVersion !== this.current.aggregateVersion) {
      throw new RepositoryConflictError(`Expected ${expectedAggregateVersion}`);
    }

    this.current = transition(this.current);
    return this.current;
  }
}

class RepositoryNotFoundError extends Error {}

class RepositoryConflictError extends Error {}

function createSyntheticContactRequest(): ContactRequest {
  const need = markNeedMatched(
    createNeed(
      {
        direction: "work",
        categoryId: "work.expert-help",
        title: "Нужно ревью SRS",
        description: "Нужно проверить требования перед передачей в разработку.",
        expectedResult: "Список замечаний и правок",
        ownerUserProfileId: "client_user_profile",
        tags: ["srs", "requirements", "review"]
      },
      now
    )
  );
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
      idempotencyKey: `service-test-${need.id}`,
      expiresAt: new Date("2026-06-30T10:00:00.000Z")
    },
    now
  );
}

function principal(id: string, roles: readonly AuthRole[]): AuthPrincipal {
  return {
    id,
    identityRef: createLocalIdentityRef(id),
    email: `${id}@cifedra.local`,
    displayName: id,
    roles
  };
}
