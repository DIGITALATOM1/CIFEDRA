import assert from "node:assert/strict";
import test from "node:test";

import {
  activateProviderProfile,
  createProviderProfile,
  createUserProfile,
  isProviderProfileEligibleForMatching,
  localIdentityIssuer,
  resolveIdentityRefFromTrustedMapping,
  submitProviderProfileForReview,
  toProviderPublicPreview,
  updateProviderProfile,
  updateUserProfile
} from "../src/index.ts";

test("resolves stable identity refs from trusted mappings without using email for ownership", () => {
  const identity = resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: "usr_123",
    source: "local"
  });
  const sameIdentityAfterEmailChange = resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: "usr_123",
    source: "local"
  });
  const oidcIdentity = resolveIdentityRefFromTrustedMapping({
    issuer: "HTTPS://IDP.EXAMPLE.COM/Tenant/",
    subject: "external-user-123",
    source: "oidc"
  });

  assert.equal(identity.id, sameIdentityAfterEmailChange.id);
  assert.equal(identity.issuer, "cifedra-local");
  assert.equal(identity.subject, "usr_123");
  assert.equal("email" in identity, false);
  assert.equal(oidcIdentity.issuer, "https://idp.example.com/Tenant/");

  assert.throws(
    () =>
      resolveIdentityRefFromTrustedMapping({
        issuer: " cifedra-local",
        subject: "usr_123",
        source: "local"
      }),
    /padded/
  );
  assert.throws(
    () =>
      resolveIdentityRefFromTrustedMapping({
        issuer: "https://idp.example.com/realms/main?x=1",
        subject: "usr_123",
        source: "oidc"
      }),
    /query/
  );
  assert.throws(
    () =>
      resolveIdentityRefFromTrustedMapping({
        issuer: localIdentityIssuer,
        subject: " usr_123",
        source: "local"
      }),
    /padded/
  );
});

test("creates and updates an owned user profile with ru/en locale metadata", () => {
  const owner = resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: "usr_owner",
    source: "local"
  });
  const other = resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: "usr_other",
    source: "local"
  });
  const profile = createUserProfile(
    {
      ownerIdentityRef: owner,
      displayName: "Игорь",
      locale: "ru-RU",
      timezone: "Europe/Moscow",
      preferredContentLanguage: "ru"
    },
    "user_profile_owner",
    new Date("2026-06-25T08:00:00.000Z")
  );

  assert.equal(profile.ownerIdentityRef.id, owner.id);
  assert.equal(profile.visibility, "private");
  assert.equal(profile.status, "draft");
  assert.equal(profile.locale, "ru-RU");
  assert.equal(profile.preferredContentLanguage, "ru");
  assert.equal(profile.timezone, "Europe/Moscow");

  const updated = updateUserProfile(
    profile,
    owner,
    {
      displayName: "Igor",
      locale: "en-US",
      timezone: "America/New_York",
      preferredContentLanguage: "en",
      countryRegion: "US"
    },
    new Date("2026-06-25T08:10:00.000Z")
  );

  assert.equal(updated.ownerIdentityRef.id, owner.id);
  assert.equal(updated.locale, "en-US");
  assert.equal(updated.preferredContentLanguage, "en");
  assert.equal(updated.updatedAt, "2026-06-25T08:10:00.000Z");
  assert.throws(() => updateUserProfile(profile, other, { displayName: "Other" }), /PROFILE_NOT_OWNED/);
  assert.throws(
    () =>
      createUserProfile({
        ownerIdentityRef: owner,
        displayName: "Invalid",
        locale: "fr-FR",
        timezone: "Europe/Moscow",
        preferredContentLanguage: "ru"
      }),
    /Unsupported locale/
  );
  assert.throws(
    () =>
      createUserProfile({
        ownerIdentityRef: owner,
        displayName: "Invalid",
        locale: "ru-RU",
        timezone: "Mars/Base",
        preferredContentLanguage: "ru"
      }),
    /Invalid timezone/
  );
  assert.throws(
    () =>
      createUserProfile({
        ownerIdentityRef: owner,
        displayName: "Invalid",
        locale: "ru-RU",
        timezone: "Europe/Moscow",
        preferredContentLanguage: "de"
      }),
    /Unsupported language/
  );
});

test("creates owned provider profiles, validates categories and exposes safe public preview", () => {
  const owner = resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: "usr_provider_owner",
    source: "local"
  });
  const userProfile = createUserProfile({
    ownerIdentityRef: owner,
    displayName: "Provider Owner",
    locale: "en-US",
    timezone: "Europe/London",
    preferredContentLanguage: "en"
  });
  const provider = createProviderProfile(
    {
      ownerUserProfileId: userProfile.id,
      displayName: "Dmitry",
      role: "System Analyst",
      summary: "SRS and requirements review.",
      directions: ["work"],
      categoryIds: ["work.expert-help"],
      capabilities: ["srs", "Requirements", "srs"],
      spokenLanguages: ["en", "ru", "en"],
      availability: "available",
      trustSignals: [
        {
          type: "portfolio",
          label: "Portfolio reviewed",
          verified: true
        },
        {
          type: "reference",
          label: "Reference pending",
          verified: false
        }
      ],
      serviceCapabilities: [
        {
          categoryId: "work.expert-help",
          capabilitySchemaId: "work.srs-review.v1",
          capabilitySchemaVersion: 1,
          answers: {
            reviewFocus: "quick_review"
          }
        }
      ]
    },
    "provider_profile_work",
    new Date("2026-06-25T09:00:00.000Z")
  );

  assert.equal(provider.ownerUserProfileId, userProfile.id);
  assert.equal(provider.status, "draft");
  assert.equal(provider.visibility, "private");
  assert.deepEqual(provider.capabilities, ["srs", "requirements"]);
  assert.deepEqual(provider.spokenLanguages, ["en", "ru"]);
  assert.equal(isProviderProfileEligibleForMatching(provider), false);

  const pending = submitProviderProfileForReview(
    provider,
    userProfile.id,
    new Date("2026-06-25T09:10:00.000Z")
  );
  const active = activateProviderProfile(
    pending,
    "provider.review",
    new Date("2026-06-25T09:20:00.000Z")
  );
  const preview = toProviderPublicPreview(active);

  assert.equal(active.status, "active");
  assert.equal(active.visibility, "public");
  assert.equal(active.serviceCapabilities[0]?.status, "active");
  assert.equal(isProviderProfileEligibleForMatching(active), true);
  assert.equal("ownerUserProfileId" in preview, false);
  assert.equal("ownerIdentityRef" in preview, false);
  assert.equal(preview.trustSignals.length, 1);

  assert.throws(
    () => updateProviderProfile(provider, "other_user_profile", { displayName: "Other" }),
    /PROFILE_NOT_OWNED/
  );
  assert.throws(
    () =>
      createProviderProfile({
        ...provider,
        ownerUserProfileId: userProfile.id,
        directions: ["work"],
        categoryIds: ["skills.career-help"],
        spokenLanguages: ["en"]
      }),
    /Category does not belong/
  );
});
