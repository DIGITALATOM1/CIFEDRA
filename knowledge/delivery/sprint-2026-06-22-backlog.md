# CIFEDRA Sprint Backlog: 2026-06-22 - 2026-07-03

Дата: 2026-06-21
Дата обновления: 2026-06-26
Статус: completed after R0
Команда: владелец продукта + Codex

## Sprint goal

Создать безопасную локальную основу three synthetic scenarios `Life`, `Work`,
`Skills`, реализовать общий Core P0 increment and validate category schemas
without real users, services or confidential data.

## Status model

- `done`: acceptance criteria подтверждены;
- `in_progress`: работа начата;
- `ready`: зависимости закрыты;
- `blocked`: требуется решение или внешнее действие;
- `planned`: работа ожидает зависимостей.

## Backlog

| ID | День | Задача | Owner | Зависит от | Acceptance | Статус |
| --- | --- | --- | --- | --- | --- | --- |
| D1-01 | 1 | Зафиксировать product brief and provisional offer. | Codex | - | Brief связан с CJM и master plan. | done |
| D1-02 | 1 | Подтвердить target audience, language/geography and first expert. | Владелец продукта | D1-01 | Решения внесены в decision log. | done |
| D1-03 | 1 | Создать decision log and risk register. | Codex | D1-01 | Owners and review dates указаны. | done |
| D1-04 | 1 | Подготовить interview kit and five target slots. | Codex | D1-01 | Client/expert scripts and notes template готовы. | done |
| D1-05 | 1 | External interviews after local functional pilot. | Владелец продукта | D1-04 | Recruitment remains visible but does not block local R0. | deferred |
| D1-06 | 1 | Зафиксировать three local pilot scenarios and commercial baseline. | Оба | D1-01 | Life/Work/Skills, free pilot and provider-paid future model recorded. | done |
| D2-01 | 2 | Подготовить SRS Core P0 v0.1. | Codex | D1-02 | Actors, requirements, invariants, errors and acceptance описаны. | done |
| D2-02 | 2 | Утвердить Life/Work/Skills intake fields and readiness. | Владелец продукта | D2-01 | Нет блокирующих domain TBD для local UAT. | done |
| D2-03 | 2 | Создать traceability CJM -> requirement -> module -> test. | Codex | D2-01 | Каждое P0 requirement имеет target module and test. | done |
| D3-01 | 3 | Запретить privileged roles in self-registration. | Codex | D2-02 | Negative tests helper/operator/admin проходят. | done |
| D3-02 | 3 | Защитить state-changing demo endpoints. | Codex | D3-01 | Anonymous/insufficient role получает 401/403. | done |
| D3-03 | 3 | Ограничить bind, CORS and live integrations. | Codex | D3-01 | Loopback/allowlist/explicit opt-in проверены. | done |
| D4-01 | 4 | Убрать persistent bearer token из browser. | Codex | D3-02 | Token отсутствует в localStorage. | done |
| D4-02 | 4 | Добавить limits, timeout and safe error handling. | Codex | D3-02 | Invalid/oversized/timeout tests проходят. | done |
| D4-03 | 4 | Добавить GitHub CI baseline. | Codex | D3-03 | Clean install, typecheck, tests, build and docs checks проходят. | done |
| D5-01 | 5 | Реализовать IdentityRef and profiles with ru/en language metadata. | Codex | D2-02, D3-01 | Ownership, locale and spoken/preferred languages покрыты tests. | done |
| D6-01 | 6 | Реализовать versioned NeedSchema for Life/Work/Skills. | Codex | D2-02, D5-01 | Completeness and invalid input tests pass for all three. | done |
| D6-02 | 6 | Заблокировать matching для incomplete Need. | Codex | D6-01 | Core возвращает ожидаемую domain error. | done |
| D7-01 | 7 | Реализовать Clarification lifecycle. | Codex | D6-01 | Questions, answers, readiness and transitions tested. | done |
| D8-01 | 8 | Поднять tracked PostgreSQL compose. | Codex | D6-01 | Clean start and healthcheck воспроизводимы. | done |
| D8-02 | 8 | Создать migration/role/repository spike. | Codex | D8-01 | One aggregate persists across restart; runtime role has no DDL. | done |
| D9-01 | 9 | Собрать three synthetic vertical flows. | Codex | D5-01, D6-02, D7-01 | Life/Work/Skills reach ready-for-match locally and in CI. | done |
| D9-02 | 9 | Сформировать local UAT evidence and metrics. | Codex | D9-01 | Functional findings are separated from future market evidence. | done |
| D10-01 | 10 | Провести evidence review R0. | Оба | Все must items | Checks green, decisions and next backlog approved. | done |
| D10-02 | 10 | Обновить SRS/HLD/ADR/backlog по evidence. | Codex | D10-01 | Changed contracts and decisions traceable. | done |

## User action queue

1. Подтвердить Quick Review: 25 pages / 10,000 words and one business day.
2. Подтвердить combined Life rule: one Need only for one provider/visit.

До выполнения этих пунктов Codex использует recommended baseline из
[product brief](../product/work-srs-review-product-brief.md), но не считает его
финальным product decision.

## Daily control

Каждый рабочий день:

1. выбрать только items текущего дня;
2. подтвердить зависимости;
3. реализовать and test;
4. обновить status and evidence;
5. закоммитить законченный increment;
6. не переносить незавершенную задачу скрыто: отметить `blocked/planned`.

## Sprint exit

Sprint закрывается только после gate `R0` из
[two-week execution plan](../system/cifedra-two-week-execution-plan-2026-06-22.md).

R0 закрыт документом
[sprint-r0-evidence-review-2026-06-26.md](./sprint-r0-evidence-review-2026-06-26.md).
Следующий proposed backlog:
[sprint-2026-07-06-backlog.md](./sprint-2026-07-06-backlog.md).
