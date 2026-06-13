# CIFEDRA CONNECT: системный blueprint

Дата: 2026-06-13
Статус: initial design + implementation scaffold v0.3

## Назначение

Этот документ фиксирует первый проектный контур системы `CIFEDRA CONNECT` и связывает архитектурные решения с начальной реализацией в репозитории.

## Базовый сценарий

Все направления используют одно ядро:

```text
Need -> Match -> Prepare -> Connect -> Result
```

Разница между `Life`, `Work`, `Skills` находится не в общей механике, а в словаре, фильтрах, доверии, типе результата и рисках.

## Границы системы

| Слой | Статус | Решение |
| --- | --- | --- |
| `CIFEDRA Core` | Активное направление доработки | Самописный TypeScript-пакет `packages/core`; план: [core-development-plan.md](./core-development-plan.md). |
| `API Prototype` | Начали реализацию | Минимальный Node.js API `apps/api` поверх core. |
| `Mobile App` | Спроектирован путь сборки | React Native + Expo; подробный план: [mobile-build-plan.md](./mobile-build-plan.md). |
| `Core Data` | Следующий этап | PostgreSQL/Supabase, после утверждения модели данных. |
| `Backoffice` | Следующий этап | Baserow OSE для ручного пилота и операционных таблиц. |
| `Support / Concierge` | Следующий этап | Chatwoot CE для поддержки и concierge-сценариев. |
| `Landing` | Есть начальная версия | `web/landing`. |

## Текущая реализация

```text
packages/core
  src/domain.ts      - доменные типы
  src/catalog.ts     - направления и категории
  src/conversation.ts - модель conversation и состояния коммуникации
  src/decisions.ts   - решения по кандидатам и shortlist
  src/need.ts        - создание и валидация задачи
  src/lifecycle.ts   - переходы статусов Need
  src/matching.ts    - базовый скоринг и ранжирование профилей
  src/prepare.ts     - подготовка разговора
  src/result.ts      - фиксация результата контакта
  src/fixtures.ts    - демо-профили для Life / Work / Skills

apps/api
  src/server.ts      - минимальный HTTP API для проверки core-сценария
```

## API-прототип

| Метод | URL | Назначение |
| --- | --- | --- |
| `GET` | `/health` | Проверка доступности сервиса. |
| `GET` | `/directions` | Справочник направлений и категорий. |
| `GET` | `/demo/profiles` | Демо-профили для проверки matching. |
| `GET` | `/demo/scenarios` | Демо-сценарии `Life`, `Work`, `Skills` для smoke-тестов и test console. |
| `POST` | `/demo/match` | Создать демо-задачу, подобрать людей, вернуть decisions, shortlist, first brief, conversation draft и integration workflow для Plane/Chatwoot. |
| `POST` | `/demo/handoff` | Передать данные предыдущих шагов в adapter Plane/Chatwoot; в draft-режиме сохранить пакет в `.local/handoffs/`. |
| `POST` | `/demo/result` | Закрыть demo conversation, записать результат контакта, вернуть resolved need и match quality signal. |
| `GET` | `/integrations/status` | Проверить режим adapter-слоя и недостающую live-конфигурацию. |

Пример запроса:

```bash
curl -X POST http://localhost:3030/demo/match \
  -H "content-type: application/json" \
  -d '{
    "direction": "work",
    "categoryId": "work.expert-help",
    "title": "Нужно ревью SRS",
    "description": "Нужно проверить требования перед передачей в разработку.",
    "expectedResult": "Список замечаний и правок",
    "tags": ["srs", "requirements", "review"]
  }'
```

## Следующие проектные шаги

1. Доработать `CIFEDRA Core` по плану [core-development-plan.md](./core-development-plan.md).
2. Подготовить SRS `CIFEDRA Core Domain Model`.
3. Уточнить сущности и статусы: `Need`, `Profile`, `Match`, `Shortlist`, `Conversation`, `Result`, `TrustSignal`.
4. Добавить persistent storage: PostgreSQL/Supabase migrations.
5. Добавить нормальный API-слой с OpenAPI-спецификацией.
6. Подготовить SRS `Mobile MVP` и после него начать `apps/mobile` на React Native + Expo.
7. Спроектировать Baserow pilot tables для ручного подбора.
8. Спроектировать Chatwoot concierge flow отдельно от будущего direct product chat.
