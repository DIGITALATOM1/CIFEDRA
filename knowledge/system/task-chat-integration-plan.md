# CIFEDRA CONNECT: задачи и чат в локальном прототипе

Дата: 2026-06-12
Статус: integration plan v0.1

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
npm run integrations:plane:install
npm run integrations:plane:start
```

`integrations:install` готовит рабочие каталоги в `.local/integrations/`:

- `.local/integrations/plane-selfhost/setup.sh` - официальный установщик Plane CE.
- `.local/integrations/chatwoot/.env` - локальная конфигурация Chatwoot.
- `.local/integrations/chatwoot/docker-compose.yaml` - compose-файл Chatwoot.

## Текущий локальный статус

1. Docker Desktop установлен и Docker Engine отвечает локально.
2. Plane CE поднят на `http://localhost:8082`.
3. Chatwoot CE поднят на `http://localhost:8083`.
4. CIFEDRA API отдает каталог решений через `GET /integrations`.
5. Test Console показывает карточки Plane CE и Chatwoot CE.

## Следующие задачи

1. Создать первый Chatwoot inbox `CIFEDRA Concierge`.
2. Создать первый Plane workspace/project для направлений `Life`, `Work`, `Skills`.
3. Добавить в CIFEDRA API адаптеры:
   - `POST /integrations/tasks`
   - `POST /integrations/chat/conversations`
   - `GET /integrations/status`
4. Связать результат matching с действием:
   - `request_contact` -> conversation in Chatwoot;
   - `manual_review` / `planned_execution` -> task in Plane.

## Лицензионные замечания

Chatwoot CE заявлен как MIT, что удобно для модификаций и производных решений.

Plane CE использует AGPL-3.0. Для локального прототипа это приемлемо, но перед внешней публикацией, SaaS-моделью или распространением модификаций нужен отдельный юридический review.
