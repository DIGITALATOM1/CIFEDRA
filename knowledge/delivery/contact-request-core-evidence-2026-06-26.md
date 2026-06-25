# ContactRequest Core Evidence: 2026-06-26

Дата: 2026-06-26
Статус: completed for N2-01; consent/disclosure domain baseline completed for N3-01
Scope: local Core domain implementation

## Summary

Implemented the first Core `ContactRequest` aggregate:

```text
requested -> accepted
          -> declined
          -> expired
          -> cancelled
```

The aggregate is created from a client `requested_contact` decision, remains in
`requested` until provider response, and carries consent/disclosure snapshots so
provider-facing brief does not expose contact details or exact coordinates.

## Implementation artifacts

| Artifact | Purpose |
| --- | --- |
| `packages/core/src/contact-request.ts` | ContactRequest types, creation, accept/decline/cancel/expire transitions and disclosure snapshot builder. |
| `packages/core/src/index.ts` | Public package export for the new domain module. |
| `packages/core/test/core.test.ts` | Unit tests for creation, disclosure masking, valid transitions and invalid actors/inputs. |

## Requirement coverage

| Requirement area | Evidence |
| --- | --- |
| Client request is not provider acceptance. | Created request starts as `requested`; `accepted` requires provider action. |
| Creation requires `requested_contact`. | Invalid `saved` decision is rejected. |
| Client ownership. | Non-owner client cannot create/cancel ContactRequest. |
| Provider ownership proxy. | Only selected `providerProfileId` can accept/decline in current Core fixture model. |
| Terminal states. | Accept, decline, cancel and expire move to terminal states; accepted request cannot be cancelled. |
| Expiry. | Due request can expire; repeated expiry of expired request is idempotent. |
| Disclosure. | Public brief contains safe service region and variants; exact coordinates remain hidden. |
| Optimistic version readiness. | `aggregateVersion` starts at 1 and increments on transition. |

## Verification

```text
npm run docs:check
npm test
npm run typecheck
npm run build
```

Result: passed.

Notes:

- Core tests: 40 passed.
- PostgreSQL integration test was skipped because `CIFEDRA_DATABASE_URL` was not
  configured in this shell.
- API tests passed; API routes for ContactRequest are not implemented yet.

## Remaining gaps

1. N2-02: integrate `requested_contact` decision into vertical flow
   ContactRequest creation.
2. N3-02: update Life/Work/Skills local vertical flows to include
   ContactRequest after match.
3. N4-01: add PostgreSQL migration and repository slice.
4. N4-02/N5-01: expose API boundary and DTO/OpenAPI draft.
5. Provider ownership currently uses `providerProfileId` because demo match
   profiles do not carry `ownerUserProfileId`; real ProviderProfile ownership
   should be enforced at application/auth boundary.
