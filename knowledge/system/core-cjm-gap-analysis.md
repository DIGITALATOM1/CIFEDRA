# CIFEDRA Core: аудит CJM и функциональных gaps

Дата: 2026-06-20
Статус: core gap analysis v0.1

## Источники аудита

- [CJM по направлениям](../product/cjm-scenarios-gap-analysis.md).
- [CJM по ролям](../product/cjm-by-roles.md).
- [Карта направлений и решений](../platforms/cifedra-connect-direction-solution-map.md).
- [Архитектура модифицируемых решений](../platforms/cifedra-connect-modifiable-solution-architecture.md).
- [План mobile](./mobile-build-plan.md).
- [План auth](./auth-integration-plan.md).
- [План задач и чата](./task-chat-integration-plan.md).
- Текущая реализация `packages/core` и `apps/api`.

## Итог

Ядро уже проверяет happy path:

```text
Need -> Match -> Decision -> Prepare -> Conversation -> Result
```

Но CJM требует более полного процесса:

```text
Identity
  -> Profile
  -> Need Intake
  -> Clarification
  -> Match Run
  -> Client Decision
  -> Contact Request
  -> Provider Acceptance
  -> Consent / Prepare
  -> Conversation
  -> Engagement / Booking / Assignment
  -> Result / Proof
  -> Review / Reputation / Repeat
```

До client API нельзя считать доменную модель стабильной: сейчас отсутствуют
агрегаты между `Decision` и `Conversation`, а также между `Conversation` и
`Result`.

## Матрица покрытия CJM

| Область | Текущая реализация | Gap | Приоритет |
| --- | --- | --- | --- |
| Identity | `AuthUser`, `AuthPrincipal`, local bearer session. | Нет provider-neutral identity key, MFA/reset/verification, device/session model. | P0 platform. |
| Authorization | Четыре роли в token claims. | Нет ownership, permission policy, organization membership, resource scopes. | P0 core. |
| Profile | `Profile` используется для fixtures и matching. | Нет lifecycle, owner, visibility, preferences, language, timezone, verification status. | P0. |
| Need Intake | Generic `NeedInput` и direction matching context. | Нет versioned schemas, обязательных полей по категории, вложений, completeness. | P0. |
| Clarification | В brief есть вопросы. | Нет сущности вопроса/ответа, readiness и перехода `needs_clarification`. | P0. |
| Match | Direction-specific scoring и breakdown. | Нет `MatchRun`, версии алгоритма, ручного override и feedback calibration. | P1. |
| Client Decision | Decision/Shortlist существуют. | Нет persistence, undo/history и actor ownership. | P0. |
| Provider Decision | Нет. | Нужны contact offer, accept/decline, expiry, counterproposal. | P0. |
| Prepare / Consent | ConversationBrief существует. | Нет consent, disclosure policy и маскирования персональных данных. | P0. |
| Conversation | Draft/state/external ref существуют. | Нет participants, messages, attachments, unread, SLA, webhook events. | P1. |
| Execution | Только workflow/handoff в Plane. | Нет engagement, assignment, task/session status, booking, cancellation. | P0. |
| Result | ContactResult и quality signal существуют. | Нет direction outcome schemas, artifacts/proof, dispute/reopen. | P1. |
| Trust & Safety | Статический `TrustSignal`. | Нет verification case, report, block, moderation, risk policy. | P0. |
| Notifications | Нет. | Нужны domain notification intents и user preferences. | P0. |
| Organization | Нет. | Нужны tenant, membership, invitation, company knowledge permissions. | P1. |
| Languages | Только свободные tags/capabilities. | Нет locale, spoken languages, language requirement, translation metadata. | P1. |
| Voice / Media | Нет. | Нужны media asset, transcript, translation status и consent. | P1. |
| Persistence | Runtime/local files. | Нет repository ports, transactions, optimistic locking, migrations. | P0. |
| Events / Integrations | Handoff создается напрямую. | Нет domain events, outbox, webhook deduplication, status mapping. | P0. |
| Audit | Нет. | Нет actor/action/resource trail и privacy disclosure history. | P0. |
| Retention | Только next step/quality signal. | Нет history, favorites, reusable need templates, repeat flow. | P2. |

## Главный доменный разрыв

Сейчас `NeedStatus` пытается описать весь путь:

```text
draft -> ready_for_match -> matched -> connected -> resolved
```

После CJM-аудита это недостаточно. Не нужно бесконечно расширять один статус.
Процесс следует разделить на несколько lifecycle:

### Need

```text
draft
  -> needs_clarification
  -> ready_for_match
  -> matching
  -> matched
  -> closed
```

Дополнительные terminal states: `cancelled`, `expired`.

### Contact Request

```text
draft -> requested -> accepted
                   -> declined
                   -> expired
                   -> cancelled
```

### Engagement

```text
planned -> in_progress -> blocked -> completed
                              \----> cancelled
```

### Moderation Case

```text
opened -> reviewing -> action_required -> resolved
                                  \----> rejected
```

Conversation остается отдельным communication lifecycle и не должна заменять
contact acceptance или execution.

## Новые core-модули

| Модуль | Основные сущности и функции |
| --- | --- |
| `identity.ts` | `IdentityRef`, provider/issuer/subject, principal claims normalization. |
| `authorization.ts` | `Permission`, ownership, policy checks, organization scopes. |
| `profile.ts` | `UserProfile`, `ProviderProfile`, visibility, preferences, languages, timezone. |
| `availability.ts` | Service area, time slots, remote/on-site formats, exceptions. |
| `intake.ts` | `NeedSchema`, fields, answers, completeness and validation. |
| `clarification.ts` | Question, answer, requester, resolution and readiness. |
| `contact-request.ts` | Offer, accept/decline, expiry, cancellation, selected candidate. |
| `consent.ts` | Consent purpose/version, disclosure permission, revocation. |
| `engagement.ts` | Assignment, booking/task/session, status, deadline and cancellation. |
| `artifact.ts` | Attachment, result artifact, proof, source and access policy. |
| `trust.ts` | Verification, risk flags, report, block and moderation case. |
| `notification.ts` | Notification intent, channel, recipient and preference. |
| `organization.ts` | Organization, membership, invitation and organization roles. |
| `language.ts` | Locale, language proficiency/requirement, translation metadata. |
| `media.ts` | Voice/video asset, transcript and processing status. |
| `events.ts` | Domain event envelope, idempotency key, correlation and causation IDs. |
| `repositories.ts` | Repository ports, unit of work and optimistic version. |
| `audit.ts` | Actor, action, resource, reason, timestamp and privacy trail. |

## Ключевые invariants

1. Email не является стабильным identity key. Используем `issuer + subject`.
2. Keycloak или другой IdP аутентифицирует пользователя; CIFEDRA Core принимает
   principal и проверяет продуктовые permissions.
3. Contact нельзя открыть без активного Need, выбранного кандидата и
   действующего consent.
4. Клиентское `requested_contact` не равно согласию помощника.
5. Персональные контакты и точный адрес не раскрываются до разрешенного шага.
6. Для risk-категорий можно требовать конкретный verification policy.
7. Любой внешний handoff идемпотентен и связан с `correlationId`.
8. Webhook обрабатывается один раз, даже если внешний сервис повторил событие.
9. Result относится к конкретному engagement и может содержать artifact/proof.
10. Оригинальный текст и аудио не заменяются машинным переводом или transcript.
11. Все автоматические решения должны хранить версию правила и объяснение.
12. Любое административное override требует actor и reason.

## Keycloak

### Решение

Keycloak нужен для staging/production общей авторизации, потому что CIFEDRA
имеет mobile/web clients, API, операторские роли, организации и несколько
интеграций.

Но Keycloak не является модулем `CIFEDRA Core`:

- Keycloak владеет credentials, login flows, sessions, MFA, password reset,
  email verification и federation;
- Core владеет продуктовым профилем, organization membership, permissions,
  consent, trust и бизнес-правилами;
- local file auth остается dev/test adapter до миграции.

SSO в UI Plane/Chatwoot не является P0. Пользователь CIFEDRA не должен видеть
их административный UI. Сначала adapters передают identity и события. SSO
операторов добавляется только после проверки поддержки OIDC/SAML в выбранных
редакциях этих продуктов.

## Языки, перевод и Whisper

### Решение

Whisper не является универсальным переводчиком продукта.

Он подходит для:

- голосового ввода потребности;
- voice notes в чате;
- транскрипции консультации или занятия;
- определения языка аудио;
- перевода речи в английский текст, если это отдельный сценарий.

Он не закрывает:

- локализацию интерфейса;
- перевод текстового Need/Profile/Chat на произвольный язык;
- хранение оригинала и исправлений;
- терминологические словари;
- live speech-to-speech перевод между любыми языками.

Поэтому нужны отдельные абстракции:

```text
UI i18n
Text Translation Provider
Speech Transcription Provider
Optional Speech Translation Provider
```

Core хранит language metadata, consent, original reference, transcript и
translation status, но не зависит от конкретной модели.

## Приоритетный backlog

### P0. До фиксации Client API

1. `IdentityRef` и provider-neutral principal.
2. `Profile` aggregate и ownership.
3. Direction/category `NeedSchema` и completeness.
4. `Clarification` lifecycle.
5. `ContactRequest` с accept/decline/expiry.
6. `Engagement` для task/session/local execution.
7. Consent и минимальный trust/safety policy.
8. Repository ports, optimistic version и unit of work.
9. Domain events/outbox/idempotency.
10. Authorization policies и audit.
11. Notification intents.

### P1. Для полного пилота Life / Work / Skills

1. Availability, schedule, timezone и booking.
2. Attachments, artifacts и proof of completion.
3. Organization/membership/company knowledge permissions.
4. Operator queue, SLA, escalation и manual override.
5. Direction-specific outcome schemas.
6. Reviews/reputation.
7. Language preferences и required/spoken languages.
8. Text translation metadata.
9. Voice asset/transcript provider interface.
10. Team shortlist и mutual skill match.
11. `Money`, `PriceTerms`, payment provider contract and mock provider.

### P2. После подтверждения продуктовой модели

1. Real payments, billing, payouts, refunds and disputes.
2. Direct product chat message store.
3. Learning path, homework and progress.
4. Live speech translation.
5. Recommendation learning from quality signals.
6. Favorites, repeat templates and retention automation.

## Обновленный порядок реализации

1. Iteration 6: Identity boundary, Profile, Need Intake and Clarification.
2. Iteration 7: Contact Request, Provider Acceptance and Engagement.
3. Iteration 8: Consent, Trust/Safety, Authorization and Audit.
4. Iteration 9: Repository ports, domain events, outbox and idempotency.
5. Iteration 10: Public DTO, versioned API and OpenAPI.
6. Iteration 11: Keycloak adapter and mobile OIDC flow.
7. Iteration 12: Notifications, operator queue and integration event sync.
8. Iteration 13: Languages, translation metadata and voice transcription.

## Критерий готовности Core к клиентским приложениям

Core готов к фиксации API для mobile и client WEB, когда:

- профиль и identity разделены;
- Need умеет запросить уточнение;
- выбранный кандидат может принять или отклонить контакт;
- исполнение имеет отдельный lifecycle;
- consent и permissions проверяются;
- состояние сохраняется через repository contracts;
- внешние события идемпотентны;
- API DTO не раскрывают внутренние сущности напрямую.
