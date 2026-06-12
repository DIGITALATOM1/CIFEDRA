const apiBaseUrl = new URLSearchParams(window.location.search).get("api") ?? "http://localhost:3030";

const elements = {
  apiUrl: document.querySelector("#api-url"),
  integrationGrid: document.querySelector("#integration-grid")
};

elements.apiUrl.textContent = apiBaseUrl;

await loadIntegrations();

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
