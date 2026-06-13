import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConversationBrief,
  buildIntegrationWorkflow,
  buildRecommendedDecisions,
  buildShortlist,
  canTransitionNeedStatus,
  createDraftNeed,
  createNeed,
  demoNeedScenarios,
  demoProfiles,
  integrationDefinitions,
  markNeedConnected,
  markNeedMatched,
  markNeedReadyForMatch,
  markNeedResolved,
  rankProfilesForNeed,
  recordCandidateDecision,
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

test("moves a need through the core lifecycle", () => {
  const draft = createDraftNeed(
    {
      direction: "work",
      categoryId: "work.expert-help",
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      expectedResult: "Список замечаний и правок"
    },
    new Date("2026-06-13T08:00:00.000Z")
  );

  const ready = markNeedReadyForMatch(draft, new Date("2026-06-13T08:01:00.000Z"));
  const matched = markNeedMatched(ready, new Date("2026-06-13T08:02:00.000Z"));
  const connected = markNeedConnected(matched, new Date("2026-06-13T08:03:00.000Z"));
  const resolved = markNeedResolved(connected, new Date("2026-06-13T08:04:00.000Z"));

  assert.equal(draft.status, "draft");
  assert.equal(ready.status, "ready_for_match");
  assert.equal(matched.status, "matched");
  assert.equal(connected.status, "connected");
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.updatedAt, "2026-06-13T08:04:00.000Z");
  assert.equal(canTransitionNeedStatus("matched", "connected"), true);
  assert.equal(canTransitionNeedStatus("matched", "resolved"), false);
});

test("rejects invalid need lifecycle transitions", () => {
  const need = createNeed({
    direction: "life",
    categoryId: "life.local-tasks",
    title: "Забрать заказ",
    description: "Нужно забрать заказ рядом с домом.",
    expectedResult: "Заказ доставлен"
  });

  assert.throws(() => markNeedResolved(need), /Cannot move need/);

  const matched = markNeedMatched(need);
  const connected = markNeedConnected(matched);
  const resolved = markNeedResolved(connected);

  assert.throws(() => markNeedMatched(resolved), /Cannot move need/);
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

test("builds shortlists from recommended candidate decisions across directions", () => {
  for (const scenario of demoNeedScenarios) {
    const need = markNeedMatched(createNeed(scenario.input));
    const matches = rankProfilesForNeed(need, demoProfiles);
    const decisions = buildRecommendedDecisions(need, matches);
    const shortlist = buildShortlist(need, matches, decisions);

    assert.equal(shortlist.needId, need.id);
    assert.equal(shortlist.items[0]?.profileId, scenario.expectedProfileId);
    assert.equal(shortlist.items[0]?.position, 1);
    assert.ok(
      shortlist.items.every(
        (item) => item.decision === "requested_contact" || item.decision === "saved"
      )
    );
  }
});

test("uses latest candidate decision and excludes rejected candidates from shortlist", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "work",
      categoryId: "work.expert-help",
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      expectedResult: "Список замечаний и правок",
      tags: ["srs", "requirements", "review"]
    })
  );
  const matches = rankProfilesForNeed(need, demoProfiles, {
    minScore: 0
  });
  const firstProfileId = matches[0]?.profile.id;

  assert.ok(firstProfileId);

  const decisions = [
    recordCandidateDecision(
      {
        needId: need.id,
        profileId: firstProfileId,
        decision: "saved",
        matchScore: matches[0]?.score
      },
      new Date("2026-06-13T09:00:00.000Z")
    ),
    recordCandidateDecision(
      {
        needId: need.id,
        profileId: firstProfileId,
        decision: "rejected",
        matchScore: matches[0]?.score
      },
      new Date("2026-06-13T09:01:00.000Z")
    )
  ];
  const shortlist = buildShortlist(need, matches, decisions);

  assert.equal(shortlist.items.some((item) => item.profileId === firstProfileId), false);
});

test("marks resolved needs as completed in workflow", () => {
  const need = createNeed({
    direction: "work",
    categoryId: "work.expert-help",
    title: "Нужно ревью SRS",
    description: "Нужно проверить требования перед передачей в разработку.",
    expectedResult: "Список замечаний и правок",
    tags: ["srs", "requirements", "review"]
  });
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const matched = markNeedMatched(need);
  const connected = markNeedConnected(matched);
  const resolved = markNeedResolved(connected);
  const brief = buildConversationBrief(resolved, candidate);
  const workflow = buildIntegrationWorkflow(resolved, candidate, brief);

  assert.equal(workflow.steps.find((step) => step.id === "chatwoot-conversation")?.status, "done");
  assert.equal(workflow.steps.find((step) => step.id === "result")?.status, "done");
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
