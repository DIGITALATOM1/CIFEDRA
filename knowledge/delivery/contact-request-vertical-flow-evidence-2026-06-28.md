# ContactRequest Vertical Flow Evidence: 2026-06-28

Дата: 2026-06-28
Статус: completed for `N2-02` and `N3-02`
Scope: local Core/API/diagnostics integration

## Summary

`requested_contact` теперь создает явный `ContactRequest`, а не означает
принятие исполнителем или старт оказания услуги.

Проверяемая цепочка для Life / Work / Skills:

```text
Ready for Match
  -> candidate decisions
  -> latest requested_contact decision
  -> ContactRequest requested
  -> consent/disclosure snapshot
```

## Implementation artifacts

| Artifact | Purpose |
| --- | --- |
| `packages/core/src/contact-request.ts` | Helper `createContactRequestFromLatestDecision` selects the latest decision for the selected Need/candidate pair and delegates lifecycle validation to `ContactRequest`. |
| `packages/core/src/vertical-flows.ts` | Synthetic Life/Work/Skills flows now return `candidateDecisions`, `contactRequest` and post-match metrics. |
| `apps/api/src/server.ts` | `POST /demo/match` now returns `firstContactRequest`; `GET /demo/vertical-flows` exposes synthetic post-match request data through Core output. |
| `web/test-console/diagnostics.js` | Diagnostics page shows `ContactRequest` status and disclosure hidden-field count. |
| `scripts/local/smoke-test.mjs` | Local smoke assertions now check `ContactRequest` and disclosure masking. |

## Requirement coverage

| Requirement area | Evidence |
| --- | --- |
| `requested_contact` is explicit client intent. | `createContactRequestFromLatestDecision` requires the latest selected decision to be `requested_contact`; saved/non-contact decisions fail. |
| Provider acceptance is not implied. | Created request starts as `requested`; existing `accepted` transition still requires provider action. |
| Latest decision is authoritative. | Unit test covers `saved` followed by `requested_contact`; ContactRequest references the latest decision id. |
| Safe pre-accept disclosure. | ContactRequest disclosure snapshot hides contact fields and exact coordinates; tests assert no `latitude` in public brief. |
| Local vertical flows remain synthetic. | Life/Work/Skills use repository-owned fixtures and deterministic synthetic expiry. |
| API demo boundary exposes post-match state. | `/demo/match` returns `firstContactRequest` while keeping legacy `firstConversationDraft` for local handoff compatibility. |

## Verification

```text
npm -w @cifedra/core run test
npm -w @cifedra/core run typecheck
npm run docs:check
npm test
npm run typecheck
npm run build
```

Result: passed.

Notes:

- Core tests: 41 passed.
- PostgreSQL integration test was skipped because `CIFEDRA_DATABASE_URL` was not
  configured in this shell.
- API test passed and now checks ContactRequest status/disclosure on demo
  endpoints.
- `clarification.test.ts` now uses fixed test time in the reopen scenario; this
  removes date sensitivity caused by a fixture deadline that is before
  2026-06-28.

## Remaining gaps

1. `ContactRequest` is still in-memory in local Core/API flows.
2. `N4-01`: add PostgreSQL migration and repository slice for ContactRequest.
3. `N4-02`: add application service boundary for create/accept/decline/cancel.
4. Provider ownership is still checked by `providerProfileId` inside Core; real
   user-to-provider ownership must be enforced at API/auth boundary.
5. Chatwoot/Plane adapters must consume domain events after Engagement baseline,
   not mutate Core state directly.
