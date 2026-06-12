# CIFEDRA CONNECT: системный blueprint

Дата: 2026-06-12
Статус: initial design + implementation scaffold v0.1

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
| `CIFEDRA Core` | Начали реализацию | Самописный TypeScript-пакет `packages/core`. |
| `API Prototype` | Начали реализацию | Минимальный Node.js API `apps/api` поверх core. |
| `Mobile App` | Следующий этап | React Native + Expo. |
| `Core Data` | Следующий этап | PostgreSQL/Supabase, после утверждения модели данных. |
| `Backoffice` | Следующий этап | Baserow OSE для ручного пилота и операционных таблиц. |
| `Support / Concierge` | Следующий этап | Chatwoot CE для поддержки и concierge-сценариев. |
| `Landing` | Есть начальная версия | `web/landing`. |

## Текущая реализация

```text
packages/core
  src/domain.ts      - доменные типы
  src/catalog.ts     - направления и категории
  src/need.ts        - создание и валидация задачи
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
| `POST` | `/demo/match` | Создать демо-задачу, подобрать людей и собрать first brief. |

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

1. Подготовить SRS `CIFEDRA Core Domain Model`.
2. Уточнить сущности и статусы: `Need`, `Profile`, `Match`, `Shortlist`, `Conversation`, `Result`, `TrustSignal`.
3. Добавить persistent storage: PostgreSQL/Supabase migrations.
4. Добавить нормальный API-слой с OpenAPI-спецификацией.
5. Начать `apps/mobile` на React Native + Expo.
6. Спроектировать Baserow pilot tables для ручного подбора.
7. Спроектировать Chatwoot concierge flow отдельно от будущего direct product chat.
