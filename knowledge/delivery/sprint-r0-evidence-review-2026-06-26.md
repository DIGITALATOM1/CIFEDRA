# CIFEDRA Sprint R0 Evidence Review

Дата: 2026-06-26
Статус: passed with follow-up backlog
Gate: `R0 - Sprint Evidence Review`

## Вывод

`R0` для локального Core P0 increment пройден.

Это означает, что CIFEDRA имеет проверяемую локальную основу для трех
synthetic scenarios `Life`, `Work`, `Skills`:

```text
Identity
  -> Profile
  -> Versioned Need Intake
  -> Clarification
  -> Ready for Match
  -> Match
  -> Handoff draft / Result smoke
```

Это не означает готовность production, external beta, real services, payments,
real documents or public mobile/web launch.

## Evidence pack

| Area | Evidence | Result |
| --- | --- | --- |
| Security baseline | [security-baseline-evidence-2026-06-21.md](./security-baseline-evidence-2026-06-21.md) | Local auth/API security baseline implemented. |
| Identity/Profile | [identity-profile-evidence-2026-06-25.md](./identity-profile-evidence-2026-06-25.md) | Stable `IdentityRef`, owned user/provider profiles and language metadata. |
| NeedSchema | [need-schema-evidence-2026-06-25.md](./need-schema-evidence-2026-06-25.md) | Life/Work/Skills versioned schemas and readiness guard. |
| Clarification | [clarification-evidence-2026-06-25.md](./clarification-evidence-2026-06-25.md) | Blocking clarification, owner answer and atomic readiness reassessment. |
| PostgreSQL spike | [postgres-evidence-2026-06-26.md](./postgres-evidence-2026-06-26.md) | Local PostgreSQL 18, migrations, roles and Need+Clarification repository spike. |
| Vertical flows | [vertical-flow-evidence-2026-06-26.md](./vertical-flow-evidence-2026-06-26.md) | Life/Work/Skills reach `ready_for_match` and expected first match locally and in CI. |

## Verification

```bash
npm run docs:check
npm test
npm run typecheck
npm run build
npm run db:smoke
npm run local:restart
npm run local:smoke
```

## Local UAT metrics

| Direction | Flow | First match | Score | Action |
| --- | --- | --- | --- | --- |
| Life | Уход за территорией | `profile_life_anna` | 84 | `request_contact` |
| Work | Ревью SRS | `profile_work_dmitry` | 91 | `request_contact` |
| Skills | Подготовка к интервью | `profile_skills_maria` | 84 | `request_contact` |

## Accepted scope

1. Core P0 contracts are good enough for the next slice:
   `ContactRequest`, consent/disclosure and engagement baseline.
2. PostgreSQL remains the Core persistence direction.
3. Local UAT remains synthetic-only until a separate `D0 - Real Data Pilot
   Readiness` gate.
4. Plane and Chatwoot remain adapters; they are not Core source of truth.
5. Keycloak, production WEB/mobile, payments, translation and external beta
   remain outside the next immediate implementation slice.

## Open decisions

| ID | Decision | Why still open |
| --- | --- | --- |
| OPEN-010 | Quick Review limit: 25 pages / 10,000 words / expert hours | Needs product-owner final acceptance before public pilot offer. |
| OPEN-011 | Quick Review turnaround: one business day / two days / no promise | Needs product-owner final acceptance before public pilot offer. |
| OPEN-007 | Combined Life request splitting rule | Needed before ContactRequest/Engagement implementation for real provider flow. |
| OPEN-004 | Result artifact format | Needed before Work result artifact SRS. |
| OPEN-006 | Provider charging model | Deferred to pricing/legal discovery. |

## Defects and gaps

No Sev-1/Sev-2 defects are open in the changed local synthetic scope.

Known gaps moved to next backlog:

1. `ContactRequest` aggregate: client requested contact does not yet equal
   provider acceptance.
2. Consent/disclosure policy before contact, address or personal contact reveal.
3. Engagement/booking/session lifecycle.
4. API versioning and OpenAPI draft.
5. PostgreSQL repository integration into API application services.
6. Event/outbox and webhook inbox for Plane/Chatwoot status sync.
7. Fixture registry with explicit action IDs and rejection of unknown/ad-hoc
   local UAT actions.

## Gate decision

`R0` is passed for the sprint's local Core P0 objective. Next work should start
from [sprint-2026-07-06-backlog.md](./sprint-2026-07-06-backlog.md).
