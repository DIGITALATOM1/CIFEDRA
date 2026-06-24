import assert from "node:assert/strict";
import test from "node:test";

import {
  createNeedFromSchema,
  demoProfiles,
  evaluateNeedCompleteness,
  findNeedSchema,
  localNeedSchemas,
  rankProfilesForNeed,
  type NeedSchema
} from "../src/index.ts";

const now = new Date("2026-06-25T10:00:00.000Z");

test("creates a complete versioned Work SRS Review need and pins schema metadata", () => {
  const need = createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_owner",
      schemaId: "work.srs-review",
      schemaVersion: 1,
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      answers: completeWorkAnswers(),
      originalContentLanguage: "ru",
      communicationLanguage: "ru",
      preferredResultLanguage: "ru",
      tags: ["srs", "requirements", "review"]
    },
    now
  );

  assert.equal(need.status, "ready_for_match");
  assert.equal(need.schemaId, "work.srs-review");
  assert.equal(need.schemaVersion, 1);
  assert.equal(need.ownerUserProfileId, "user_profile_owner");
  assert.equal(need.originalContentLanguage, "ru");
  assert.equal(need.completeness.complete, true);
  assert.deepEqual(need.completeness.missingFieldIds, []);
  assert.deepEqual(need.completeness.invalidFieldIds, []);
  assert.equal(rankProfilesForNeed(need, demoProfiles)[0]?.profile.id, "profile_work_dmitry");
});

test("keeps incomplete Work intake out of matching and reports deterministic gaps", () => {
  const answers = completeWorkAnswers();
  delete answers.systemContext;
  answers.artifactSizeValue = 12_000;

  const need = createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_owner",
      schemaId: "work.srs-review",
      schemaVersion: 1,
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      answers,
      originalContentLanguage: "ru",
      communicationLanguage: "ru",
      preferredResultLanguage: "ru"
    },
    now
  );

  assert.equal(need.status, "needs_clarification");
  assert.deepEqual(need.completeness.missingFieldIds, ["systemContext"]);
  assert.deepEqual(need.completeness.invalidFieldIds, ["artifactSizeValue"]);
  assert.throws(() => rankProfilesForNeed(need, demoProfiles), /NEED_NOT_READY_FOR_MATCHING/);
});

test("validates Life outdoor maintenance variants and synthetic privacy boundary", () => {
  const completeNeed = createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_life",
      schemaId: "life.outdoor-maintenance",
      schemaVersion: 1,
      title: "Уход за участком",
      description: "Нужно синтетически проверить уход за территорией около дома.",
      answers: completeLifeAnswers(),
      originalContentLanguage: "ru",
      communicationLanguage: "en",
      preferredResultLanguage: "ru",
      tags: ["home", "lawn", "pool"]
    },
    now
  );

  assert.equal(completeNeed.status, "ready_for_match");
  assert.equal(completeNeed.categoryId, "life.home-help");
  assert.equal(completeNeed.completeness.complete, true);

  const missingConditionalAnswers = completeLifeAnswers();
  delete missingConditionalAnswers.poolSizeValue;
  missingConditionalAnswers.singleProviderVisit = false;
  missingConditionalAnswers.propertyContext = "Участок на улице Тверская, дом 1";

  const schema = findNeedSchema("life.outdoor-maintenance", 1);
  assert.ok(schema);

  const completeness = evaluateNeedCompleteness(schema, missingConditionalAnswers, now);
  assert.equal(completeness.complete, false);
  assert.deepEqual(completeness.missingFieldIds, ["poolSizeValue"]);
  assert.deepEqual(completeness.invalidFieldIds, ["singleProviderVisit", "propertyContext"]);
});

test("validates Skills interview preparation language and format rules", () => {
  const need = createNeedFromSchema(
    {
      ownerUserProfileId: "user_profile_skills",
      schemaId: "skills.interview-preparation",
      schemaVersion: 1,
      title: "Подготовка к интервью",
      description: "Нужна практика ответов и разбор синтетического контекста.",
      answers: completeSkillsAnswers(),
      originalContentLanguage: "ru",
      communicationLanguage: "en",
      preferredResultLanguage: "en",
      tags: ["career", "interview", "resume"]
    },
    now
  );

  assert.equal(need.status, "ready_for_match");
  assert.equal(need.completeness.complete, true);

  const invalidAnswers = completeSkillsAnswers();
  invalidAnswers.preferredFormat = "async";
  invalidAnswers.interviewLanguage = "de";
  invalidAnswers.vacancyContext = "Attach my real CV as PDF and use https://example.com/job";

  const schema = findNeedSchema("skills.interview-preparation", 1);
  assert.ok(schema);

  const completeness = evaluateNeedCompleteness(schema, invalidAnswers, now);
  assert.equal(completeness.complete, false);
  assert.deepEqual(completeness.invalidFieldIds, [
    "interviewLanguage",
    "vacancyContext",
    "preferredFormat"
  ]);
});

test("rejects unknown, deprecated and unpublished Need schemas", () => {
  assert.throws(
    () =>
      createNeedFromSchema(
        {
          ownerUserProfileId: "user_profile_owner",
          schemaId: "unknown.schema",
          schemaVersion: 1,
          title: "Unknown",
          description: "Unknown schema should not be accepted.",
          answers: {},
          originalContentLanguage: "ru",
          communicationLanguage: "ru",
          preferredResultLanguage: "ru"
        },
        now
      ),
    /NEED_SCHEMA_NOT_FOUND/
  );

  const deprecatedRegistry: NeedSchema[] = localNeedSchemas.map((schema) =>
    schema.schemaId === "work.srs-review"
      ? {
          ...schema,
          status: "deprecated"
        }
      : schema
  );
  const deprecatedWorkSchema = deprecatedRegistry.find(
    (schema) => schema.schemaId === "work.srs-review"
  );
  assert.ok(deprecatedWorkSchema);
  assert.equal(
    evaluateNeedCompleteness(deprecatedWorkSchema, completeWorkAnswers(), now).complete,
    true
  );

  assert.throws(
    () =>
      createNeedFromSchema(
        {
          ownerUserProfileId: "user_profile_owner",
          schemaId: "work.srs-review",
          schemaVersion: 1,
          title: "Нужно ревью SRS",
          description: "Нужно проверить требования перед передачей в разработку.",
          answers: completeWorkAnswers(),
          originalContentLanguage: "ru",
          communicationLanguage: "ru",
          preferredResultLanguage: "ru"
        },
        now,
        deprecatedRegistry
      ),
    /NEED_SCHEMA_NOT_PUBLISHED/
  );
});

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

function completeLifeAnswers(): Record<string, unknown> {
  return {
    serviceTypes: ["pool_cleaning", "lawn_mowing"],
    singleProviderVisit: true,
    serviceRegionId: "synthetic_region_north",
    desiredDate: "2026-06-30",
    propertyContext: "Синтетический участок без точного адреса.",
    expectedResult: "Газон подстрижен, бассейн очищен.",
    accessPresence: "to_be_agreed",
    dataMode: "synthetic",
    serviceFormat: "in_person",
    poolSizeValue: 24,
    poolSizeUnit: "square_meters",
    poolCondition: "routine",
    lawnAreaM2: 300,
    terrainCondition: "mixed",
    preferredTimeWindow: "morning",
    equipmentResponsibility: "provider",
    accessConstraints: "none",
    safetyConcerns: "none"
  };
}

function completeSkillsAnswers(): Record<string, unknown> {
  return {
    targetRole: "System Analyst",
    targetSeniority: "senior",
    domainContext: "Digital platform",
    currentSeniority: "middle",
    interviewTypes: ["system_design", "behavioral"],
    preparationGoal: "mock_interview",
    targetTimeline: "within_week",
    interviewLanguage: "en",
    vacancyContext: "Synthetic vacancy summary for local UAT only.",
    expectedResult: "Feedback and preparation plan.",
    preferredFormat: "video",
    sessionDurationMinutes: "60",
    dataMode: "synthetic"
  };
}
