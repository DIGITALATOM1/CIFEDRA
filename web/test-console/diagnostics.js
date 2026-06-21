const apiBaseUrl = new URLSearchParams(window.location.search).get("api") ?? "http://localhost:3030";

const elements = {
  apiUrl: document.querySelector("#api-url"),
  integrationGrid: document.querySelector("#integration-grid"),
  integrationStatus: document.querySelector("#integration-status"),
  authStatus: document.querySelector("#auth-status")
};

elements.apiUrl.textContent = apiBaseUrl;

await loadIntegrations();
await loadIntegrationStatus();
await loadAuthStatus();

async function loadIntegrations() {
  try {
    const response = await fetch(`${apiBaseUrl}/integrations`);

    if (!response.ok) {
      throw new Error(`Failed to load integrations: ${response.status}`);
    }

    const payload = await response.json();
    renderIntegrations(payload.integrations ?? [], payload.localRuntime);
  } catch (error) {
    elements.integrationGrid.innerHTML = `
      <div class="error-state">
        Не удалось загрузить список интеграций. Проверьте API и endpoint /integrations.
      </div>
    `;
  }
}

async function loadIntegrationStatus() {
  try {
    const response = await fetch(`${apiBaseUrl}/integrations/status`);

    if (!response.ok) {
      throw new Error(`Failed to load integration status: ${response.status}`);
    }

    const status = await response.json();
    renderIntegrationStatus(status);
  } catch (error) {
    elements.integrationStatus.innerHTML = `
      <div class="error-state">
        Не удалось загрузить статус adapter-слоя. Проверьте API и endpoint /integrations/status.
      </div>
    `;
  }
}

async function loadAuthStatus() {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/status`);

    if (!response.ok) {
      throw new Error(`Failed to load auth status: ${response.status}`);
    }

    const status = await response.json();
    renderAuthStatus(status);
  } catch (error) {
    elements.authStatus.innerHTML = `
      <div class="error-state">
        Не удалось загрузить auth-статус. Проверьте API и endpoint /auth/status.
      </div>
    `;
  }
}

function renderIntegrationStatus(status) {
  elements.integrationStatus.innerHTML = `
    <article class="integration-card">
      <div class="integration-head">
        <div>
          <span class="integration-kind">policy</span>
          <h3>External writes</h3>
        </div>
        <span class="license-pill">${status.liveEnabled ? "enabled" : "disabled"}</span>
      </div>
      <div class="meta">
        <span class="pill">Live requested: ${status.liveRequested ? "yes" : "no"}</span>
        <span class="pill">Writes allowed: ${status.externalWritesAllowed ? "yes" : "no"}</span>
      </div>
      <p>Внешние записи разрешены только при одновременном включении обоих флагов.</p>
    </article>
    <article class="integration-card">
      <div class="integration-head">
        <div>
          <span class="integration-kind">tasks</span>
          <h3>Plane handoff</h3>
        </div>
        <span class="license-pill">${escapeHtml(status.plane.mode)}</span>
      </div>
      <p>Base URL: ${escapeHtml(status.plane.baseUrl)}</p>
      ${renderMissingConfig(status.plane.missingConfig, status.plane.mode)}
    </article>
    <article class="integration-card">
      <div class="integration-head">
        <div>
          <span class="integration-kind">chat</span>
          <h3>Chatwoot handoff</h3>
        </div>
        <span class="license-pill">${escapeHtml(status.chatwoot.mode)}</span>
      </div>
      <p>Base URL: ${escapeHtml(status.chatwoot.baseUrl)}</p>
      ${renderMissingConfig(status.chatwoot.missingConfig, status.chatwoot.mode)}
    </article>
  `;
}

function renderAuthStatus(status) {
  elements.authStatus.innerHTML = `
    <article class="integration-card">
      <div class="integration-head">
        <div>
          <span class="integration-kind">auth</span>
          <h3>CIFEDRA Auth</h3>
        </div>
        <span class="license-pill">${escapeHtml(status.mode)}</span>
      </div>
      <p>Provider: ${escapeHtml(status.provider)}</p>
      <div class="meta">
        <span class="pill">Users: ${escapeHtml(status.userCount)}</span>
        <span class="pill">Active sessions: ${escapeHtml(status.activeSessionCount)}</span>
        <span class="pill">Store: ${escapeHtml(status.storePath)}</span>
      </div>
      <p>${escapeHtml(status.integrationPolicy)}</p>
    </article>
  `;
}

function renderMissingConfig(keys, mode) {
  if (!keys?.length) {
    return mode === "live"
      ? `<p>Live-конфигурация заполнена. Adapter будет создавать записи во внешнем модуле.</p>`
      : `<p>Live-конфигурация заполнена. Для реальной отправки нужны CIFEDRA_INTEGRATIONS_LIVE=1 и CIFEDRA_ALLOW_EXTERNAL_WRITES=1.</p>`;
  }

  return `
    <h4>Для live-режима нужно заполнить</h4>
    ${renderList(keys)}
  `;
}

function renderIntegrations(integrations, localRuntime) {
  elements.integrationGrid.innerHTML = "";

  if (integrations.length === 0) {
    elements.integrationGrid.innerHTML = `<div class="empty-state">Интеграции еще не настроены.</div>`;
    return;
  }

  for (const integration of integrations) {
    const card = document.createElement("article");
    const actions = document.createElement("div");
    const link = document.createElement("a");
    const runtime = document.createElement("span");

    card.className = "integration-card";
    actions.className = "integration-actions";
    link.href = integration.localUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Открыть локально";
    runtime.textContent = localRuntime?.required ?? "docker compose";
    actions.append(link, runtime);

    card.innerHTML = `
      <div class="integration-head">
        <div>
          <span class="integration-kind">${escapeHtml(integration.kind)}</span>
          <h3>${escapeHtml(integration.name)}</h3>
        </div>
        <span class="license-pill">${escapeHtml(integration.license)}</span>
      </div>
      <p>${escapeHtml(integration.decision)}</p>
      <div class="meta">
        <span class="pill">Runtime: ${escapeHtml(integration.runtime)}</span>
        <span class="pill">Local: ${escapeHtml(integration.localUrl)}</span>
      </div>
      <h4>Роль в CIFEDRA</h4>
      ${renderList(integration.integrationPattern)}
    `;
    card.querySelector(".meta").after(actions);
    elements.integrationGrid.append(card);
  }
}

function renderList(items, tagName = "ul") {
  const safeItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<${tagName}>${safeItems}</${tagName}>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
