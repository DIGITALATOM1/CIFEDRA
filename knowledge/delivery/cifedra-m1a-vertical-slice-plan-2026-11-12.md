# CIFEDRA: M1a vertical slice plan

Дата: 2026-11-12
Статус: ready for backlog decomposition
Сценарий: `Work / Quick Review` на synthetic data

## 1. Цель

Первый сквозной cross-role increment:

```text
Client login
  -> persisted profile
  -> persisted Quick Review request
  -> clarification
  -> client summary confirmation
  -> versioned matching
  -> explicit client contact decision
  -> Ally inbox
  -> Ally accept/decline
  -> both boards survive reload/restart
```

M1a проверяет application boundary, ownership, persistence и две роли. Он не
закрывает полный `M1` из User Story Map: decomposition/Request Bundle остается
обязательным отдельным increment до объявления M1 завершенным.

Upstream:

- [User Story Map](../product/cifedra-user-story-map-mvp-2026-11-12.md);
- [Critical Use Cases](../srs/cifedra-mvp-critical-use-cases-2026-11-12.md);
- [MVP Architecture Delta](../system/cifedra-mvp-architecture-delta-2026-11-12.md).

## 2. Почему этот срез

- WORK Quick Review имеет наиболее зрелые Core fixtures;
- privacy/safety risk ниже, чем у реального LIFE-сценария;
- ContactRequest domain/service/repository уже частично реализованы;
- срез заставляет закрыть principal-to-profile mapping и resource API;
- результат наблюдаем двумя ролями, а не только технической консолью;
- все данные остаются synthetic; реальные документы не принимаются.

Это delivery baseline, а не доказательство market fit и не окончательное
решение `OPEN-012` о primary market vertical.

## 3. In scope

### Identity/Profile

- два local synthetic account: client и Ally;
- trusted `principal -> UserProfile -> AllyProfile` resolver;
- profile read/create/update/readiness;
- role context без передачи privileged role из payload.

### Request

- опубликованная schema `work.quick-review` version 1;
- persisted draft и answers;
- completeness и Clarification lifecycle;
- summary/review snapshot и client confirmation;
- переход `ready_for_match` только после confirmation.

### Matching/Decision

- persisted Match Run с ruleset version;
- seeded eligible Ally fixture;
- explainable candidate factors;
- explicit client Candidate Decision;
- решение не создается автоматически AI/fixture flow.

### ContactRequest

- create/query/list;
- safe brief snapshot;
- Ally inbox;
- accept/decline/cancel/expire contract;
- optimistic locking и idempotency;
- role-specific board projections.

### Quality

- state survives API/PostgreSQL restart;
- cross-owner access запрещен;
- closed fields отсутствуют в API/log/event;
- desktop and mobile-width WEB E2E.

## 4. Out of scope

- Request Bundle/decomposition — следующий обязательный M1b;
- product chat, Agreement и Disclosure Consent — M2;
- Alliance/Result/rework/dispute — M3/M4;
- real documents, addresses, contacts and people;
- Keycloak, password recovery, MFA;
- Chatwoot/Plane/Baserow as runtime dependencies;
- translation runtime, files/object storage;
- payments and public ratings.

## 5. Current-state gap

| Capability | Есть сейчас | Gap для M1a |
| --- | --- | --- |
| Local auth | register/login/me/logout | principal/profile resolver и role context |
| Profile | Core types/rules | resource API + PostgreSQL repository |
| Intake | schemas/completeness in Core | persisted resource API; убрать обход через `/demo/match` |
| Clarification | Core + repository | HTTP application service/authorization |
| Matching | scoring/shortlist | Match Run aggregate/repository/API |
| Candidate Decision | domain logic | explicit client command + persistence |
| ContactRequest | Core/service/repository and transitions | create/list/query, Ally inbox, transactional flow |
| Board | prototype UI | server-owned projection + reload/restart recovery |
| OpenAPI | `/demo/*` draft | resource-oriented `/api/v1` contracts |

Текущий checkout также содержит ранее удаленные `packages/core/src/index.ts`,
`packages/core/tsconfig.json`, `packages/postgres/src/index.ts` и
`packages/postgres/tsconfig.json`. До реализации требуется отдельно определить,
являются ли эти удаления намеренной перестройкой package boundaries; M1a нельзя
объявить зеленым без запуска Core/PostgreSQL quality gates.

## 6. API surface M1a

| Method/path | Purpose | Actor |
| --- | --- | --- |
| `GET /api/v1/me` | principal, profile IDs, available contexts | authenticated |
| `GET /api/v1/profiles/me` | own profile/readiness | authenticated |
| `PATCH /api/v1/profiles/me` | update allowed profile fields | owner |
| `POST /api/v1/requests` | create Quick Review draft | client |
| `GET /api/v1/requests` | own request list | client |
| `GET /api/v1/requests/{id}` | own request detail | owner |
| `PATCH /api/v1/requests/{id}` | update answers with expectedVersion | owner |
| `POST /api/v1/requests/{id}/clarifications/{cid}/answer` | answer gap | owner |
| `POST /api/v1/requests/{id}/confirmations` | confirm summary revision | owner |
| `POST /api/v1/requests/{id}/match-runs` | start idempotent match | owner/system policy |
| `GET /api/v1/requests/{id}/match-runs/latest` | progress/result | owner |
| `POST /api/v1/candidate-decisions` | save/reject/request contact | client |
| `POST /api/v1/contact-requests` | create from selected candidate | client |
| `GET /api/v1/contact-requests/{id}` | participant-safe view | participant |
| `GET /api/v1/ally/contact-requests` | Ally inbox | Ally owner |
| `POST /api/v1/contact-requests/{id}/accept` | accept current version | target Ally |
| `POST /api/v1/contact-requests/{id}/decline` | decline with reason | target Ally |
| `GET /api/v1/boards/client` | client read projection | client |
| `GET /api/v1/boards/ally` | Ally read projection | Ally |

Все create/command endpoint принимают idempotency/version contract по
MVP Architecture Delta. DTO не принимает actor/owner IDs, которые можно вывести
из principal и resource.

## 7. Persistence increments

Предлагаемый migration order:

1. `people.user_profile`, `people.ally_profile`, principal mapping;
2. `catalog.intake_schema` seed `work.quick-review@1`;
3. `need.ally_request`, answer/revision/confirmation;
4. существующая Clarification migration alignment;
5. `matching.match_run`, candidate snapshot, candidate decision;
6. ContactRequest migration alignment and ownership foreign keys;
7. client/Ally board query views or repository projections;
8. outbox/audit records for commands.

Каждый aggregate имеет application-generated ID, `version`, UTC timestamps и
явный owner/participant scope. Cross-module cascade delete запрещен.

## 8. Implementation order

| Step | Work item | Exit evidence |
| --- | --- | --- |
| 0 | Восстановить/утвердить package boundaries и зеленые Core tests | `typecheck`, Core/API/Postgres tests green or DB tests explicitly provisioned |
| 1 | Principal/Profile resolver + repository/API | two actors cannot access each other's profile |
| 2 | Request repository/application service/API | draft survives restart |
| 3 | Clarification + confirmation HTTP flow | incomplete request cannot match |
| 4 | Match Run + explicit Candidate Decision | decision actor is client, ruleset version stored |
| 5 | ContactRequest create/query/inbox | safe brief and participant authorization |
| 6 | Accept/decline + board projections | both boards recover state after reload |
| 7 | OpenAPI/examples and responsive WEB E2E | happy and negative E2E evidence |

WIP limit: один незавершенный vertical work item. Chat/Agreement не начинается
до прохождения M1a gate.

## 9. Test matrix

### Domain

- readiness and summary confirmation guard;
- candidate decision ownership;
- ContactRequest transitions/expiry/idempotency;
- disclosure preview does not contain closed fields.

### Repository/integration

- save/reload/version conflict for each aggregate;
- transaction rollback does not leave partial decision/request;
- duplicate idempotency key does not duplicate resources;
- state survives PostgreSQL/API restart.

### API/security

- unauthenticated `401`;
- authenticated non-participant `403`/hidden `404` by policy;
- stale version `409`;
- invalid transition `409`;
- schema validation `422`;
- client cannot accept as Ally;
- Ally cannot create client decision;
- payload cannot self-assign owner/role;
- response/log/event omit direct contacts, exact address and artifact content.

### WEB E2E

1. Client login -> create Request -> clarify -> confirm -> view candidate.
2. Client requests contact.
3. Ally login -> inbox -> accept or decline.
4. Client reload -> sees accepted/declined state.
5. Ally reload -> sees same state and no forbidden data.
6. Repeat at mobile viewport without overlap or lost action.

## 10. Definition of Done

M1a завершен, когда:

1. два независимых auth actors проходят сценарий через WEB и `/api/v1`;
2. все business state хранится в PostgreSQL и переживает restart;
3. client decision создается человеком, а не автоматически fixture/AI;
4. ContactRequest accepted/declined одинаково отображается на двух досках;
5. cross-owner and cross-role negative tests проходят;
6. version/idempotency tests проходят;
7. закрытые поля отсутствуют до будущего M2 disclosure;
8. Core, API, PostgreSQL, WEB tests/typecheck/build green;
9. OpenAPI, traceability и evidence обновлены;
10. M1a не объявляется полным M1 и не считается доказательством market fit.

## 11. Product decisions, не блокирующие M1a

- окончательный primary market vertical (`OPEN-012`);
- Quick Review commercial limit/turnaround;
- payer side и pricing model;
- real artifact upload policy;
- production identity and PSP.

Для synthetic M1a используются текущие fixture assumptions; они должны быть
явно помечены как test-only и не публикуются как рыночное обещание.
