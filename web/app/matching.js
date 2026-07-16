const columns = [
  {
    id: "intake",
    title: "Ally Request",
    kicker: "Запрос",
    action: "Уточнить"
  },
  {
    id: "clarification",
    title: "Clarification",
    kicker: "Вопросы",
    action: "Ответить"
  },
  {
    id: "matching",
    title: "AI Matching",
    kicker: "Подбор",
    action: "Смотреть"
  },
  {
    id: "proposed",
    title: "Proposed Allies",
    kicker: "Кандидаты",
    action: "Выбрать"
  },
  {
    id: "contact",
    title: "Contact Request",
    kicker: "Запрос контакта",
    action: "Подготовить"
  },
  {
    id: "intro",
    title: "Intro",
    kicker: "Первый контакт",
    action: "Отправить"
  }
];

const initialCards = [
  {
    id: "work-srs-review",
    column: "proposed",
    direction: "work",
    signal: "exact",
    title: "Ревью SRS перед разработкой",
    text: "Найти союзника для quick review требований, рисков и acceptance criteria.",
    ally: "Дмитрий",
    role: "Системный аналитик",
    score: 91,
    tags: ["Work", "online", "ru/en"],
    details: {
      taskFit: "SRS / API requirements / acceptance criteria",
      contextFit: "Разработка продукта, HLD, интеграции",
      risk: "Нужно ограничить объем до 25 страниц",
      next: "Запросить контакт и подготовить intro"
    }
  },
  {
    id: "life-yard-care",
    column: "matching",
    direction: "life",
    signal: "risk",
    title: "Уход за территорией около дома",
    text: "Стрижка газона и чистка бассейна в один визит, точный адрес скрыт.",
    ally: "Анна",
    role: "Локальная помощь",
    score: 84,
    tags: ["Life", "offline", "trust"],
    details: {
      taskFit: "Газон + бассейн",
      contextFit: "Северный район, локальная доступность",
      risk: "Нужно подтвердить оборудование и доступ",
      next: "Проверить критерии и предложить союзников"
    }
  },
  {
    id: "skills-interview",
    column: "contact",
    direction: "skills",
    signal: "exact",
    title: "Подготовка к интервью",
    text: "Mock interview, feedback по ответам и план подготовки.",
    ally: "Мария",
    role: "Career mentor",
    score: 88,
    tags: ["Skills", "online", "career"],
    details: {
      taskFit: "Mock interview + feedback",
      contextFit: "Target role and behavioral answers",
      risk: "Нужно уточнить целевую вакансию",
      next: "Сформировать безопасное первое сообщение"
    }
  },
  {
    id: "work-architecture-help",
    column: "clarification",
    direction: "work",
    signal: "saved",
    title: "Нужен союзник по архитектуре",
    text: "Разобрать интеграции, риски и границу MVP.",
    ally: "Пока не выбран",
    role: "Solution architect",
    score: 0,
    tags: ["Work", "HLD", "saved"],
    details: {
      taskFit: "Архитектура и интеграции",
      contextFit: "Нужен контекст системы",
      risk: "Не хватает входных данных",
      next: "Ответить на уточняющие вопросы"
    }
  },
  {
    id: "life-local-errand",
    column: "intake",
    direction: "life",
    signal: "saved",
    title: "Поручение рядом",
    text: "Забрать и отвезти вещи в пределах района.",
    ally: "Пока не выбран",
    role: "Local helper",
    score: 0,
    tags: ["Life", "local", "draft"],
    details: {
      taskFit: "Поручение рядом",
      contextFit: "Нужно указать район и окно времени",
      risk: "Без деталей нельзя оценить trust fit",
      next: "Заполнить запрос на союзника"
    }
  },
  {
    id: "skills-english-practice",
    column: "intro",
    direction: "skills",
    signal: "exact",
    title: "Практика английского для интервью",
    text: "Нужен practice partner для разговорной части.",
    ally: "Никита",
    role: "Practice partner",
    score: 82,
    tags: ["Skills", "practice", "en"],
    details: {
      taskFit: "Разговорная практика",
      contextFit: "Interview English",
      risk: "Нужно согласовать расписание",
      next: "Отправить intro и зафиксировать договоренность"
    }
  }
];

let cards = [...initialCards];
let selectedCardId = "work-srs-review";
let activeFilter = "all";

const elements = {
  board: document.querySelector("#matching-board"),
  inspectorTitle: document.querySelector("#inspector-title"),
  inspectorCopy: document.querySelector("#inspector-copy"),
  inspectorGrid: document.querySelector("#inspector-grid"),
  filters: [...document.querySelectorAll(".segment")],
  openCount: document.querySelector("#open-count"),
  allyCount: document.querySelector("#ally-count"),
  actionCount: document.querySelector("#action-count")
};

render();

for (const filter of elements.filters) {
  filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filter;
    selectedCardId = filteredCards()[0]?.id ?? selectedCardId;
    render();
  });
}

function render() {
  for (const filter of elements.filters) {
    filter.classList.toggle("active", filter.dataset.filter === activeFilter);
  }

  renderSummary();
  renderBoard();
  renderInspector();
}

function renderSummary() {
  const visible = filteredCards();
  const needsAction = visible.filter((card) =>
    ["intake", "clarification", "contact"].includes(card.column)
  ).length;

  elements.openCount.textContent = String(visible.length);
  elements.allyCount.textContent = String(
    visible.reduce((count, card) => count + (card.score > 0 ? 1 : 0), 0)
  );
  elements.actionCount.textContent = String(needsAction);
}

function renderBoard() {
  const visible = filteredCards();

  elements.board.innerHTML = columns.map((column) => {
    const columnCards = visible.filter((card) => card.column === column.id);

    return `
      <section class="kanban-column" aria-labelledby="${column.id}-title">
        <div class="column-header">
          <span class="column-kicker">${escapeHtml(column.kicker)}</span>
          <h2 id="${column.id}-title">${escapeHtml(column.title)}</h2>
          <span class="column-count">${columnCards.length}</span>
        </div>
        ${columnCards.map((card) => renderCard(card, column)).join("")}
      </section>
    `;
  }).join("");

  for (const cardNode of elements.board.querySelectorAll(".kanban-card")) {
    cardNode.addEventListener("click", () => {
      selectedCardId = cardNode.dataset.cardId;
      renderBoard();
      renderInspector();
    });
    cardNode.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      selectedCardId = cardNode.dataset.cardId;
      renderBoard();
      renderInspector();
    });
  }

  for (const action of elements.board.querySelectorAll("[data-move]")) {
    action.addEventListener("click", (event) => {
      event.stopPropagation();
      moveCard(action.dataset.move);
    });
  }

  for (const action of elements.board.querySelectorAll("[data-save]")) {
    action.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSaved(action.dataset.save);
    });
  }
}

function renderCard(card, column) {
  const score = card.score > 0 ? `<span class="score">${card.score}%</span>` : "";
  const selected = card.id === selectedCardId ? "selected" : "";
  const saved = card.saved ? "saved-action" : "";
  const savedLabel = card.saved ? "Сохранено" : "Сохранить";

  return `
    <article class="kanban-card ${selected}" tabindex="0" data-card-id="${escapeHtml(card.id)}">
      <span class="card-meta">${escapeHtml(card.direction)} · ${escapeHtml(card.signal)}</span>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.text)}</p>
      <div class="score-row">
        <div>
          <strong>${escapeHtml(card.ally)}</strong>
          <p>${escapeHtml(card.role)}</p>
        </div>
        ${score}
      </div>
      <div class="card-tags">
        ${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button type="button" data-move="${escapeHtml(card.id)}">${escapeHtml(column.action)}</button>
        <button class="secondary ${saved}" type="button" data-save="${escapeHtml(card.id)}">${savedLabel}</button>
      </div>
    </article>
  `;
}

function renderInspector() {
  const card = cards.find((item) => item.id === selectedCardId) ?? filteredCards()[0];

  if (!card) {
    elements.inspectorTitle.textContent = "Нет карточек";
    elements.inspectorCopy.textContent = "Для выбранного фильтра нет запросов.";
    elements.inspectorGrid.innerHTML = "";
    return;
  }

  elements.inspectorTitle.textContent = card.title;
  elements.inspectorCopy.textContent =
    `${card.ally}: ${card.role}. Следующий шаг: ${card.details.next}.`;
  elements.inspectorGrid.innerHTML = [
    ["Task fit", card.details.taskFit],
    ["Context fit", card.details.contextFit],
    ["Risk", card.details.risk],
    ["Next", card.details.next]
  ].map(([label, value]) => `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function moveCard(cardId) {
  cards = cards.map((card) => {
    if (card.id !== cardId) {
      return card;
    }

    const currentIndex = columns.findIndex((column) => column.id === card.column);
    const nextColumn = columns[Math.min(currentIndex + 1, columns.length - 1)];

    return {
      ...card,
      column: nextColumn.id
    };
  });
  selectedCardId = cardId;
  render();
}

function toggleSaved(cardId) {
  cards = cards.map((card) => {
    if (card.id !== cardId) {
      return card;
    }

    return {
      ...card,
      saved: !card.saved
    };
  });
  selectedCardId = cardId;
  render();
}

function filteredCards() {
  return activeFilter === "all"
    ? cards
    : cards.filter((card) => card.direction === activeFilter);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
