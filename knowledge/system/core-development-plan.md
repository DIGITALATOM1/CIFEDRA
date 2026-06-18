# CIFEDRA CONNECT: план доработки ядра

Дата: 2026-06-19
Статус: core work plan v0.6
Фокус чата: доработка `CIFEDRA Core`

## Назначение

Этот документ фиксирует дальнейший план работ для чата, который теперь используем как рабочее место по развитию ядра `CIFEDRA Core`.

Главная задача ядра: стабильно описывать и проверять общий сценарий продукта:

```text
Need -> Match -> Prepare -> Connect -> Result
```

`Life`, `Work`, `Skills` должны отличаться словарями, правилами, рисками и параметрами подбора, но не ломать общий жизненный цикл.

## Текущее состояние

Уже реализовано в `packages/core`:

| Модуль | Статус |
| --- | --- |
| `domain.ts` | Базовые типы `Need`, `Profile`, `MatchCandidate`, `ConversationBrief`, `ContactResult`. |
| `catalog.ts` | Справочник направлений и категорий. |
| `conversation.ts` | Product-owned conversation model и состояния коммуникации. |
| `decisions.ts` | Пользовательские решения по кандидатам и построение shortlist. |
| `need.ts` | Создание и валидация потребности. |
| `lifecycle.ts` | Допустимые переходы `NeedStatus` и helpers жизненного цикла. |
| `matching.ts` | Базовый скоринг профилей и объяснение релевантности. |
| `prepare.ts` | Подготовка brief для контакта. |
| `result.ts` | Фиксация результата контакта, next step, quality score и match quality signal. |
| `workflow.ts` | Связка core-сценария с Plane/Chatwoot handoff. |
| `fixtures.ts` | Демо-профили для локальных сценариев. |

Уже реализовано вокруг core:

- `apps/api` вызывает core и отдает demo endpoints.
- `web/test-console` проверяет сценарии локально.
- Plane/Chatwoot подключены через adapter-layer и draft handoff.
- Smoke-тесты проверяют `Life`, `Work`, `Skills`.

## Главные пробелы ядра

| Пробел | Почему важно |
| --- | --- |
| `Decision / Shortlist` не сохраняется. | Типы и функции есть, но нужны API хранения и mobile UI. |
| `Conversation` не получает внешние события. | Core хранит draft/state и связан с Result, но нужны persistence и event sync Chatwoot/Plane. |
| Lifecycle `Need` работает только в runtime. | Переходы оформлены, но еще не связаны с persistent storage и транзакциями. |
| `Result / quality loop` не влияет на scoring. | Quality signal создается, но пока не калибрует веса и правила matching. |
| Direction-specific rules требуют дальнейшей калибровки. | Первая версия реализована и покрыта тестами, но веса нужно уточнять на реальных результатах. |
| Нет API-contract-first слоя. | Mobile и будущий backend должны опираться на устойчивые DTO/контракты. |

## Ближайшая цель

Подготовить `CIFEDRA Core` к mobile MVP и реальному backend storage.

Критерий: ядро должно уметь не только подобрать профиль, но и провести минимальный жизненный цикл:

```text
Need created
  -> Matches ranked
  -> Candidate decisions recorded
  -> Shortlist built
  -> Brief prepared
  -> Conversation opened or drafted
  -> Result recorded
  -> Need status updated
```

## План работ

### Итерация 1. Core lifecycle

Цель: сделать жизненный цикл явным и тестируемым.

Задачи:

1. Описать статусы `NeedStatus` и допустимые переходы. Выполнено.
2. Добавить функции переходов: `markNeedMatched`, `markNeedConnected`, `markNeedResolved`. Выполнено.
3. Добавить тесты на допустимые и недопустимые переходы. Выполнено.
4. Обновить `workflow.ts`, чтобы статусы шагов брались из состояния core. Выполнено.

Ожидаемый результат: сценарий перестает быть только набором функций и становится управляемым lifecycle.

Текущий результат: `Need` проходит переходы `draft -> ready_for_match -> matched -> connected -> resolved`, invalid transitions запрещены, demo API после successful matching возвращает `need.status = matched`.

### Итерация 2. Decision / Shortlist

Цель: подготовить ядро к мобильным карточкам и свайпам.

Задачи:

1. Добавить типы `CandidateDecision`, `DecisionType`, `Shortlist`. Выполнено.
2. Поддержать действия: `viewed`, `saved`, `rejected`, `requested_contact`. Выполнено.
3. Добавить функцию построения shortlist из решений пользователя. Выполнено.
4. Добавить тесты по `Life`, `Work`, `Skills`. Выполнено.

Ожидаемый результат: mobile сможет показывать карточки, сохранять выбор и передавать выбранного кандидата в `Prepare`.

Текущий результат: `buildRecommendedDecisions` и `buildShortlist` дают первый контракт для mobile/cards flow, `/demo/match` возвращает `decisions` и `shortlist`.

### Итерация 3. Conversation core model

Цель: отделить продуктовую коммуникацию от Chatwoot как внешнего инструмента.

Задачи:

1. Добавить типы `Conversation`, `ConversationState`, `ConversationChannel`. Выполнено.
2. Поддержать состояния: `draft`, `opened`, `assigned`, `waiting_user`, `waiting_operator`, `resolved`, `failed`. Выполнено.
3. Связать conversation с `needId`, `profileId`, `decisionId`, `brief`, `externalRef`. Выполнено.
4. Добавить функцию создания conversation draft из brief. Выполнено.
5. Обновить Chatwoot handoff, чтобы он принимал данные, совместимые с core conversation. Выполнено.

Ожидаемый результат: Chatwoot становится сменяемым каналом, а не владельцем продуктового состояния.

Текущий результат: `/demo/match` возвращает `firstConversationDraft`, а `/demo/handoff` может передать conversation context в Chatwoot adapter.

### Итерация 4. Result and quality loop

Цель: результат контакта должен улучшать качество matching.

Задачи:

1. Расширить `ContactResult`: связать с `conversationId`, `matchScore`, `decisionId`. Выполнено.
2. Добавить outcome mapping: `agreed`, `not_relevant`, `no_response`, `needs_follow_up`, `needs_another_person`. Выполнено.
3. Добавить правила следующего шага после результата. Выполнено.
4. Подготовить первый quality signal для будущей аналитики. Выполнено.
5. Связать resolved conversation с `Need` lifecycle и `Result`. Выполнено.

Ожидаемый результат: core фиксирует не просто факт общения, а полезность подбора.

Текущий результат: `/demo/result` принимает conversation draft, закрывает conversation, записывает `ContactResult`, возвращает `MatchQualitySignal` и переводит `Need` в `resolved`.

### Итерация 5. Direction-specific rules

Цель: усилить различия `Life`, `Work`, `Skills` без разрыва общего ядра.

Задачи:

1. Вынести правила scoring по направлениям. Выполнено.
2. Для `Life` усилить географию, срочность, доверие. Выполнено.
3. Для `Work` усилить опыт, роль, SRS/проектный контекст. Выполнено.
4. Для `Skills` усилить уровень, цель развития, формат занятий. Выполнено.
5. Добавить fixtures и тесты для edge cases. Выполнено.

Ожидаемый результат: matching станет более объяснимым и ближе к продуктовой ценности.

Текущий результат:

- Добавлены типизированные `NeedMatchingContext` и `ProfileMatchingContext`.
- `Life` учитывает координаты/район, допустимый радиус, срочность и обязательную
  проверку личности.
- `Work` учитывает требуемую роль, проектный контекст, опыт, портфолио и
  корпоративное подтверждение.
- `Skills` учитывает текущий/целевой уровень, цели развития и формат занятий.
- Каждый кандидат возвращает `scoreBreakdown` по общим и direction-specific
  факторам.
- Обязательные, но неподтвержденные trust-факторы переводят кандидата в
  `review_manually`.
- Добавлены контрастные unit-тесты и smoke-проверка breakdown для трех
  направлений.

### Итерация 6. API contracts for mobile

Цель: подготовить backend/mobile к стабильной интеграции.

Задачи:

1. Описать DTO для `Need`, `Match`, `Decision`, `Shortlist`, `Brief`, `Conversation`, `Result`.
2. Подготовить OpenAPI-outline.
3. Синхронизировать endpoints `apps/api` с core-моделью.
4. Обновить smoke-тесты.

Ожидаемый результат: можно безопасно начинать `apps/mobile`.

## Следующий рабочий фокус

Начать Итерацию 6: `API contracts for mobile`.

Порядок:

1. Зафиксировать публичные DTO отдельно от внутренних domain-типов.
2. Описать request/response для `Need`, `Match`, `Decision`, `Shortlist`,
   `Brief`, `Conversation`, `Result`.
3. Подготовить OpenAPI-outline для текущих и целевых endpoints.
4. Добавить версионирование API и единый формат ошибок.
5. Синхронизировать `apps/api`, test console и smoke-тесты с DTO.
6. Прогнать `npm run typecheck`, `npm test`, `npm run build`,
   `npm run local:smoke`.

## Правило для этого чата

Этот чат используем для доработки ядра. Если во время работы появятся задачи по mobile, chat, Plane, Chatwoot или landing, фиксируем их в backlog, но не переключаемся, пока не завершена текущая core-итерация.
