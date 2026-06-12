import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConversationBrief,
  buildIntegrationWorkflow,
  createNeed,
  demoProfiles,
  integrationDefinitions,
  rankProfilesForNeed,
  recordContactResult
} from "../src/index.ts";

test("creates a valid work need and ranks a relevant profile", () => {
  const need = createNeed({
    direction: "work",
    categoryId: "work.expert-help",
    title: "Нужно ревью SRS",
    description: "Нужно проверить требования перед передачей в разработку.",
    expectedResult: "Список замечаний и правок",
    tags: ["srs", "requirements", "review"],
    location: {
      remoteAllowed: true
    }
  });

  const matches = rankProfilesForNeed(need, demoProfiles);

  assert.equal(matches[0]?.profile.id, "profile_work_dmitry");
  assert.equal(matches[0]?.recommendedAction, "request_contact");
});

test("builds a conversation brief from a match", () => {
  const need = createNeed({
    direction: "skills",
    categoryId: "skills.career-help",
    title: "Подготовка к интервью",
    description: "Нужна практика ответов и разбор резюме.",
    expectedResult: "План подготовки и обратная связь",
    tags: ["career", "interview", "resume"]
  });

  const [candidate] = rankProfilesForNeed(need, demoProfiles);

  assert.ok(candidate);

  const brief = buildConversationBrief(need, candidate);

  assert.equal(brief.needId, need.id);
  assert.equal(brief.profileId, "profile_skills_maria");
  assert.ok(brief.questions.length >= 3);
});

test("records a contact result and clamps quality score", () => {
  const result = recordContactResult({
    needId: "need_demo",
    profileId: "profile_demo",
    outcome: "agreed",
    summary: "Договорились о следующем шаге.",
    qualityScore: 140
  });

  assert.equal(result.qualityScore, 100);
  assert.equal(result.outcome, "agreed");
});

test("declares the local task and chat integrations", () => {
  const integrationIds = integrationDefinitions.map((integration) => integration.id);

  assert.deepEqual(integrationIds, ["plane", "chatwoot"]);
  assert.equal(integrationDefinitions[0]?.kind, "tasks");
  assert.equal(integrationDefinitions[1]?.kind, "chat");
  assert.ok(integrationDefinitions.every((integration) => integration.runtime === "docker-compose"));
});

test("binds match flow to Plane and Chatwoot handoffs", () => {
  const need = createNeed({
    direction: "work",
    categoryId: "work.expert-help",
    title: "Нужно ревью SRS",
    description: "Нужно проверить SRS и найти слабые места перед передачей в разработку.",
    expectedResult: "Список замечаний и правок",
    tags: ["srs", "review"]
  });
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  const brief = buildConversationBrief(need, candidate);
  const workflow = buildIntegrationWorkflow(need, candidate, brief);

  assert.deepEqual(
    workflow.steps.map((step) => step.id),
    ["need", "match", "prepare", "plane-task", "chatwoot-conversation", "result"]
  );
  assert.equal(workflow.steps.find((step) => step.id === "plane-task")?.status, "ready");
  assert.equal(workflow.steps.find((step) => step.id === "chatwoot-conversation")?.status, "ready");
  assert.equal(workflow.steps.find((step) => step.id === "plane-task")?.handoff?.target, "Plane issue draft");
  assert.equal(
    workflow.steps.find((step) => step.id === "chatwoot-conversation")?.handoff?.target,
    "Chatwoot conversation draft"
  );
});
