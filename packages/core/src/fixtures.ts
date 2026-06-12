import type { Profile } from "./domain.js";

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
