# CIFEDRA Risk Register

Дата создания: 2026-06-20
Дата обновления: 2026-07-26
Статус: active

Шкала:

- probability: low, medium, high;
- impact: low, medium, high, critical.

| ID | Risk | Probability | Impact | Mitigation / evidence | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Пользователи считают review полезным в разговоре, но не готовы передавать задачу или платить. | high | high | Проверять recent cases, alternatives, pilot commitment and price signals. | Product | R0 |
| R-002 | Scope превращается в полное переписывание SRS или консалтинг без границ. | high | high | Quick Review scope, exclusions and structured artifact. | Product | 2026-06-26 |
| R-003 | В discovery попадают confidential SRS до legal/privacy readiness. | medium | critical | Только repository-owned synthetic examples; явный запрет в scripts and brief. | Product/Security | D0 |
| R-004 | Невозможно найти экспертов с достаточным качеством и доступностью. | medium | high | Два supply interviews, capability criteria and explicit decline flow. | Product | R0 |
| R-005 | Качество result artifact субъективно и не имеет acceptance criteria. | high | high | Severity taxonomy, artifact outline and user usefulness questions. | Analysis/Product | 2026-07-02 |
| R-006 | Разработка Core фиксирует неверный intake до product evidence. | medium | high | Versioned schema, provisional fields, traceability and R0 review passed; schemas remain provisional until external evidence. | System | P1 |
| R-007 | Security gaps прототипа допускают privilege escalation or data exposure. | medium | critical | S0 evidence passed; keep negative tests and loopback/local-only defaults. | Engineering | Each release |
| R-008 | PostgreSQL spike разрастается в полную persistence implementation. | low | medium | D8 limited to one aggregate boundary; next repository slices must remain backlog-scoped. | Architecture | Next sprint |
| R-009 | Solo capacity не позволяет закончить must scope. | high | high | Daily WIP limit, remove should items first, no hidden carry-over. | Оба | Daily |
| R-010 | Plane/Chatwoot/Keycloak/mobile отвлекают от critical path. | medium | medium | Явно out of scope; новые работы только через decision log. | System | R0 |
| R-011 | Название или домен окажутся недоступны. | medium | medium | Не покупать до shortlist and registrar verification; держать alternatives. | Product | R0 |
| R-012 | Interview notes содержат лишние персональные данные. | medium | high | Consent, minimization, participant codes and restricted notes. | Research | Each interview |
| R-013 | Increment `Ready for Match` ошибочно объявят готовым SRS Review product. | medium | high | R0 review explicitly separates Core local readiness from product/market readiness. | Product/System | Each demo |
| R-014 | Широкая аудитория Life/Work/Skills приводит к одновременной реализации несвязанных сценариев. | high | critical | Один validation scenario and one vertical increment at a time. | Product/System | Each sprint |
| R-015 | "Без ограничений по географии" трактуется как немедленный global launch. | medium | high | Architecture global-ready, rollout geography enabled only after legal/support/payment gates. | Product/Legal | Production gate |
| R-016 | Машинный перевод искажает смысл потребности или договоренности. | medium | high | Original retained, machine label, user correction, confidence and manual fallback. | Product/Architecture | Client MVP |
| R-017 | Владелец продукта как единственный эксперт создает confirmation bias. | high | medium | Использовать self-expert для workflow; quality/supply подтверждать независимыми experts позже. | Product | Gate P1 |
| R-018 | Три pilot scenarios раздувают scope до трех отдельных продуктов. | medium | critical | D9 vertical flows use one generic lifecycle; next sprint remains one post-match lifecycle. | Product/System | Daily |
| R-019 | Life fixture воспринимается как разрешение реальных домашних услуг без trust/safety. | medium | critical | Synthetic local pilot only; no address, real provider or engagement. | Product/Security | Life gate |
| R-020 | Provider-paid model выбирается без unit economics and legal analysis. | medium | high | Keep charging mechanism open until P1/pricing evidence. | Product/Legal | P1 |
| R-021 | ContactRequest accidentally reveals contacts, exact address or confidential artifact data before mutual match. | medium | critical | ContactRequest SRS requires disclosure snapshots, consent policy version and negative tests before API exposure. | Product/Security | ContactRequest implementation |
| R-022 | Одновременная реализация нескольких «популярных» сценариев в каждом направлении раздувает MVP. | high | critical | Wide discovery, one primary vertical slice; остальные сценарии остаются catalog/research scope. | Product/Delivery | Gate P0 |
| R-023 | Точный LIFE-адрес раскрывается до mutual consent или человеку без достаточной verification. | medium | critical | Сохранять `DEC-028`; approximate geo before consent, field-level disclosure and audit. | Security/Product | LIFE gate |
| R-024 | Резервирование, возврат и выплата денег запускаются без определения legal role, PSP contract, tax/fiscal and dispute process. | high | critical | Mock contract only до payment/legal SRS и country approval. | Product/Legal | Commercial gate |
| R-025 | Широкий LIFE-каталог воспринимается как разрешение всех категорий в реальном пилоте. | high | critical | Safety tier matrix, prohibited list and category enablement feature flags. | Safety/Product | LIFE gate |
| R-026 | Отдельные `.ru` и `.com` codebase расходятся по доменной модели, исправлениям и security controls. | medium | critical | One codebase; country config, localization, feature flags and deployment isolation. | Architecture | SRS-P11 |
| R-027 | Декомпозиция запроса искусственно увеличивает число платных карточек и вызывает недоверие к тарифу. | high | high | Parent bundle rules, user confirmation, anti-gaming metric and pricing experiment. | Product/System | Pricing gate |
| R-028 | Self-attested Verified Help и референсы позволяют накручивать trust. | high | high | Bilateral confirmation, evidence provenance, moderation and dispute path. | Safety/Product | SRS-P8 |
| R-029 | Бессрочное хранение артефактов активного пользователя нарушает minimization, deletion или jurisdiction rules. | medium | critical | Data classes, purpose-based retention, user deletion, legal hold and country policy. | Security/Legal | D0 |
| R-030 | Request, work card, Alliance, payment and Result смешиваются в одной канбан-карточке и одном status field. | high | high | Separate aggregates/state models and explicit projection for Board. | System/Architecture | R1 |
| R-031 | Свободные AI-теги создают дубли, языковые варианты и нестабильные filters/matches. | high | high | Stable taxonomy IDs, localized labels, tag provenance and user/admin correction. | Product/System | SRS-P9 |
| R-032 | Одна recurring-карточка перезаписывает историю периодов, оплат и результатов. | medium | high | Separate RecurringRule/template and immutable occurrence records. | System | SRS-P7 |
| R-033 | Полностью автоматический AI matching показывает небезопасный или формально релевантный, но непригодный матч. | medium | critical | Hard constraints, explainability, quality threshold, evaluation dataset, audited escalation and user correction. | AI/Product/Safety | SRS-P4 |

## Escalation

Немедленная остановка соответствующей работы требуется, если:

- получен реальный confidential document до D0;
- обнаружен способ self-assign privileged role;
- тестовые данные могут быть доступны не только на local loopback;
- ContactRequest или связанный UI/API раскрывает контакты, точный адрес или
  confidential artifact data до mutual match;
- participant просит удалить notes;
- sprint change добавляет scope без снятия другой задачи.
