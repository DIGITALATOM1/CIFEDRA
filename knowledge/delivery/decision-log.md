# CIFEDRA Decision Log

Дата создания: 2026-06-20
Статус: active

## Правило

Product and delivery decisions фиксируются здесь. Architecture decisions,
меняющие system boundaries or technology baseline, оформляются отдельным ADR.

| ID | Дата | Решение | Статус | Основание | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | 2026-06-20 | Первый provisional scenario: `Work / Expert Help / SRS Review`. | accepted | Ниже safety risk, проверяемый artifact, существующие CJM/Core fixtures. | Владелец продукта | Gate P1 |
| DEC-002 | 2026-06-20 | `Quick Review` используется как primary discovery baseline; `Full Review` остается альтернативой. | provisional | Узкий результат проще проверить за две недели. | Владелец продукта | 2026-06-26 |
| DEC-003 | 2026-06-20 | До D0 используются только synthetic/redacted examples. | accepted | Нет legal/privacy readiness для confidential documents. | Владелец продукта | Gate D0 |
| DEC-004 | 2026-06-20 | В sprint допускается только fixture match simulation; будущий manual expert selection потребует actor and reason. | accepted | Нельзя смешивать research walkthrough с реальным offer/contact flow. | Product/System | Gate P1 |
| DEC-005 | 2026-06-20 | Plane/Chatwoot не расширяются в текущем sprint. | accepted | Не входят в critical path Identity/Profile/Intake/Clarification. | System | Gate R0 |
| DEC-006 | 2026-06-20 | Keycloak, WEB and mobile implementation отложены до Core contract/persistence evidence. | accepted | Текущий prototype не имеет стабильной domain/API boundary. | Architecture | Gate R0 |
| DEC-007 | 2026-06-20 | Discovery language/geography: Russian-speaking participants, geography open. | proposed | Практичный старт для доступной сети контактов. | Владелец продукта | 2026-06-23 |
| DEC-008 | 2026-06-20 | Primary ICP: system/lead analysts plus delivery/engineering leads. | proposed | Они создают/принимают SRS и несут стоимость переделок. | Владелец продукта | 2026-06-23 |

## Open decisions

| ID | Вопрос | Варианты | Рекомендуемый baseline | Owner | Deadline |
| --- | --- | --- | --- | --- | --- |
| OPEN-001 | Первый оффер | Quick / Full / Both | Quick | Владелец продукта | 2026-06-23 |
| OPEN-002 | Primary segment | Analysts / delivery / founders / mixed | Analysts + delivery leads | Владелец продукта | 2026-06-23 |
| OPEN-003 | Discovery geography | Russia / international Russian-speaking / specific market | Russian-speaking, geography open | Владелец продукта | 2026-06-23 |
| OPEN-004 | Result artifact format | Markdown / DOCX / PDF / mixed | Structured Markdown with later export | Product/System | 2026-07-02 |
| OPEN-005 | Turnaround | Same day / 1 day / 2 days / no promise | No promise before evidence | Владелец продукта | 2026-07-02 |
| OPEN-006 | Pricing test | Free / symbolic / fixed / range | Interview price sensitivity first | Владелец продукта | Gate R0 |
