# Core P0 Traceability Matrix

Дата: 2026-06-25
Версия: 0.5
Статус: reviewed draft; Identity/Profile, NeedSchema and Clarification baseline implemented

## Sources

- [SRS](./core-p0-identity-profile-intake-clarification.md);
- [CJM by scenarios](../product/cjm-scenarios-gap-analysis.md);
- [CJM by roles](../product/cjm-by-roles.md);
- [Core gap analysis](../system/core-cjm-gap-analysis.md).

## Requirement traceability

| Requirement | CJM step / gap | Target module | Planned test |
| --- | --- | --- | --- |
| IDN-001 - IDN-008 | Auth/Profile; provider-neutral identity gap | `identity.ts`, auth adapter mapping | `identity-profile.test.ts`: idempotent resolve, invalid identity, trusted mapping, email change ownership |
| PRF-001 - PRF-004 | Profile ownership and authorization | `profile.ts`, later `authorization.ts` | `identity-profile.test.ts`: own/cross-owner read-update cases |
| PRF-005 - PRF-006 | Provider lifecycle and match eligibility | `profile.ts`, later matching policy | valid/invalid status, suspended exclusion |
| PRF-007 - PRF-010 | Profile locale/language/timezone gaps | `profile.ts`, `language.ts` | `identity-profile.test.ts`: ru/en accepted, unsupported rejected, timezone invalid |
| PRF-011 - PRF-015 | Admin/ownership/visibility/capability gaps | `authorization.ts`, `profile.ts` | admin without permission, private default, safe preview, provider draft/capability |
| INT-001 - INT-003 | Need Intake ownership and category schema | `intake.ts` | `intake.test.ts`: schema/category/owner consistency |
| INT-004 - INT-006 | Required fields and completeness gap | `intake.ts` | `intake.test.ts`: valid, missing, invalid, deterministic completeness |
| INT-007 | Need ownership gap | `authorization.ts`, `intake.ts` | cross-owner update rejected |
| INT-008 - INT-009 | Language metadata/original preservation gap | `language.ts`, `intake.ts` | `intake.test.ts`: ru/en metadata and original unchanged |
| INT-010, INT-013, INT-014, INT-017, INT-018 | Versioned schema gap | `intake.ts` | `intake.test.ts`: unknown version, lifecycle, immutable publication, deprecation and pinned Need version |
| INT-011, INT-015 | Matching before readiness gap | `intake.ts`, `lifecycle.ts`, matching guard | `intake.test.ts`: incomplete Need cannot match |
| INT-012, INT-019, INT-020 | Artifact/privacy boundary | `intake.ts`, synthetic fixture registry | `intake.test.ts`: file/link/external data rejected; fixture checksum/IDs still planned |
| INT-016 | Concurrency boundary | `intake.ts` | stale expected version rejected |
| Life schema v1 | Life home-help intake gaps | schema config/registry | `intake.test.ts`: pool, lawn, combined variants and conditional fields |
| Work schema v1 | Work SRS review intake gaps | schema config/registry | `intake.test.ts`: complete/incomplete SRS intake |
| Skills schema v1 | Skills career-help intake gaps | schema config/registry | `intake.test.ts`: role, level, interview type, goals and language |
| CLR-001 - CLR-004 | Clarification entity absent | `clarification.ts` | `clarification.test.ts`: create for field/topic by allowed requester |
| CLR-005 - CLR-007 | Clarification lifecycle/actor gap | `clarification.ts`, later `authorization.ts` | `clarification.test.ts`: resolve/reopen and invalid actor/status |
| CLR-008 - CLR-009 | Readiness and recalculation gap | `clarification.ts`, `intake.ts`, `lifecycle.ts` | `clarification.test.ts`: blocking open; answer leads to ready |
| CLR-010 - CLR-011 | Clarification language/original gap | `clarification.ts`, `language.ts` | `clarification.test.ts`: original language preserved in answer history |
| CLR-012 - CLR-018 | Reason/blocking/waiver/concurrency/answer application gaps | `clarification.ts`, later `authorization.ts`, application UoW | `clarification.test.ts`: reason, blocking, waiver limits, answer merge, reopen, stale and atomic update |
| NFR-001 - NFR-003 | Replaceable provider architecture | all Core modules | no external imports/provider calls |
| NFR-004 | Multi-direction extensibility | `intake.ts` schema registry | second synthetic schema without lifecycle change |
| NFR-005 | Translation safety | `language.ts` | translated variant cannot overwrite original |
| NFR-006 | Safe error boundary | Core errors/API mapping later | error payload excludes runtime details |
| NFR-007 | Deterministic testability | utilities/module factories | fixed timestamps/ids where asserted |
| NFR-008 | Privacy-safe diagnostics | logger/analytics boundary | free text and IdP claims absent |
| NFR-009 | Local retention/reset | local test tooling | repeatable reset and retention check |
| NFR-010 | Atomic reassessment | application service/UoW contract | `clarification.test.ts`: failure leaves Need and Clarification unchanged |
| NFR-011 | Provisional schema governance | schema registry/review process | local draft can change without migration of external user data |

## Acceptance scenario mapping

| Acceptance | Requirements | Test target |
| --- | --- | --- |
| AC-001 | IDN-001, IDN-002, IDN-004 | `identity.test.ts` |
| AC-002 | PRF-001 - PRF-004, INT-001, INT-007 | `authorization.test.ts` |
| AC-003 | PRF-007, PRF-010 | `profile.test.ts` |
| AC-004 | PRF-005 - PRF-010 | `profile.test.ts` |
| AC-005 | INT-004 - INT-006, INT-011, CLR-004, CLR-008 | `intake.test.ts`, `clarification.test.ts` |
| AC-006 | CLR-003 - CLR-009 | `clarification.test.ts` |
| AC-007 | CLR-003, CLR-007 | `clarification.test.ts`, later `authorization.test.ts` |
| AC-008 | INT-008, PRF-010 | `language.test.ts`, `intake.test.ts` |
| AC-009 | INT-009, CLR-010, CLR-011, NFR-005 | `language.test.ts` |
| AC-010 | INT-012 | `intake.test.ts` |
| AC-011 | INT-005, INT-006, NFR-001 | `intake.test.ts` |
| AC-012 | Authorization security prerequisite | existing/new auth and API security tests |
| AC-013 | INT-013, INT-014 | `intake.test.ts` |
| AC-014 | INT-016, CLR-015, CLR-016 | `intake.test.ts`, `clarification.test.ts` |
| AC-015 | PRF-012, PRF-013 | `profile.test.ts` |
| AC-016, AC-017 | Life schema conditional rules | `intake.test.ts` |
| AC-018 | INT-012, NFR-008 | `intake.test.ts`, safe logging test |
| AC-019 | Work schema `reviewFocus` | `intake.test.ts` |
| AC-020 | Skills schema v1 | `intake.test.ts` |
| AC-021 | PRF-011, PA-012 | `authorization.test.ts` |
| AC-022 | INT-017, INT-018 | `intake.test.ts` |
| AC-023 | CLR-013, CLR-014 | `clarification.test.ts` |
| AC-024 | CLR-015 - CLR-017, NFR-010 | `clarification.test.ts` |
| AC-025 | Need lifecycle/out-of-scope rule | `intake.test.ts`, `lifecycle.test.ts` |
| AC-026 | INT-019, INT-020 | local UAT fixture registry test |
| AC-027, AC-028 | PRF-005, provider permissions | `authorization.test.ts`, `profile.test.ts` |
| AC-029 | INT-017, INT-018, catalog permissions | `authorization.test.ts`, `intake.test.ts` |
| AC-030 | CLR-015, CLR-018, NFR-010 | `clarification.test.ts` |
| Three schema readiness | INT-003 - INT-016 | `intake.test.ts` parameterized for Life/Work/Skills |

## Implementation sequence

```text
identity.ts + language.ts
  -> authorization.ts
  -> profile.ts
  -> intake.ts
  -> clarification.ts
  -> lifecycle/matching readiness guard
  -> exports and tests
```

## Review rule

A requirement may be marked implemented only when:

1. target module exists;
2. acceptance test passes;
3. negative authorization/validation path is covered;
4. SRS and implementation terminology match;
5. changed requirement has review evidence.
