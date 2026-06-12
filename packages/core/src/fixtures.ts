import type { NeedInput, Profile } from "./domain.js";

export interface DemoNeedScenario {
  id: string;
  title: string;
  summary: string;
  expectedProfileId: string;
  input: NeedInput;
}

export const demoProfiles: Profile[] = [
  {
    id: "profile_life_anna",
    displayName: "Анна",
    role: "Локальный помощник",
    summary: "Помогает с поручениями рядом, покупками и бытовыми задачами.",
    directions: ["life"],
    categoryIds: ["life.local-tasks", "life.home-help"],
    capabilities: ["delivery", "local help", "errands", "home"],
    availability: "available",
    location: {
      city: "Moscow",
      district: "Tverskoy"
    },
    trustSignals: [
      {
        type: "identity",
        label: "Identity checked",
        verified: true
      },
      {
        type: "reference",
        label: "Two references",
        verified: true
      }
    ]
  },
  {
    id: "profile_work_dmitry",
    displayName: "Дмитрий",
    role: "Системный аналитик",
    summary: "Помогает с SRS, ревью требований и подготовкой задач на разработку.",
    directions: ["work"],
    categoryIds: ["work.expert-help", "work.task-execution", "work.company-knowledge"],
    capabilities: ["srs", "requirements", "analysis", "jira", "review"],
    availability: "available",
    location: {
      city: "Moscow",
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
        label: "Company context",
        verified: true
      }
    ]
  },
  {
    id: "profile_skills_maria",
    displayName: "Мария",
    role: "Карьерный ментор",
    summary: "Готовит к собеседованиям и помогает упаковать опыт в резюме.",
    directions: ["skills"],
    categoryIds: ["skills.mentors", "skills.career-help", "skills.practice-partners"],
    capabilities: ["career", "interview", "resume", "mentoring"],
    availability: "limited",
    location: {
      remoteAllowed: true
    },
    trustSignals: [
      {
        type: "manual_review",
        label: "Manual review",
        verified: true
      }
    ]
  }
];

export const demoNeedScenarios: DemoNeedScenario[] = [
  {
    id: "life-local-tasks",
    title: "Life / Поручение рядом",
    summary: "Проверяем локальную задачу, географию, доступность и доверие.",
    expectedProfileId: "profile_life_anna",
    input: {
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
    }
  },
  {
    id: "work-expert-help",
    title: "Work / Ревью SRS",
    summary: "Проверяем экспертную помощь, требования, SRS и подготовку контакта.",
    expectedProfileId: "profile_work_dmitry",
    input: {
      direction: "work",
      categoryId: "work.expert-help",
      title: "Нужно ревью SRS",
      description: "Нужно проверить требования перед передачей в разработку.",
      expectedResult: "Список замечаний и правок",
      tags: ["srs", "requirements", "review"],
      location: {
        remoteAllowed: true
      }
    }
  },
  {
    id: "skills-career-help",
    title: "Skills / Подготовка к интервью",
    summary: "Проверяем карьерную помощь, уровень, практику и следующий шаг.",
    expectedProfileId: "profile_skills_maria",
    input: {
      direction: "skills",
      categoryId: "skills.career-help",
      title: "Подготовка к интервью",
      description: "Нужна практика ответов и разбор резюме перед собеседованием.",
      expectedResult: "План подготовки и обратная связь",
      tags: ["career", "interview", "resume"]
    }
  }
];
