const apiBaseUrl = process.env.CIFEDRA_API_URL ?? "http://localhost:3030";
const webUrl = process.env.CIFEDRA_WEB_URL ?? "http://localhost:4177/web/landing/";

const scenarios = [
  {
    name: "Life / Local Tasks",
    expectedProfileId: "profile_life_anna",
    payload: {
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
    name: "Work / Expert Help",
    expectedProfileId: "profile_work_dmitry",
    payload: {
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
    name: "Skills / Career Help",
    expectedProfileId: "profile_skills_maria",
    payload: {
      direction: "skills",
      categoryId: "skills.career-help",
      title: "Подготовка к интервью",
      description: "Нужна практика ответов и разбор резюме перед собеседованием.",
      expectedResult: "План подготовки и обратная связь",
      tags: ["career", "interview", "resume"]
    }
  }
];

await checkHealth();
await checkLanding();

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

async function checkScenario(scenario) {
  const response = await fetch(`${apiBaseUrl}/demo/match`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(scenario.payload)
  });

  assert(response.ok, `${scenario.name}: /demo/match failed with ${response.status}`);

  const body = await response.json();
  const firstProfileId = body.matches?.[0]?.profile?.id;

  assert(
    firstProfileId === scenario.expectedProfileId,
    `${scenario.name}: expected ${scenario.expectedProfileId}, got ${firstProfileId ?? "none"}`
  );

  assert(body.firstBrief?.questions?.length >= 3, `${scenario.name}: first brief is incomplete`);

  console.log(
    `${scenario.name}: ${firstProfileId}, score ${body.matches[0].score}, action ${body.matches[0].recommendedAction}`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
