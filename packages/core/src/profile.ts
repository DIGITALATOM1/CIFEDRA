import { directionDefinitions } from "./catalog.js";
import type {
  Availability,
  DirectionId,
  Location,
  Profile,
  ProfileMatchingContext,
  TrustSignal
} from "./domain.js";
import type { IdentityRef } from "./identity.js";
import {
  assertSupportedLanguageCode,
  assertSupportedLocaleCode,
  assertValidTimezone,
  normalizeLanguageCodes,
  type LanguageCode,
  type LocaleCode
} from "./language.js";
import { createId, toIsoString, uniqueTokens } from "./utils.js";

export type ProfileVisibility = "private" | "public";
export type UserProfileStatus = "draft" | "active" | "suspended" | "deactivated";
export type ProviderProfileStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rejected"
  | "suspended"
  | "deactivated";

export interface UserProfileInput {
  readonly ownerIdentityRef: IdentityRef;
  readonly displayName: string;
  readonly locale: string;
  readonly timezone: string;
  readonly preferredContentLanguage: string;
  readonly countryRegion?: string;
}

export interface UserProfile {
  readonly id: string;
  readonly ownerIdentityRef: IdentityRef;
  readonly displayName: string;
  readonly locale: LocaleCode;
  readonly timezone: string;
  readonly preferredContentLanguage: LanguageCode;
  readonly countryRegion?: string;
  readonly status: UserProfileStatus;
  readonly visibility: ProfileVisibility;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserProfilePatch {
  readonly displayName?: string;
  readonly locale?: string;
  readonly timezone?: string;
  readonly preferredContentLanguage?: string;
  readonly countryRegion?: string;
}

export interface ServiceCapabilityInput {
  readonly categoryId: string;
  readonly capabilitySchemaId: string;
  readonly capabilitySchemaVersion: number;
  readonly answers: Record<string, unknown>;
}

export interface ServiceCapability extends ServiceCapabilityInput {
  readonly status: "draft" | "active";
}

export interface ProviderProfileInput {
  readonly ownerUserProfileId: string;
  readonly displayName: string;
  readonly role: string;
  readonly summary: string;
  readonly directions: readonly DirectionId[];
  readonly categoryIds: readonly string[];
  readonly capabilities: readonly string[];
  readonly spokenLanguages: readonly string[];
  readonly availability: Availability;
  readonly location?: Location;
  readonly trustSignals?: readonly TrustSignal[];
  readonly matching?: ProfileMatchingContext;
  readonly serviceCapabilities?: readonly ServiceCapabilityInput[];
}

export interface ProviderProfile extends Profile {
  readonly ownerUserProfileId: string;
  readonly spokenLanguages: readonly LanguageCode[];
  readonly status: ProviderProfileStatus;
  readonly visibility: ProfileVisibility;
  readonly serviceCapabilities: readonly ServiceCapability[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProviderProfilePatch {
  readonly displayName?: string;
  readonly role?: string;
  readonly summary?: string;
  readonly directions?: readonly DirectionId[];
  readonly categoryIds?: readonly string[];
  readonly capabilities?: readonly string[];
  readonly spokenLanguages?: readonly string[];
  readonly availability?: Availability;
  readonly location?: Location;
  readonly trustSignals?: readonly TrustSignal[];
  readonly matching?: ProfileMatchingContext;
  readonly serviceCapabilities?: readonly ServiceCapabilityInput[];
}

export interface ProviderPublicPreview {
  readonly id: string;
  readonly displayName: string;
  readonly role: string;
  readonly summary: string;
  readonly directions: readonly DirectionId[];
  readonly categoryIds: readonly string[];
  readonly capabilities: readonly string[];
  readonly spokenLanguages: readonly LanguageCode[];
  readonly availability: Availability;
  readonly trustSignals: readonly TrustSignal[];
}

export class ProfileError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

export function createUserProfile(
  input: UserProfileInput,
  id: string = createId("user_profile"),
  now: Date = new Date()
): UserProfile {
  const timestamp = toIsoString(now);

  return {
    id,
    ownerIdentityRef: input.ownerIdentityRef,
    displayName: normalizeDisplayName(input.displayName),
    locale: assertSupportedLocaleCode(input.locale),
    timezone: assertValidTimezone(input.timezone),
    preferredContentLanguage: assertSupportedLanguageCode(input.preferredContentLanguage),
    countryRegion: normalizeOptionalToken(input.countryRegion),
    status: "draft",
    visibility: "private",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function updateUserProfile(
  profile: UserProfile,
  actorIdentityRef: IdentityRef,
  patch: UserProfilePatch,
  now: Date = new Date()
): UserProfile {
  assertOwnsUserProfile(profile, actorIdentityRef);

  return {
    ...profile,
    displayName: patch.displayName === undefined
      ? profile.displayName
      : normalizeDisplayName(patch.displayName),
    locale: patch.locale === undefined ? profile.locale : assertSupportedLocaleCode(patch.locale),
    timezone: patch.timezone === undefined ? profile.timezone : assertValidTimezone(patch.timezone),
    preferredContentLanguage: patch.preferredContentLanguage === undefined
      ? profile.preferredContentLanguage
      : assertSupportedLanguageCode(patch.preferredContentLanguage),
    countryRegion: patch.countryRegion === undefined
      ? profile.countryRegion
      : normalizeOptionalToken(patch.countryRegion),
    updatedAt: toIsoString(now)
  };
}

export function assertOwnsUserProfile(
  profile: UserProfile,
  actorIdentityRef: IdentityRef
): void {
  if (profile.ownerIdentityRef.id !== actorIdentityRef.id) {
    throw new ProfileError("PROFILE_NOT_OWNED", "Identity does not own user profile");
  }
}

export function createProviderProfile(
  input: ProviderProfileInput,
  id: string = createId("provider_profile"),
  now: Date = new Date()
): ProviderProfile {
  const timestamp = toIsoString(now);
  const directions = normalizeDirections(input.directions);
  const categoryIds = normalizeCategoryIds(input.categoryIds, directions);

  return {
    id,
    ownerUserProfileId: normalizeRequiredId("ownerUserProfileId", input.ownerUserProfileId),
    displayName: normalizeDisplayName(input.displayName),
    role: normalizeRequiredText("role", input.role),
    summary: normalizeRequiredText("summary", input.summary),
    directions,
    categoryIds,
    capabilities: uniqueTokens([...input.capabilities]),
    availability: input.availability,
    location: input.location,
    trustSignals: [...(input.trustSignals ?? [])],
    matching: input.matching,
    spokenLanguages: normalizeNonEmptyLanguages(input.spokenLanguages),
    status: "draft",
    visibility: "private",
    serviceCapabilities: normalizeServiceCapabilities(input.serviceCapabilities ?? [], categoryIds),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function updateProviderProfile(
  profile: ProviderProfile,
  actorUserProfileId: string,
  patch: ProviderProfilePatch,
  now: Date = new Date()
): ProviderProfile {
  assertOwnsProviderProfile(profile, actorUserProfileId);

  const directions = patch.directions === undefined
    ? profile.directions
    : normalizeDirections(patch.directions);
  const categoryIds = patch.categoryIds === undefined
    ? profile.categoryIds
    : normalizeCategoryIds(patch.categoryIds, directions);

  return {
    ...profile,
    displayName: patch.displayName === undefined
      ? profile.displayName
      : normalizeDisplayName(patch.displayName),
    role: patch.role === undefined ? profile.role : normalizeRequiredText("role", patch.role),
    summary: patch.summary === undefined
      ? profile.summary
      : normalizeRequiredText("summary", patch.summary),
    directions,
    categoryIds,
    capabilities: patch.capabilities === undefined
      ? profile.capabilities
      : uniqueTokens([...patch.capabilities]),
    spokenLanguages: patch.spokenLanguages === undefined
      ? profile.spokenLanguages
      : normalizeNonEmptyLanguages(patch.spokenLanguages),
    availability: patch.availability ?? profile.availability,
    location: patch.location === undefined ? profile.location : patch.location,
    trustSignals: patch.trustSignals === undefined
      ? profile.trustSignals
      : [...patch.trustSignals],
    matching: patch.matching === undefined ? profile.matching : patch.matching,
    serviceCapabilities: patch.serviceCapabilities === undefined
      ? profile.serviceCapabilities
      : normalizeServiceCapabilities(patch.serviceCapabilities, categoryIds),
    updatedAt: toIsoString(now)
  };
}

export function assertOwnsProviderProfile(
  profile: ProviderProfile,
  actorUserProfileId: string
): void {
  if (profile.ownerUserProfileId !== actorUserProfileId) {
    throw new ProfileError("PROFILE_NOT_OWNED", "User profile does not own provider profile");
  }
}

export function submitProviderProfileForReview(
  profile: ProviderProfile,
  actorUserProfileId: string,
  now: Date = new Date()
): ProviderProfile {
  assertOwnsProviderProfile(profile, actorUserProfileId);

  if (profile.status !== "draft" && profile.status !== "rejected") {
    throw new ProfileError("PROFILE_STATUS_INVALID", "Provider profile is not submittable");
  }

  return {
    ...profile,
    status: "pending_review",
    updatedAt: toIsoString(now)
  };
}

export function activateProviderProfile(
  profile: ProviderProfile,
  permission: "provider.review",
  now: Date = new Date()
): ProviderProfile {
  if (permission !== "provider.review") {
    throw new ProfileError("PROFILE_PERMISSION_REQUIRED", "provider.review is required");
  }

  if (profile.status !== "pending_review" && profile.status !== "suspended") {
    throw new ProfileError("PROFILE_STATUS_INVALID", "Provider profile is not activatable");
  }

  return {
    ...profile,
    status: "active",
    visibility: "public",
    serviceCapabilities: profile.serviceCapabilities.map((capability) => ({
      ...capability,
      status: "active"
    })),
    updatedAt: toIsoString(now)
  };
}

export function isProviderProfileEligibleForMatching(profile: ProviderProfile): boolean {
  return profile.status === "active";
}

export function toProviderPublicPreview(profile: ProviderProfile): ProviderPublicPreview {
  return {
    id: profile.id,
    displayName: profile.displayName,
    role: profile.role,
    summary: profile.summary,
    directions: profile.directions,
    categoryIds: profile.categoryIds,
    capabilities: profile.capabilities,
    spokenLanguages: profile.spokenLanguages,
    availability: profile.availability,
    trustSignals: profile.trustSignals.filter((signal) => signal.verified)
  };
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim();

  if (displayName.length < 2) {
    throw new ProfileError("PROFILE_INVALID", "Display name must contain at least 2 characters");
  }

  return displayName;
}

function normalizeRequiredText(name: string, value: string): string {
  const text = value.trim();

  if (!text) {
    throw new ProfileError("PROFILE_INVALID", `${name} is required`);
  }

  return text;
}

function normalizeRequiredId(name: string, value: string): string {
  const text = normalizeRequiredText(name, value);

  if (/[\u0000-\u001F\u007F]/.test(text)) {
    throw new ProfileError("PROFILE_INVALID", `${name} must not contain control characters`);
  }

  return text;
}

function normalizeOptionalToken(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const token = value.trim();

  return token || undefined;
}

function normalizeDirections(directions: readonly DirectionId[]): DirectionId[] {
  const knownDirections = new Set(directionDefinitions.map((direction) => direction.id));
  const uniqueDirections = [...new Set(directions)];

  if (uniqueDirections.length === 0) {
    throw new ProfileError("PROFILE_INVALID", "Provider directions are required");
  }

  for (const direction of uniqueDirections) {
    if (!knownDirections.has(direction)) {
      throw new ProfileError("PROFILE_INVALID", `Unknown direction: ${direction}`);
    }
  }

  return uniqueDirections;
}

function normalizeCategoryIds(
  categoryIds: readonly string[],
  directions: readonly DirectionId[]
): string[] {
  const uniqueCategoryIds = uniqueTokens([...categoryIds]);

  if (uniqueCategoryIds.length === 0) {
    throw new ProfileError("PROFILE_INVALID", "Provider categories are required");
  }

  for (const categoryId of uniqueCategoryIds) {
    if (!directions.some((directionId) => categoryBelongsToDirection(categoryId, directionId))) {
      throw new ProfileError("PROFILE_INVALID", `Category does not belong to provider directions: ${categoryId}`);
    }
  }

  return uniqueCategoryIds;
}

function categoryBelongsToDirection(categoryId: string, directionId: DirectionId): boolean {
  const direction = directionDefinitions.find((item) => item.id === directionId);

  return Boolean(direction?.categories.some((category) => category.id === categoryId));
}

function normalizeNonEmptyLanguages(values: readonly string[]): LanguageCode[] {
  const languages = normalizeLanguageCodes(values);

  if (languages.length === 0) {
    throw new ProfileError("PROFILE_INVALID", "At least one spoken language is required");
  }

  return languages;
}

function normalizeServiceCapabilities(
  capabilities: readonly ServiceCapabilityInput[],
  categoryIds: readonly string[]
): ServiceCapability[] {
  return capabilities.map((capability) => {
    if (!categoryIds.includes(capability.categoryId)) {
      throw new ProfileError(
        "PROFILE_INVALID",
        `Capability category is not declared by provider: ${capability.categoryId}`
      );
    }

    if (!Number.isInteger(capability.capabilitySchemaVersion) || capability.capabilitySchemaVersion <= 0) {
      throw new ProfileError("PROFILE_INVALID", "Capability schema version must be positive");
    }

    return {
      ...capability,
      capabilitySchemaId: normalizeRequiredText(
        "capabilitySchemaId",
        capability.capabilitySchemaId
      ),
      status: "draft"
    };
  });
}
