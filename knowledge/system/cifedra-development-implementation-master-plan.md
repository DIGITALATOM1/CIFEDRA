# CIFEDRA CONNECT: master-план разработки и внедрения

Дата: 2026-06-20
Статус: program baseline v0.1
Горизонт: от локального прототипа до production pilot

## 1. Назначение

Документ объединяет:

- продуктовую проверку;
- системный анализ и SRS;
- корректировку архитектуры;
- разработку Core, API, WEB, iOS и Android;
- дизайн и контент;
- инфраструктуру и тестирование;
- домен, юридическую подготовку и магазины приложений;
- маркетинг, пилот, внедрение и сопровождение.

Это не жесткий waterfall-график. План является управляемой программой с
контрольными точками. После каждого тестового этапа архитектура, SRS, HLD, ADR,
API и backlog могут корректироваться на основании фактов.

Связанные планы:

- [Quality, security and release plan](./cifedra-quality-release-plan.md);
- [Product, design and go-to-market plan](../product/cifedra-product-design-go-to-market-plan.md);
- [HLD](./cifedra-hld.md);
- [Core development plan](./core-development-plan.md);
- [Mobile build plan](./mobile-build-plan.md);
- [Client WEB build plan](./web-client-build-plan.md).

## 2. Точка старта

На дату плана есть:

- TypeScript-домен `packages/core`;
- demo API;
- локальная test console;
- unit-тесты основного happy path;
- draft/live handoff в Plane/Chatwoot;
- landing;
- CJM, HLD и ADR.

Пока отсутствуют:

- production domain aggregates из P0 gap register;
- PostgreSQL repositories и migrations;
- worker/outbox/inbox;
- `/api/v1` и OpenAPI;
- Keycloak runtime;
- `apps/web` и `apps/mobile`;
- CI/CD и production-like staging;
- product analytics;
- legal pages, account deletion и store readiness;
- production operations and support process.

Текущая система считается локальным функциональным прототипом, а не MVP,
shared environment или production backend.

## 3. Рекомендуемая стратегия запуска

Одновременный публичный запуск `Life`, `Work`, `Skills` слишком широк для
текущего состояния продукта.

Рекомендуемый порядок:

1. `Work / Expert Help`: ревью SRS и требований.
2. `Skills`: карьерная помощь, менторы и подготовка к интервью.
3. `Life / Local Tasks`: только после trust, verification, geo, moderation,
   dispute и proof-of-completion gates.

`Life / Care`, доступ в жилье, реальные платежи и чувствительные media не
входят в первый production pilot.

На `G0` утверждается provisional scope для проектирования. Окончательный
pilot/public scope lock выполняется на `P1` после product evidence. До этого
`Work / Expert Help` является рабочим baseline, а Core проектируется через
общие lifecycle boundaries без жесткой привязки к одному офферу.

## 4. Принципы программы

1. Один Core и один API обслуживают iOS, Android и client WEB.
2. WEB является первой reference-реализацией полного CJM.
3. Mobile начинается на стабильном API, а не на `/demo/*`.
4. Интеграции вызываются через worker/outbox, а не из interactive API.
5. Architecture baseline versioned, но не заморожен навсегда.
6. Каждая существенная корректировка подтверждается тестом, spike или pilot
   evidence.
7. Security, privacy, deletion, audit и support не откладываются на день
   публикации.
8. Marketing проверяет activated Need и useful Result, а не только трафик и
   регистрации.
9. Optional capabilities не блокируют production pilot.
10. Один immutable release artifact продвигается по environments.

## 5. Состав production pilot

### 5.1 Обязательно

- registration/login/profile;
- Need intake and clarification;
- explainable match;
- decision/shortlist/contact request;
- provider accept/decline/expire;
- consent and permitted disclosure;
- engagement and result;
- secure artifact/document lifecycle;
- WEB client;
- iOS/Android beta clients;
- operator queue and concierge;
- notifications baseline;
- PostgreSQL, audit, outbox/inbox;
- Keycloak;
- Chatwoot/Plane adapters;
- deletion/retention;
- analytics and operational observability;
- legal pages, support and incident process.

### 5.2 Допустимо в mock/manual режиме

- payment provider;
- calendar provider;
- Baserow pilot projection;
- email delivery;
- manual verification;
- manual matching override.

### 5.3 Вне critical path

- production PSP, payouts and marketplace settlement;
- direct product chat;
- Whisper/voice;
- automatic text translation;
- Jitsi;
- n8n;
- ML learning loop;
- multi-region;
- отдельные доменные микросервисы.

## 6. Оценка сроков

Сроки зависят от состава команды, результатов pilot и количества изменений
архитектуры.

| Сценарий команды | Production pilot без реальных платежей |
| --- | --- |
| 2 backend, 1 web, 1 mobile, 1 QA automation, 0.5 DevOps, product/analyst/designer | 32-38 календарных недель. |
| 3-4 универсальных специалиста | 12-15 месяцев. |
| Один разработчик с частичной поддержкой | Планировать по отдельным вертикальным increments; календарный срок заранее ненадежен. |

Коммерческий production с реальным PSP, payouts и dispute flow добавляет
ориентировочно 6-10 недель после утверждения юридической и финансовой модели.

Оценка не является обещанием даты. На каждом gate пересчитывается:

- remaining scope;
- team capacity;
- critical path;
- architecture rework;
- external verification/review lead time.

## 7. Потоки работ

| Поток | Ответственность |
| --- | --- |
| Product and Business | Discovery, pilot scope, offer, pricing, metrics, unit economics. |
| System Analysis | CJM, SRS, traceability, domain model, API/event contracts. |
| Architecture | HLD, ADR, LLD boundaries, data and deployment decisions. |
| UX/UI and Brand | Research, flows, design system, WEB/mobile screens, store assets. |
| Backend | Core, application services, PostgreSQL, API, worker, integrations. |
| Client Applications | WEB, iOS, Android and shared generated API client. |
| Operations | Operator queue, Chatwoot, Plane, Baserow projection, SLA. |
| QA/Security/SRE | Test automation, threat/privacy, CI/CD, staging, observability, DR. |
| Legal and Compliance | Entity, terms, privacy, consent, retention, provider rules. |
| Marketing and Support | Domain/content, pilot acquisition, channels, help center and launch. |

## 8. Интегрированный roadmap

Этапы частично перекрываются. Переход через gate означает разрешение следующего
критического шага, а не завершение всех улучшений текущего потока.

### Этап 0. Program baseline and containment

Ориентир: недели 0-2.

Deliverables:

- утвержденный pilot scenario и exclusions;
- SRS backlog `Core P0` и `Client Applications MVP`;
- traceability `CJM -> requirement -> test`;
- owners, RACI, risk register and decision log;
- tracked Docker/CI baseline;
- локальные сервисы доступны только на `127.0.0.1`;
- закрыты небезопасная self-registration admin/operator, публичные demo endpoints,
  wildcard CORS, insecure handoff file permissions и persistent browser token;
- live provider mode выключен по умолчанию;
- naming/domain/store-account work запущен.

Gate `G0 - Scope and Safety`:

- P0 gaps имеют owner и acceptance criteria;
- provisional beta scope и первый сегмент утверждены;
- build/typecheck/unit/smoke воспроизводимы;
- critical prototype security blockers закрыты;
- открытые HLD вопросы перенесены в backlog.

### Этап 1. Discovery and design foundation

Ориентир: недели 0-8, параллельно с этапами 0-2.

Deliverables:

- 15-20 interviews со стороны спроса;
- 8-10 interviews/verification со стороны experts/providers;
- narrow value proposition;
- synthetic/redacted concierge walkthroughs без приема реальных SRS/PII;
- service blueprint и операционный процесс;
- information architecture and critical user flows;
- Figma foundations: tokens, typography, forms, candidate cards, status,
  trust, loading/empty/error states;
- brand/naming/trademark preliminary clearance;
- приобретенный домен после clearance;
- launch geography, legal entity/service model and data roles proposal;
- landing без ложных ссылок на недоступные приложения;
- metric dictionary draft: formula, denominator, cohort window, source and owner;
- event taxonomy and North Star proposal.

Результат этапа: hypotheses готовы к проверке. Реальные документы и
персональные данные до `D0` не принимаются.

### Этап 2. Core P0 domain completion

Ориентир: недели 2-10.

Deliverables:

- `IdentityRef`, `UserProfile`, `ProviderProfile`;
- versioned Need Intake and Clarification;
- `ContactRequest / Offer / Accept / Decline / Expire`;
- `Engagement`, Assignment and Result;
- `Artifact`, classification, ownership, access and retention metadata;
- Consent, disclosure and data masking;
- Trust, report, block and moderation baseline;
- Audit and NotificationIntent;
- authorization matrix and ownership rules;
- unit tests for all invariants and negative transitions.

Gate `G1 - Domain Review`:

- клиентский и provider CJM проходят без подмены сущностей;
- invalid transitions и privilege violations запрещены;
- Core не зависит от Chatwoot/Plane SDK;
- domain changes отражены в SRS and HLD;
- critical invariants имеют automated tests.

### Этап 3. PostgreSQL, persistence and asynchronous runtime

Ориентир: недели 8-15.

Deliverables:

- tracked `cifedra-core` compose project;
- PostgreSQL/PostGIS/pgvector;
- schemas, roles and migration pipeline;
- repositories, transaction/UoW and optimistic locking;
- object metadata and local media adapter;
- file type/size policy, malware scanning hook, checksum and quarantine flow;
- transactional outbox and webhook inbox;
- `apps/worker`, retry, dead-letter and reconciliation;
- synthetic seeds and repeatable environment reset;
- backup/restore baseline.

Gate `G2 - Data and Reliability Review`:

- state сохраняется после restart;
- concurrent updates не теряются;
- duplicate commands/webhooks не создают duplicate state;
- provider outage не отменяет Core transaction;
- migration and restore rehearsal успешны;
- API больше не вызывает external providers напрямую.

### Этап 3A. Pilot Data Readiness and controlled concierge pilot

Ориентир: недели 12-20, после `G2`; API work может продолжаться параллельно.

Gate `D0 - Real Data Pilot Readiness` до первого реального документа:

- launch geography and applicable law approved;
- legal entity or documented interim operator approved;
- controller/processor and expert/service-provider roles defined;
- Terms, Privacy, NDA/confidentiality and provider terms available;
- consent/disclosure, retention/deletion and incident process approved;
- pilot environment, access list, audit and deletion procedure verified;
- secure artifact flow covers classification, redaction, malware scan, ACL,
  download, expert use, subprocessors, backup retention and deletion;
- metric dictionary and pilot protocol approved.

Controlled pilot after `D0`:

- 5-10 completed cases in first cohort;
- cumulative expansion to 20-30 only after cohort review;
- 8+ verified experts/providers;
- paid/unpaid status explicitly recorded;
- manual matching and operations measured.

Gate `P1 - Problem and Offer Evidence`:

- case/completion/useful outcome definitions are applied consistently;
- users provide sufficient context through approved flow;
- supply coverage and provider acceptance are measured;
- useful outcome and repeat intent have evidence;
- support effort and economics direction are understood;
- final public vertical scope and automation priorities approved.

### Этап 4. Versioned API, CI/CD and identity

Ориентир: недели 13-20.

Deliverables:

- application services and DTO boundary;
- `/api/v1`, OpenAPI 3.1 and generated client;
- RFC 9457 errors, pagination, ETag/expectedVersion and Idempotency-Key;
- request validation, limits, timeouts and rate limiting;
- Keycloak realm-as-code;
- WEB/mobile/API/ops clients and JWT/JWKS validation;
- CI pipeline: lint, typecheck, tests, coverage, contract compatibility,
  migrations, security scans and build;
- artifact registry, SBOM and release versioning.

Gate `G3 - Contract and Security Review`:

- MVP API contract versioned and compatibility-tested;
- local auth остается только test adapter;
- IDOR/privilege escalation tests проходят;
- no critical/high security findings;
- generated client используется тестовым consumer.

### Этап 5. WEB vertical slice, operations and integrations

Ориентир: недели 17-26.

Deliverables:

- `apps/web` responsive shell;
- complete WEB flow from Need to Result;
- Keycloak WEB auth;
- Chatwoot and Plane adapters через worker;
- signed webhook ingress;
- operator queue/manual match/escalation;
- Baserow projection только при подтвержденной пользе;
- mock notification/calendar/payment providers;
- product analytics instrumentation;
- accessibility and cross-browser baseline.

Gate `G4 - WEB Internal UAT Readiness`:

- WEB проходит critical CJM end-to-end во внутреннем/local UAT;
- provider failure does not corrupt Core state;
- operator может обработать stuck/manual case;
- analytics events проходят data/PII review;
- responsive, accessibility and security tests проходят;
- support and deletion flows доступны.

`G4` не разрешает external beta or real production users.

### Этап 6. Mobile iOS/Android and shared client quality

Ориентир: недели 23-33.

Deliverables:

- Expo application;
- iOS and Android builds;
- generated API client;
- OIDC PKCE and secure token storage;
- direction/Need/match/decision/prepare/connect/result;
- deep links and notification handling;
- device matrix and mobile accessibility;
- TestFlight internal beta;
- Google Play internal and closed testing;
- synchronized state between WEB and mobile.

Gate `G5 - Client Applications MVP`:

- WEB, iOS and Android используют один API contract;
- critical CJM passes on supported platforms;
- нет provider credentials in clients;
- account deletion доступно in-app and on WEB;
- no open Sev-1/Sev-2;
- support feedback channel работает.

### Этап 7. Infrastructure decision, staging, NFR and external closed beta

Ориентир: недели 27-36.

Gate `I0 - Infrastructure and Capacity Decision`:

- approved sizing assumptions;
- managed/self-hosted PostgreSQL and hosting decision;
- network, secrets, object storage and observability topology;
- cost estimate and owners;
- HLD/ADR updated before provisioning.

Staging deliverables:

- production-like staging based on approved topology;
- TLS and environment-specific secrets;
- object storage, PITR and restore automation;
- logs, metrics, traces, dashboards and alerts;
- agreed MAU/RPS/media sizing, SLO, error budget, RTO/RPO;
- load, soak, failover, security and restore reports;
- legal pages and data inventory;
- privacy labels/Data Safety drafts;
- incident, rollback and support runbooks.

Gate `G6 - External Beta Entry`:

- SLO выполняется при согласованной нагрузке;
- restore укладывается в RTO/RPO;
- privacy/security/legal review подписан;
- staging soak стабилен;
- independent penetration test completed, or documented risk acceptance signed
  by Product/Security/Engineering owners;
- beta has separate DB, Keycloak realm, buckets, secrets and provider accounts;
- incident tabletop and status communication drill completed;
- canary and rollback rehearsed.

External closed beta after `G6`:

- allowlisted users only;
- evidence pack collected;
- architecture changes from beta incorporated;
- affected security/load/restore/regression gates rerun.

### Этап 8. Store submission and production launch preparation

Ориентир: недели 34-38.

Deliverables:

- verified Apple/Google organization accounts;
- icons, screenshots, descriptions, keywords and review notes;
- privacy/support/deletion URLs;
- production DNS/TLS and redirects;
- App Store/TestFlight and Google Play submissions;
- launch content and support schedule;
- release notes and known limitations.

Gate `G7 - Production Go/No-Go` выполняется до production rollout:

- no open release-blocking defects;
- support/on-call staffed;
- store and legal checklists complete;
- supply can serve planned demand;
- dashboards and stop conditions active;
- rollback is executable.

Production launch после `G7`:

- backend/WEB: internal -> 5% -> 25% -> 50% -> 100%;
- first mobile publication: controlled geography/audience where supported,
  feature flags, allowlists, remote kill switches and conservative marketing;
- mobile updates may use store phased/staged rollout, but the first release is
  not assumed to support percentage rollback;
- API supports compatibility window and minimum supported client version;
- bad mobile build is mitigated by server-side feature disable and compatible
  API, not by instant uninstall/rollback.

### Этап 9. Stabilization and next vertical

Ориентир: первые 4-6 недель после launch.

Deliverables:

- daily launch review during first week;
- defect and support trend;
- funnel and useful outcome analysis;
- cost and operational effort per case;
- post-launch architecture review;
- roadmap decision: improve Work, expand Skills or pause.

Gate `G8 - Scale Decision`:

- useful outcome and retention targets met;
- unit economics direction understood;
- support and safety load acceptable;
- architecture scaling decision evidence-based;
- next vertical approved separately.

## 9. Architecture correction loop

Архитектура рассматривается как versioned baseline.

```text
Hypothesis
  -> Prototype / Spike
  -> Automated or Pilot Test
  -> Evidence
  -> Architecture Review
  -> ADR/HLD/SRS/OpenAPI update
  -> Backlog and Migration Plan
  -> Implementation
```

### 9.1 Обязательный architecture review

Проводится:

- раз в две недели;
- перед каждым gate;
- после significant incident;
- после failed load/security/restore test;
- перед добавлением external provider;
- перед изменением source of truth, PII scope or trust boundary.

Каждое change review включает impact analysis и перечень затронутых gates.
Security/load/restore/regression evidence по затронутым границам выполняется
повторно до следующего release.

### 9.2 Классы изменений

| Класс | Пример | Действие |
| --- | --- | --- |
| A: локальное и обратимое | Index, timeout, UI composition. | Backlog + tests; ADR обычно не нужен. |
| B: contract/module change | New status, event version, module ownership. | SRS/OpenAPI/JSON Schema review, compatibility plan. |
| C: architecture boundary | New service, DB, broker, IdP/provider, PII flow. | Новый/обновленный ADR, threat/data review, migration and rollback. |
| D: product/legal boundary | Payments, Care, minors, recording, sensitive data. | Product, legal, security and architecture gate before implementation. |

### 9.3 Правила безопасной корректировки

- additive API/event changes внутри версии;
- breaking changes через новую version;
- DB changes через expand/migrate/contract;
- feature flags for incomplete/new behavior;
- no direct production-only manual schema changes;
- test and documentation change in the same pull request;
- architecture decision owner and review date;
- old path removed only after telemetry confirms migration.

## 10. Critical path and parallel work

Critical path:

```text
Core P0
  -> PostgreSQL/repositories
  -> outbox/inbox/worker
  -> API/OpenAPI
  -> Keycloak
  -> WEB reference flow
  -> mobile
  -> staging/NFR
  -> production
```

Можно выполнять параллельно:

- discovery, naming, domain and legal setup с Core work;
- design foundations с SRS/domain modeling;
- infrastructure/IaC после data boundary;
- store-account verification заранее;
- marketing content после подтверждения value proposition;
- mobile technical spike after draft OpenAPI, product implementation after
  contract gate.

Нельзя делать:

- product clients на `/demo/*`;
- Keycloak integration до IdentityRef/Profile boundary;
- live provider calls до outbox/worker;
- production promotion до restore/rollback;
- paid acquisition до supply and support readiness;
- public Life/Care до safety gate;
- PSP до legal/financial SRS.

## 11. Команда и ответственность

Минимальные роли:

| Роль | Ответственность |
| --- | --- |
| Product Owner | Scope, priority, value and go/no-go. |
| System Analyst | CJM, SRS, traceability, contracts and acceptance criteria. |
| Solution Architect | HLD/ADR, cross-cutting boundaries and architecture gates. |
| Backend Engineers | Core, data, API, worker and adapters. |
| WEB Engineer | Client WEB and accessibility. |
| Mobile Engineer | Expo iOS/Android and stores. |
| QA Automation | Test strategy, automation and release evidence. |
| DevOps/SRE | Environments, CI/CD, observability, backup and rollout. |
| UX/UI Designer | Research, flows, design system and store assets. |
| Security/Privacy | Threat model, data map, reviews and incidents. |
| Operations/Support | Concierge, SLA, runbooks and feedback. |
| Marketing/Growth | Positioning, content, acquisition and funnel. |

Если один человек совмещает роли, gate и artifacts не отменяются.

## 12. Домен, accounts and external expenses

### 12.1 Домен

Домен покупается в этапе 0-1, после naming/trademark clearance.

Требования:

- registrant оформлен на владельца продукта/юридическое лицо;
- ICANN-accredited registrar;
- 2FA, registrar lock, recovery contacts and auto-renew;
- единый password manager and access register;
- DNS zones: apex/www, `app`, `api`, `help`, `status`;
- corporate email and SPF/DKIM/DMARC;
- TLS and DNS monitoring;
- redirects `/ios`, `/android`;
- домен и renewal не зависят от личного аккаунта подрядчика.

На 2026-06-20 DNS records для `cifedra.app` не обнаружены локальной проверкой.
Это не доказывает доступность регистрации: registrar/ICANN lookup и trademark
review обязательны перед покупкой.

### 12.2 Store accounts

- Apple Developer Program: 99 USD per membership year; regional price may vary.
- Google Play Console: 25 USD one-time registration fee.
- Для organization accounts заранее нужны legal entity data, public contacts,
  website and verification documents.
- Если используется новый personal Google Play account, production access
  требует closed test: минимум 12 opted-in testers в течение 14 continuous days.
- Organization accounts предпочтительнее создавать на продукт/компанию, а не
  на личного разработчика.

### 12.3 Категории бюджета

| Категория | Когда утверждается |
| --- | --- |
| Domain, DNS, corporate email | G0/P1. |
| Trademark/naming and legal review | P1. |
| Figma/design production and research | G0-G4. |
| Apple/Google accounts | Не позже G3. |
| Hosting, PostgreSQL, object storage, monitoring | Proposal G3, approval G5. |
| Email/SMS/push providers | G4-G5. |
| Security testing and legal/privacy | G3-G6. |
| Store assets and localization | G5-G7. |
| Pilot operations and provider payments | P1-G8. |
| Marketing experiments | После evidence gate; paid acquisition after G6. |

Infrastructure cost нельзя утверждать без sizing. Labor budget считается
отдельно по team capacity и выбранному sourcing model.

Domain critical path:

- owner: Product/Legal;
- deadline naming shortlist: конец недели 1;
- clearance and registrant model: конец недели 2;
- reserve primary and at least one defensive/fallback domain immediately after
  clearance;
- if preferred name fails, select from pre-approved alternative name/TLD list;
- store organization verification starts only after legal entity, domain and
  public website data are consistent.

## 13. Управление программой

Cadence:

- weekly delivery/status review;
- biweekly sprint demo and architecture review;
- monthly product/financial review;
- gate review по завершении этапа;
- quarterly roadmap and risk refresh after production.

Обязательные registers:

- requirements and traceability;
- ADR and decision log;
- risks/dependencies;
- defects and security findings;
- data classification/retention;
- integrations and licenses;
- metrics and experiments;
- release/change log.

## 14. Метрики программы

Delivery:

- lead time, escaped defects, deployment frequency;
- test pass/coverage for critical modules;
- migration/rollback success;
- architecture decision age and unresolved risks.

Product:

- completed Need intake;
- time to first qualified match;
- contact request acceptance;
- engagement completion;
- confirmed useful outcome;
- repeat Need/referral.

Operations:

- fill rate;
- provider response time;
- operator minutes per case;
- support SLA;
- complaint/deletion SLA;
- dead-letter and reconciliation drift.

Economics:

- revenue per completed case;
- provider and support cost;
- gross margin;
- activated Need acquisition cost;
- repeat contribution.

## 15. Ближайшие 30 дней

### Неделя 1

1. Утвердить первый pilot scenario and exclusions.
2. Назначить owners and RACI.
3. Завести SRS `Core P0` и `Client Applications MVP`.
4. Закрыть prototype security blockers.
5. Добавить CI baseline.
6. Запустить naming/trademark/domain check.
7. Определить launch geography and legal model owner.

### Неделя 2

1. Провести первые demand/provider interviews.
2. Спроектировать aggregates Identity/Profile/Need/Clarification.
3. Подготовить tracked PostgreSQL compose and migration spike.
4. Создать Figma information architecture and critical flows.
5. Создать risk, data and analytics event registers.

### Недели 3-4

1. Реализовать первый Core P0 increment.
2. Провести только synthetic/redacted concierge walkthroughs до `D0`.
3. Утвердить domain and developer account owner model.
4. Подготовить design system foundations.
5. Сформировать CI ephemeral PostgreSQL test.
6. Провести первый architecture evidence review и обновить план.

## 16. Источники внешних требований

- [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/).
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
- [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/).
- [Apple upcoming submission requirements](https://developer.apple.com/news/upcoming-requirements/).
- [Apple third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/).
- [Apple TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
- [Google Play Console setup](https://support.google.com/googleplay/android-developer/answer/6112435).
- [Google Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
- [Google Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469).
- [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
- [Google Play app review preparation](https://support.google.com/googleplay/android-developer/answer/9859455).
- [ICANN domain registration](https://www.icann.org/resources/pages/register-domain-name-2017-06-20-en).
