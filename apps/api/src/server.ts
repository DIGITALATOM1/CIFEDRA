import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createIntegrationHandoff, getIntegrationStatus } from "./integration-handoff.js";
import { getConfiguredContactRequestRepository } from "./contact-request-store.js";
import {
  ContactRequestApplicationError,
  ContactRequestApplicationService
} from "./contact-request-service.js";
import {
  AuthError,
  getAuthContextFromHeader,
  getAuthStatus,
  loginLocalUser,
  logoutLocalSession,
  registerLocalUser,
  type AuthLoginInput
} from "./auth-store.js";
import {
  buildConversationBrief,
  buildIntegrationWorkflow,
  buildMatchQualitySignal,
  buildRecommendedDecisions,
  buildShortlist,
  createContactRequestFromLatestDecision,
  createConversationDraft,
  createNeed,
  demoNeedScenarios,
  demoProfiles,
  directionDefinitions,
  integrationDefinitions,
  type AuthRegistrationInput,
  type AuthRole,
  markConversationOpened,
  markConversationResolved,
  markNeedMatched,
  rankProfilesForNeed,
  recordContactResult,
  resolveNeedFromContactResult,
  runAllSyntheticVerticalFlows,
  type ContactOutcome,
  type Conversation,
  type Need,
  type NeedInput
} from "@cifedra/core";

export function createApiServer(): Server {
  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response);
    } catch (error) {
      if (
        error instanceof AuthError ||
        error instanceof RequestError ||
        error instanceof ContactRequestApplicationError
      ) {
        sendJson(response, error.statusCode, {
          error: error.message
        });
        return;
      }

      console.error("Unhandled API error", error);
      sendJson(response, 500, {
        error: "Internal server error"
      });
    }
  });
  const requestTimeoutMs = getRequestTimeoutMs();

  server.requestTimeout = requestTimeoutMs;
  server.headersTimeout = requestTimeoutMs;
  server.keepAliveTimeout = Math.min(5000, requestTimeoutMs);
  server.setTimeout(requestTimeoutMs);

  return server;
}

export function startApiServer(): Server {
  const port = Number(process.env.PORT ?? 3030);
  const host = getApiHost();
  const server = createApiServer();

  server.listen(port, host, () => {
    console.log(`CIFEDRA API prototype listening on http://${host}:${port}`);
  });

  return server;
}

export function getApiHost(): string {
  return process.env.CIFEDRA_API_HOST ?? "127.0.0.1";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startApiServer();
}

async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (!applyCorsPolicy(request, response)) {
    sendJson(response, 403, {
      error: "Origin is not allowed"
    });
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "OPTIONS") {
    sendEmpty(response, 204);
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "cifedra-api",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/directions") {
    sendJson(response, 200, {
      directions: directionDefinitions
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/demo/profiles") {
    sendJson(response, 200, {
      profiles: demoProfiles
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/demo/scenarios") {
    sendJson(response, 200, {
      scenarios: demoNeedScenarios
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/demo/vertical-flows") {
    sendJson(response, 200, {
      flows: runAllSyntheticVerticalFlows()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/integrations") {
    sendJson(response, 200, {
      integrations: integrationDefinitions,
      localRuntime: {
        required: "docker compose",
        dataPolicy: "runtime state and secrets stay in .local and are not committed",
        authProvider: "cifedra-local-auth"
      }
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/status") {
    sendJson(response, 200, await getAuthStatus());
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/register") {
    const body = await readJsonObject<AuthRegistrationInput>(request);
    const session = await registerLocalUser(body);

    sendJson(response, 201, session);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/login") {
    const body = await readJsonObject<AuthLoginInput>(request);
    const session = await loginLocalUser(body);

    sendJson(response, 200, session);
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/me") {
    const authContext = await requireAuthContext(request);

    sendJson(response, 200, {
      user: authContext.principal,
      identityRef: authContext.identityRef,
      integrationIdentity: authContext.integrationIdentity
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/logout") {
    const revoked = await logoutLocalSession(request.headers.authorization);

    sendJson(response, 200, {
      revoked
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/integrations/status") {
    sendJson(response, 200, getIntegrationStatus());
    return;
  }

  if (request.method === "POST" && url.pathname === "/demo/match") {
    const authContext = await requireAnyRole(request, ["client", "helper", "operator"]);
    const body = await readJsonObject<Partial<NeedInput>>(request);
    const createdNeed = createNeed({
      ...normalizeDemoNeed(body),
      ownerUserProfileId: authContext.principal.id
    });
    const matches = rankProfilesForNeed(createdNeed, demoProfiles, {
      limit: 5,
      minScore: 25
    });
    const need = matches.length > 0 ? markNeedMatched(createdNeed) : createdNeed;
    const decisions = buildRecommendedDecisions(need, matches);
    const shortlist = buildShortlist(need, matches, decisions);
    const firstBrief = matches[0] ? buildConversationBrief(need, matches[0]) : null;
    const firstDecision = matches[0]
      ? decisions.find((decision) => decision.profileId === matches[0]?.profile.id)
      : undefined;
    const firstContactRequest =
      matches[0] && firstDecision?.decision === "requested_contact"
        ? createContactRequestFromLatestDecision({
            need,
            candidate: matches[0],
            decisions,
            actorUserProfileId: authContext.principal.id,
            idempotencyKey: `demo-${need.id}-${matches[0].profile.id}-contact-request`,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
          })
        : null;
    const firstConversationDraft =
      matches[0] && firstBrief && firstDecision?.decision === "requested_contact"
        ? createConversationDraft({
            need,
            candidate: matches[0],
            decision: firstDecision,
            brief: firstBrief
          })
        : null;

    sendJson(response, 200, {
      need,
      matches,
      decisions,
      shortlist,
      firstContactRequest,
      firstBrief,
      firstConversationDraft,
      integrationWorkflow: buildIntegrationWorkflow(need, matches[0], firstBrief),
      actor: authContext.principal
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/demo/handoff") {
    const authContext = await requireAnyRole(request, ["client", "operator"]);
    const body = await readJsonObject<Parameters<typeof createIntegrationHandoff>[0]>(request);
    const handoff = await createIntegrationHandoff({
      ...body,
      actor: authContext.principal
    });

    sendJson(response, 200, {
      handoff
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/demo/result") {
    await requireAnyRole(request, ["client", "helper", "operator"]);
    const body = await readJsonObject<DemoResultRequest>(request);
    const conversation = resolveDemoConversation(body.conversation);
    const result = recordContactResult({
      needId: body.need.id,
      profileId: conversation.profileId,
      conversationId: conversation.id,
      decisionId: conversation.decisionId,
      outcome: body.outcome ?? "agreed",
      summary: body.summary ?? "Договорились о следующем шаге.",
      matchScore: body.matchScore,
      qualityScore: body.qualityScore
    });
    const need = resolveNeedFromContactResult(body.need, conversation, result);
    const qualitySignal = buildMatchQualitySignal(result);

    sendJson(response, 200, {
      need,
      conversation,
      result,
      qualitySignal
    });
    return;
  }

  const contactRequestRoute = parseContactRequestRoute(url.pathname);

  if (request.method === "POST" && contactRequestRoute) {
    const authContext = await requireAuthContext(request);
    const body = await readJsonObject<ContactRequestTransitionRequest>(request);
    const repository = getConfiguredContactRequestRepository();

    if (!repository) {
      throw new RequestError(
        503,
        "ContactRequest PostgreSQL store is not configured; set CIFEDRA_CONTACT_REQUEST_STORE=postgres"
      );
    }

    const service = new ContactRequestApplicationService(repository);
    const command = {
      requestId: contactRequestRoute.requestId,
      expectedAggregateVersion: normalizeExpectedAggregateVersion(body.expectedAggregateVersion),
      actor: authContext.principal,
      reason: normalizeOptionalReason(body.reason)
    };
    const result = await runContactRequestAction(
      service,
      contactRequestRoute.action,
      command
    );

    sendJson(response, 200, result);
    return;
  }

  sendJson(response, 404, {
    error: "Not found",
    routes: [
      "GET /auth/status",
      "POST /auth/register",
      "POST /auth/login",
      "GET /auth/me",
      "POST /auth/logout",
      "GET /health",
      "GET /directions",
      "GET /demo/profiles",
      "GET /demo/scenarios",
      "GET /demo/vertical-flows",
      "GET /integrations",
      "GET /integrations/status",
      "POST /demo/contact-requests/{id}/accept",
      "POST /demo/contact-requests/{id}/decline",
      "POST /demo/contact-requests/{id}/cancel",
      "POST /demo/contact-requests/{id}/expire",
      "POST /demo/handoff",
      "POST /demo/match",
      "POST /demo/result"
    ]
  });
}

async function requireAuthContext(request: IncomingMessage) {
  const authContext = await getAuthContextFromHeader(request.headers.authorization);

  if (!authContext) {
    throw new AuthError(401, "Authorization required");
  }

  return authContext;
}

async function requireAnyRole(request: IncomingMessage, allowedRoles: readonly AuthRole[]) {
  const authContext = await requireAuthContext(request);

  if (!authContext.principal.roles.some((role) => allowedRoles.includes(role))) {
    throw new AuthError(403, "Insufficient permissions");
  }

  return authContext;
}

interface DemoResultRequest {
  readonly need: Need;
  readonly conversation: Conversation;
  readonly outcome?: ContactOutcome;
  readonly summary?: string;
  readonly matchScore?: number;
  readonly qualityScore?: number;
}

interface ContactRequestTransitionRequest {
  readonly expectedAggregateVersion?: unknown;
  readonly reason?: unknown;
}

class RequestError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function parseContactRequestRoute(pathname: string):
  | {
    readonly requestId: string;
    readonly action: "accept" | "decline" | "cancel" | "expire";
  }
  | null {
  const match = /^\/demo\/contact-requests\/([^/]+)\/(accept|decline|cancel|expire)$/.exec(
    pathname
  );

  if (!match) {
    return null;
  }

  return {
    requestId: decodeURIComponent(match[1] ?? ""),
    action: match[2] as "accept" | "decline" | "cancel" | "expire"
  };
}

function runContactRequestAction(
  service: ContactRequestApplicationService,
  action: "accept" | "decline" | "cancel" | "expire",
  command: Parameters<ContactRequestApplicationService["accept"]>[0]
) {
  switch (action) {
    case "accept":
      return service.accept(command);
    case "decline":
      return service.decline(command);
    case "cancel":
      return service.cancel(command);
    case "expire":
      return service.expire(command);
  }
}

function normalizeExpectedAggregateVersion(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}

function normalizeOptionalReason(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeDemoNeed(body: Partial<NeedInput>): NeedInput {
  return {
    direction: body.direction ?? "work",
    categoryId: body.categoryId ?? "work.expert-help",
    title: body.title ?? "Нужно найти подходящего эксперта",
    description:
      body.description ?? "Нужно подобрать релевантного человека и подготовить разговор.",
    expectedResult: body.expectedResult ?? "Понятный следующий шаг после контакта",
    context: body.context,
    constraints: body.constraints,
    location: body.location,
    priority: body.priority,
    tags: body.tags ?? ["analysis", "requirements", "review"],
    matching: body.matching
  };
}

function resolveDemoConversation(conversation: Conversation): Conversation {
  if (conversation.state === "resolved") {
    return conversation;
  }

  if (conversation.state === "draft") {
    return markConversationResolved(markConversationOpened(conversation));
  }

  return markConversationResolved(conversation);
}

async function readJsonObject<T extends object>(request: IncomingMessage): Promise<T> {
  const body = await readJson(request);

  if (!isJsonObject(body)) {
    throw new RequestError(400, "JSON body must be an object");
  }

  return body as T;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  assertJsonContentType(request);

  const chunks: Buffer[] = [];
  const maxBodyBytes = getMaxJsonBodyBytes();
  let receivedBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.length;

    if (receivedBytes > maxBodyBytes) {
      throw new RequestError(413, `JSON body exceeds ${maxBodyBytes} bytes`);
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new RequestError(400, "Invalid JSON body");
  }
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendEmpty(response: ServerResponse, statusCode: number): void {
  response.writeHead(statusCode);
  response.end();
}

function applyCorsPolicy(request: IncomingMessage, response: ServerResponse): boolean {
  const origin = request.headers.origin;

  if (!origin) {
    return true;
  }

  if (!allowedCorsOrigins().has(origin)) {
    return false;
  }

  response.setHeader("access-control-allow-origin", origin);
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "authorization,content-type");
  response.setHeader("vary", "Origin");
  return true;
}

function allowedCorsOrigins(): Set<string> {
  const configured = process.env.CIFEDRA_CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(
    configured?.length
      ? configured
      : ["http://localhost:4177", "http://127.0.0.1:4177"]
  );
}

function assertJsonContentType(request: IncomingMessage): void {
  const contentType = Array.isArray(request.headers["content-type"])
    ? request.headers["content-type"][0]
    : request.headers["content-type"];
  const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();

  if (mediaType === "application/json" || mediaType?.endsWith("+json")) {
    return;
  }

  throw new RequestError(415, "Content-Type must be application/json");
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMaxJsonBodyBytes(): number {
  return positiveIntegerEnv("CIFEDRA_MAX_JSON_BODY_BYTES", 64 * 1024);
}

function getRequestTimeoutMs(): number {
  return positiveIntegerEnv("CIFEDRA_REQUEST_TIMEOUT_MS", 10_000);
}

function positiveIntegerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}
