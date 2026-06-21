# CIFEDRA CONNECT: задачи и чат в локальном прототипе

Дата: 2026-06-12
Статус: integration plan v0.1

Связанный продуктовый таймбокс: [рабочая сессия по направлению Chat](../support/chat-direction-session-2026-06-13.md).

## Архитектурное решение

`CIFEDRA Core` остается самописным ядром продукта: направления, потребности, matching,
brief, результат контакта и качество подбора.

Задачи и чат подключаем как внешние сменяемые open source модули:

| Направление функции | Решение | Лицензия | Локальный URL | Роль |
| --- | --- | --- | --- | --- |
| Tasks / execution | Plane CE | AGPL-3.0 | `http://localhost:8082` | Проекты, задачи, очереди, трекинг исполнения. |
| Chat / concierge | Chatwoot CE | MIT | `http://localhost:8083` | Диалоги, inbox, операторская коммуникация. |

## Почему так

- CIFEDRA не должна превращаться в копию таск-трекера или helpdesk.
- В ядре держим уникальную доменную ценность: `Need -> Match -> Prepare -> Connect -> Result`.
- Внешние решения можно модифицировать и заменить, если лицензия, UX или API перестанут подходить.
- Локальный Docker-контур нужен до внешнего сервера, чтобы проверить реальные интеграции без преждевременного DevOps-усложнения.

## Граница ответственности

| CIFEDRA Core | Plane CE | Chatwoot CE |
| --- | --- | --- |
| Принимает потребность. | Хранит задачу исполнения. | Хранит диалог и операторский workflow. |
| Подбирает помощника/эксперта. | Ведет статус, приоритет, исполнителя. | Ведет сообщения и inbox. |
| Формирует brief контакта. | Показывает очередь работ. | Поддерживает коммуникацию. |
| Фиксирует результат и качество. | Возвращает task status. | Возвращает conversation outcome. |

## Локальные команды

```bash
npm run docker:install
npm run integrations:check
npm run integrations:install
npm run integrations:chatwoot:start
npm run integrations:chatwoot:bootstrap
npm run integrations:plane:install
npm run integrations:plane:start
```

`integrations:install` готовит рабочие каталоги в `.local/integrations/`:

- `.local/integrations/plane-selfhost/setup.sh` - официальный установщик Plane CE.
- `.local/integrations/chatwoot/.env` - локальная конфигурация Chatwoot.
- `.local/integrations/chatwoot/docker-compose.yaml` - compose-файл Chatwoot.
- `.local/integrations/chatwoot/cifedra.env` - live-настройки adapter-слоя CIFEDRA для Chatwoot.
- `.local/integrations/chatwoot/bootstrap.json` - локальные учетные данные администратора Chatwoot.

## Текущий локальный статус

1. Docker Desktop установлен и Docker Engine отвечает локально.
2. Plane CE поднят на `http://localhost:8082`.
3. Chatwoot CE поднят на `http://localhost:8083`.
4. CIFEDRA API отдает каталог решений через `GET /integrations`.
5. `POST /demo/match` возвращает `integrationWorkflow`: привязку шагов `Need -> Match -> Prepare -> Connect -> Result` к Plane task draft и Chatwoot conversation draft.
6. Test Console после matching показывает цепочку внутренних шагов с handoff-payload.
7. Карточки Plane CE и Chatwoot CE вынесены на dev-страницу `http://localhost:4177/web/test-console/diagnostics.html`.
8. `POST /demo/handoff` принимает результат предыдущих шагов и сохраняет локальный transfer package в `.local/handoffs/`.
9. `GET /integrations/status` показывает, какие env-переменные нужны для live-создания записей.
10. `Conversation` теперь создается в `CIFEDRA Core` как draft и может передаваться в Chatwoot adapter как product-owned контекст.
11. `POST /demo/result` закрывает demo conversation и возвращает result/quality signal в `CIFEDRA Core`.
12. `integrations:chatwoot:bootstrap` автоматически создает Chatwoot account, admin user, API inbox, contact и API token, а также закрывает Chatwoot installation onboarding.
13. `local:start` автоматически подхватывает `.local/integrations/chatwoot/cifedra.env`; bootstrap заполняет adapter configuration, но оставляет внешние записи выключенными.
14. `CIFEDRA Auth` добавляет actor в handoff: Chatwoot получает `cifedra_actor_*` custom attributes, Plane получает actor в описание задачи.

## Pre-adapter в сценарии

Текущая реализация по умолчанию не создает реальные записи в Plane/Chatwoot автоматически. Она проверяет продуктовую механику привязки и сохраняет пакет передачи:

| Шаг CIFEDRA | Владелец | Что происходит |
| --- | --- | --- |
| `Need` | CIFEDRA Core | Фиксируем потребность, направление, категорию, ожидаемый результат. |
| `Match` | CIFEDRA Core | Выбираем кандидата и recommended action. |
| `Prepare` | CIFEDRA Core | Формируем brief для контакта. |
| `Conversation draft` | CIFEDRA Core | Создаем product-owned conversation state и first message для канала связи. |
| `Execute` | Plane CE | Готовим draft задачи: title, priority, assignee hint, description, labels. |
| `Connect` | Chatwoot CE | Готовим draft диалога: inbox, contact, goal, context, first message, risks. |
| `Result` | CIFEDRA Core | Фиксируем outcome, next step, quality score и match quality signal. |

## Live-режим

Чтобы adapter начал создавать реальные записи, нужно явно включить live-режим:

```bash
CIFEDRA_INTEGRATIONS_LIVE=1
CIFEDRA_ALLOW_EXTERNAL_WRITES=1
```

Оба флага обязательны. Один `CIFEDRA_INTEGRATIONS_LIVE=1` показывает намерение
включить live-режим, но не разрешает внешние записи.

Plane:

- `CIFEDRA_PLANE_API_KEY`
- `CIFEDRA_PLANE_WORKSPACE_SLUG`
- `CIFEDRA_PLANE_PROJECT_ID`

Chatwoot:

- `CIFEDRA_CHATWOOT_API_TOKEN`
- `CIFEDRA_CHATWOOT_ACCOUNT_ID`
- `CIFEDRA_CHATWOOT_INBOX_ID`
- `CIFEDRA_CHATWOOT_CONTACT_ID`

Для локального Chatwoot эти значения заполняются автоматически:

```bash
npm run integrations:chatwoot:bootstrap
npm run local:restart
```

Bootstrap записывает оба флага со значением `0` в локальный файл
`.local/integrations/chatwoot/cifedra.env`. После проверки конфигурации владелец
локального окружения явно меняет оба значения на `1`. Plane остается в
draft-режиме, пока для него не заполнены собственные live-настройки.

## Следующие задачи

1. Протестировать создание реального Chatwoot conversation из `POST /demo/handoff`.
2. Создать первый Plane workspace/project для направлений `Life`, `Work`, `Skills`.
3. Заполнить env-переменные live-режима Plane.
4. Протестировать создание реального Plane work item.
5. Вернуть outcome из Plane/Chatwoot в `Result`.

## Лицензионные замечания

Chatwoot CE заявлен как MIT, что удобно для модификаций и производных решений.

Plane CE использует AGPL-3.0. Для локального прототипа это приемлемо, но перед внешней публикацией, SaaS-моделью или распространением модификаций нужен отдельный юридический review.
