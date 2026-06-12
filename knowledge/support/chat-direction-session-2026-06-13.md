# CIFEDRA CONNECT: рабочая сессия по направлению Chat

Дата: 2026-06-13
Статус: timebox plan v0.1
Таймбокс: 1 час
Направление: `Chat / Concierge / Communication`

## Цель часа

Зафиксировать роль чата в пользовательском сценарии `Need -> Match -> Prepare -> Connect -> Result` и отделить ранний concierge-чат через Chatwoot от будущего прямого product chat между пользователем и помощником.

## Решение на этот час

Этот час используем не для доработки UI и не для публикации мобильного приложения. Используем его для системной аналитики по chat-направлению, чтобы дальше корректно проектировать API, mobile flow и интеграцию Chatwoot.

Фокус:

```text
Prepare -> Connect -> Result
```

Именно здесь чат становится продуктовой функцией: пользователь уже выбрал релевантного человека или получил shortlist, система подготовила brief, дальше нужно безопасно довести коммуникацию до результата.

## Границы направления Chat

| Зона | Решение |
| --- | --- |
| Support chat | Пользователь пишет в поддержку по работе продукта. |
| Concierge chat | Оператор помогает уточнить задачу, выбрать помощника и довести до контакта. |
| Handoff chat | CIFEDRA передает в Chatwoot контекст задачи, кандидата, brief и первый текст сообщения. |
| Direct product chat | Будущий отдельный модуль прямого общения пользователя и помощника; не смешиваем с support/concierge без SRS. |
| Result capture | Итог коммуникации должен вернуться в CIFEDRA Core как `Result`, а не остаться только в Chatwoot. |

## Что должно выйти за час

1. Черновой SRS-outline `Chat / Concierge MVP`.
2. Список событий и данных, которые передаются из предыдущих шагов в чат.
3. Решение по состояниям conversation: draft, opened, assigned, waiting, resolved, failed.
4. Первые правила, когда создавать Chatwoot conversation.
5. Backlog задач для следующей реализации.

## Рабочий сценарий

| Шаг | Система | Что происходит |
| --- | --- | --- |
| `Need` | CIFEDRA Core | Пользователь формулирует задачу и ожидаемый результат. |
| `Match` | CIFEDRA Core | Система выбирает кандидата или shortlist. |
| `Prepare` | CIFEDRA Core | Система формирует цель разговора, контекст, вопросы и риски. |
| `Connect` | Chatwoot concierge | Создается conversation с подготовленным контекстом и первым сообщением. |
| `Operator action` | Chatwoot | Оператор уточняет, сопровождает или эскалирует коммуникацию. |
| `Result` | CIFEDRA Core | Итог возвращается в продукт: договорились, не подошел, нужен follow-up, нужен другой кандидат. |

## Данные, которые нужно передавать в чат

| Данные | Источник | Зачем нужны в чате |
| --- | --- | --- |
| `need.id` | `Need` | Связать conversation с задачей. |
| `need.direction` | `Need` | Понять сценарий: `Life`, `Work`, `Skills`. |
| `need.title` | `Need` | Короткая тема обращения. |
| `need.description` | `Need` | Контекст пользователя. |
| `need.expectedResult` | `Need` | Что считать успехом. |
| `match.profile.id` | `Match` | Связать чат с выбранным кандидатом. |
| `match.score` | `Match` | Показать уверенность подбора. |
| `match.reasons` | `Match` | Объяснить оператору, почему кандидат подходит. |
| `brief.context` | `Prepare` | Дать оператору готовый контекст. |
| `brief.questions` | `Prepare` | Подготовить вопросы для уточнения. |
| `brief.risks` | `Prepare` | Подсветить ограничения и риски. |

## Conversation states

| Состояние | Значение |
| --- | --- |
| `draft` | CIFEDRA подготовила handoff, но conversation еще не создана live. |
| `opened` | Conversation создана в Chatwoot. |
| `assigned` | Conversation назначена оператору/агенту. |
| `waiting_user` | Нужен ответ пользователя. |
| `waiting_operator` | Нужен ответ оператора. |
| `resolved` | Коммуникация завершена с понятным итогом. |
| `failed` | Не удалось создать или обработать conversation. |

## Когда создавать Chatwoot conversation

В MVP conversation создаем не сразу после создания задачи, а после подготовки контакта:

1. Пользователь запустил matching.
2. Система выбрала кандидата или shortlist.
3. Сформирован brief.
4. Пользователь нажал `Передать данные` или `Связаться через concierge`.
5. CIFEDRA API создает Chatwoot conversation или draft handoff.

Это защищает Chatwoot от мусорных обращений и сохраняет связь с результатом подбора.

## Backlog после часа

1. Создать SRS `Chat / Concierge MVP`.
2. Добавить в core тип `ConversationState`.
3. Добавить в API endpoint для получения conversation outcome.
4. Настроить live Chatwoot inbox `CIFEDRA Concierge`.
5. Создать тестовый contact и проверить live conversation.
6. Описать operator guide: как читать brief и как фиксировать outcome.
7. Подготовить mobile UX для действия `Связаться через concierge`.
8. Отдельно спроектировать direct product chat и не смешивать его с Chatwoot support.

## Критерий завершения часа

Час считается использованным продуктивно, если после него можно ответить на три вопроса:

1. Зачем CIFEDRA нужен чат на MVP?
2. Какие данные приходят в чат из предыдущих шагов?
3. Как результат чата возвращается в `Result` и влияет на качество matching?
