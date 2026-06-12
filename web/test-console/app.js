const apiBaseUrl = new URLSearchParams(window.location.search).get("api") ?? "http://localhost:3030";

const state = {
  scenarios: [],
  selectedScenarioId: null
};

const elements = {
  apiStatus: document.querySelector("#api-status"),
  apiUrl: document.querySelector("#api-url"),
  scenarioList: document.querySelector("#scenario-list"),
  form: document.querySelector("#need-form"),
  resetButton: document.querySelector("#reset-button"),
  resultPanel: document.querySelector("#result-panel")
};

elements.apiUrl.textContent = apiBaseUrl;

await boot();

async function boot() {
  await checkApi();
  await loadScenarios();
  bindEvents();
}

async function checkApi() {
  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    const payload = await response.json();

    if (!response.ok || payload.status !== "ok") {
      throw new Error("API returned non-ok status");
    }

    elements.apiStatus.textContent = "API: online";
    elements.apiStatus.classList.add("ok");
  } catch (error) {
    elements.apiStatus.textContent = "API: offline";
    elements.apiStatus.classList.add("error");
    showError(`Не удалось подключиться к API ${apiBaseUrl}. Запустите npm run local:start.`);
  }
}

async function loadScenarios() {
  const response = await fetch(`${apiBaseUrl}/demo/scenarios`);

  if (!response.ok) {
    throw new Error(`Failed to load scenarios: ${response.status}`);
  }

  const payload = await response.json();
  state.scenarios = payload.scenarios ?? [];

  renderScenarioList();

  if (state.scenarios[0]) {
    selectScenario(state.scenarios[0].id);
  }
}

function bindEvents() {
  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await runMatch();
  });

  elements.resetButton.addEventListener("click", () => {
    if (state.selectedScenarioId) {
      selectScenario(state.selectedScenarioId);
    }
  });
}

function renderScenarioList() {
  elements.scenarioList.innerHTML = "";

  for (const scenario of state.scenarios) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-button";
    button.dataset.scenarioId = scenario.id;
    button.innerHTML = `
      <strong>${escapeHtml(scenario.title)}</strong>
      <span>${escapeHtml(scenario.summary)}</span>
    `;
    button.addEventListener("click", () => selectScenario(scenario.id));
    elements.scenarioList.append(button);
  }
}

function selectScenario(scenarioId) {
  const scenario = state.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    return;
  }

  state.selectedScenarioId = scenarioId;

  for (const button of elements.scenarioList.querySelectorAll(".scenario-button")) {
    button.classList.toggle("active", button.dataset.scenarioId === scenarioId);
  }

  fillForm(scenario.input);
  elements.resultPanel.className = "empty-state";
  elements.resultPanel.textContent = "Сценарий загружен. Запустите matching.";
}

function fillForm(input) {
  elements.form.direction.value = input.direction ?? "work";
  elements.form.categoryId.value = input.categoryId ?? "";
  elements.form.title.value = input.title ?? "";
  elements.form.description.value = input.description ?? "";
  elements.form.expectedResult.value = input.expectedResult ?? "";
  elements.form.tags.value = (input.tags ?? []).join(", ");
  elements.form.priority.value = input.priority ?? "normal";
  elements.form.city.value = input.location?.city ?? "";
  elements.form.district.value = input.location?.district ?? "";
  elements.form.remoteAllowed.checked = Boolean(input.location?.remoteAllowed);
}

async function runMatch() {
  const payload = formToNeedInput();

  elements.resultPanel.className = "empty-state";
  elements.resultPanel.textContent = "Matching выполняется...";

  try {
    const response = await fetch(`${apiBaseUrl}/demo/match`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? `API error ${response.status}`);
    }

    renderResult(result);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Неизвестная ошибка matching");
  }
}

function formToNeedInput() {
  const formData = new FormData(elements.form);
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const location = {
    city: stringOrUndefined(formData.get("city")),
    district: stringOrUndefined(formData.get("district")),
    remoteAllowed: formData.get("remoteAllowed") === "on"
  };

  return {
    direction: String(formData.get("direction")),
    categoryId: String(formData.get("categoryId")),
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    expectedResult: String(formData.get("expectedResult")),
    priority: String(formData.get("priority")),
    tags,
    location
  };
}

function renderResult(result) {
  const firstMatch = result.matches?.[0];
  const brief = result.firstBrief;

  if (!firstMatch) {
    elements.resultPanel.className = "empty-state";
    elements.resultPanel.textContent = "Релевантных профилей не найдено. Нужна ручная проверка или расширение каталога.";
    return;
  }

  elements.resultPanel.className = "result-stack";
  elements.resultPanel.innerHTML = `
    <article class="match-card">
      <div class="match-head">
        <div>
          <h3>${escapeHtml(firstMatch.profile.displayName)}</h3>
          <p>${escapeHtml(firstMatch.profile.role)} · ${escapeHtml(firstMatch.profile.summary)}</p>
        </div>
        <div class="score">${firstMatch.score}%</div>
      </div>
      <div class="meta">
        <span class="pill">Action: ${escapeHtml(firstMatch.recommendedAction)}</span>
        <span class="pill">Availability: ${escapeHtml(firstMatch.profile.availability)}</span>
        <span class="pill">Profile: ${escapeHtml(firstMatch.profile.id)}</span>
      </div>
    </article>
    <article class="brief-card">
      <h3>Почему подходит</h3>
      ${renderList(firstMatch.explanation.reasons)}
    </article>
    <article class="brief-card">
      <h3>Риски</h3>
      ${firstMatch.explanation.risks.length > 0 ? renderList(firstMatch.explanation.risks) : "<p>Явных рисков нет.</p>"}
    </article>
    <article class="brief-card">
      <h3>Brief для контакта</h3>
      <p>${escapeHtml(brief.goal)}</p>
      <h3>Контекст</h3>
      ${renderList(brief.context)}
      <h3>Вопросы</h3>
      ${renderList(brief.questions, "ol")}
      <h3>Следующий шаг</h3>
      <p>${escapeHtml(brief.nextStep)}</p>
    </article>
  `;
}

function renderList(items, tagName = "ul") {
  const safeItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<${tagName}>${safeItems}</${tagName}>`;
}

function showError(message) {
  elements.resultPanel.className = "error-state";
  elements.resultPanel.textContent = message;
}

function stringOrUndefined(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
