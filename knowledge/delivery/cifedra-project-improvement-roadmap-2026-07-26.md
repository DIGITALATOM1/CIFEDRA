# CIFEDRA Connect: project improvement roadmap

Дата: 2026-07-26
Статус: executable program baseline v0.1
Горизонт: 8 недель + следующий 90-day increment

## 1. Цель

Перевести проект из набора быстро развивавшихся прототипов и временных
baseline-документов в управляемую продуктовую программу, где:

- ответы владельца продукта связаны с решениями и experiments;
- один документ является canonical baseline для каждой области;
- `Ally Request -> Agreement -> Alliance -> Result -> Reference` отражен в
  CJM, SRS, HLD, API, WEB и тестах;
- широкий каталог `WORK/LIFE/SKILLS` исследуется без одновременной реализации
  трех продуктов;
- один выбранный vertical slice проходит полный E2E и controlled validation;
- safety, privacy, payments и international rollout включаются через gates.

## 2. Текущая точка

### Уже есть

- Core identity/profile/intake/clarification;
- explainable matching baseline;
- `ContactRequest` domain/API/PostgreSQL boundary;
- Engagement baseline;
- OpenAPI draft;
- WEB application prototype и Alliance Board concepts;
- CJM `WORK/LIFE/SKILLS`;
- architecture, delivery and evidence documents.

### Требует выравнивания

- Product vocabulary `Ally Request/Ally/Alliance` и technical vocabulary
  `Need/Provider/Engagement`;
- ответы анкеты и decision log;
- старый master plan и фактически выполненные increments;
- HLD и решение о встроенном messenger;
- Board UX и доменная state machine;
- Request decomposition, work cards, recurrence, tags;
- Result, Verified Help и Reference;
- payment, refund, disclosure и safety boundaries;
- статус исторических sprint plans и canonical documents.

## 3. Принципы выполнения

1. `Wide discovery, narrow implementation`: исследуем несколько сценариев в
   каждом направлении, реализуем один primary vertical slice.
2. Общий Core SRS дополняется direction-specific rules; полные SRS не
   копируются для `WORK/LIFE/SKILLS`.
3. AI предлагает, объясняет и контролирует зависания; решения людей о цене,
   раскрытии, результате и споре не автоматизируются.
4. Каталог может быть широким, но реальное исполнение включается по safety
   tiers и country gates.
5. Один codebase обслуживает страны через configuration, localization,
   feature flags и deployment boundaries.
6. Product evidence, implementation evidence и legal/safety evidence не
   смешиваются.
7. Незакрытый вопрос должен иметь owner, experiment и gate; формулировка
   «уточнить позже» не является backlog item.

## 4. Агентная модель

| Агент | Ответственность | Основные выходы |
| --- | --- | --- |
| Product Lead | ICP, offer, scope, economics, product gates. | Decision synthesis, scenario shortlist, metric dictionary. |
| WORK Analyst | WORK taxonomy, personas, result and artifact rules. | WORK delta CJM/SRS, interview evidence. |
| LIFE Analyst | LIFE taxonomy, geo, safety, offline completion. | LIFE delta, safety tier matrix, incident scenarios. |
| SKILLS Analyst | Skills goals, baseline/target, learning result. | SKILLS delta, progress/result rules. |
| System Analyst | Domain, states, invariants, permissions, traceability. | SRS package, state machines, requirement registry. |
| AI Matching Analyst | Intake completeness, scoring, explanation, no-match. | Matching SRS, quality dataset, evaluation protocol. |
| Trust/Safety Analyst | Verification, privacy, disclosure, moderation. | Policies, threat/abuse cases, safety gate. |
| Payment/Business Analyst | Pricing, PSP, reservation, refund, tax roles. | Commercial experiments, payment/legal SRS. |
| Architecture/API Analyst | HLD, ADR, storage, events, API compatibility. | Architecture delta, OpenAPI/event plan. |
| UX Analyst | Role boards, card actions, errors, mobile/desktop. | Screen/state mapping and usability protocol. |
| QA Analyst | Acceptance, negative E2E, regression and evidence. | Test design, traceability and gate report. |
| Delivery/Knowledge Lead | WIP, dependencies, canonical docs, freshness. | Integrated backlog, artifact register, weekly review. |

## 5. Roadmap на 8 недель

| Phase | Период | Цель | Главные deliverables | Gate |
| --- | --- | --- | --- | --- |
| 0. Decision intake | 26-29 Jul | Перевести ответы анкеты в decisions, conflicts и experiments. | Decision synthesis, conflict register, updated risks. | `G0 Answers Classified` |
| 1. Baseline reset | 27 Jul-2 Aug | Определить canonical/working/evidence/historical документы. | Artifact register, glossary mapping, supersession list, refreshed indexes. | `G1 Baseline Coherent` |
| 2. Market taxonomy | 27 Jul-7 Aug | Исследовать популярные работы и human-value сценарии. | Source matrix, dataset, scored shortlist, personas. | `P0 Scenario Selection` |
| 3. Product/process lock | 8-14 Aug | Выбрать один vertical и зафиксировать процесс. | Revised CJM, Board columns, Result taxonomy, safety tiers, metric dictionary. | `P1 Process Baseline` |
| 4. SRS/architecture alignment | 10-23 Aug | Описать новые сущности, states и контракты. | SRS package, HLD delta, ADR backlog, OpenAPI/event changes. | `R1 Requirements Ready` |
| 5. MVP vertical slice | 24 Aug-13 Sep | Реализовать один E2E от Request до Result. | Core/API/WEB slice, persistence, tests, evidence. | `U1 Internal UAT` |
| 6. Controlled validation | 14-20 Sep | Проверить сценарий с ограниченной когортой после readiness. | Pilot protocol, funnel, match quality, support effort, risk review. | `P2 Pilot Review` |

## 6. SRS roadmap

Приоритетный порядок:

| ID | SRS | Ключевой scope | Зависит от |
| --- | --- | --- | --- |
| SRS-P2 | Product terminology and lifecycle mapping | `Need <-> Ally Request`, `Provider <-> Ally`, `Engagement <-> Alliance/Work`. | Decision synthesis. |
| SRS-P3 | Request Bundle and Work Card | Parent request, decomposition, child cards, aggregate progress, anti-gaming. | Scenario taxonomy. |
| SRS-P4 | AI Matching, No Exact Match and Rematching | Hard constraints, preferences, scoring, explanation, quality threshold, saved request, rematch and audited manual escalation. | SRS-P2, P3, research dataset. |
| SRS-P5 | Alliance Board and role actions | Role-specific columns, domain states, allowed transitions, filters. | SRS-P2, P3, P4. |
| SRS-P6 | Agreement, pricing and change approval | Mutual confirmation, scope, price, deadline, change request. | Board baseline. |
| SRS-P7 | Recurring Work | Template, schedule, occurrence, pause, cancel, per-occurrence result. | SRS-P3, P6. |
| SRS-P8 | Result, Verified Help and Reference | Work result, acceptance, rework, dispute, bilateral verification. | SRS-P6. |
| SRS-P9 | Catalog, capabilities, tags and filters | Controlled taxonomy, AI tags, provenance, correction, search/filter. | Research dataset. |
| SRS-P10 | Messenger and disclosure | Embedded chat, field-level consent, address/contact/artifact disclosure. | Existing ContactRequest SRS. |
| SRS-P11 | Payment reservation and refund contract | Отдельные contracts/ledger events для тарифа CIFEDRA и оплаты работы Ally; PSP-neutral intent, reservation, capture, refund, dispute; mock first. | Legal/commercial gate. |
| SRS-P12 | Country configuration and localization | RU/EN, currency, PSP, legal text, category enablement, deployment policy. | Country research. |

## 7. Ближайший backlog: 27 Jul-9 Aug

Sprint goal:

```text
Выбрать evidence-based scenario shortlist и подготовить требования
к Request Bundle, Work Card и Alliance Board без преждевременной
реализации платежей и high-risk LIFE.
```

| ID | Задача | Owner | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| IMP-01 | Классифицировать ответы анкеты. | Product + Delivery | Каждый OQ связан с accepted/provisional/conflict/research/guardrail. | - |
| IMP-02 | Создать artifact register и canonical map. | Knowledge Lead | Для каждого продукта/SRS/system/delivery scope указан один baseline. | IMP-01 |
| IMP-03 | Обновить decision log и risk register. | Product + Safety | Конфликты не выданы за решения; новые critical risks имеют controls. | IMP-01 |
| RES-01 | Собрать marketplace source matrix. | Research agents | Источники, категории, дата, provenance, ограничения. | - |
| RES-02 | Создать normalized Service Candidate dataset. | WORK/LIFE/SKILLS agents | Работы нормализованы и связаны с client/Ally/result. | RES-01 |
| RES-03 | Оценить demand/human value/supply/safety/pilot effort. | Product + Safety | У каждого кандидата score и evidence note. | RES-02 |
| RES-04 | Сформировать top-5 по направлению и recommended primary vertical. | Product Lead | 15 candidates, 3 prototypes, 1 recommendation. | RES-03 |
| PROD-01 | Утвердить терминологическую mapping-таблицу. | Product + System | Product и technical language не конфликтуют в SRS/API. | IMP-01 |
| SRS-01 | Draft `Request Bundle and Work Card`. | System Analyst | Entities, cardinality, invariants, states, permissions, events, AC. | RES-02 |
| SRS-02 | Draft `AI Matching / No Exact Match`. | AI Matching + System | Hard constraints, quality threshold, explanation, saved request and escalation описаны проверяемо. | RES-02, SRS-01 |
| SRS-03 | Draft `Alliance Board and role actions`. | System + UX | User columns связаны с domain states и negative transitions. | SRS-01, SRS-02 |
| SAFE-01 | Подготовить direction safety tiers. | Trust/Safety | Категории имеют enable/verify/disclose/incident requirements. | RES-02 |
| GATE-01 | Провести scenario-selection review. | Владелец продукта | Выбран primary vertical или оформлен следующий experiment. | RES-04, SAFE-01 |

WIP rule: одновременно в работе не более одной задачи research, одной SRS и
одной governance-задачи на ведущего исполнителя.

## 8. Что перепланировать из старого sprint

| Старый item | Решение |
| --- | --- |
| `N7-01 Event/outbox spike` | Перенести после утверждения событий Request Bundle/Alliance; не фиксировать старые event names. |
| `N8-01 Plane/Chatwoot sync plan` | Пересмотреть: embedded messenger является target UI, Chatwoot - support/ops adapter. |
| `N9-01 Local UAT post-match` | Включить в Gate `U1` после новой Board/Alliance state model. |
| `N10-01 Update SRS/HLD/ADR/backlog` | Выполнить частично в Baseline reset и полностью после `R1`. |

## 9. Паузы до прохождения gates

До отдельного решения не начинать:

- реальные payments/escrow/refunds;
- реальный LIFE pilot с адресами или доступом в жилье;
- отдельный `.ru` и `.com` codebase;
- family/organization account implementation;
- масштабирование Plane/Chatwoot integration;
- мобильную реализацию полного lifecycle;
- обучение matching на неподтвержденных feedback signals.

## 10. 90-day increment после 8 недель

После `P2 Pilot Review`:

1. скорректировать scoring и intake по данным пилота;
2. выбрать второй vertical slice;
3. подготовить PSP/legal spike для одной страны;
4. включить country configuration без fork codebase;
5. реализовать no-match saved request and notifications;
6. добавить recurrence для подтвержденного repeat scenario;
7. расширить references и bilateral Verified Help;
8. провести production-readiness review по security, privacy, operations,
   support, observability и deletion.

## 11. Governance

### Document states

- `Canonical` - текущий утвержденный источник истины;
- `Working` - документ в разработке/review;
- `Evidence` - неизменяемое подтверждение результата;
- `Historical` - завершенный sprint или superseded baseline;
- `Reference` - материал, не управляющий scope.

### Traceability

```text
Product Question
  -> Decision / Experiment
  -> CJM Step
  -> Capability
  -> SRS Requirement
  -> Domain Rule
  -> API / Event / UI
  -> Acceptance Scenario
  -> Test
  -> Evidence
  -> Gate Decision
```

### Definition of Done для аналитической задачи

- scope и owner указаны;
- решение отделено от assumption;
- позитивные и негативные сценарии описаны;
- privacy/safety boundary проверена;
- ссылки на upstream/downstream артефакты добавлены;
- acceptance criteria проверяемы;
- reviewer и gate указаны;
- индекс и artifact register обновлены.

## 12. Success measures

Через 8 недель:

- один primary scenario выбран на evidence, а не по размеру каталога;
- один E2E vertical slice проходит automated tests и internal UAT;
- 100% P0 product questions имеют decision или active experiment;
- новые SRS имеют traceability до CJM и тестов;
- critical disclosure/payment/LIFE risks не обходятся UI;
- master plan, HLD, SRS registry и delivery backlog не противоречат
  фактически реализованному состоянию;
- следующий vertical выбирается по результатам пилота.
