# ContactRequest API Boundary Evidence: 2026-06-28

Дата: 2026-06-28
Статус: completed for `N4-02`
Scope: API application service boundary, repository transaction and local demo endpoints

## Summary

Добавлена application service boundary для transition-команд `ContactRequest`.
HTTP body больше не принимает actor ids: actor всегда приходит из trusted auth
context. Из body принимаются только `expectedAggregateVersion` и опциональный
`reason`.

Локальный endpoint не объявлен как стабильный public `/v1` contract. Он
доступен как demo boundary:

```text
POST /demo/contact-requests/{id}/accept
POST /demo/contact-requests/{id}/decline
POST /demo/contact-requests/{id}/cancel
POST /demo/contact-requests/{id}/expire
```

PostgreSQL store включается явно через:

```text
CIFEDRA_CONTACT_REQUEST_STORE=postgres
```

## Implementation artifacts

| Artifact | Purpose |
| --- | --- |
| `apps/api/src/contact-request-service.ts` | Application service for accept/decline/cancel/expire with auth actor, expected version and safe error mapping. |
| `apps/api/src/contact-request-store.ts` | Lazy PostgreSQL repository adapter for API boundary. |
| `apps/api/src/server.ts` | Demo HTTP endpoints and request DTO normalization. |
| `packages/postgres/src/contact-request-repository.ts` | Transactional `updateContactRequest` using `SELECT ... FOR UPDATE` and optimistic version check. |
| `packages/postgres/src/need-repository.ts` | Shared `RepositoryNotFoundError` and conflict error for application mapping. |
| `apps/api/test/contact-request-service.test.ts` | Application service tests for auth actor, stale version, forbidden actor and not found mapping. |
| `packages/postgres/test/need-repository.test.ts` | PostgreSQL test now covers transactional ContactRequest update. |
| `scripts/local/smoke-test.mjs` | Anonymous access check includes ContactRequest transition endpoint. |

## Requirement coverage

| Requirement area | Evidence |
| --- | --- |
| Actor ids do not come from body. | Service command receives `actor: AuthPrincipal` from API auth context; body contains only version/reason. |
| Versioned transition. | Endpoint requires `expectedAggregateVersion`; service rejects missing/invalid values. |
| Repository transaction. | PostgreSQL repository locks row with `FOR UPDATE`, checks expected version, applies domain transition and saves inside one transaction. |
| Safe errors. | Not found maps to 404, stale version maps to 409, forbidden actor maps to 403, invalid command maps to 400. |
| Operator cannot act for participants. | Service rejects operator cancel/participant actions; expire is limited to operator/admin local worker role. |
| Provider response remains explicit. | Accept/decline call Core `acceptContactRequest` / `declineContactRequest`; client decision still does not imply provider acceptance. |
| Store is opt-in. | API returns 503 when PostgreSQL ContactRequest store is not explicitly configured. |

## Local actor model note

Current Core demo profiles do not yet carry full ProviderProfile ownership.
For provider accept/decline in this local boundary, the temporary proxy remains:

```text
auth principal id == ContactRequest.providerProfileId
```

This must be replaced by real `ProviderProfile.ownerUserProfileId` validation
before production or external pilot data.

## Verification

```text
npm -w @cifedra/postgres run typecheck
npm -w @cifedra/postgres run build
CIFEDRA_DATABASE_URL=postgresql://cifedra_api:cifedra_api_local_only@127.0.0.1:54327/cifedra_core npm -w @cifedra/postgres run test
npm -w @cifedra/api run typecheck
npm -w @cifedra/api run test
npm run docs:check
npm test
npm run typecheck
npm run build
npm run db:smoke
```

Result: passed.

Notes:

- Root `npm test` still skips PostgreSQL integration tests when
  `CIFEDRA_DATABASE_URL` is not set; the explicit env run above executed the
  transactional PostgreSQL ContactRequest test.
- `db:smoke` verified the repository path after PostgreSQL restart with no
  pending migrations.

## Remaining gaps

1. `N5-01`: draft OpenAPI/DTO contract for WEB/mobile clients.
2. Public `/v1` endpoints are still not declared stable.
3. ContactRequest create endpoint is still demo/match-driven; explicit persisted
   create command should be finalized with OpenAPI.
4. Provider ownership must be resolved through real ProviderProfile persistence.
5. Outbox/domain events remain pending before Plane/Chatwoot production sync.
