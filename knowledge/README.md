# NEWLIFE Knowledge Base

База знаний проекта хранит рабочие решения, SRS-материалы, архитектурные заметки, руководства, инструкции и планы развития направлений.

## Разделы

| Раздел | Назначение |
| --- | --- |
| `platforms/` | Выбор платформ, интеграций, стеков и архитектурных гипотез. |
| `system/` | Системная архитектура, доменная модель, API-контракты и проектные blueprint-документы. |
| `srs/` | Постановки, шаблоны SRS, реестр требований и ревью требований. |
| `product/` | Продуктовые гипотезы, сценарии, CJM, сегменты пользователей, метрики. |
| `business/` | Бизнес-анализ, процессы, роли, регламенты, модели ценности. |
| `research/` | Интервью, usability research, обезличенные notes и evidence synthesis. |
| `delivery/` | Sprint backlog, decision log, risk register и evidence packs. |
| `support/` | Руководства, инструкции, release notes, эксплуатационные материалы. |
| `agents/` | Зарезервировано для внутренних проектных помощников; не является продуктовым scope CIFEDRA. |
| `adr/` | Утвержденные Architecture Decision Records и история изменения решений. |

## Актуальные рабочие документы

| Документ | Назначение |
| --- | --- |
| [product/cjm-scenarios-gap-analysis.md](./product/cjm-scenarios-gap-analysis.md) | CJM по направлениям `Life`, `Work`, `Skills` и реестр неучтенных функций. |
| [product/cjm-by-roles.md](./product/cjm-by-roles.md) | CJM клиента, помощника, оператора, администратора, организации и аналитика. |
| [product/cifedra-product-strategy-product-owner-review-2026-06-26.md](./product/cifedra-product-strategy-product-owner-review-2026-06-26.md) | Product strategy draft, Vision Board and CJM review package handed to product owner. |
| [srs/README.md](./srs/README.md) | Реестр SRS, acceptance criteria и traceability. |
| [srs/core-p0-identity-profile-intake-clarification.md](./srs/core-p0-identity-profile-intake-clarification.md) | SRS первого Core P0 increment. |
| [srs/core-p1-contact-request-consent.md](./srs/core-p1-contact-request-consent.md) | SRS первого post-match increment: ContactRequest, consent and disclosure baseline. |
| [product/cifedra-service-platform-product-scope.md](./product/cifedra-service-platform-product-scope.md) | Стратегический scope универсальной платформы услуг Life / Work / Skills. |
| [product/work-srs-review-product-brief.md](./product/work-srs-review-product-brief.md) | Provisional scope и оффер первого сценария Work / SRS Review. |
| [research/work-srs-review-interview-kit.md](./research/work-srs-review-interview-kit.md) | Скрипты, target slots и правила первых client/expert interviews. |
| [delivery/sprint-2026-06-22-backlog.md](./delivery/sprint-2026-06-22-backlog.md) | Исполнимый backlog текущего двухнедельного спринта. |
| [delivery/sprint-r0-evidence-review-2026-06-26.md](./delivery/sprint-r0-evidence-review-2026-06-26.md) | R0 evidence review and gate decision по Core P0 local increment. |
| [delivery/contact-request-srs-evidence-2026-06-26.md](./delivery/contact-request-srs-evidence-2026-06-26.md) | Evidence по `ContactRequest` SRS and consent/disclosure baseline. |
| [delivery/contact-request-core-evidence-2026-06-26.md](./delivery/contact-request-core-evidence-2026-06-26.md) | Evidence по Core implementation of `ContactRequest` aggregate. |
| [delivery/contact-request-vertical-flow-evidence-2026-06-28.md](./delivery/contact-request-vertical-flow-evidence-2026-06-28.md) | Evidence по связке `requested_contact`, ContactRequest and Life / Work / Skills vertical flows. |
| [delivery/sprint-2026-07-06-backlog.md](./delivery/sprint-2026-07-06-backlog.md) | Proposed backlog следующего спринта после R0. |
| [delivery/parallel-development-plan-2026-06-27.md](./delivery/parallel-development-plan-2026-06-27.md) | Parallel development plan while product owner reviews product strategy draft. |
| [delivery/decision-log.md](./delivery/decision-log.md) | Реестр продуктовых и delivery-решений. |
| [delivery/risk-register.md](./delivery/risk-register.md) | Активный реестр рисков программы. |
| [delivery/security-baseline-evidence-2026-06-21.md](./delivery/security-baseline-evidence-2026-06-21.md) | Evidence по локальному security increment Day 3. |
| [delivery/identity-profile-evidence-2026-06-25.md](./delivery/identity-profile-evidence-2026-06-25.md) | Evidence по `IdentityRef`, `UserProfile`, `ProviderProfile` and language metadata. |
| [delivery/need-schema-evidence-2026-06-25.md](./delivery/need-schema-evidence-2026-06-25.md) | Evidence по versioned `NeedSchema`, completeness and matching guard. |
| [delivery/clarification-evidence-2026-06-25.md](./delivery/clarification-evidence-2026-06-25.md) | Evidence по `Clarification` lifecycle, readiness reassessment and answer history. |
| [delivery/postgres-evidence-2026-06-26.md](./delivery/postgres-evidence-2026-06-26.md) | Evidence по local PostgreSQL compose, migrations, roles and repository spike. |
| [delivery/vertical-flow-evidence-2026-06-26.md](./delivery/vertical-flow-evidence-2026-06-26.md) | Evidence по Life / Work / Skills vertical flows and local UAT metrics. |
| [system/cifedra-hld.md](./system/cifedra-hld.md) | Формальный High-Level Design решения. |
| [system/cifedra-target-architecture.md](./system/cifedra-target-architecture.md) | Каноническая архитектура локального и production-контуров. |
| [system/cifedra-development-implementation-master-plan.md](./system/cifedra-development-implementation-master-plan.md) | Интегрированный roadmap разработки, внедрения и запуска. |
| [system/cifedra-two-week-execution-plan-2026-06-22.md](./system/cifedra-two-week-execution-plan-2026-06-22.md) | Исполнимый план на 22 июня - 3 июля 2026 для владельца продукта и Codex. |
| [system/cifedra-quality-release-plan.md](./system/cifedra-quality-release-plan.md) | QA, security, environments, CI/CD, beta и production rollout. |
| [system/core-cjm-gap-analysis.md](./system/core-cjm-gap-analysis.md) | Сопоставление CJM с текущим Core и план закрытия gaps. |
| [system/multilingual-voice-plan.md](./system/multilingual-voice-plan.md) | Языки, перевод, Whisper и voice scenarios. |
| [system/web-client-build-plan.md](./system/web-client-build-plan.md) | Клиентское WEB-приложение, стек, границы и этапы реализации. |
| [product/cifedra-product-design-go-to-market-plan.md](./product/cifedra-product-design-go-to-market-plan.md) | Discovery, дизайн, домен, legal, marketing и go-to-market. |
| [adr/README.md](./adr/README.md) | Реестр утвержденных архитектурных решений. |

## Правило структуры

Каждое новое решение фиксируется в своем разделе как отдельный документ с датой, статусом, контекстом, решением, альтернативами, рисками и следующими задачами проектирования.
