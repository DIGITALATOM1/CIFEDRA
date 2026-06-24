# CIFEDRA Decision Log

Дата создания: 2026-06-20
Дата обновления: 2026-06-25
Статус: active

## Правило

Product and delivery decisions фиксируются здесь. Architecture decisions,
меняющие system boundaries or technology baseline, оформляются отдельным ADR.

| ID | Дата | Решение | Статус | Основание | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | 2026-06-20 | Первый provisional scenario: `Work / Expert Help / SRS Review`. | accepted | Ниже safety risk, проверяемый artifact, существующие CJM/Core fixtures. | Владелец продукта | Gate P1 |
| DEC-002 | 2026-06-20 | `Quick Review` используется как primary discovery baseline; `Full Review` остается альтернативой. | provisional | Узкий результат проще проверить за две недели. | Владелец продукта | 2026-06-26 |
| DEC-003 | 2026-06-20 | До D0 используются только repository-owned synthetic examples. | accepted | Нет legal/privacy readiness для external participant data or confidential documents. | Владелец продукта | Gate D0 |
| DEC-004 | 2026-06-20 | В sprint допускается только fixture match simulation; будущий manual expert selection потребует actor and reason. | accepted | Нельзя смешивать research walkthrough с реальным offer/contact flow. | Product/System | Gate P1 |
| DEC-005 | 2026-06-20 | Plane/Chatwoot не расширяются в текущем sprint. | accepted | Не входят в critical path Identity/Profile/Intake/Clarification. | System | Gate R0 |
| DEC-006 | 2026-06-20 | Keycloak, WEB and mobile implementation отложены до Core contract/persistence evidence. | accepted | Текущий prototype не имеет стабильной domain/API boundary. | Architecture | Gate R0 |
| DEC-007 | 2026-06-21 | Product supports Russian and English; strategic geography has no global restriction. | accepted | Продукт должен поддерживать международное online-взаимодействие. | Владелец продукта | Production geography gate |
| DEC-008 | 2026-06-21 | Target clients are any users with service needs in Life, Work or Skills. | accepted | CIFEDRA является общей service platform, а SRS Review только первым scenario. | Владелец продукта | Gate P1 |
| DEC-009 | 2026-06-21 | Все важные lifecycle steps учитываются, но реализуются successive vertical increments. | accepted | Solo capacity не допускает одновременную реализацию всей платформы. | Product/System | Each sprint |
| DEC-010 | 2026-06-21 | Product owner is the first expert for the SRS Review validation scenario. | accepted | Позволяет проверить workflow без initial supply recruitment. | Владелец продукта | Gate R0 |
| DEC-011 | 2026-06-21 | Russian/English UI and provider-neutral text translation are required for client MVP. | accepted | Географически широкий продукт должен сохранять original and translated content. | Product/Architecture | Client MVP |
| DEC-012 | 2026-06-21 | Local pilot covers Life outdoor maintenance, Work SRS Review and Skills interview preparation. | accepted | Нужно проверить один Core lifecycle на трех направлениях. | Владелец продукта | Gate R0 |
| DEC-013 | 2026-06-21 | Local pilot uses only synthetic data and does not perform real services. | accepted | Система еще не прошла D0, trust/safety and production readiness. | Владелец продукта | Gate R0 |
| DEC-014 | 2026-06-21 | Provider selection uses explainable shortlist and explicit choice; swipe is mobile presentation only. | accepted | Decision semantics должны быть одинаковыми в WEB/mobile. | Владелец продукта | Client MVP |
| DEC-015 | 2026-06-21 | First communication is concierge flow through CIFEDRA/Chatwoot adapter. | accepted | Direct product chat is not required for local pilot. | Владелец продукта | Gate P1 |
| DEC-016 | 2026-06-21 | Local pilot is free; future provider-paid monetization is the product-owner hypothesis. | provisional | Demand-side access remains free in baseline, but mechanism/economics/legal model are unvalidated. | Владелец продукта | Pricing gate |
| DEC-017 | 2026-06-21 | Runtime online text translation is required after language metadata/contracts. | accepted | Russian/English users must communicate without replacing originals. | Владелец продукта | Client MVP |
| DEC-018 | 2026-06-21 | Work Quick Review request has one primary review focus. | accepted | Scope должен оставаться быстрым и проверяемым. | Владелец продукта | Gate R0 |
| DEC-019 | 2026-06-21 | Real artifact metadata is required before engagement; file content is enabled only after D0 policy. | accepted | До D0 нельзя принимать confidential documents. | Владелец продукта | Gate D0 |
| DEC-020 | 2026-06-21 | Provider contacts are hidden until mutual match; operator only assists analysis and does not choose on behalf of participants. | accepted | Selection and disclosure require participant decisions. | Владелец продукта | ContactRequest SRS |
| DEC-021 | 2026-06-21 | Life pilot category is `Уход за участком`; pool cleaning and lawn mowing are service variants. | accepted | Варианты используют общий local-service intake and lifecycle. | Владелец продукта | Gate R0 |
| DEC-022 | 2026-06-21 | Proposed Life/Work/Skills fields and readiness rules are approved for local synthetic UAT. | accepted | Product owner approved Day 2 schema baseline. | Владелец продукта | External product evidence |
| DEC-023 | 2026-06-25 | CIFEDRA не является Project 1 для отдела системного анализа; системный анализ остается только возможной услугой в `Work`. | accepted | Product owner separated CIFEDRA from the system-analysis department project. | Владелец продукта | Always |

## Open decisions

| ID | Вопрос | Варианты | Рекомендуемый baseline | Owner | Deadline |
| --- | --- | --- | --- | --- | --- |
| OPEN-001 | Первый оффер | Quick / Full / Both | Quick | Владелец продукта | 2026-06-23 |
| OPEN-004 | Result artifact format | Markdown / DOCX / PDF / mixed | Structured Markdown with later export | Product/System | 2026-07-02 |
| OPEN-005 | Turnaround | Same day / 1 day / 2 days / no promise | No promise before evidence | Владелец продукта | 2026-07-02 |
| OPEN-006 | Provider charging model | Subscription / lead / commission / promotion | Do not choose before pricing/legal discovery | Владелец продукта | Gate P1 |
| OPEN-007 | Life combined request | One or multiple variants in one Need | Combine when one provider/visit is intended; otherwise split into linked Needs | Владелец продукта | Before ContactRequest implementation |
| OPEN-009 | Service payment flow | Through CIFEDRA / direct client-provider | Mock only until legal/payment SRS | Владелец продукта | Before PSP work |
| OPEN-010 | Quick Review limit | 25 pages / 10,000 words / expert hours | 25 pages or 10,000 words | Владелец продукта | Before pilot offer |
| OPEN-011 | Quick Review turnaround | One business day / two days / no promise | At least one business day | Владелец продукта | Before pilot offer |
