import assert from "node:assert/strict";
import test from "node:test";

import type { Profile } from "../src/domain.ts";
import {
  buildIntegrationIdentity,
  buildConversationBrief,
  buildIntegrationWorkflow,
  buildMatchQualitySignal,
  buildRecommendedDecisions,
  buildShortlist,
  canTransitionConversationState,
  canTransitionNeedStatus,
  acceptContactRequest,
  cancelContactRequest,
  createAuthUser,
  createContactRequest,
  createConversationDraft,
  createDraftNeed,
  createNeed,
  declineContactRequest,
  demoNeedScenarios,
  demoProfiles,
  expireContactRequest,
  integrationDefinitions,
  isActiveContactRequest,
  markNeedConnected,
  markNeedMatched,
  markNeedReadyForMatch,
  markNeedResolved,
  markConversationAssigned,
  markConversationOpened,
  markConversationResolved,
  markConversationWaitingUser,
  normalizeAuthEmail,
  rankProfilesForNeed,
  recordCandidateDecision,
  recordContactResult,
  resolveNeedFromContactResult,
  scoreProfileForNeed
} from "../src/index.ts";

test("creates a normalized auth user and integration identity", () => {
  const user = createAuthUser(
    {
      email: " User@Example.COM ",
      displayName: "  Test User  ",
      password: "Password123!",
      roles: ["client", "operator", "operator"]
    },
    "usr_demo",
    new Date("2026-06-13T07:00:00.000Z")
  );
  const identity = buildIntegrationIdentity(user);

  assert.equal(user.email, "user@example.com");
  assert.equal(user.displayName, "Test User");
  assert.deepEqual(user.roles, ["client", "operator"]);
  assert.equal(user.createdAt, "2026-06-13T07:00:00.000Z");
  assert.equal(identity.provider, "cifedra");
  assert.equal(identity.claims.subject, "usr_demo");
  assert.equal(identity.claims.issuer, "cifedra-local");
  assert.equal(identity.identityRef.id, identity.claims.identityRefId);
  assert.equal(identity.principal.identityRef.id, identity.identityRef.id);
  assert.equal(identity.claims.email, "user@example.com");
});

test("rejects invalid auth registration input", () => {
  assert.equal(normalizeAuthEmail(" ADMIN@CIFEDRA.LOCAL "), "admin@cifedra.local");
  assert.throws(
    () =>
      createAuthUser(
        {
          email: "invalid",
          displayName: "A User",
          password: "Password123!"
        },
        "usr_invalid"
      ),
    /Auth email is invalid/
  );
  assert.throws(
    () =>
      createAuthUser(
        {
          email: "user@example.com",
          displayName: "A",
          password: "Password123!"
        },
        "usr_invalid"
      ),
    /displayName/
  );
  assert.throws(
    () =>
      createAuthUser(
        {
          email: "user@example.com",
          displayName: "A User",
          password: "short"
        },
        "usr_invalid"
      ),
    /password/
  );
});

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

test("applies life geography, urgency and identity rules", () => {
  const need = createNeed({
    direction: "life",
    categoryId: "life.local-tasks",
    title: "Срочно забрать заказ",
    description: "Нужно срочно забрать заказ и привезти его домой.",
    expectedResult: "Заказ доставлен",
    tags: ["delivery"],
    priority: "urgent",
    location: {
      city: "Moscow",
      latitude: 55.764,
      longitude: 37.605
    },
    matching: {
      life: {
        requiresVerifiedIdentity: true,
        maxDistanceKm: 5
      }
    }
  });
  const profiles: Profile[] = [
    {
      id: "life_near_verified",
      displayName: "Ближний помощник",
      role: "Локальный помощник",
      summary: "Выполняет срочные поручения рядом.",
      directions: ["life"],
      categoryIds: ["life.local-tasks"],
      capabilities: ["delivery"],
      availability: "available",
      location: {
        city: "Moscow",
        latitude: 55.766,
        longitude: 37.604
      },
      trustSignals: [
        {
          type: "identity",
          label: "Identity checked",
          verified: true
        }
      ],
      matching: {
        life: {
          supportsUrgent: true,
          serviceRadiusKm: 10
        }
      }
    },
    {
      id: "life_far_unverified",
      displayName: "Непроверенный помощник",
      role: "Локальный помощник",
      summary: "Выполняет локальные поручения.",
      directions: ["life"],
      categoryIds: ["life.local-tasks"],
      capabilities: ["delivery"],
      availability: "available",
      location: {
        city: "Moscow",
        latitude: 55.86,
        longitude: 37.605
      },
      trustSignals: [],
      matching: {
        life: {
          supportsUrgent: false,
          serviceRadiusKm: 3
        }
      }
    }
  ];

  const nearby = scoreProfileForNeed(need, profiles[0]);
  const unverified = scoreProfileForNeed(need, profiles[1]);

  assert.ok(nearby.score > unverified.score);
  assert.equal(nearby.recommendedAction, "request_contact");
  assert.equal(unverified.recommendedAction, "review_manually");
  assert.ok(nearby.explanation.scoreBreakdown.location > 0);
  assert.ok(unverified.explanation.scoreBreakdown.location < 0);
  assert.match(unverified.explanation.risks.join(" "), /подтвержденная личность/);
});

test("applies work role, context, experience and trust rules", () => {
  const need = createNeed({
    direction: "work",
    categoryId: "work.expert-help",
    title: "Экспертное ревью SRS",
    description: "Нужно провести экспертное ревью требований проекта.",
    expectedResult: "Список замечаний",
    tags: ["srs"],
    location: {
      remoteAllowed: true
    },
    matching: {
      work: {
        requiredRoles: ["system analyst"],
        projectContext: ["srs"],
        minimumExperienceYears: 5,
        requiresPortfolio: true,
        requiresCompanyVerification: true
      }
    }
  });
  const profiles: Profile[] = [
    {
      id: "work_senior_analyst",
      displayName: "Старший аналитик",
      role: "System Analyst",
      summary: "Ревью требований и проектирование систем.",
      directions: ["work"],
      categoryIds: ["work.expert-help"],
      capabilities: ["srs"],
      availability: "available",
      location: {
        remoteAllowed: true
      },
      trustSignals: [
        {
          type: "portfolio",
          label: "Portfolio reviewed",
          verified: true
        },
        {
          type: "company",
          label: "Company verified",
          verified: true
        }
      ],
      matching: {
        work: {
          roles: ["system analyst"],
          domains: ["srs"],
          experienceYears: 8
        }
      }
    },
    {
      id: "work_junior_developer",
      displayName: "Разработчик",
      role: "Developer",
      summary: "Разработка и участие в ревью.",
      directions: ["work"],
      categoryIds: ["work.expert-help"],
      capabilities: ["srs"],
      availability: "available",
      location: {
        remoteAllowed: true
      },
      trustSignals: [],
      matching: {
        work: {
          roles: ["developer"],
          domains: ["development"],
          experienceYears: 2
        }
      }
    }
  ];

  const expert = scoreProfileForNeed(need, profiles[0]);
  const weakMatch = scoreProfileForNeed(need, profiles[1]);

  assert.ok(expert.score > weakMatch.score);
  assert.equal(expert.recommendedAction, "request_contact");
  assert.equal(weakMatch.recommendedAction, "review_manually");
  assert.ok(expert.explanation.scoreBreakdown.directionSpecific > 0);
  assert.ok(weakMatch.explanation.scoreBreakdown.directionSpecific < 0);
  assert.match(weakMatch.explanation.risks.join(" "), /портфолио/);
});

test("applies skills level, goal and format rules", () => {
  const need = createNeed({
    direction: "skills",
    categoryId: "skills.career-help",
    title: "Подготовка к интервью",
    description: "Нужна практика интервью для системного аналитика.",
    expectedResult: "Обратная связь",
    tags: ["interview"],
    location: {
      remoteAllowed: true
    },
    matching: {
      skills: {
        currentLevel: "intermediate",
        targetLevel: "advanced",
        goals: ["interview"],
        preferredFormats: ["video"]
      }
    }
  });
  const profiles: Profile[] = [
    {
      id: "skills_video_mentor",
      displayName: "Видео-ментор",
      role: "Карьерный ментор",
      summary: "Проводит mock interview по видео.",
      directions: ["skills"],
      categoryIds: ["skills.career-help"],
      capabilities: ["interview"],
      availability: "available",
      location: {
        remoteAllowed: true
      },
      trustSignals: [],
      matching: {
        skills: {
          supportedLevels: ["intermediate", "advanced"],
          goals: ["interview"],
          formats: ["video"]
        }
      }
    },
    {
      id: "skills_in_person_beginner",
      displayName: "Офлайн-наставник",
      role: "Наставник",
      summary: "Работает очно с начинающими.",
      directions: ["skills"],
      categoryIds: ["skills.career-help"],
      capabilities: ["resume"],
      availability: "available",
      location: {
        remoteAllowed: false
      },
      trustSignals: [],
      matching: {
        skills: {
          supportedLevels: ["beginner"],
          goals: ["resume"],
          formats: ["in_person"]
        }
      }
    }
  ];

  const mentor = scoreProfileForNeed(need, profiles[0]);
  const wrongFormat = scoreProfileForNeed(need, profiles[1]);

  assert.ok(mentor.score > wrongFormat.score);
  assert.equal(mentor.recommendedAction, "request_contact");
  assert.ok(mentor.explanation.scoreBreakdown.directionSpecific > 0);
  assert.ok(wrongFormat.explanation.scoreBreakdown.directionSpecific < 0);
  assert.match(wrongFormat.explanation.risks.join(" "), /формат занятий/);
});

test("rejects matching context from another direction and invalid numeric rules", () => {
  const baseLifeNeed = {
    direction: "life" as const,
    categoryId: "life.local-tasks",
    title: "Забрать заказ",
    description: "Нужно забрать заказ рядом с домом.",
    expectedResult: "Заказ доставлен"
  };

  assert.throws(
    () =>
      createNeed({
        ...baseLifeNeed,
        matching: {
          work: {
            requiredRoles: ["system analyst"]
          }
        }
      }),
    /does not belong/
  );
  assert.throws(
    () =>
      createNeed({
        ...baseLifeNeed,
        matching: {
          life: {
            maxDistanceKm: 0
          }
        }
      }),
    /positive number/
  );
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
  assert.equal(canTransitionNeedStatus("draft", "needs_clarification"), true);
  assert.equal(canTransitionNeedStatus("needs_clarification", "ready_for_match"), true);
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

test("creates a conversation draft from requested contact decision and brief", () => {
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
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const [decision] = buildRecommendedDecisions(
    need,
    [candidate],
    new Date("2026-06-13T10:00:00.000Z")
  );
  const brief = buildConversationBrief(need, candidate);
  const conversation = createConversationDraft(
    {
      need,
      candidate,
      decision,
      brief
    },
    new Date("2026-06-13T10:01:00.000Z")
  );

  assert.equal(conversation.needId, need.id);
  assert.equal(conversation.profileId, candidate.profile.id);
  assert.equal(conversation.decisionId, decision.id);
  assert.equal(conversation.channel, "chatwoot_concierge");
  assert.equal(conversation.state, "draft");
  assert.equal(conversation.externalRef?.provider, "chatwoot");
  assert.match(conversation.firstMessage, /Нужно ревью SRS/);
  assert.match(conversation.firstMessage, /Вопросы:/);
});

test("rejects conversation draft for non-contact decisions", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "skills",
      categoryId: "skills.career-help",
      title: "Подготовка к интервью",
      description: "Нужна практика ответов и разбор резюме перед собеседованием.",
      expectedResult: "План подготовки и обратная связь",
      tags: ["career", "interview", "resume"]
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const decision = recordCandidateDecision({
    needId: need.id,
    profileId: candidate.profile.id,
    decision: "saved",
    matchScore: candidate.score
  });
  const brief = buildConversationBrief(need, candidate);

  assert.throws(
    () =>
      createConversationDraft({
        need,
        candidate,
        decision,
        brief
      }),
    /requested_contact/
  );
});

test("creates a pending contact request without disclosing exact location", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "life",
      categoryId: "life.local-tasks",
      title: "Уход за территорией",
      description: "Нужно синтетически проверить уборку бассейна и стрижку газона.",
      expectedResult: "Газон подстрижен, бассейн очищен.",
      ownerUserProfileId: "client_profile_1",
      answers: {
        serviceTypes: ["pool_cleaning", "lawn_mowing"],
        preferredTimeWindow: "morning"
      },
      location: {
        city: "Moscow",
        district: "Tverskoy",
        latitude: 55.764,
        longitude: 37.605
      },
      tags: ["home", "lawn", "pool"]
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const decision = recordCandidateDecision(
    {
      needId: need.id,
      profileId: candidate.profile.id,
      decision: "requested_contact",
      matchScore: candidate.score
    },
    new Date("2026-06-13T10:00:00.000Z")
  );
  const request = createContactRequest(
    {
      need,
      candidate,
      decision,
      actorUserProfileId: "client_profile_1",
      idempotencyKey: "contact-request-demo-1",
      expiresAt: new Date("2026-06-15T10:00:00.000Z")
    },
    new Date("2026-06-13T10:01:00.000Z")
  );

  assert.equal(request.status, "requested");
  assert.equal(request.needId, need.id);
  assert.equal(request.profileId, candidate.profile.id);
  assert.equal(request.providerProfileId, candidate.profile.id);
  assert.equal(request.clientUserProfileId, "client_profile_1");
  assert.equal(request.decisionId, decision.id);
  assert.equal(request.expiresAt, "2026-06-15T10:00:00.000Z");
  assert.equal(request.aggregateVersion, 1);
  assert.equal(isActiveContactRequest(request), true);
  assert.deepEqual(request.disclosureSnapshot.publicBrief.serviceVariants, [
    "pool_cleaning",
    "lawn_mowing"
  ]);
  assert.equal(request.disclosureSnapshot.publicBrief.serviceRegion?.city, "Moscow");
  assert.equal(request.disclosureSnapshot.publicBrief.serviceRegion?.district, "Tverskoy");
  assert.equal(
    Object.hasOwn(request.disclosureSnapshot.publicBrief.serviceRegion ?? {}, "latitude"),
    false
  );
  assert.ok(request.disclosureSnapshot.hiddenFields.includes("location.latitude"));
  assert.ok(request.disclosureSnapshot.hiddenFields.includes("contact.email"));
});

test("moves contact request through provider and client terminal states", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "work",
      categoryId: "work.expert-help",
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      expectedResult: "Список замечаний и правок",
      ownerUserProfileId: "client_profile_2",
      tags: ["srs", "requirements", "review"],
      location: {
        remoteAllowed: true
      }
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);
  const decision = recordCandidateDecision({
    needId: need.id,
    profileId: candidate.profile.id,
    decision: "requested_contact",
    matchScore: candidate.score
  });
  const request = createContactRequest(
    {
      need,
      candidate,
      decision,
      actorUserProfileId: "client_profile_2",
      expiresAt: new Date("2026-06-15T10:00:00.000Z")
    },
    new Date("2026-06-13T10:01:00.000Z")
  );

  assert.throws(
    () => acceptContactRequest(request, "profile_skills_maria"),
    /Only the selected provider/
  );

  const accepted = acceptContactRequest(
    request,
    candidate.profile.id,
    new Date("2026-06-13T10:02:00.000Z")
  );
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.respondedAt, "2026-06-13T10:02:00.000Z");
  assert.equal(accepted.aggregateVersion, 2);
  assert.equal(isActiveContactRequest(accepted), false);
  assert.throws(() => cancelContactRequest(accepted, "client_profile_2"), /NOT_PENDING/);

  const declined = declineContactRequest(request, candidate.profile.id, "busy");
  assert.equal(declined.status, "declined");
  assert.equal(declined.declineReason, "busy");

  const cancelled = cancelContactRequest(request, "client_profile_2");
  assert.equal(cancelled.status, "cancelled");
  assert.throws(() => cancelContactRequest(request, "client_profile_3"), /Only the Need owner/);

  const expired = expireContactRequest(request, new Date("2026-06-16T10:00:00.000Z"));
  assert.equal(expired.status, "expired");
  assert.equal(expireContactRequest(expired), expired);
});

test("rejects invalid contact request creation inputs", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "skills",
      categoryId: "skills.career-help",
      title: "Подготовка к интервью",
      description: "Нужна практика ответов и разбор резюме перед собеседованием.",
      expectedResult: "План подготовки и обратная связь",
      ownerUserProfileId: "client_profile_3",
      tags: ["career", "interview", "resume"]
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);
  const savedDecision = recordCandidateDecision({
    needId: need.id,
    profileId: candidate.profile.id,
    decision: "saved",
    matchScore: candidate.score
  });
  const contactDecision = recordCandidateDecision({
    needId: need.id,
    profileId: candidate.profile.id,
    decision: "requested_contact",
    matchScore: candidate.score
  });
  const draftNeed = createDraftNeed({
    direction: "skills",
    categoryId: "skills.career-help",
    title: "Подготовка к интервью",
    description: "Нужна практика ответов и разбор резюме перед собеседованием.",
    expectedResult: "План подготовки и обратная связь",
    ownerUserProfileId: "client_profile_3",
    tags: ["career", "interview", "resume"]
  });

  assert.throws(
    () =>
      createContactRequest({
        need,
        candidate,
        decision: savedDecision,
        actorUserProfileId: "client_profile_3"
      }),
    /requested_contact/
  );
  assert.throws(
    () =>
      createContactRequest({
        need,
        candidate,
        decision: contactDecision,
        actorUserProfileId: "client_profile_other"
      }),
    /Only the Need owner/
  );
  assert.throws(
    () =>
      createContactRequest({
        need: draftNeed,
        candidate,
        decision: contactDecision,
        actorUserProfileId: "client_profile_3"
      }),
    /cannot create contact request/
  );
});

test("moves a conversation through concierge states", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "life",
      categoryId: "life.local-tasks",
      title: "Нужно забрать заказ рядом",
      description: "Нужно забрать заказ в районе и передать мне вечером.",
      expectedResult: "Заказ забран и передан",
      tags: ["delivery", "local help", "errands"],
      location: {
        city: "Moscow",
        district: "Tverskoy"
      }
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const [decision] = buildRecommendedDecisions(need, [candidate]);
  const brief = buildConversationBrief(need, candidate);
  const draft = createConversationDraft({
    need,
    candidate,
    decision,
    brief
  });
  const opened = markConversationOpened(
    draft,
    {
      provider: "chatwoot",
      id: "conversation_123",
      url: "http://localhost:8083/app/accounts/1/conversations/123"
    },
    new Date("2026-06-13T11:00:00.000Z")
  );
  const assigned = markConversationAssigned(opened, new Date("2026-06-13T11:01:00.000Z"));
  const waitingUser = markConversationWaitingUser(
    assigned,
    new Date("2026-06-13T11:02:00.000Z")
  );
  const resolved = markConversationResolved(waitingUser, new Date("2026-06-13T11:03:00.000Z"));

  assert.equal(opened.state, "opened");
  assert.equal(opened.externalRef?.id, "conversation_123");
  assert.equal(resolved.state, "resolved");
  assert.equal(resolved.updatedAt, "2026-06-13T11:03:00.000Z");
  assert.equal(canTransitionConversationState("resolved", "opened"), false);
  assert.throws(() => markConversationOpened(resolved), /Cannot move conversation/);
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
    conversationId: "conversation_demo",
    decisionId: "decision_demo",
    outcome: "agreed",
    summary: "Договорились о следующем шаге.",
    matchScore: 101,
    qualityScore: 140
  });

  assert.equal(result.qualityScore, 100);
  assert.equal(result.matchScore, 100);
  assert.equal(result.outcome, "agreed");
  assert.equal(result.nextStep, "Зафиксировать договоренность и следующий операционный шаг.");
});

test("resolves need from conversation result and creates quality signal", () => {
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
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const [decision] = buildRecommendedDecisions(need, [candidate]);
  const brief = buildConversationBrief(need, candidate);
  const draft = createConversationDraft({
    need,
    candidate,
    decision,
    brief
  });
  const opened = markConversationOpened(draft);
  const conversation = markConversationResolved(opened, new Date("2026-06-13T12:00:00.000Z"));
  const result = recordContactResult(
    {
      needId: need.id,
      profileId: candidate.profile.id,
      conversationId: conversation.id,
      decisionId: decision.id,
      outcome: "agreed",
      summary: "Договорились о ревью требований.",
      matchScore: candidate.score
    },
    new Date("2026-06-13T12:01:00.000Z")
  );
  const resolvedNeed = resolveNeedFromContactResult(
    need,
    conversation,
    result,
    new Date("2026-06-13T12:02:00.000Z")
  );
  const signal = buildMatchQualitySignal(result, new Date("2026-06-13T12:03:00.000Z"));

  assert.equal(resolvedNeed.status, "resolved");
  assert.equal(result.qualityScore, 90);
  assert.equal(signal.impact, "positive");
  assert.equal(signal.resultId, result.id);
  assert.equal(signal.conversationId, conversation.id);
  assert.equal(signal.decisionId, decision.id);
});

test("rejects result resolution for unresolved conversations", () => {
  const need = markNeedMatched(
    createNeed({
      direction: "life",
      categoryId: "life.local-tasks",
      title: "Нужно забрать заказ рядом",
      description: "Нужно забрать заказ в районе и передать мне вечером.",
      expectedResult: "Заказ забран и передан",
      tags: ["delivery", "local help", "errands"],
      location: {
        city: "Moscow",
        district: "Tverskoy"
      }
    })
  );
  const [candidate] = rankProfilesForNeed(need, demoProfiles);
  assert.ok(candidate);

  const [decision] = buildRecommendedDecisions(need, [candidate]);
  const brief = buildConversationBrief(need, candidate);
  const conversation = createConversationDraft({
    need,
    candidate,
    decision,
    brief
  });
  const result = recordContactResult({
    needId: need.id,
    profileId: candidate.profile.id,
    conversationId: conversation.id,
    decisionId: decision.id,
    outcome: "needs_follow_up",
    summary: "Нужно уточнить время контакта."
  });

  assert.throws(
    () => resolveNeedFromContactResult(need, conversation, result),
    /unresolved conversation/
  );
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
