import {
  applyClarificationAnswer,
  createClarificationForNeed,
  type Clarification,
  type ClarificationReason
} from "./clarification.js";
import {
  createContactRequestFromLatestDecision,
  type ContactRequest
} from "./contact-request.js";
import { buildRecommendedDecisions } from "./decisions.js";
import type { CandidateDecision, DirectionId, MatchCandidate, NeedInput } from "./domain.js";
import { demoProfiles } from "./fixtures.js";
import { createLocalIdentityRef, type IdentityRef } from "./identity.js";
import { createNeedFromSchema, type VersionedNeed } from "./intake.js";
import { rankProfilesForNeed } from "./matching.js";
import { createUserProfile, type UserProfile } from "./profile.js";

export interface SyntheticVerticalFlowDefinition {
  readonly id: string;
  readonly title: string;
  readonly direction: DirectionId;
  readonly expectedProfileId: string;
  readonly ownerSubject: string;
  readonly ownerDisplayName: string;
  readonly locale: string;
  readonly timezone: string;
  readonly preferredContentLanguage: string;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly needTitle: string;
  readonly needDescription: string;
  readonly initialAnswers: Record<string, unknown>;
  readonly clarification: {
    readonly fieldId: string;
    readonly question: string;
    readonly reason: ClarificationReason;
    readonly answer: unknown;
    readonly originalLanguage: string;
  };
  readonly contentLanguage: string;
  readonly communicationLanguage: string;
  readonly preferredResultLanguage: string;
  readonly context?: NeedInput["context"];
  readonly constraints?: NeedInput["constraints"];
  readonly location?: NeedInput["location"];
  readonly priority?: NeedInput["priority"];
  readonly tags: readonly string[];
  readonly matching?: NeedInput["matching"];
}

export interface SyntheticVerticalFlowResult {
  readonly id: string;
  readonly title: string;
  readonly direction: DirectionId;
  readonly expectedProfileId: string;
  readonly identityRef: IdentityRef;
  readonly userProfile: UserProfile;
  readonly initialNeed: VersionedNeed;
  readonly clarification: Clarification;
  readonly answeredNeed: VersionedNeed;
  readonly matches: readonly MatchCandidate[];
  readonly candidateDecisions: readonly CandidateDecision[];
  readonly contactRequest?: ContactRequest;
  readonly metrics: {
    readonly missingBefore: readonly string[];
    readonly invalidBefore: readonly string[];
    readonly readyForMatch: boolean;
    readonly firstMatchProfileId?: string;
    readonly firstMatchScore?: number;
    readonly firstMatchAction?: string;
    readonly firstDecision?: string;
    readonly contactRequestStatus?: string;
    readonly disclosureHiddenFieldCount?: number;
    readonly contactRequestExpiresAt?: string;
  };
}

const defaultVerticalFlowNow = new Date("2026-06-26T08:00:00.000Z");

export const syntheticVerticalFlowDefinitions: readonly SyntheticVerticalFlowDefinition[] = [
  {
    id: "life-outdoor-maintenance",
    title: "Life / Уход за территорией",
    direction: "life",
    expectedProfileId: "profile_life_anna",
    ownerSubject: "synthetic-life-owner",
    ownerDisplayName: "Life Client",
    locale: "ru-RU",
    timezone: "Europe/Moscow",
    preferredContentLanguage: "ru",
    schemaId: "life.outdoor-maintenance",
    schemaVersion: 1,
    needTitle: "Уход за территорией",
    needDescription: "Нужно синтетически проверить уборку бассейна и стрижку газона.",
    initialAnswers: {
      serviceTypes: ["pool_cleaning", "lawn_mowing"],
      singleProviderVisit: true,
      serviceRegionId: "synthetic_region_north",
      desiredDate: "2026-06-30",
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
      accessConstraints: "Synthetic gated access note without exact address.",
      safetyConcerns: "No synthetic safety concerns."
    },
    clarification: {
      fieldId: "propertyContext",
      question: "Опишите участок без точного адреса и контактов.",
      reason: "missing",
      answer: "Синтетический участок около дома, есть газон и небольшой бассейн.",
      originalLanguage: "ru"
    },
    contentLanguage: "ru",
    communicationLanguage: "ru",
    preferredResultLanguage: "ru",
    location: {
      city: "Moscow",
      district: "Tverskoy",
      latitude: 55.764,
      longitude: 37.605
    },
    tags: ["home", "lawn", "pool"],
    matching: {
      life: {
        urgency: "scheduled",
        requiresVerifiedIdentity: true,
        maxDistanceKm: 5
      }
    }
  },
  {
    id: "work-srs-review",
    title: "Work / Ревью SRS",
    direction: "work",
    expectedProfileId: "profile_work_dmitry",
    ownerSubject: "synthetic-work-owner",
    ownerDisplayName: "Work Client",
    locale: "ru-RU",
    timezone: "Europe/Moscow",
    preferredContentLanguage: "ru",
    schemaId: "work.srs-review",
    schemaVersion: 1,
    needTitle: "Нужно ревью SRS",
    needDescription: "Нужно проверить требования перед передачей в разработку.",
    initialAnswers: {
      reviewType: "quick_review",
      requesterRole: "analyst",
      artifactType: "srs",
      artifactStage: "pre_development",
      documentAudience: ["business", "development", "testing"],
      reviewGoal: "Понять, можно ли отдавать требования в разработку.",
      expectedResult: "Список замечаний, рисков и уточнений.",
      artifactSizeValue: 20,
      artifactSizeUnit: "pages",
      reviewFocus: "completeness",
      desiredDeadline: "2026-06-29T10:00:00.000Z",
      dataMode: "synthetic",
      serviceFormat: "online"
    },
    clarification: {
      fieldId: "systemContext",
      question: "Опишите границы системы для ревью.",
      reason: "missing",
      answer: "Синтетическая платформа подбора исполнителей Life, Work и Skills.",
      originalLanguage: "ru"
    },
    contentLanguage: "ru",
    communicationLanguage: "ru",
    preferredResultLanguage: "ru",
    location: {
      remoteAllowed: true
    },
    tags: ["srs", "requirements", "review"],
    matching: {
      work: {
        requiredRoles: ["system analyst"],
        projectContext: ["srs", "requirements"],
        minimumExperienceYears: 5,
        requiresPortfolio: true
      }
    }
  },
  {
    id: "skills-interview-preparation",
    title: "Skills / Подготовка к интервью",
    direction: "skills",
    expectedProfileId: "profile_skills_maria",
    ownerSubject: "synthetic-skills-owner",
    ownerDisplayName: "Skills Client",
    locale: "en-US",
    timezone: "Europe/Moscow",
    preferredContentLanguage: "en",
    schemaId: "skills.interview-preparation",
    schemaVersion: 1,
    needTitle: "Interview preparation",
    needDescription: "Need synthetic mock interview preparation and feedback.",
    initialAnswers: {
      targetRole: "System Analyst",
      targetSeniority: "senior",
      domainContext: "Digital service platform",
      currentSeniority: "middle",
      interviewTypes: ["system_design", "behavioral"],
      preparationGoal: "mock_interview",
      targetTimeline: "within_week",
      interviewLanguage: "en",
      expectedResult: "Feedback and preparation plan.",
      preferredFormat: "video",
      sessionDurationMinutes: "60",
      dataMode: "synthetic"
    },
    clarification: {
      fieldId: "vacancyContext",
      question: "Describe the target vacancy without links, files or personal contacts.",
      reason: "missing",
      answer: "Synthetic senior system analyst vacancy focused on requirements and discovery.",
      originalLanguage: "en"
    },
    contentLanguage: "en",
    communicationLanguage: "en",
    preferredResultLanguage: "en",
    location: {
      remoteAllowed: true
    },
    tags: ["career", "interview", "resume"],
    matching: {
      skills: {
        currentLevel: "intermediate",
        targetLevel: "advanced",
        goals: ["interview", "resume"],
        preferredFormats: ["video"]
      }
    }
  }
];

export function runAllSyntheticVerticalFlows(
  now: Date = defaultVerticalFlowNow
): SyntheticVerticalFlowResult[] {
  return syntheticVerticalFlowDefinitions.map((definition) =>
    runSyntheticVerticalFlow(definition, now)
  );
}

export function runSyntheticVerticalFlow(
  definition: SyntheticVerticalFlowDefinition,
  now: Date = defaultVerticalFlowNow
): SyntheticVerticalFlowResult {
  const identityRef = createLocalIdentityRef(definition.ownerSubject);
  const userProfile = createUserProfile(
    {
      ownerIdentityRef: identityRef,
      displayName: definition.ownerDisplayName,
      locale: definition.locale,
      timezone: definition.timezone,
      preferredContentLanguage: definition.preferredContentLanguage
    },
    `user_profile_${definition.id.replaceAll("-", "_")}`,
    now
  );
  const initialNeed = createNeedFromSchema(
    {
      ownerUserProfileId: userProfile.id,
      schemaId: definition.schemaId,
      schemaVersion: definition.schemaVersion,
      title: definition.needTitle,
      description: definition.needDescription,
      answers: definition.initialAnswers,
      originalContentLanguage: definition.contentLanguage,
      communicationLanguage: definition.communicationLanguage,
      preferredResultLanguage: definition.preferredResultLanguage,
      context: definition.context,
      constraints: definition.constraints,
      location: definition.location,
      matching: definition.matching,
      priority: definition.priority,
      tags: definition.tags
    },
    now
  );
  const createdClarification = createClarificationForNeed(
    {
      need: initialNeed,
      target: {
        fieldId: definition.clarification.fieldId
      },
      requester: {
        type: "system",
        id: "system"
      },
      question: definition.clarification.question,
      reason: definition.clarification.reason,
      blocking: true,
      originalLanguage: definition.clarification.originalLanguage,
      expectedNeedVersion: initialNeed.aggregateVersion
    },
    now
  );
  const answered = applyClarificationAnswer(
    {
      need: createdClarification.need,
      clarification: createdClarification.clarification,
      actorUserProfileId: userProfile.id,
      value: definition.clarification.answer,
      originalLanguage: definition.clarification.originalLanguage,
      expectedNeedVersion: createdClarification.need.aggregateVersion,
      expectedClarificationVersion: createdClarification.clarification.aggregateVersion,
      relatedClarifications: [createdClarification.clarification]
    },
    now
  );
  const matches = rankProfilesForNeed(answered.need, demoProfiles, {
    limit: 5,
    minScore: 25
  });
  const firstMatch = matches[0];
  const candidateDecisions = buildRecommendedDecisions(answered.need, matches, now);
  const contactRequest = firstMatch
    ? createContactRequestFromLatestDecision(
        {
          need: answered.need,
          candidate: firstMatch,
          decisions: candidateDecisions,
          actorUserProfileId: userProfile.id,
          idempotencyKey: `synthetic-${definition.id}-contact-request`,
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
        },
        now
      )
    : undefined;
  const firstDecision = firstMatch
    ? candidateDecisions.find((decision) => decision.profileId === firstMatch.profile.id)
    : undefined;

  return {
    id: definition.id,
    title: definition.title,
    direction: definition.direction,
    expectedProfileId: definition.expectedProfileId,
    identityRef,
    userProfile,
    initialNeed,
    clarification: answered.clarification,
    answeredNeed: answered.need,
    matches,
    candidateDecisions,
    contactRequest,
    metrics: {
      missingBefore: initialNeed.completeness.missingFieldIds,
      invalidBefore: initialNeed.completeness.invalidFieldIds,
      readyForMatch: answered.need.status === "ready_for_match",
      firstMatchProfileId: firstMatch?.profile.id,
      firstMatchScore: firstMatch?.score,
      firstMatchAction: firstMatch?.recommendedAction,
      firstDecision: firstDecision?.decision,
      contactRequestStatus: contactRequest?.status,
      disclosureHiddenFieldCount: contactRequest?.disclosureSnapshot.hiddenFields.length,
      contactRequestExpiresAt: contactRequest?.expiresAt
    }
  };
}
