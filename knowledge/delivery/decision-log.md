# CIFEDRA Decision Log

Дата создания: 2026-06-20
Дата обновления: 2026-06-21
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
| DEC-007 | 2026-06-21 | Product supports Russian and English; strategic geography has no global restriction. | accepted | Продукт должен поддерживать международное online-взаимодействие. | Владелец продукта | Production geography gate |
| DEC-008 | 2026-06-21 | Target clients are any users with service needs in Life, Work or Skills. | accepted | CIFEDRA является общей service platform, а SRS Review только первым scenario. | Владелец продукта | Gate P1 |
| DEC-009 | 2026-06-21 | Все важные lifecycle steps учитываются, но реализуются successive vertical increments. | accepted | Solo capacity не допускает одновременную реализацию всей платформы. | Product/System | Each sprint |
| DEC-010 | 2026-06-21 | Product owner is the first expert for the SRS Review validation scenario. | accepted | Позволяет проверить workflow без initial supply recruitment. | Владелец продукта | Gate R0 |
| DEC-011 | 2026-06-21 | Russian/English UI and provider-neutral text translation are required for client MVP. | accepted | Географически широкий продукт должен сохранять original and translated content. | Product/Architecture | Client MVP |

## Open decisions

| ID | Вопрос | Варианты | Рекомендуемый baseline | Owner | Deadline |
| --- | --- | --- | --- | --- | --- |
| OPEN-001 | Первый оффер | Quick / Full / Both | Quick | Владелец продукта | 2026-06-23 |
| OPEN-004 | Result artifact format | Markdown / DOCX / PDF / mixed | Structured Markdown with later export | Product/System | 2026-07-02 |
| OPEN-005 | Turnaround | Same day / 1 day / 2 days / no promise | No promise before evidence | Владелец продукта | 2026-07-02 |
| OPEN-006 | Pricing test | Free / symbolic / fixed / range | Interview price sensitivity first | Владелец продукта | Gate R0 |
| OPEN-007 | Initial service categories | System analysis only / several expert services | System analysis and SRS Review first | Владелец продукта | 2026-06-22 |
| OPEN-008 | Initial delivery format | Online only / online + local | Online only | Владелец продукта | 2026-06-22 |
| OPEN-009 | First translation surfaces | UI / Need+Profile / chat / documents / voice | UI + Need/Profile/Clarification text | Владелец продукта | 2026-06-22 |
| OPEN-010 | Selection model | Shortlist / swipe / auto-assign / combination | Explainable shortlist + explicit choice | Владелец продукта | 2026-06-22 |
| OPEN-011 | Initial communication | Concierge / direct chat / external call | Concierge through CIFEDRA/Chatwoot adapter | Владелец продукта | 2026-06-22 |
