# ContactRequest SRS Evidence: 2026-06-26

Дата: 2026-06-26
Статус: completed for N1-01
Scope: requirements baseline before Core implementation

## Summary

Created SRS for the first post-match Core increment:

```text
Client Decision
  -> ContactRequest
  -> Consent / permitted disclosure
  -> Provider acceptance or decline
  -> Engagement candidate
```

The SRS separates client intent from provider acceptance and prevents accidental
contact/address disclosure before mutual match.

## Evidence

| Area | Evidence |
| --- | --- |
| Lifecycle | `requested`, `accepted`, `declined`, `expired`, `cancelled` states documented. |
| Actors | Client, Provider, Operator, Administrator and System permissions documented. |
| Disclosure | Pre-accept permitted/prohibited fields documented. |
| Consent | Policy version, snapshots and original-vs-sanitized data separation documented. |
| Life combined rule | Provisional ask-before-split baseline documented for `Уход за участком`. |
| Implementation readiness | Core, API and PostgreSQL requirements documented with acceptance scenarios. |

Primary artifact:
[core-p1-contact-request-consent.md](../srs/core-p1-contact-request-consent.md).

## Requirement controls

| Control | Result |
| --- | --- |
| Client request does not disclose contacts. | Covered by `CRQ-009`, `CNS-003`, `AC-CRQ-001`. |
| Provider acceptance is explicit. | Covered by `CRQ-011` - `CRQ-016`. |
| Operators cannot decide for participants. | Covered by `CRQ-022` and `CNS-006`. |
| Duplicate active requests are controlled. | Covered by `CRQ-006`, `CRQ-007`, `AC-CRQ-008`. |
| Expiry is deterministic. | Covered by `CRQ-018`, `CRQ-019`, `AC-CRQ-007`. |
| Local fixtures remain safe. | Covered by `AC-CRQ-009` and `AC-CRQ-010`. |

## Open decisions carried forward

| ID | Question | Current baseline |
| --- | --- | --- |
| OD-CR-001 | Provider response timeout. | Explicit `expiresAt`; product default proposed as 48 hours. |
| OD-CR-002 | Combined Life split UX. | Ask client before creating linked Needs. |
| OD-CR-003 | Exact pre-accept fields per direction. | Category, variant, region, expected result, language and preferred time only. |
| OD-CR-004 | Post-accept legal consent text. | Out of local P1; required before beta/production. |

## Next implementation tasks

1. Implement Core `ContactRequest` aggregate and unit tests.
2. Connect `requested_contact` decision to ContactRequest creation.
3. Add consent/disclosure snapshot builder and negative tests.
4. Extend Life/Work/Skills vertical flows.
5. Add PostgreSQL migration/repository slice.
