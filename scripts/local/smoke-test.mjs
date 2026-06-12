const apiBaseUrl = process.env.CIFEDRA_API_URL ?? "http://localhost:3030";
const webUrl = process.env.CIFEDRA_WEB_URL ?? "http://localhost:4177/web/landing/";

await checkHealth();
await checkLanding();
await checkTestConsole();

const scenarios = await getScenarios();
for (const scenario of scenarios) {
  await checkScenario(scenario);
}

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
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(scenario.input)
  });

  assert(response.ok, `${scenario.name}: /demo/match failed with ${response.status}`);

  const body = await response.json();
  const firstProfileId = body.matches?.[0]?.profile?.id;

  assert(
    firstProfileId === scenario.expectedProfileId,
    `${scenario.title}: expected ${scenario.expectedProfileId}, got ${firstProfileId ?? "none"}`
  );

  assert(body.firstBrief?.questions?.length >= 3, `${scenario.title}: first brief is incomplete`);

  console.log(
    `${scenario.title}: ${firstProfileId}, score ${body.matches[0].score}, action ${body.matches[0].recommendedAction}`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
