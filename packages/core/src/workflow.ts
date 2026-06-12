import type { ConversationBrief, MatchCandidate, Need } from "./domain.js";

export type WorkflowStage = "need" | "match" | "prepare" | "connect" | "execute" | "result";

export type WorkflowOwner = "cifedra" | "plane" | "chatwoot";

export type WorkflowStepStatus = "done" | "ready" | "planned" | "blocked";

export interface WorkflowHandoffPayload {
  readonly title: string;
  readonly target: string;
  readonly fields: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}

export interface WorkflowStep {
  readonly id: string;
  readonly stage: WorkflowStage;
  readonly owner: WorkflowOwner;
  readonly integrationId?: "plane" | "chatwoot";
  readonly title: string;
  readonly summary: string;
  readonly status: WorkflowStepStatus;
  readonly localUrl?: string;
  readonly handoff?: WorkflowHandoffPayload;
}

export interface IntegrationWorkflow {
  readonly summary: string;
  readonly steps: readonly WorkflowStep[];
}

export function buildIntegrationWorkflow(
  need: Need,
  candidate?: MatchCandidate,
  brief?: ConversationBrief | null
): IntegrationWorkflow {
  const noCandidate = !candidate || !brief;
  const action = candidate?.recommendedAction ?? "review_manually";
  const canRequestContact = action === "request_contact";

  return {
    summary:
      "CIFEDRA держит Need, Match, Prepare и Result в своем ядре; Plane получает задачу исполнения, Chatwoot получает коммуникацию по подготовленному brief.",
    steps: [
      {
        id: "need",
        stage: "need",
        owner: "cifedra",
        title: "Need: постановка потребности",
        summary: `${need.title} -> ${need.expectedResult}`,
        status: "done"
      },
      {
        id: "match",
        stage: "match",
        owner: "cifedra",
        title: "Match: подбор помощника",
        summary: candidate
          ? `${candidate.profile.displayName}, score ${candidate.score}%, action ${candidate.recommendedAction}`
          : "Нет кандидата для автоматической привязки.",
        status: candidate ? "done" : "blocked"
      },
      {
        id: "prepare",
        stage: "prepare",
        owner: "cifedra",
        title: "Prepare: brief контакта",
        summary: brief ? brief.nextStep : "Brief не сформирован, нужен ручной разбор.",
        status: brief ? "done" : "blocked"
      },
      {
        id: "plane-task",
        stage: "execute",
        owner: "plane",
        integrationId: "plane",
        title: "Plane: задача исполнения",
        summary: noCandidate
          ? "Задача в Plane будет создана после ручного выбора исполнителя."
          : "Plane фиксирует статус, приоритет, ответственного и следующий шаг исполнения.",
        status: noCandidate ? "blocked" : "ready",
        localUrl: "http://localhost:8082",
        handoff: candidate && brief ? buildPlaneHandoff(need, candidate, brief) : undefined
      },
      {
        id: "chatwoot-conversation",
        stage: "connect",
        owner: "chatwoot",
        integrationId: "chatwoot",
        title: "Chatwoot: диалог concierge",
        summary: canRequestContact
          ? "Chatwoot получает диалог с goal, контекстом и вопросами из CIFEDRA brief."
          : "Диалог пока не открываем: кандидат требует shortlist/manual review перед контактом.",
        status: noCandidate ? "blocked" : canRequestContact ? "ready" : "planned",
        localUrl: "http://localhost:8083",
        handoff: candidate && brief ? buildChatwootHandoff(need, candidate, brief) : undefined
      },
      {
        id: "result",
        stage: "result",
        owner: "cifedra",
        title: "Result: итог и качество",
        summary:
          "После статуса Plane и результата диалога Chatwoot CIFEDRA фиксирует outcome, next step и quality score.",
        status: noCandidate ? "blocked" : "planned"
      }
    ]
  };
}

function buildPlaneHandoff(
  need: Need,
  candidate: MatchCandidate,
  brief: ConversationBrief
): WorkflowHandoffPayload {
  return {
    title: `[${need.direction.toUpperCase()}] ${need.title}`,
    target: "Plane issue draft",
    fields: [
      {
        label: "Project/module",
        value: `CIFEDRA ${need.direction}`
      },
      {
        label: "Priority",
        value: need.priority
      },
      {
        label: "Assignee hint",
        value: `${candidate.profile.displayName} (${candidate.profile.id})`
      },
      {
        label: "Description",
        value: `${need.description}\n\nExpected result: ${need.expectedResult}`
      },
      {
        label: "Next step",
        value: brief.nextStep
      },
      {
        label: "Labels",
        value: [need.direction, need.categoryId, ...need.tags].join(", ")
      }
    ]
  };
}

function buildChatwootHandoff(
  need: Need,
  candidate: MatchCandidate,
  brief: ConversationBrief
): WorkflowHandoffPayload {
  return {
    title: `CIFEDRA Concierge -> ${candidate.profile.displayName}`,
    target: "Chatwoot conversation draft",
    fields: [
      {
        label: "Inbox",
        value: "CIFEDRA Concierge"
      },
      {
        label: "Contact",
        value: `${candidate.profile.displayName} (${candidate.profile.role})`
      },
      {
        label: "Goal",
        value: brief.goal
      },
      {
        label: "Context",
        value: brief.context.join("\n")
      },
      {
        label: "First message",
        value: [
          `Здравствуйте. Есть задача: ${need.title}.`,
          `Ожидаемый результат: ${need.expectedResult}.`,
          "Можно уточнить:",
          ...brief.questions.map((question, index) => `${index + 1}. ${question}`)
        ].join("\n")
      },
      {
        label: "Risks",
        value: brief.risks.length > 0 ? brief.risks.join("\n") : "Явных рисков нет."
      }
    ]
  };
}
