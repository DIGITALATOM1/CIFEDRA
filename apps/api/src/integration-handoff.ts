import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildIntegrationWorkflow,
  type AuthPrincipal,
  type Conversation,
  type ConversationBrief,
  type MatchCandidate,
  type Need
} from "@cifedra/core";

type HandoffStepId = "plane-task" | "chatwoot-conversation";
type HandoffMode = "draft" | "live";
type HandoffStatus = "draft_saved" | "created" | "failed";

interface IntegrationHandoffInput {
  readonly stepId: HandoffStepId;
  readonly need: Need;
  readonly match: MatchCandidate;
  readonly brief: ConversationBrief;
  readonly conversation?: Conversation;
  readonly actor?: AuthPrincipal;
}

interface ExternalRequestDraft {
  readonly method: "POST";
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: Record<string, unknown>;
}

interface IntegrationHandoffResult {
  readonly id: string;
  readonly stepId: HandoffStepId;
  readonly integrationId: "plane" | "chatwoot";
  readonly mode: HandoffMode;
  readonly status: HandoffStatus;
  readonly message: string;
  readonly createdAt: string;
  readonly source: {
    readonly needId: string;
    readonly profileId: string;
    readonly direction: string;
    readonly categoryId: string;
    readonly actor?: AuthPrincipal;
  };
  readonly localRecordPath: string;
  readonly externalRequest: ExternalRequestDraft;
  readonly externalResponse?: unknown;
  readonly missingConfig?: readonly string[];
}

interface IntegrationStatus {
  readonly liveEnabled: boolean;
  readonly plane: {
    readonly baseUrl: string;
    readonly missingConfig: readonly string[];
    readonly mode: HandoffMode;
  };
  readonly chatwoot: {
    readonly baseUrl: string;
    readonly missingConfig: readonly string[];
    readonly mode: HandoffMode;
  };
}

const rootDir = new URL("../../..", import.meta.url).pathname;
const handoffDir = join(rootDir, ".local", "handoffs");

export function getIntegrationStatus(): IntegrationStatus {
  const liveEnabled = process.env.CIFEDRA_INTEGRATIONS_LIVE === "1";
  const planeMissing = planeMissingConfig();
  const chatwootMissing = chatwootMissingConfig();

  return {
    liveEnabled,
    plane: {
      baseUrl: planeBaseUrl(),
      missingConfig: planeMissing,
      mode: liveEnabled && planeMissing.length === 0 ? "live" : "draft"
    },
    chatwoot: {
      baseUrl: chatwootBaseUrl(),
      missingConfig: chatwootMissing,
      mode: liveEnabled && chatwootMissing.length === 0 ? "live" : "draft"
    }
  };
}

export async function createIntegrationHandoff(input: IntegrationHandoffInput): Promise<IntegrationHandoffResult> {
  const workflow = buildIntegrationWorkflow(input.need, input.match, input.brief);
  const step = workflow.steps.find((item) => item.id === input.stepId);

  if (!step?.handoff || !step.integrationId) {
    throw new Error(`Workflow step ${input.stepId} is not ready for handoff`);
  }

  const id = `handoff_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const request =
    step.integrationId === "plane"
      ? buildPlaneRequest(input, id)
      : buildChatwootRequest(input, id);
  const missingConfig =
    step.integrationId === "plane" ? planeMissingConfig() : chatwootMissingConfig();
  const liveEnabled = process.env.CIFEDRA_INTEGRATIONS_LIVE === "1";
  const mode: HandoffMode = liveEnabled && missingConfig.length === 0 ? "live" : "draft";

  let status: HandoffStatus = "draft_saved";
  let message =
    mode === "draft"
      ? "Handoff пакет сохранен локально. Для live-создания добавьте конфигурацию интеграции и CIFEDRA_INTEGRATIONS_LIVE=1."
      : "Handoff отправлен во внешний модуль.";
  let externalResponse: unknown;

  if (mode === "live") {
    const response = await fetch(request.url, {
      method: request.method,
      headers: liveHeaders(request),
      body: JSON.stringify(request.body)
    });
    externalResponse = await safeJson(response);
    status = response.ok ? "created" : "failed";
    message = response.ok
      ? "Запись создана во внешнем модуле."
      : `Внешний модуль вернул ошибку ${response.status}.`;
  }

  const result: IntegrationHandoffResult = {
    id,
    stepId: input.stepId,
    integrationId: step.integrationId,
    mode,
    status,
    message,
    createdAt,
    source: {
      needId: input.need.id,
      profileId: input.match.profile.id,
      direction: input.need.direction,
      categoryId: input.need.categoryId,
      actor: input.actor
    },
    localRecordPath: await saveHandoffRecord(id, {
      input,
      request,
      mode,
      status,
      message,
      externalResponse
    }),
    externalRequest: request,
    externalResponse,
    missingConfig: missingConfig.length > 0 ? missingConfig : undefined
  };

  return result;
}

function buildPlaneRequest(input: IntegrationHandoffInput, handoffId: string): ExternalRequestDraft {
  const fields = input.brief.context.join("\n");
  const actorLine = input.actor
    ? `Requested by: ${input.actor.displayName} (${input.actor.email}, ${input.actor.id})`
    : "Requested by: anonymous local demo user";
  const body = {
    name: `[${input.need.direction.toUpperCase()}] ${input.need.title}`,
    description_html: [
      `<p>${escapeHtml(input.need.description)}</p>`,
      `<p><strong>Expected result:</strong> ${escapeHtml(input.need.expectedResult)}</p>`,
      `<p><strong>Matched profile:</strong> ${escapeHtml(input.match.profile.displayName)}</p>`,
      `<p><strong>CIFEDRA actor:</strong> ${escapeHtml(actorLine)}</p>`,
      `<pre>${escapeHtml(fields)}</pre>`
    ].join("\n"),
    description_stripped: [
      input.need.description,
      `Expected result: ${input.need.expectedResult}`,
      `Matched profile: ${input.match.profile.displayName} (${input.match.profile.id})`,
      actorLine,
      fields
    ].join("\n\n"),
    priority: mapPlanePriority(input.need.priority),
    external_source: "cifedra",
    external_id: handoffId
  };

  return {
    method: "POST",
    url: `${planeBaseUrl()}/api/v1/workspaces/${envOrPlaceholder("CIFEDRA_PLANE_WORKSPACE_SLUG", "workspace_slug")}/projects/${envOrPlaceholder("CIFEDRA_PLANE_PROJECT_ID", "project_id")}/work-items/`,
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.CIFEDRA_PLANE_API_KEY ? "[configured]" : "[missing]"
    },
    body
  };
}

function buildChatwootRequest(input: IntegrationHandoffInput, handoffId: string): ExternalRequestDraft {
  const firstMessage = input.conversation?.firstMessage ?? buildChatwootFirstMessage(input);

  const body = {
    source_id: input.conversation?.id ?? handoffId,
    inbox_id: numericEnvOrPlaceholder("CIFEDRA_CHATWOOT_INBOX_ID", "inbox_id"),
    contact_id: numericEnvOrPlaceholder("CIFEDRA_CHATWOOT_CONTACT_ID", "contact_id"),
    status: "open",
    custom_attributes: {
      cifedra_need_id: input.need.id,
      cifedra_profile_id: input.match.profile.id,
      cifedra_conversation_id: input.conversation?.id,
      cifedra_direction: input.need.direction,
      cifedra_category_id: input.need.categoryId,
      cifedra_actor_user_id: input.actor?.id,
      cifedra_actor_email: input.actor?.email,
      cifedra_actor_name: input.actor?.displayName,
      cifedra_actor_roles: input.actor?.roles.join(",")
    },
    message: {
      content: firstMessage
    }
  };

  return {
    method: "POST",
    url: `${chatwootBaseUrl()}/api/v1/accounts/${envOrPlaceholder("CIFEDRA_CHATWOOT_ACCOUNT_ID", "account_id")}/conversations`,
    headers: {
      "content-type": "application/json",
      api_access_token: process.env.CIFEDRA_CHATWOOT_API_TOKEN ? "[configured]" : "[missing]"
    },
    body
  };
}

function buildChatwootFirstMessage(input: IntegrationHandoffInput): string {
  return [
    `Здравствуйте. Есть задача: ${input.need.title}.`,
    `Ожидаемый результат: ${input.need.expectedResult}.`,
    "",
    "Контекст:",
    ...input.brief.context,
    "",
    "Вопросы:",
    ...input.brief.questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    input.actor
      ? `Инициатор в CIFEDRA: ${input.actor.displayName} (${input.actor.email}).`
      : "Инициатор в CIFEDRA: локальный demo user без авторизации."
  ].join("\n");
}

async function saveHandoffRecord(id: string, record: unknown): Promise<string> {
  await mkdir(handoffDir, {
    recursive: true
  });

  const relativePath = `.local/handoffs/${id}.json`;
  await writeFile(join(rootDir, relativePath), `${JSON.stringify(record, null, 2)}\n`);

  return relativePath;
}

function liveHeaders(request: ExternalRequestDraft): Record<string, string> {
  if (request.url.includes("/work-items/")) {
    return {
      "content-type": "application/json",
      "X-API-Key": process.env.CIFEDRA_PLANE_API_KEY ?? ""
    };
  }

  return {
    "content-type": "application/json",
    api_access_token: process.env.CIFEDRA_CHATWOOT_API_TOKEN ?? ""
  };
}

function planeMissingConfig(): string[] {
  return missingEnv([
    "CIFEDRA_PLANE_API_KEY",
    "CIFEDRA_PLANE_WORKSPACE_SLUG",
    "CIFEDRA_PLANE_PROJECT_ID"
  ]);
}

function chatwootMissingConfig(): string[] {
  return missingEnv([
    "CIFEDRA_CHATWOOT_API_TOKEN",
    "CIFEDRA_CHATWOOT_ACCOUNT_ID",
    "CIFEDRA_CHATWOOT_INBOX_ID",
    "CIFEDRA_CHATWOOT_CONTACT_ID"
  ]);
}

function missingEnv(keys: readonly string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}

function planeBaseUrl(): string {
  return process.env.CIFEDRA_PLANE_BASE_URL ?? "http://localhost:8082";
}

function chatwootBaseUrl(): string {
  return process.env.CIFEDRA_CHATWOOT_BASE_URL ?? "http://localhost:8083";
}

function envOrPlaceholder(key: string, placeholder: string): string {
  return process.env[key] ?? `{${placeholder}}`;
}

function numericEnvOrPlaceholder(key: string, placeholder: string): number | string {
  const value = process.env[key];

  return value ? Number(value) : `{${placeholder}}`;
}

function mapPlanePriority(priority?: string): string {
  if (priority === "urgent" || priority === "high" || priority === "low") {
    return priority;
  }

  if (priority === "normal") {
    return "medium";
  }

  return "none";
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
