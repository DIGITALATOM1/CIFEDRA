# ContactRequest PostgreSQL Evidence: 2026-06-28

Дата: 2026-06-28
Статус: completed for `N4-01`
Scope: local PostgreSQL migration, repository and smoke verification

## Summary

`ContactRequest` теперь имеет первый PostgreSQL persistence slice. Хранение
сделано по тому же паттерну, что `Need + Clarification`: индексированные поля
для запросов и `jsonb payload` как источник полной версии aggregate.

## Implementation artifacts

| Artifact | Purpose |
| --- | --- |
| `packages/postgres/migrations/002_contact_request.sql` | Creates `need.contact_requests`, indexes, runtime grants and readonly grants. |
| `packages/postgres/src/contact-request-repository.ts` | Saves and reads ContactRequest by `id`, `idempotency_key` and `need_id`. |
| `packages/postgres/src/index.ts` | Exports the ContactRequest repository. |
| `packages/postgres/test/need-repository.test.ts` | Adds integration coverage for ContactRequest persistence and optimistic conflict. |
| `packages/postgres/src/local-smoke.ts` | Extends local DB smoke with ContactRequest save/read after PostgreSQL restart. |

## Table shape

Table: `need.contact_requests`

Key persisted fields:

- references: `need_id`, `profile_id`, `decision_id`;
- actors: `client_user_profile_id`, `provider_profile_id`;
- lifecycle: `status`, `requested_at`, `expires_at`, `responded_at`,
  `cancelled_at`, `decline_reason`;
- idempotency: `idempotency_key`;
- privacy snapshots: `disclosure_snapshot`, `consent_snapshot`;
- optimistic versioning: `aggregate_version`;
- full aggregate: `payload`;
- audit timestamps: `created_at`, `updated_at`.

Indexes:

- by `need_id`;
- by `(client_user_profile_id, status)`;
- by `(provider_profile_id, status)`;
- by `(status, expires_at)` for expirable requests.

## Requirement coverage

| Requirement area | Evidence |
| --- | --- |
| ContactRequest persists. | Integration test saves and reads ContactRequest by `id`. |
| Idempotency key is stored. | Repository reads ContactRequest by `idempotency_key`. |
| Need-linked queries work. | Repository lists ContactRequests by `need_id`. |
| Optimistic versioning works. | Test saves accepted version 2 and rejects stale version 1. |
| Runtime role has no DDL. | `db:smoke` still verifies runtime DDL attempt fails with PostgreSQL permission error. |
| Runtime role can use new table. | `db:smoke` saves and reads ContactRequest using `cifedra_api`. |
| Disclosure snapshots are persisted. | Test verifies hidden contact email and no exact latitude in public brief after read. |

## Verification

```text
npm -w @cifedra/postgres run typecheck
npm -w @cifedra/postgres run test
npm -w @cifedra/postgres run build
npm run db:smoke
CIFEDRA_DATABASE_URL=postgresql://cifedra_api:cifedra_api_local_only@127.0.0.1:54327/cifedra_core npm -w @cifedra/postgres run test
npm run docs:check
npm test
npm run typecheck
npm run build
```

Result: passed.

Notes:

- `db:smoke` applied `002_contact_request.sql` and verified ContactRequest after
  PostgreSQL restart.
- Root `npm test` still skips PostgreSQL integration tests when
  `CIFEDRA_DATABASE_URL` is not set; the explicit env run above executed both
  PostgreSQL tests.
- Docker Desktop had to be started locally before `db:smoke` could connect to
  the Docker daemon.

## Remaining gaps

1. `N4-02`: add API/application service boundary for ContactRequest create,
   accept, decline, cancel and expire flows.
2. Add transaction boundary that persists Need/contact-domain changes and
   future outbox event in one unit.
3. Provider ownership must move from Core fixture proxy (`providerProfileId`) to
   API/auth ownership validation before production data.
4. OpenAPI/DTO contract is still pending for WEB/mobile clients.
