import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { getApiHost, createApiServer } from "../src/server.ts";

test("secures local registration, demo mutations, CORS and integration writes", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "cifedra-api-test-"));
  const previousEnv = {
    authStorePath: process.env.CIFEDRA_AUTH_STORE_PATH,
    handoffDir: process.env.CIFEDRA_HANDOFF_DIR,
    live: process.env.CIFEDRA_INTEGRATIONS_LIVE,
    writes: process.env.CIFEDRA_ALLOW_EXTERNAL_WRITES,
    cors: process.env.CIFEDRA_CORS_ALLOWED_ORIGINS,
    host: process.env.CIFEDRA_API_HOST,
    maxJsonBodyBytes: process.env.CIFEDRA_MAX_JSON_BODY_BYTES,
    providerTimeoutMs: process.env.CIFEDRA_PROVIDER_REQUEST_TIMEOUT_MS,
    chatwootBaseUrl: process.env.CIFEDRA_CHATWOOT_BASE_URL,
    chatwootToken: process.env.CIFEDRA_CHATWOOT_API_TOKEN,
    chatwootAccountId: process.env.CIFEDRA_CHATWOOT_ACCOUNT_ID,
    chatwootInboxId: process.env.CIFEDRA_CHATWOOT_INBOX_ID,
    chatwootContactId: process.env.CIFEDRA_CHATWOOT_CONTACT_ID
  };

  process.env.CIFEDRA_AUTH_STORE_PATH = join(tempDir, "auth", "store.json");
  process.env.CIFEDRA_HANDOFF_DIR = join(tempDir, "handoffs");
  process.env.CIFEDRA_INTEGRATIONS_LIVE = "1";
  process.env.CIFEDRA_ALLOW_EXTERNAL_WRITES = "0";
  process.env.CIFEDRA_CORS_ALLOWED_ORIGINS = "http://localhost:4177";
  process.env.CIFEDRA_MAX_JSON_BODY_BYTES = "8192";
  delete process.env.CIFEDRA_API_HOST;

  const server = createApiServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const timeoutServer = createServer((_request, _response) => {
    // Deliberately leave the response open to verify provider timeout handling.
  });
  await new Promise<void>((resolve) => timeoutServer.listen(0, "127.0.0.1", resolve));
  const timeoutAddress = timeoutServer.address() as AddressInfo;

  try {
    assert.equal(getApiHost(), "127.0.0.1");

    for (const role of ["helper", "operator", "admin"]) {
      const response = await postJson(`${baseUrl}/auth/register`, {
        email: `${role}@cifedra.local`,
        displayName: `${role} user`,
        password: "Password123!",
        roles: [role]
      });

      assert.equal(response.status, 400);
    }

    const invalidJson = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{not-valid-json"
    });
    assert.equal(invalidJson.status, 400);
    assert.equal((await invalidJson.json()).error, "Invalid JSON body");

    const nonObjectJson = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "[]"
    });
    assert.equal(nonObjectJson.status, 400);
    assert.equal((await nonObjectJson.json()).error, "JSON body must be an object");

    const unsupportedContentType = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "text/plain"
      },
      body: "{}"
    });
    assert.equal(unsupportedContentType.status, 415);

    const oversizedJson = await postJson(`${baseUrl}/auth/login`, {
      email: "client@cifedra.local",
      password: "x".repeat(9000)
    });
    assert.equal(oversizedJson.status, 413);

    const registration = await postJson(`${baseUrl}/auth/register`, {
      email: "client@cifedra.local",
      displayName: "Client User",
      password: "Password123!"
    });
    assert.equal(registration.status, 201);
    const registrationBody = await registration.json();
    assert.deepEqual(registrationBody.user.roles, ["client"]);
    const token = registrationBody.token as string;
    const authStorePath = join(tempDir, "auth", "store.json");

    for (const path of ["/demo/match", "/demo/handoff", "/demo/result"]) {
      const response = await postJson(`${baseUrl}${path}`, {});
      assert.equal(response.status, 401, path);
    }

    const authStore = JSON.parse(await readFile(authStorePath, "utf8"));
    authStore.users[0].roles = ["admin"];
    await writeFile(authStorePath, `${JSON.stringify(authStore, null, 2)}\n`, {
      mode: 0o600
    });
    for (const path of ["/demo/match", "/demo/handoff", "/demo/result"]) {
      const response = await postJson(`${baseUrl}${path}`, {}, token);
      assert.equal(response.status, 403, path);
    }

    authStore.users[0].roles = ["client"];
    await writeFile(authStorePath, `${JSON.stringify(authStore, null, 2)}\n`, {
      mode: 0o600
    });

    const deniedOrigin = await fetch(`${baseUrl}/health`, {
      headers: {
        origin: "https://untrusted.example"
      }
    });
    assert.equal(deniedOrigin.status, 403);
    assert.equal(deniedOrigin.headers.get("access-control-allow-origin"), null);

    const allowedOrigin = await fetch(`${baseUrl}/health`, {
      headers: {
        origin: "http://localhost:4177"
      }
    });
    assert.equal(allowedOrigin.status, 200);
    assert.equal(
      allowedOrigin.headers.get("access-control-allow-origin"),
      "http://localhost:4177"
    );

    const matchResponse = await postJson(
      `${baseUrl}/demo/match`,
      {
        direction: "work",
        categoryId: "work.expert-help",
        title: "Нужно ревью SRS",
        description: "Нужно проверить требования перед передачей в разработку.",
        expectedResult: "Список замечаний и правок",
        tags: ["srs", "requirements", "review"]
      },
      token
    );
    assert.equal(matchResponse.status, 200);
    const matchBody = await matchResponse.json();

    const handoffResponse = await postJson(
      `${baseUrl}/demo/handoff`,
      {
        stepId: "chatwoot-conversation",
        need: matchBody.need,
        match: matchBody.matches[0],
        brief: matchBody.firstBrief,
        conversation: matchBody.firstConversationDraft
      },
      token
    );
    assert.equal(handoffResponse.status, 200);
    const handoffBody = await handoffResponse.json();
    assert.equal(handoffBody.handoff.mode, "draft");
    assert.equal(handoffBody.handoff.status, "draft_saved");

    const handoffFilename = handoffBody.handoff.localRecordPath.split("/").at(-1);
    const handoffStat = await stat(join(tempDir, "handoffs", handoffFilename));
    assert.equal(handoffStat.mode & 0o777, 0o600);

    const statusResponse = await fetch(`${baseUrl}/integrations/status`);
    const statusBody = await statusResponse.json();
    assert.equal(statusBody.liveRequested, true);
    assert.equal(statusBody.externalWritesAllowed, false);
    assert.equal(statusBody.liveEnabled, false);

    process.env.CIFEDRA_ALLOW_EXTERNAL_WRITES = "1";
    process.env.CIFEDRA_PROVIDER_REQUEST_TIMEOUT_MS = "25";
    process.env.CIFEDRA_CHATWOOT_BASE_URL = `http://127.0.0.1:${timeoutAddress.port}`;
    process.env.CIFEDRA_CHATWOOT_API_TOKEN = "test-token";
    process.env.CIFEDRA_CHATWOOT_ACCOUNT_ID = "1";
    process.env.CIFEDRA_CHATWOOT_INBOX_ID = "2";
    process.env.CIFEDRA_CHATWOOT_CONTACT_ID = "3";

    const timeoutHandoffResponse = await postJson(
      `${baseUrl}/demo/handoff`,
      {
        stepId: "chatwoot-conversation",
        need: matchBody.need,
        match: matchBody.matches[0],
        brief: matchBody.firstBrief,
        conversation: matchBody.firstConversationDraft
      },
      token
    );
    assert.equal(timeoutHandoffResponse.status, 200);
    const timeoutHandoffBody = await timeoutHandoffResponse.json();
    assert.equal(timeoutHandoffBody.handoff.mode, "live");
    assert.equal(timeoutHandoffBody.handoff.status, "failed");
    assert.equal(timeoutHandoffBody.handoff.externalResponse.error, "provider_timeout");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    await new Promise<void>((resolve, reject) =>
      timeoutServer.close((error) => (error ? reject(error) : resolve()))
    );
    restoreEnv("CIFEDRA_AUTH_STORE_PATH", previousEnv.authStorePath);
    restoreEnv("CIFEDRA_HANDOFF_DIR", previousEnv.handoffDir);
    restoreEnv("CIFEDRA_INTEGRATIONS_LIVE", previousEnv.live);
    restoreEnv("CIFEDRA_ALLOW_EXTERNAL_WRITES", previousEnv.writes);
    restoreEnv("CIFEDRA_CORS_ALLOWED_ORIGINS", previousEnv.cors);
    restoreEnv("CIFEDRA_API_HOST", previousEnv.host);
    restoreEnv("CIFEDRA_MAX_JSON_BODY_BYTES", previousEnv.maxJsonBodyBytes);
    restoreEnv("CIFEDRA_PROVIDER_REQUEST_TIMEOUT_MS", previousEnv.providerTimeoutMs);
    restoreEnv("CIFEDRA_CHATWOOT_BASE_URL", previousEnv.chatwootBaseUrl);
    restoreEnv("CIFEDRA_CHATWOOT_API_TOKEN", previousEnv.chatwootToken);
    restoreEnv("CIFEDRA_CHATWOOT_ACCOUNT_ID", previousEnv.chatwootAccountId);
    restoreEnv("CIFEDRA_CHATWOOT_INBOX_ID", previousEnv.chatwootInboxId);
    restoreEnv("CIFEDRA_CHATWOOT_CONTACT_ID", previousEnv.chatwootContactId);
    await rm(tempDir, {
      recursive: true,
      force: true
    });
  }
});

async function postJson(url: string, body: unknown, token?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
