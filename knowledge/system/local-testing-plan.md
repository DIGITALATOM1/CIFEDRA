# CIFEDRA CONNECT: локальное тестирование

Дата: 2026-06-12
Статус: local testing plan v0.1

## Решение

До завершения локального тестирования по направлениям `Life`, `Work`, `Skills` не размещаем систему на стороннем сервере и не готовим публикацию в App Store / Google Play.

Локальный контур нужен для проверки:

- доменной логики `Need -> Match -> Prepare -> Connect -> Result`;
- API-прототипа;
- лендинга;
- локального Docker runtime для open source модулей;
- интеграций с задачами и чатом;
- сценариев по каждому направлению;
- будущих требований к мобильному приложению, backoffice и concierge.

## Локальные сервисы

| Сервис | URL | Назначение |
| --- | --- | --- |
| API | `http://localhost:3030` | Прототип backend API. |
| Landing | `http://localhost:4177/web/landing/` | Веб-лендинг с QR-кодами приложений. |
| Test Console | `http://localhost:4177/web/test-console/` | Ручная проверка сценариев `Life`, `Work`, `Skills`. |
| Integration Diagnostics | `http://localhost:4177/web/test-console/diagnostics.html` | Техническая проверка локальных модулей Plane/Chatwoot. |
| Plane CE | `http://localhost:8082` | Open source модуль задач и исполнения. |
| Chatwoot CE | `http://localhost:8083` | Open source модуль чата и concierge. |

## Команды

```bash
npm install
npm run local:start
npm run local:smoke
npm run local:stop
```

Интеграции:

```bash
npm run docker:install
npm run integrations:check
npm run integrations:install
npm run integrations:chatwoot:start
npm run integrations:plane:install
npm run integrations:plane:start
```

Дополнительные проверки:

```bash
npm run typecheck
npm test
npm run build
```

## Smoke-тесты

`npm run local:smoke` проверяет:

| Направление | Сценарий | Ожидаемый профиль |
| --- | --- | --- |
| `Life` | Забрать заказ рядом | `profile_life_anna` |
| `Work` | Ревью SRS | `profile_work_dmitry` |
| `Skills` | Подготовка к интервью | `profile_skills_maria` |

## Ручное тестирование

Для ручной проверки открыть:

```text
http://localhost:4177/web/test-console/
```

В консоли можно выбрать сценарий, изменить параметры задачи, запустить matching и проверить:

- выбранный профиль;
- score;
- recommended action;
- причины релевантности;
- риски;
- brief для контакта;
- workflow-привязку к Plane task draft и Chatwoot conversation draft.

## Логи и процессы

Локальные процессы пишут PID и логи в `.local/`:

```text
.local/pids.json
.local/logs/api.log
.local/logs/web.log
```

Папка `.local/` не коммитится в Git.

## Правило перехода к внешней публикации

К стороннему серверу, сборке мобильных приложений и публикации в магазинах переходим только после того, как локально будут приняты:

1. `Life` MVP flow.
2. `Work` MVP flow.
3. `Skills` MVP flow.
4. Общая доменная модель.
5. API-контракты.
6. Минимальный mobile UX.
7. Решение по backoffice и support/concierge.
8. Локальная проверка Plane CE и Chatwoot CE как сменяемых модулей.
