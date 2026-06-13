import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { createIntegrationHandoff, getIntegrationStatus } from "./integration-handoff.js";
import {
  buildConversationBrief,
  buildIntegrationWorkflow,
  buildRecommendedDecisions,
  buildShortlist,
  createNeed,
  demoNeedScenarios,
  demoProfiles,
  directionDefinitions,
  integrationDefinitions,
  markNeedMatched,
  rankProfilesForNeed,
  type NeedInput
} from "@cifedra/core";

const port = Number(process.env.PORT ?? 3030);

const server = createServer(async (request, response) => {
  try {
    await routeRequest(request, response);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
});

server.listen(port, () => {
  console.log(`CIFEDRA API prototype listening on http://localhost:${port}`);
});

async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

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

  if (request.method === "GET" && url.pathname === "/integrations") {
    sendJson(response, 200, {
      integrations: integrationDefinitions,
      localRuntime: {
        required: "docker compose",
        dataPolicy: "runtime state and secrets stay in .local and are not committed"
      }
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/integrations/status") {
    sendJson(response, 200, getIntegrationStatus());
    return;
  }

  if (request.method === "POST" && url.pathname === "/demo/match") {
    const body = await readJson<Partial<NeedInput>>(request);
    const createdNeed = createNeed(normalizeDemoNeed(body));
    const matches = rankProfilesForNeed(createdNeed, demoProfiles, {
      limit: 5,
      minScore: 25
    });
    const need = matches.length > 0 ? markNeedMatched(createdNeed) : createdNeed;
    const decisions = buildRecommendedDecisions(need, matches);
    const shortlist = buildShortlist(need, matches, decisions);
    const firstBrief = matches[0] ? buildConversationBrief(need, matches[0]) : null;

    sendJson(response, 200, {
      need,
      matches,
      decisions,
      shortlist,
      firstBrief,
      integrationWorkflow: buildIntegrationWorkflow(need, matches[0], firstBrief)
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/demo/handoff") {
    const body = await readJson<Parameters<typeof createIntegrationHandoff>[0]>(request);
    const handoff = await createIntegrationHandoff(body);

    sendJson(response, 200, {
      handoff
    });
    return;
  }

  sendJson(response, 404, {
    error: "Not found",
    routes: [
      "GET /health",
      "GET /directions",
      "GET /demo/profiles",
      "GET /demo/scenarios",
      "GET /integrations",
      "GET /integrations/status",
      "POST /demo/handoff",
      "POST /demo/match"
    ]
  });
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
    tags: body.tags ?? ["analysis", "requirements", "review"]
  };
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...corsHeaders()
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendEmpty(response: ServerResponse, statusCode: number): void {
  response.writeHead(statusCode, corsHeaders());
  response.end();
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}
