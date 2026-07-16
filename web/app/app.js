const boardSteps = [
  {
    id: "request",
    title: "Ally Request",
    copy: "Запрос сформулирован, критерии и ограничения понятны."
  },
  {
    id: "matching",
    title: "AI Matching",
    copy: "Подбор союзников и объяснение релевантности."
  },
  {
    id: "intro",
    title: "Intro",
    copy: "Безопасный первый контакт и подготовленное сообщение."
  },
  {
    id: "agreement",
    title: "Agreement",
    copy: "Условия, следующий шаг и ожидаемый результат."
  },
  {
    id: "active",
    title: "Active Alliance",
    copy: "Союз в работе, результат фиксируется."
  },
  {
    id: "completed",
    title: "Result",
    copy: "Подтвержденная помощь и референс."
  }
];

const scenarios = {
  work: {
    title: "Ревью SRS перед разработкой",
    status: "Proposed Allies",
    direction: "Work",
    description:
      "Нужен союзник, который быстро проверит требования, найдет пробелы, риски и вопросы до передачи в разработку.",
    format: "online",
    language: "ru",
    urgency: "this_week",
    criteria: [
      ["Task fit", "SRS / требования / acceptance criteria"],
      ["Context fit", "Разработка продукта и системный анализ"],
      ["Result", "Список замечаний, рисков и уточнений"]
    ],
    matches: [
      {
        name: "Дмитрий",
        role: "Системный аналитик",
        meta: "Quick Review · online · ru/en",
        score: 91,
        reasons: ["Похожий опыт в SRS и API requirements", "Может дать структурированный список gap", "Доступен на этой неделе"],
        risks: ["Нужно уточнить границу системы", "Нужно ограничить объем до 25 страниц"]
      },
      {
        name: "Алексей",
        role: "Архитектор решений",
        meta: "HLD / integrations · online",
        score: 83,
        reasons: ["Силен в интеграциях и NFR", "Подходит для архитектурного review"],
        risks: ["Может быть избыточен для quick review"]
      }
    ]
  },
  life: {
    title: "Уход за территорией около дома",
    status: "Matching",
    direction: "Life",
    description:
      "Нужен союзник для ухода за территорией: стрижка газона и чистка бассейна в один визит, без раскрытия точного адреса до принятия запроса.",
    format: "offline",
    language: "ru",
    urgency: "scheduled",
    criteria: [
      ["Task fit", "Газон + бассейн в один визит"],
      ["Location fit", "Северный район, без точного адреса"],
      ["Trust fit", "Проверенная личность и отзывы"]
    ],
    matches: [
      {
        name: "Анна",
        role: "Локальная помощь",
        meta: "уход за участком · 1.8 км",
        score: 84,
        reasons: ["Поддерживает оба типа работ", "Подходит по району", "Есть trust-сигналы"],
        risks: ["Нужно подтвердить оборудование", "Точный адрес скрыт до принятия"]
      },
      {
        name: "Илья",
        role: "Мастер участка",
        meta: "газон · бассейн по согласованию",
        score: 77,
        reasons: ["Подходит по географии", "Есть опыт газона"],
        risks: ["Бассейн требует уточнения"]
      }
    ]
  },
  skills: {
    title: "Подготовка к интервью",
    status: "Intro",
    direction: "Skills",
    description:
      "Нужен союзник для mock interview, обратной связи по ответам и плана подготовки к собеседованию.",
    format: "online",
    language: "ru",
    urgency: "this_week",
    criteria: [
      ["Task fit", "Mock interview + feedback"],
      ["Style fit", "Спокойная практика и конкретные правки"],
      ["Result", "План подготовки и список слабых мест"]
    ],
    matches: [
      {
        name: "Мария",
        role: "Career mentor",
        meta: "interview prep · online",
        score: 88,
        reasons: ["Проводит mock interview", "Работает с career stories", "Подходит по языку"],
        risks: ["Нужно указать целевую роль"]
      },
      {
        name: "Никита",
        role: "Senior interviewer",
        meta: "technical interview · online",
        score: 81,
        reasons: ["Хорош для технического блока", "Дает практические вопросы"],
        risks: ["Меньше фокуса на HR части"]
      }
    ]
  }
};

let currentDirection = "work";
let currentStepIndex = 2;

const elements = {
  activeCount: document.querySelector("#active-count"),
  directionTabs: [...document.querySelectorAll(".direction-tab")],
  requestList: document.querySelector("#request-list"),
  requestStatus: document.querySelector("#request-status"),
  requestDescription: document.querySelector("#request-description"),
  requestFormat: document.querySelector("#request-format"),
  requestLanguage: document.querySelector("#request-language"),
  requestUrgency: document.querySelector("#request-urgency"),
  criteriaGrid: document.querySelector("#criteria-grid"),
  matchList: document.querySelector("#match-list"),
  processSteps: document.querySelector("#process-steps"),
  nextStepTitle: document.querySelector("#next-step-title"),
  nextStepCopy: document.querySelector("#next-step-copy"),
  advanceButton: document.querySelector("#advance-button"),
  rematchButton: document.querySelector("#rematch-button"),
  kanbanBoard: document.querySelector("#kanban-board")
};

render();

for (const tab of elements.directionTabs) {
  tab.addEventListener("click", () => {
    currentDirection = tab.dataset.direction;
    currentStepIndex = currentDirection === "life" ? 1 : currentDirection === "skills" ? 2 : 2;
    render();
  });
}

elements.advanceButton.addEventListener("click", () => {
  currentStepIndex = Math.min(currentStepIndex + 1, boardSteps.length - 1);
  renderProcess();
  renderKanban();
});

elements.rematchButton.addEventListener("click", () => {
  currentStepIndex = 1;
  renderProcess();
  renderKanban();
});

function render() {
  const scenario = scenarios[currentDirection];

  for (const tab of elements.directionTabs) {
    tab.classList.toggle("active", tab.dataset.direction === currentDirection);
  }

  elements.requestStatus.textContent = scenario.status;
  elements.requestStatus.classList.toggle("active", currentStepIndex >= 2);
  elements.requestDescription.value = scenario.description;
  elements.requestFormat.value = scenario.format;
  elements.requestLanguage.value = scenario.language;
  elements.requestUrgency.value = scenario.urgency;

  renderRequestList();
  renderCriteria();
  renderMatches();
  renderProcess();
  renderKanban();
}

function renderRequestList() {
  elements.requestList.innerHTML = Object.entries(scenarios).map(([direction, scenario]) => `
    <button class="request-button ${direction === currentDirection ? "active" : ""}" type="button" data-request="${direction}">
      <strong>${escapeHtml(scenario.title)}</strong>
      <span>${escapeHtml(scenario.direction)} · ${escapeHtml(scenario.status)}</span>
    </button>
  `).join("");

  for (const button of elements.requestList.querySelectorAll(".request-button")) {
    button.addEventListener("click", () => {
      currentDirection = button.dataset.request;
      currentStepIndex = currentDirection === "life" ? 1 : 2;
      render();
    });
  }
}

function renderCriteria() {
  elements.criteriaGrid.innerHTML = scenarios[currentDirection].criteria.map(([label, value]) => `
    <article class="criteria-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function renderMatches() {
  elements.matchList.innerHTML = scenarios[currentDirection].matches.map((match, index) => `
    <article class="match-card">
      <div class="match-top">
        <div class="match-name">
          <span class="match-meta">Союзник ${index + 1}</span>
          <h3>${escapeHtml(match.name)}</h3>
          <p>${escapeHtml(match.role)} · ${escapeHtml(match.meta)}</p>
        </div>
        <div class="score">${match.score}%</div>
      </div>
      <ul class="match-reasons">
        ${match.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
      <ul class="match-risks">
        ${match.risks.map((risk) => `<li>Риск: ${escapeHtml(risk)}</li>`).join("")}
      </ul>
      <div class="match-actions">
        <button class="primary-button request-contact-button" type="button">Запросить контакт</button>
        <button class="ghost-button" type="button">Сохранить</button>
      </div>
    </article>
  `).join("");

  for (const button of elements.matchList.querySelectorAll(".request-contact-button")) {
    button.addEventListener("click", () => {
      currentStepIndex = Math.max(currentStepIndex, 2);
      renderProcess();
      renderKanban();
    });
  }
}

function renderProcess() {
  elements.processSteps.innerHTML = boardSteps.map((step, index) => `
    <article class="step-card ${index < currentStepIndex ? "done" : ""} ${index === currentStepIndex ? "current" : ""}">
      <div class="step-index">${index + 1}</div>
      <div>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.copy)}</p>
      </div>
    </article>
  `).join("");

  const next = boardSteps[Math.min(currentStepIndex + 1, boardSteps.length - 1)];
  elements.nextStepTitle.textContent = next.title;
  elements.nextStepCopy.textContent = next.copy;
  elements.advanceButton.textContent = currentStepIndex >= boardSteps.length - 1
    ? "Процесс завершен"
    : "Продвинуть процесс";
  elements.advanceButton.disabled = currentStepIndex >= boardSteps.length - 1;
  elements.activeCount.textContent = currentStepIndex >= 4 ? "3 / 5" : "2 / 5";
}

function renderKanban() {
  const scenario = scenarios[currentDirection];
  const columns = [
    ["Ally Requests", [scenario.title, "Открытый запрос: найти практика"]],
    ["Matching", currentStepIndex === 1 ? [scenario.title] : ["Уточнить критерии Life"]],
    ["Proposed Allies", currentStepIndex >= 2 ? scenario.matches.map((match) => match.name) : ["Ожидает AI Matching"]],
    ["Intro / Agreement", currentStepIndex >= 3 ? ["Intro подготовлен", "Условия согласуются"] : ["Нет активного intro"]],
    ["Active Alliances", currentStepIndex >= 4 ? [scenario.title] : ["2 активных союза"]]
  ];

  elements.kanbanBoard.innerHTML = columns.map(([title, items]) => `
    <article class="kanban-column">
      <span>${escapeHtml(title)}</span>
      <strong>${items.length}</strong>
      ${items.map((item) => `<div class="kanban-item">${escapeHtml(item)}</div>`).join("")}
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
