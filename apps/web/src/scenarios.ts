import type { DirectionId, NeedInput } from "./api";

export interface PilotScenario {
  readonly id: string;
  readonly direction: DirectionId;
  readonly label: string;
  readonly title: string;
  readonly input: NeedInput;
}

export const pilotScenarios: readonly PilotScenario[] = [
  {
    id: "life-outdoor-maintenance",
    direction: "life",
    label: "Life",
    title: "Уход за территорией",
    input: {
      direction: "life",
      categoryId: "life.outdoor-maintenance",
      title: "Уход за территорией около дома",
      description: "Нужно совместить чистку бассейна и стрижку газона без раскрытия точного адреса.",
      expectedResult: "Газон подстрижен, бассейн очищен, следующий визит согласован.",
      answers: {
        serviceTypes: ["pool_cleaning", "lawn_mowing"],
        singleProviderVisit: true,
        serviceRegionId: "synthetic_region_north",
        preferredTimeWindow: "morning",
        equipmentResponsibility: "provider"
      },
      location: {
        city: "Moscow",
        district: "Tverskoy",
        remoteAllowed: false
      },
      priority: "normal",
      tags: ["home", "pool", "lawn"],
      matching: {
        life: {
          urgency: "scheduled",
          requiresVerifiedIdentity: true,
          maxDistanceKm: 5
        }
      }
    }
  },
  {
    id: "work-srs-review",
    direction: "work",
    label: "Work",
    title: "Ревью SRS",
    input: {
      direction: "work",
      categoryId: "work.expert-help",
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      expectedResult: "Markdown-список замечаний, рисков, вопросов и рекомендаций.",
      answers: {
        reviewType: "quick_review",
        artifactType: "srs",
        artifactStage: "pre_development",
        artifactSizeValue: 20,
        artifactSizeUnit: "pages",
        serviceFormat: "online"
      },
      location: {
        remoteAllowed: true
      },
      priority: "high",
      tags: ["srs", "requirements", "review"],
      matching: {
        work: {
          requiredRoles: ["system analyst"],
          projectContext: ["srs", "requirements"],
          minimumExperienceYears: 5,
          requiresPortfolio: true
        }
      }
    }
  },
  {
    id: "skills-interview",
    direction: "skills",
    label: "Skills",
    title: "Подготовка к интервью",
    input: {
      direction: "skills",
      categoryId: "skills.interview-preparation",
      title: "Подготовка к интервью",
      description: "Нужен mock interview, обратная связь и план подготовки.",
      expectedResult: "План подготовки и feedback по ответам.",
      answers: {
        targetRole: "System Analyst",
        targetSeniority: "senior",
        interviewTypes: ["system_design", "behavioral"],
        preparationGoal: "mock_interview",
        preferredFormat: "video",
        interviewLanguage: "en"
      },
      location: {
        remoteAllowed: true
      },
      priority: "normal",
      tags: ["interview", "career", "english"],
      matching: {
        skills: {
          currentLevel: "intermediate",
          targetLevel: "advanced",
          goals: ["mock_interview"],
          preferredFormats: ["video"]
        }
      }
    }
  }
];
