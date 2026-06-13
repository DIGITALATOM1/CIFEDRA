const apiBaseUrl = new URLSearchParams(window.location.search).get("api") ?? "http://localhost:3030";

const state = {
  scenarios: [],
  selectedScenarioId: null,
  currentResult: null
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
  state.currentResult = null;
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

    state.currentResult = result;
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
    ${renderWorkflow(result.integrationWorkflow)}
  `;
  bindWorkflowActions();
}

function renderWorkflow(workflow) {
  if (!workflow?.steps?.length) {
    return "";
  }

  return `
    <article class="workflow-card">
      <div class="workflow-head">
        <div>
          <h3>Внутренние шаги после matching</h3>
          <p>${escapeHtml(workflow.summary)}</p>
        </div>
        <span class="pill">handoff draft</span>
      </div>
      <div class="workflow-steps">
        ${workflow.steps.map(renderWorkflowStep).join("")}
      </div>
    </article>
  `;
}

function renderWorkflowStep(step) {
  const handoff = step.handoff ? renderHandoff(step.handoff) : "";
  const link = step.localUrl
    ? `<a href="${escapeAttribute(step.localUrl)}" target="_blank" rel="noreferrer">Открыть ${escapeHtml(step.owner)}</a>`
    : "";
  const transferButton = step.handoff
    ? `<button class="handoff-button" type="button" data-step-id="${escapeAttribute(step.id)}">Передать данные</button>`
    : "";

  return `
    <section class="workflow-step ${escapeAttribute(step.status)}">
      <div class="workflow-step-head">
        <span class="stage-badge">${escapeHtml(step.stage)}</span>
        <span class="owner-badge ${escapeAttribute(step.owner)}">${escapeHtml(step.owner)}</span>
        <span class="status-badge">${escapeHtml(step.status)}</span>
      </div>
      <h4>${escapeHtml(step.title)}</h4>
      <p>${escapeHtml(step.summary)}</p>
      ${handoff}
      ${
        link || transferButton
          ? `<div class="workflow-actions">${transferButton}${link}</div>`
          : ""
      }
      <div class="handoff-result" data-step-result="${escapeAttribute(step.id)}"></div>
    </section>
  `;
}

function bindWorkflowActions() {
  for (const button of elements.resultPanel.querySelectorAll(".handoff-button")) {
    button.addEventListener("click", async () => {
      await sendHandoff(button);
    });
  }
}

async function sendHandoff(button) {
  const stepId = button.dataset.stepId;
  const resultTarget = elements.resultPanel.querySelector(`[data-step-result="${cssEscape(stepId)}"]`);

  if (!state.currentResult || !stepId || !resultTarget) {
    return;
  }

  button.disabled = true;
  button.textContent = "Передаем...";
  resultTarget.textContent = "Формируем пакет передачи из предыдущих шагов...";
  resultTarget.className = "handoff-result pending";

  try {
    const response = await fetch(`${apiBaseUrl}/demo/handoff`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        stepId,
        need: state.currentResult.need,
        match: state.currentResult.matches?.[0],
        brief: state.currentResult.firstBrief,
        conversation: state.currentResult.firstConversationDraft
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? `API error ${response.status}`);
    }

    resultTarget.className = `handoff-result ${escapeAttribute(payload.handoff.status)}`;
    resultTarget.innerHTML = renderHandoffOutcome(payload.handoff);
  } catch (error) {
    resultTarget.className = "handoff-result failed";
    resultTarget.textContent = error instanceof Error ? error.message : "Ошибка передачи handoff";
  } finally {
    button.disabled = false;
    button.textContent = "Передать данные";
  }
}

function renderHandoffOutcome(handoff) {
  const missing = handoff.missingConfig?.length
    ? `<p>Для live-режима не хватает: ${escapeHtml(handoff.missingConfig.join(", "))}</p>`
    : "";

  return `
    <strong>${escapeHtml(handoff.status)} · ${escapeHtml(handoff.mode)}</strong>
    <p>${escapeHtml(handoff.message)}</p>
    <p>Источник: ${escapeHtml(handoff.source.needId)} -> ${escapeHtml(handoff.source.profileId)}</p>
    <p>Локальная запись: <code>${escapeHtml(handoff.localRecordPath)}</code></p>
    ${missing}
  `;
}

function renderHandoff(handoff) {
  return `
    <details class="handoff" open>
      <summary>${escapeHtml(handoff.target)}: ${escapeHtml(handoff.title)}</summary>
      <dl>
        ${handoff.fields
          .map(
            (field) => `
              <div>
                <dt>${escapeHtml(field.label)}</dt>
                <dd>${escapeHtml(field.value)}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </details>
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

function escapeAttribute(value) {
  return escapeHtml(value);
}

function cssEscape(value) {
  return String(value).replaceAll('"', '\\"');
}
