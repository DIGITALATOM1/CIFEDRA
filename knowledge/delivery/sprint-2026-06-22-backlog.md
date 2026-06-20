# CIFEDRA Sprint Backlog: 2026-06-22 - 2026-07-03

Дата: 2026-06-20
Статус: active baseline v0.1
Команда: владелец продукта + Codex

## Sprint goal

Создать безопасную локальную основу `Work / SRS Review`, реализовать первый
Core P0 increment и получить первые product evidence без использования
реальных confidential SRS.

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
| D1-02 | 1 | Подтвердить primary segment, language/geography and offer. | Владелец продукта | D1-01 | Решения внесены в decision log. | blocked |
| D1-03 | 1 | Создать decision log and risk register. | Codex | D1-01 | Owners and review dates указаны. | done |
| D1-04 | 1 | Подготовить interview kit and five target slots. | Codex | D1-01 | Client/expert scripts and notes template готовы. | done |
| D1-05 | 1 | Назначить 3 client and 2 expert interviews. | Владелец продукта | D1-04 | В tracker указаны participants and confirmed times. | blocked |
| D2-01 | 2 | Подготовить SRS Core P0 v0.1. | Codex | D1-02 | Actors, requirements, invariants, errors and acceptance описаны. | planned |
| D2-02 | 2 | Утвердить Work intake fields and readiness. | Владелец продукта | D2-01 | Нет блокирующих domain TBD. | planned |
| D2-03 | 2 | Создать traceability CJM -> requirement -> module -> test. | Codex | D2-01 | Каждое P0 requirement имеет target module and test. | planned |
| D3-01 | 3 | Запретить privileged roles in self-registration. | Codex | D2-02 | Negative tests operator/admin проходят. | planned |
| D3-02 | 3 | Защитить state-changing demo endpoints. | Codex | D3-01 | Anonymous/insufficient role получает 401/403. | planned |
| D3-03 | 3 | Ограничить bind, CORS and live integrations. | Codex | D3-01 | Loopback/allowlist/explicit opt-in проверены. | planned |
| D4-01 | 4 | Убрать persistent bearer token из browser. | Codex | D3-02 | Token отсутствует в localStorage. | planned |
| D4-02 | 4 | Добавить limits, timeout and safe error handling. | Codex | D3-02 | Invalid/oversized/timeout tests проходят. | planned |
| D4-03 | 4 | Добавить GitHub CI baseline. | Codex | D3-03 | Clean install, typecheck, tests, build and docs checks проходят. | planned |
| D5-01 | 5 | Реализовать IdentityRef and profiles. | Codex | D2-02, D3-01 | Ownership and lifecycle покрыты tests. | planned |
| D6-01 | 6 | Реализовать versioned Work NeedSchema. | Codex | D5-01 | Completeness and invalid input tests проходят. | planned |
| D6-02 | 6 | Заблокировать matching для incomplete Need. | Codex | D6-01 | Core возвращает ожидаемую domain error. | planned |
| D7-01 | 7 | Реализовать Clarification lifecycle. | Codex | D6-01 | Questions, answers, readiness and transitions tested. | planned |
| D8-01 | 8 | Поднять tracked PostgreSQL compose. | Codex | D6-01 | Clean start and healthcheck воспроизводимы. | planned |
| D8-02 | 8 | Создать migration/role/repository spike. | Codex | D8-01 | One aggregate persists across restart; runtime role has no DDL. | planned |
| D9-01 | 9 | Собрать synthetic vertical flow. | Codex | D5-01, D6-02, D7-01 | Identity -> ready-for-match проходит локально и в CI. | planned |
| D9-02 | 9 | Синтезировать interview evidence and metrics. | Codex | D1-05 | Findings отделены от мнений и решений. | planned |
| D10-01 | 10 | Провести evidence review R0. | Оба | Все must items | Checks green, decisions and next backlog approved. | planned |
| D10-02 | 10 | Обновить SRS/HLD/ADR/backlog по evidence. | Codex | D10-01 | Changed contracts and decisions traceable. | planned |

## User action queue

1. Подтвердить либо изменить provisional `Quick Review`.
2. Выбрать primary client segment.
3. Подтвердить язык и географию discovery.
4. Передать список минимум из 3 потенциальных клиентов и 2 экспертов.
5. Указать доступные интервалы для интервью.

До выполнения пунктов 1-3 Codex использует baseline из
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
