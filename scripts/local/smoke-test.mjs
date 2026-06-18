const apiBaseUrl = process.env.CIFEDRA_API_URL ?? "http://localhost:3030";
const webUrl = process.env.CIFEDRA_WEB_URL ?? "http://localhost:4177/web/landing/";
const smokePassword = "SmokePassword123!";

let authToken = null;
let authUser = null;

await checkHealth();
await checkLanding();
await checkTestConsole();
await checkAuth();

const scenarios = await getScenarios();
let firstScenarioResult = null;
for (const scenario of scenarios) {
  const result = await checkScenario(scenario);
  firstScenarioResult ??= result;
}

await checkHandoff(firstScenarioResult);
await checkResult(firstScenarioResult);

console.log("Local smoke tests passed for Life / Work / Skills.");

async function checkHealth() {
  const response = await fetch(`${apiBaseUrl}/health`);

  assert(response.ok, `GET /health failed with ${response.status}`);

  const body = await response.json();
  assert(body.status === "ok", "GET /health returned non-ok status");
}

async function checkLanding() {
  const response = await fetch(webUrl);

  assert(response.ok, `Landing failed with ${response.status}`);

  const html = await response.text();
  assert(html.includes("Навигатор полезных людей"), "Landing title text not found");
  assert(html.includes("assets/qr-ios.svg"), "iOS QR reference not found");
  assert(html.includes("assets/qr-android.svg"), "Android QR reference not found");
}

async function checkTestConsole() {
  const response = await fetch("http://localhost:4177/web/test-console/");

  assert(response.ok, `Test console failed with ${response.status}`);

  const html = await response.text();
  assert(html.includes("CIFEDRA Local Test Console"), "Test console title text not found");
  assert(html.includes("CIFEDRA Auth"), "Auth console section not found");
}

async function checkAuth() {
  const statusResponse = await fetch(`${apiBaseUrl}/auth/status`);
  assert(statusResponse.ok, `GET /auth/status failed with ${statusResponse.status}`);

  const email = `smoke-${Date.now()}@cifedra.local`;
  const registerResponse = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      email,
      displayName: "Smoke User",
      password: smokePassword,
      roles: ["operator"]
    })
  });

  assert(registerResponse.ok, `POST /auth/register failed with ${registerResponse.status}`);

  const registerBody = await registerResponse.json();
  assert(registerBody.token, "Expected auth token after register");
  assert(registerBody.user?.email === email, "Expected registered auth user email");

  authToken = registerBody.token;
  authUser = registerBody.user;

  const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: authHeaders()
  });
  assert(meResponse.ok, `GET /auth/me failed with ${meResponse.status}`);

  const meBody = await meResponse.json();
  assert(meBody.user?.email === email, "Expected /auth/me to return current user");
  assert(meBody.integrationIdentity?.provider === "cifedra", "Expected CIFEDRA identity");

  console.log(`Auth registration passed for ${email}.`);
}

async function getScenarios() {
  const response = await fetch(`${apiBaseUrl}/demo/scenarios`);

  assert(response.ok, `GET /demo/scenarios failed with ${response.status}`);

  const body = await response.json();
  assert(body.scenarios?.length >= 3, "Expected at least 3 demo scenarios");

  return body.scenarios;
}

async function checkScenario(scenario) {
  const response = await fetch(`${apiBaseUrl}/demo/match`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(scenario.input)
  });

  assert(response.ok, `${scenario.name}: /demo/match failed with ${response.status}`);

  const body = await response.json();
  const firstProfileId = body.matches?.[0]?.profile?.id;

  assert(
    firstProfileId === scenario.expectedProfileId,
    `${scenario.title}: expected ${scenario.expectedProfileId}, got ${firstProfileId ?? "none"}`
  );

  assert(body.need?.status === "matched", `${scenario.title}: expected need status matched`);
  assert(
    body.matches?.[0]?.explanation?.scoreBreakdown?.total === body.matches?.[0]?.score,
    `${scenario.title}: score breakdown is missing or inconsistent`
  );
  assert(
    body.matches?.[0]?.explanation?.scoreBreakdown?.directionSpecific > 0,
    `${scenario.title}: expected positive direction-specific score`
  );
  assert(body.decisions?.length >= 1, `${scenario.title}: expected candidate decisions`);
  assert(
    body.shortlist?.items?.[0]?.profileId === scenario.expectedProfileId,
    `${scenario.title}: expected shortlist to start with ${scenario.expectedProfileId}`
  );
  assert(body.firstBrief?.questions?.length >= 3, `${scenario.title}: first brief is incomplete`);
  assert(
    body.firstConversationDraft?.state === "draft",
    `${scenario.title}: expected conversation draft`
  );
  assert(
    body.firstConversationDraft?.decisionId === body.decisions?.[0]?.id,
    `${scenario.title}: expected conversation to reference first decision`
  );
  assert(
    body.integrationWorkflow?.steps?.some((step) => step.id === "plane-task"),
    `${scenario.title}: Plane handoff step is missing`
  );
  assert(
    body.integrationWorkflow?.steps?.some((step) => step.id === "chatwoot-conversation"),
    `${scenario.title}: Chatwoot handoff step is missing`
  );
  assert(body.actor?.email === authUser.email, `${scenario.title}: expected auth actor`);

  console.log(
    `${scenario.title}: ${firstProfileId}, score ${body.matches[0].score}, action ${body.matches[0].recommendedAction}`
  );

  return body;
}

async function checkHandoff(matchResult) {
  for (const stepId of ["plane-task", "chatwoot-conversation"]) {
    const response = await fetch(`${apiBaseUrl}/demo/handoff`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        stepId,
        need: matchResult.need,
        match: matchResult.matches[0],
        brief: matchResult.firstBrief,
        conversation: matchResult.firstConversationDraft
      })
    });

    assert(response.ok, `${stepId}: /demo/handoff failed with ${response.status}`);

    const body = await response.json();
    assert(
      body.handoff?.mode === "draft" || body.handoff?.mode === "live",
      `${stepId}: expected draft or live handoff mode`
    );
    assert(
      body.handoff.mode === "live"
        ? body.handoff.status === "created"
        : body.handoff.status === "draft_saved",
      `${stepId}: unexpected ${body.handoff.mode}/${body.handoff.status} handoff`
    );
    assert(body.handoff?.localRecordPath?.startsWith(".local/handoffs/"), `${stepId}: local handoff path missing`);
    assert(body.handoff?.source?.actor?.email === authUser.email, `${stepId}: auth actor missing`);
  }

  console.log("Integration handoff checks passed for Plane / Chatwoot.");
}

async function checkResult(matchResult) {
  const response = await fetch(`${apiBaseUrl}/demo/result`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      need: matchResult.need,
      conversation: matchResult.firstConversationDraft,
      outcome: "agreed",
      summary: "Договорились о следующем шаге.",
      matchScore: matchResult.matches[0].score
    })
  });

  assert(response.ok, `/demo/result failed with ${response.status}`);

  const body = await response.json();

  assert(body.need?.status === "resolved", "Expected resolved need after contact result");
  assert(body.conversation?.state === "resolved", "Expected resolved conversation after contact result");
  assert(body.result?.qualityScore >= 90, "Expected positive result quality score");
  assert(body.qualitySignal?.impact === "positive", "Expected positive match quality signal");

  console.log("Contact result quality loop passed.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function authHeaders(withJson = false) {
  return {
    ...jsonHeaders(withJson),
    authorization: `Bearer ${authToken}`
  };
}

function jsonHeaders(include = true) {
  return include
    ? {
        "content-type": "application/json"
      }
    : {};
}
