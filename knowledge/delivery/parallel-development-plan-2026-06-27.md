# CIFEDRA Parallel Development Plan: 2026-06-27

Дата создания: 2026-06-26
Статус: ready for next session
Контекст: product owner fills product strategy DOCX in parallel

## Цель

Продолжить разработку CIFEDRA по уже известным решениям, пока продакт отвечает
на вопросы в продуктовой стратегии и правит CJM. Продуктовый review не
останавливает Core/API work, но его ответы могут изменить backlog через
decision log, SRS and HLD.

## Current baseline

Already completed and pushed:

- Core P0 local gate passed.
- PostgreSQL persistence spike for `Need + Clarification`.
- Synthetic Life/Work/Skills vertical flows to `ready_for_match`.
- `ContactRequest` SRS and Core domain baseline.
- Consent/disclosure snapshot baseline in Core.
- Product owner review DOCX prepared in Russian.

Current branch:

```text
main
```

Remote:

```text
origin git@github.com:DIGITALATOM1/CIFEDRA.git
```

## Non-blocking product assumptions for development

These assumptions allow engineering to continue locally:

1. Work / Quick SRS Review remains first external market baseline.
2. Life combined service uses one Need when one provider/visit can satisfy all
   variants; otherwise ask the client before linked Needs.
3. `ContactRequest` response supports explicit `expiresAt`; proposed product
   default is 48 hours.
4. Before provider acceptance, provider sees only safe brief fields:
   category, variant, approximate region, expected result, language and
   preferred time.
5. No real personal data, exact address, confidential files, payments or real
   service delivery in local tests.
6. Chatwoot/Plane remain adapters; CIFEDRA Core remains source of product state.

## Tomorrow implementation order

### 1. Start-of-session check

Acceptance:

- `git status --short --branch` is clean or unrelated changes are identified.
- `npm run docs:check`, `npm test`, `npm run typecheck`, `npm run build` are
  known baseline checks.
- Local service state is checked only if needed for API/local UAT.

### 2. N2-02: connect `requested_contact` decision with ContactRequest

Scope:

- Add a small Core helper/application function that creates `ContactRequest`
  from selected candidate decision.
- Ensure `requested_contact` no longer implies conversation or provider
  acceptance.
- Keep conversation/Chatwoot handoff after accepted/requested boundary
  explicit.

Acceptance:

- Unit tests cover valid creation from latest `requested_contact` decision.
- Non-contact decisions fail.
- Wrong Need/candidate/actor fails.
- Existing conversation tests still pass.

### 3. N3-02: update local vertical flows

Scope:

- Extend synthetic Life/Work/Skills vertical flow output with post-match
  ContactRequest.
- Keep all data synthetic.
- Add metrics:
  - first match;
  - first decision;
  - contactRequest status;
  - disclosure hidden fields count;
  - expiry configured or not.

Acceptance:

- `runAllSyntheticVerticalFlows()` returns ContactRequest per direction.
- API `GET /demo/vertical-flows` exposes enough post-match data for local test
  console without leaking hidden fields.
- Smoke/local checks still pass.

### 4. N4-01: PostgreSQL slice for ContactRequest

Scope:

- Add migration for `contact_requests`.
- Store references, status, timestamps, idempotency key,
  consent/disclosure snapshots and optimistic version.
- Runtime role must not need DDL.

Acceptance:

- Repository test persists and reads ContactRequest when
  `CIFEDRA_DATABASE_URL` is configured.
- Migration is idempotent through existing migration pipeline.
- Evidence doc records table shape and remaining gaps.

### 5. N4-02 starter: API application boundary

Scope only if time remains:

- Draft application service inputs/outputs for:
  - create;
  - accept;
  - decline;
  - cancel;
  - expire due.
- Do not expose unstable public `/v1` contract before repository boundary is
  clear.

Acceptance:

- DTO draft or internal service boundary documented.
- Safe actor context rule is explicit: actor ids are not accepted from request
  body as trusted identity.

### 6. Documentation and evidence

Acceptance:

- Update sprint backlog statuses.
- Add evidence pack for implemented slice.
- Update SRS/HLD only if behavior changes.
- Commit and push major completed increment.

## What to wait for from product owner

Development does not wait for these tomorrow unless a task directly touches
them:

| Product answer | Affects |
| --- | --- |
| First external market segment confirmation | Landing, discovery, UX copy, acquisition. |
| Quick Review limits and turnaround | Work intake, Result artifact, pricing. |
| Pre-accept disclosure exact fields | ContactRequest DTO/API and UI copy. |
| Life split rule final decision | Linked Needs and matching behavior. |
| Provider timeout default | API/OpenAPI default and worker expiry job. |
| Monetization model | Commerce/payment SRS, not current Core slice. |
| D0 legal/privacy readiness | Real data pilot only, not synthetic local work. |

## Stop conditions

Stop or re-plan development if:

- implementation would require real personal data or confidential documents;
- a new product answer changes `ContactRequest` lifecycle states;
- API work would expose contacts/address before consent policy is finalized;
- local tests require external production services;
- unrelated user changes conflict with files being edited.

## End-of-day target

Preferred outcome for the next session:

1. Life/Work/Skills synthetic flows include ContactRequest.
2. Core tests cover creation and invalid transitions through the integrated
   flow.
3. PostgreSQL migration/repository slice is started or completed.
4. Evidence and backlog are updated.
5. All completed work is committed and pushed.
