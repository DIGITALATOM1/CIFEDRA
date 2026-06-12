import type { ConversationBrief, MatchCandidate, Need } from "./domain.js";

export function buildConversationBrief(need: Need, candidate: MatchCandidate): ConversationBrief {
  const profile = candidate.profile;

  return {
    needId: need.id,
    profileId: profile.id,
    goal: `Проверить, может ли ${profile.displayName} помочь с задачей: ${need.title}`,
    context: [
      `Направление: ${need.direction}`,
      `Категория: ${need.categoryId}`,
      `Ожидаемый результат: ${need.expectedResult}`,
      ...(need.context ? [`Контекст: ${need.context}`] : []),
      ...(need.constraints.length > 0 ? [`Ограничения: ${need.constraints.join("; ")}`] : [])
    ],
    questions: [
      "Можете подтвердить релевантный опыт по такой задаче?",
      "Какая информация нужна до старта?",
      "Какой результат вы можете подтвердить и в какие сроки?",
      "Какие риски или ограничения лучше обсудить заранее?"
    ],
    risks: candidate.explanation.risks,
    nextStep:
      candidate.recommendedAction === "request_contact"
        ? "Запросить контакт и отправить подготовленный контекст."
        : "Проверить вручную перед контактом."
  };
}
