import type { CandidateDecision, MatchCandidate, Need } from "./domain.js";
import { createId, toIsoString } from "./utils.js";

export type ContactRequestStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export interface ContactRequestPublicBrief {
  readonly direction: Need["direction"];
  readonly categoryId: string;
  readonly title: string;
  readonly expectedResult: string;
  readonly serviceRegion?: {
    readonly city?: string;
    readonly district?: string;
    readonly remoteAllowed?: boolean;
  };
  readonly serviceVariants?: readonly string[];
  readonly preferredTimeWindow?: string;
  readonly originalContentLanguage?: string;
  readonly communicationLanguage?: string;
  readonly preferredResultLanguage?: string;
}

export interface ContactRequestDisclosureSnapshot {
  readonly policyVersion: string;
  readonly publicBrief: ContactRequestPublicBrief;
  readonly hiddenFields: readonly string[];
}

export interface ContactRequestConsentSnapshot {
  readonly purpose: "provider_pre_accept_brief";
  readonly version: string;
  readonly grantedByUserProfileId: string;
  readonly grantedAt: string;
  readonly allowedDisclosureFields: readonly string[];
}

export interface ContactRequest {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly decisionId: string;
  readonly clientUserProfileId: string;
  readonly providerProfileId: string;
  readonly status: ContactRequestStatus;
  readonly disclosureSnapshot: ContactRequestDisclosureSnapshot;
  readonly consentSnapshot: ContactRequestConsentSnapshot;
  readonly idempotencyKey?: string;
  readonly requestedAt: string;
  readonly expiresAt?: string;
  readonly respondedAt?: string;
  readonly cancelledAt?: string;
  readonly declineReason?: string;
  readonly aggregateVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateContactRequestInput {
  readonly need: Need;
  readonly candidate: MatchCandidate;
  readonly decision: CandidateDecision;
  readonly actorUserProfileId: string;
  readonly idempotencyKey?: string;
  readonly expiresAt?: Date;
  readonly disclosurePolicyVersion?: string;
  readonly consentVersion?: string;
  readonly allowedDisclosureFields?: readonly string[];
}

export interface CreateContactRequestFromLatestDecisionInput
  extends Omit<CreateContactRequestInput, "decision"> {
  readonly decisions: readonly CandidateDecision[];
}

export class ContactRequestError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

const creatableNeedStatuses: readonly Need["status"][] = ["ready_for_match", "matched"];

const defaultAllowedDisclosureFields = [
  "direction",
  "categoryId",
  "title",
  "expectedResult",
  "serviceRegion",
  "serviceVariants",
  "preferredTimeWindow",
  "originalContentLanguage",
  "communicationLanguage",
  "preferredResultLanguage"
] as const;

const defaultHiddenFields = [
  "contact.phone",
  "contact.email",
  "contact.messenger",
  "location.exactAddress",
  "location.latitude",
  "location.longitude",
  "artifacts.content",
  "artifacts.externalLinks",
  "payment.data",
  "identity.documents"
] as const;

export function createContactRequest(
  input: CreateContactRequestInput,
  now: Date = new Date()
): ContactRequest {
  validateCreateContactRequest(input, now);

  const timestamp = toIsoString(now);
  const expiresAt = input.expiresAt ? toIsoString(input.expiresAt) : undefined;

  return {
    id: createId("contact_request"),
    needId: input.need.id,
    profileId: input.candidate.profile.id,
    decisionId: input.decision.id,
    clientUserProfileId: input.need.ownerUserProfileId ?? "",
    providerProfileId: input.candidate.profile.id,
    status: "requested",
    disclosureSnapshot: buildContactRequestDisclosureSnapshot(
      input.need,
      input.disclosurePolicyVersion
    ),
    consentSnapshot: {
      purpose: "provider_pre_accept_brief",
      version: input.consentVersion ?? "contact-request-pre-accept-v1",
      grantedByUserProfileId: input.actorUserProfileId,
      grantedAt: timestamp,
      allowedDisclosureFields: [
        ...(input.allowedDisclosureFields ?? defaultAllowedDisclosureFields)
      ]
    },
    idempotencyKey: normalizeOptional(input.idempotencyKey),
    requestedAt: timestamp,
    expiresAt,
    aggregateVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createContactRequestFromLatestDecision(
  input: CreateContactRequestFromLatestDecisionInput,
  now: Date = new Date()
): ContactRequest {
  const decision = findLatestCandidateDecision(
    input.need.id,
    input.candidate.profile.id,
    input.decisions
  );

  if (!decision) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_DECISION_REQUIRED",
      "Contact request requires candidate decision for selected profile"
    );
  }

  return createContactRequest(
    {
      ...input,
      decision
    },
    now
  );
}

export function acceptContactRequest(
  request: ContactRequest,
  actorProviderProfileId: string,
  now: Date = new Date()
): ContactRequest {
  assertProviderCanRespond(request, actorProviderProfileId);

  return transitionContactRequest(request, "accepted", now, {
    respondedAt: toIsoString(now)
  });
}

export function declineContactRequest(
  request: ContactRequest,
  actorProviderProfileId: string,
  reason?: string,
  now: Date = new Date()
): ContactRequest {
  assertProviderCanRespond(request, actorProviderProfileId);

  return transitionContactRequest(request, "declined", now, {
    respondedAt: toIsoString(now),
    declineReason: normalizeOptional(reason)
  });
}

export function cancelContactRequest(
  request: ContactRequest,
  actorUserProfileId: string,
  now: Date = new Date()
): ContactRequest {
  assertPending(request);

  if (request.clientUserProfileId !== actorUserProfileId) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_FORBIDDEN",
      "Only the Need owner can cancel contact request"
    );
  }

  return transitionContactRequest(request, "cancelled", now, {
    cancelledAt: toIsoString(now)
  });
}

export function expireContactRequest(
  request: ContactRequest,
  now: Date = new Date()
): ContactRequest {
  if (request.status === "expired") {
    return request;
  }

  assertPending(request);

  if (!request.expiresAt) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_EXPIRY_NOT_CONFIGURED",
      "Contact request has no expiry time"
    );
  }

  if (new Date(request.expiresAt).getTime() > now.getTime()) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_NOT_DUE",
      "Contact request is not due for expiry"
    );
  }

  return transitionContactRequest(request, "expired", now);
}

export function isActiveContactRequest(request: ContactRequest): boolean {
  return request.status === "requested";
}

export function buildContactRequestDisclosureSnapshot(
  need: Need,
  policyVersion = "contact-request-disclosure-v1"
): ContactRequestDisclosureSnapshot {
  const answers = need.answers ?? {};

  return {
    policyVersion,
    publicBrief: {
      direction: need.direction,
      categoryId: need.categoryId,
      title: need.title,
      expectedResult: need.expectedResult,
      serviceRegion: buildPublicServiceRegion(need),
      serviceVariants: normalizeStringList(answers.serviceTypes),
      preferredTimeWindow: normalizeOptionalString(answers.preferredTimeWindow),
      originalContentLanguage: need.originalContentLanguage,
      communicationLanguage: need.communicationLanguage,
      preferredResultLanguage: need.preferredResultLanguage
    },
    hiddenFields: [...defaultHiddenFields]
  };
}

function validateCreateContactRequest(input: CreateContactRequestInput, now: Date): void {
  const ownerUserProfileId = normalizeOptional(input.need.ownerUserProfileId);

  if (!ownerUserProfileId) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_OWNER_REQUIRED",
      "Contact request requires Need owner"
    );
  }

  if (ownerUserProfileId !== input.actorUserProfileId) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_FORBIDDEN",
      "Only the Need owner can request contact"
    );
  }

  if (!creatableNeedStatuses.includes(input.need.status)) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_NEED_NOT_MATCHABLE",
      `Need status ${input.need.status} cannot create contact request`
    );
  }

  if (input.decision.decision !== "requested_contact") {
    throw new ContactRequestError(
      "CONTACT_REQUEST_DECISION_REQUIRED",
      "Contact request requires requested_contact decision"
    );
  }

  if (input.decision.needId !== input.need.id) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_DECISION_MISMATCH",
      "Candidate decision does not belong to Need"
    );
  }

  if (input.decision.profileId !== input.candidate.profile.id) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_CANDIDATE_MISMATCH",
      "Candidate decision does not belong to selected profile"
    );
  }

  if (input.expiresAt && input.expiresAt.getTime() <= now.getTime()) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_INVALID_EXPIRY",
      "Contact request expiry must be in the future"
    );
  }
}

function findLatestCandidateDecision(
  needId: string,
  profileId: string,
  decisions: readonly CandidateDecision[]
): CandidateDecision | undefined {
  let latest: CandidateDecision | undefined;

  for (const decision of decisions) {
    if (decision.needId !== needId || decision.profileId !== profileId) {
      continue;
    }

    if (!latest || decision.decidedAt >= latest.decidedAt) {
      latest = decision;
    }
  }

  return latest;
}

function assertProviderCanRespond(
  request: ContactRequest,
  actorProviderProfileId: string
): void {
  assertPending(request);

  if (request.providerProfileId !== actorProviderProfileId) {
    throw new ContactRequestError(
      "CONTACT_REQUEST_FORBIDDEN",
      "Only the selected provider can respond to contact request"
    );
  }
}

function assertPending(request: ContactRequest): void {
  if (request.status !== "requested") {
    throw new ContactRequestError(
      "CONTACT_REQUEST_NOT_PENDING",
      `Contact request ${request.id} is ${request.status}`
    );
  }
}

function transitionContactRequest(
  request: ContactRequest,
  status: ContactRequestStatus,
  now: Date,
  patch: Partial<
    Pick<ContactRequest, "respondedAt" | "cancelledAt" | "declineReason">
  > = {}
): ContactRequest {
  return {
    ...request,
    ...patch,
    status,
    aggregateVersion: request.aggregateVersion + 1,
    updatedAt: toIsoString(now)
  };
}

function buildPublicServiceRegion(
  need: Need
): ContactRequestPublicBrief["serviceRegion"] | undefined {
  if (!need.location) {
    return undefined;
  }

  const region = {
    city: normalizeOptional(need.location.city),
    district: normalizeOptional(need.location.district),
    remoteAllowed: need.location.remoteAllowed
  };

  if (
    region.city === undefined &&
    region.district === undefined &&
    region.remoteAllowed === undefined
  ) {
    return undefined;
  }

  return region;
}

function normalizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tokens = value.filter((item): item is string => typeof item === "string");

  return tokens.length > 0 ? tokens : undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? normalizeOptional(value) : undefined;
}

function normalizeOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}
