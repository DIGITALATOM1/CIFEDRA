import type { DirectionDefinition } from "./domain.js";

export const directionDefinitions: DirectionDefinition[] = [
  {
    id: "life",
    title: "CIFEDRA Life",
    summary: "Люди для жизни, дома и локальной помощи.",
    categories: [
      {
        id: "life.home-help",
        title: "Помощь по дому",
        summary: "Уборка, мелкий ремонт, сборка мебели, установка техники."
      },
      {
        id: "life.local-tasks",
        title: "Поручения рядом",
        summary: "Забрать, отвезти, купить, встретить, помочь на месте."
      },
      {
        id: "life.move-transport",
        title: "Переезды и перевозки",
        summary: "Грузчики, транспорт, упаковка, вывоз вещей."
      },
      {
        id: "life.care",
        title: "Забота и уход",
        summary: "Няни, сиделки, сопровождение, выгул и передержка."
      },
      {
        id: "life.local-deals",
        title: "Локальные сделки",
        summary: "Купить, продать, арендовать, обменяться рядом."
      }
    ]
  },
  {
    id: "work",
    title: "CIFEDRA Work",
    summary: "Люди для работы, бизнеса, проектов и сделок.",
    categories: [
      {
        id: "work.expert-help",
        title: "Экспертная помощь",
        summary: "Консультация, ревью, диагностика, второе мнение."
      },
      {
        id: "work.task-execution",
        title: "Исполнение задач",
        summary: "Дизайн, разработка, аналитика, тексты, юридическая помощь."
      },
      {
        id: "work.business-deals",
        title: "Бизнес и сделки",
        summary: "Клиенты, партнеры, поставщики, подрядчики, инвесторы."
      },
      {
        id: "work.project-team",
        title: "Команда под проект",
        summary: "Собрать людей под MVP, запуск, мероприятие или исследование."
      },
      {
        id: "work.company-knowledge",
        title: "Люди внутри компании",
        summary: "Найти того, кто знает систему, процесс, клиента или решение."
      }
    ]
  },
  {
    id: "skills",
    title: "CIFEDRA Skills",
    summary: "Люди для обучения, развития и обмена опытом.",
    categories: [
      {
        id: "skills.mentors",
        title: "Менторы",
        summary: "Наставники по профессии, бизнесу, карьере и переходу в новую сферу."
      },
      {
        id: "skills.learning-help",
        title: "Обучение",
        summary: "Репетиторы, преподаватели, тренеры, индивидуальные занятия."
      },
      {
        id: "skills.career-help",
        title: "Карьера",
        summary: "Собеседования, резюме, портфолио, карьерная стратегия."
      },
      {
        id: "skills.practice-partners",
        title: "Практика",
        summary: "Разговорная практика, mock interview, разбор кейсов."
      },
      {
        id: "skills.skill-exchange",
        title: "Обмен навыками",
        summary: "Взаимное обучение и практика без денежной сделки."
      }
    ]
  }
];

export function getAllCategoryIds(): string[] {
  return directionDefinitions.flatMap((direction) =>
    direction.categories.map((category) => category.id)
  );
}

export function isKnownCategory(categoryId: string): boolean {
  return getAllCategoryIds().includes(categoryId);
}
