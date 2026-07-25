# API Contract Draft Evidence: 2026-07-26

Дата: 2026-07-26
Статус: completed for `N5-01`
Scope: OpenAPI/DTO draft for local Core/API MVP, WEB and future mobile clients

## Summary

Подготовлен draft OpenAPI 3.1 contract:

```text
apps/api/openapi/cifedra-v1-draft.json
```

Контракт описывает текущий local API namespace и фиксирует DTO, которые нужны
для MVP-экрана матчинга:

```text
Auth -> NeedInput -> DemoMatchResponse
  -> MatchCandidate / CandidateDecision / Shortlist
  -> ContactRequest
  -> ConversationBrief / Conversation
  -> ContactResult / MatchQualitySignal
```

## Product decisions captured

| Decision | Accepted baseline |
| --- | --- |
| Combined Life request | Сначала спрашиваем клиента; если разные направления или нет исполнителя на весь bundle, CIFEDRA дробит на linked Needs. |
| ContactRequest timeout | Product default: 48 hours. |
| First-contact channel | Встроенный CIFEDRA messenger; Chatwoot остается support/ops adapter. |
| Pre-accept disclosure | Показываем имя клиента и описание запроса/работы; прямые контакты и точный адрес скрыты. |
| Work artifact | Structured Markdown. |

## Contract boundaries

| Area | Current path | Notes |
| --- | --- | --- |
| Auth | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout` | Local bearer-session only; future Keycloak/OIDC remains separate auth increment. |
| Catalog | `/directions` | Life/Work/Skills catalog for client UI. |
| Matching | `/demo/match` | Main local endpoint for MVP kanban board. |
| ContactRequest | `/demo/contact-requests/{id}/{action}` | Versioned transitions: accept, decline, cancel, expire. |
| Result | `/demo/result` | Synthetic quality loop after contact. |
| Integrations | `/demo/handoff`, `/integrations/status` | Plane/Chatwoot adapter boundary, not client UI. |

## Remaining gaps

1. Promote local `/demo` paths into stable `/api/v1` endpoints after persisted
   Need/Profile boundaries are ready.
2. Add explicit persisted `CreateContactRequest` endpoint outside `/demo/match`.
3. Add `Engagement` aggregate and API after provider accepts contact request.
4. Replace temporary provider proxy rule
   `auth principal id == ContactRequest.providerProfileId` with real
   `ProviderProfile.ownerUserProfileId`.
5. Add generated client once OpenAPI path namespace is stable enough for
   `apps/web` and mobile.

## Verification

```text
node -e "JSON.parse(require('node:fs').readFileSync('apps/api/openapi/cifedra-v1-draft.json','utf8'))"
npm run docs:check
```
