# CIFEDRA Decision Log

Дата создания: 2026-06-20
Дата обновления: 2026-07-26
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
| DEC-015 | 2026-06-21 | First communication is concierge flow through CIFEDRA/Chatwoot adapter. | superseded by DEC-028 | Direct product chat is not required for local pilot. | Владелец продукта | Gate P1 |
| DEC-016 | 2026-06-21 | Local pilot is free; future provider-paid monetization is the product-owner hypothesis. | provisional | Demand-side access remains free in baseline, but mechanism/economics/legal model are unvalidated. | Владелец продукта | Pricing gate |
| DEC-017 | 2026-06-21 | Runtime online text translation is required after language metadata/contracts. | accepted | Russian/English users must communicate without replacing originals. | Владелец продукта | Client MVP |
| DEC-018 | 2026-06-21 | Work Quick Review request has one primary review focus. | accepted | Scope должен оставаться быстрым и проверяемым. | Владелец продукта | Gate R0 |
| DEC-019 | 2026-06-21 | Real artifact metadata is required before engagement; file content is enabled only after D0 policy. | accepted | До D0 нельзя принимать confidential documents. | Владелец продукта | Gate D0 |
| DEC-020 | 2026-06-21 | Provider contacts are hidden until mutual match; operator only assists analysis and does not choose on behalf of participants. | accepted | Selection and disclosure require participant decisions. | Владелец продукта | ContactRequest SRS |
| DEC-021 | 2026-06-21 | Life pilot category is `Уход за участком`; pool cleaning and lawn mowing are service variants. | accepted | Варианты используют общий local-service intake and lifecycle. | Владелец продукта | Gate R0 |
| DEC-022 | 2026-06-21 | Proposed Life/Work/Skills fields and readiness rules are approved for local synthetic UAT. | accepted | Product owner approved Day 2 schema baseline. | Владелец продукта | External product evidence |
| DEC-023 | 2026-06-25 | CIFEDRA не является Project 1 для отдела системного анализа; системный анализ остается только возможной услугой в `Work`. | accepted | Product owner separated CIFEDRA from the system-analysis department project. | Владелец продукта | Always |
| DEC-024 | 2026-06-26 | R0 Core P0 local gate passed; next sprint starts with ContactRequest/Consent/Engagement, not WEB/mobile production build. | accepted | D1-D9 evidence shows local synthetic Core readiness, but post-match lifecycle and API persistence remain the critical path. | Product/System | Next sprint review |
| DEC-025 | 2026-06-26 | `ContactRequest` separates client intent from provider acceptance; `requested_contact` does not disclose contacts or create Engagement. | accepted | Post-match workflow needs mutual match and consent/disclosure controls before implementation. | Product/System | ContactRequest implementation |
| DEC-026 | 2026-07-26 | Combined Life requests are confirmed with the client first; CIFEDRA may split them into linked Needs when services belong to different directions or no single provider can deliver the bundle. | accepted | Client keeps control of scope, while the platform can still continue matching when all-in-one supply is unavailable. | Владелец продукта | Client MVP |
| DEC-027 | 2026-07-26 | ContactRequest default provider response timeout is 48 hours. | accepted | Time-bounded response is needed for clear kanban status and client expectations. | Владелец продукта | API/OpenAPI draft |
| DEC-028 | 2026-07-26 | Target first-contact channel is embedded CIFEDRA messenger; before mutual acceptance the provider sees the client's display name and request/work description, but direct contacts and exact address remain hidden. | accepted | Product needs in-app communication and safe disclosure; Chatwoot remains support/ops, not the primary client UI. | Владелец продукта | Messenger MVP |
| DEC-029 | 2026-07-26 | First Work result artifact format is structured Markdown. | accepted | Markdown is fast to produce, easy to review locally and can later be exported to DOCX/PDF. | Владелец продукта | Work MVP |
| DEC-030 | 2026-07-26 | CIFEDRA remains human-to-human: AI structures requests, matches, explains and monitors, while people confirm terms, perform work and accept results. | accepted | Product-owner questionnaire; protection of human value in an AI-heavy market. | Владелец продукта | Always |
| DEC-031 | 2026-07-26 | Minimum product promise includes the start of an Alliance and management of work execution, not only a relevant introduction. | accepted | Product-owner questionnaire. | Владелец продукта | Scenario selection gate |
| DEC-032 | 2026-07-26 | Client and Ally use role-specific board views; proposed visible stages are discussion, planned work, in progress, result submitted and evaluation. | provisional | Labels require mapping to domain states and negative transitions. | Product/System | SRS-P5 |
| DEC-033 | 2026-07-26 | A large request may create linked work cards with different Allies; recurring work creates scheduled occurrences. | accepted | Product-owner questionnaire; avoids one overloaded card. | Product/System | SRS-P3/P7 |
| DEC-034 | 2026-07-26 | Russian and English remain first languages; German and Croatian are next localization candidates. | provisional | Product-owner questionnaire; activation depends on country/language readiness. | Product | Country gate |
| DEC-035 | 2026-07-26 | Separate family and organization accounts are out of first MVP scope. | accepted | First release prioritizes personal Client/Ally contexts. | Product/System | Post-MVP review |
| DEC-036 | 2026-07-26 | In-platform service payment through PSP adapters is the target hypothesis, but no real payment is approved for MVP yet. | provisional | Payment, refund, tax and marketplace roles require legal/commercial evidence. | Product/Legal | Commercial gate |
| DEC-037 | 2026-07-26 | Three free work/Alliance cards with paid additional capacity is the first pricing hypothesis. | provisional | Must be tested against decomposition gaming, payer-side conflict and willingness to pay. | Product | Pricing experiment |

## Open decisions

| ID | Вопрос | Варианты | Рекомендуемый baseline | Owner | Deadline |
| --- | --- | --- | --- | --- | --- |
| OPEN-001 | Первый оффер | Quick / Full / Both | Quick | Владелец продукта | 2026-06-23 |
| OPEN-005 | Turnaround | Same day / 1 day / 2 days / no promise | No promise before evidence | Владелец продукта | 2026-07-02 |
| OPEN-006 | Provider charging model | Subscription / lead / commission / promotion | Do not choose before pricing/legal discovery | Владелец продукта | Gate P1 |
| OPEN-009 | Service payment flow | Through CIFEDRA / direct client-provider | Mock only until legal/payment SRS | Владелец продукта | Before PSP work |
| OPEN-010 | Quick Review limit | 25 pages / 10,000 words / expert hours | 25 pages or 10,000 words | Владелец продукта | Before pilot offer |
| OPEN-011 | Quick Review turnaround | One business day / two days / no promise | At least one business day | Владелец продукта | Before pilot offer |
| OPEN-012 | Primary vertical slice | One WORK/LIFE/SKILLS scenario selected from research shortlist | Wide discovery, one implemented vertical | Владелец продукта | Gate P0 |
| OPEN-013 | Payer side | Client / Ally / both / organization | Client vs both-side answers require pricing experiment | Владелец продукта | Commercial gate |
| OPEN-014 | Paid capacity unit | Work card / Agreement / Active Alliance / hybrid | Do not consume paid capacity before confirmed Agreement | Владелец продукта | SRS-P5 and pricing experiment |
| OPEN-015 | Result semantics | Payment / work completion / client acceptance / platform revenue | Separate transaction, work and business outcomes | Product/System | SRS-P8 |
| OPEN-016 | Market topology | Two codebases / one configurable codebase | One codebase with country configuration | Architecture/Product | SRS-P11 |
| OPEN-017 | Reference verification | Ally self-attestation / client confirmation / evidence / moderation | Bilateral confirmation with dispute path | Product/Safety | SRS-P8 |
