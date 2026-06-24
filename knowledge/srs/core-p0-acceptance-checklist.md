# Core P0 Acceptance Checklist

Дата: 2026-06-21
Версия: 0.2
Статус: reviewed draft; product approval incomplete

Связанный SRS:
[Core P0 Identity, Profile, Intake and Clarification](./core-p0-identity-profile-intake-clarification.md).

## Product approval

- [x] Three local pilot scenario families подтверждены.
- [x] Local synthetic environment подтвержден.
- [x] Russian/English UI and runtime translation direction подтверждены.
- [x] Provider selection model подтвержден.
- [x] Communication model подтвержден.
- [x] Free pilot and provider-paid future baseline подтверждены.
- [x] Work/SRS required intake fields подтверждены для local UAT.
- [x] Life `Уход за участком` required/conditional fields подтверждены для local UAT.
- [x] Skills interview-preparation required fields подтверждены для local UAT.
- [x] Readiness rule подтвержден для local UAT.
- [ ] Quick Review size and deadline limits подтверждены.
- [x] Artifact metadata before engagement confirmed.
- [x] Exactly one Quick Review focus confirmed.
- [x] Provider public/private fields and contact hiding confirmed.
- [x] Operator assistance-only boundary confirmed.

## Identity

- [x] `issuer + subject` является stable key.
- [x] Email не участвует в ownership.
- [x] Invalid/empty identity rejected.
- [x] Local and future OIDC principals map to one Core boundary.
- [x] IdentityRef is created only through trusted auth mapping.
- [x] Repeated trusted mapping returns the same IdentityRef.

## Profile

- [x] User and provider profiles имеют explicit owner.
- [x] Cross-owner update rejected.
- [ ] Status transitions validated.
- [ ] Provider activation requires trusted review and cannot come from self-registration.
- [ ] Provider status commands use explicit `provider.review`/`provider.suspend` permissions.
- [ ] Suspended provider excluded from matching.
- [x] `ru-RU` and `en-US` accepted.
- [x] Unsupported locale/language rejected.
- [x] IANA timezone validated.
- [x] Provider categories validated against catalog.
- [x] Profile is private by default.
- [x] Public provider preview excludes contacts and IdP claims.
- [ ] One user and one provider profile per identity baseline accepted.

## Intake

- [x] Schema is versioned.
- [x] Direction/category/schema consistency checked.
- [x] Required, optional and invalid fields distinguished.
- [x] Completeness is deterministic.
- [x] Unknown schema/version rejected.
- [x] Published schema is immutable and Need pins exact version.
- [x] Deprecated schema blocks new Need but continues validating existing Need.
- [x] Incomplete Need cannot enter matching.
- [x] Original and preferred result languages stored.
- [ ] Original, communication and result language have one aggregate source of truth.
- [x] Files and confidential material rejected in current increment.
- [ ] Local UAT accepts repository-owned synthetic fixtures only.
- [ ] Local UAT rejects unknown fixture/action IDs and ad-hoc answers.
- [ ] Stale aggregate version rejected.
- [x] Life conditional fields depend on selected service variants.
- [x] Life exact address and real property identifiers rejected.
- [x] Skills real CV/vacancy files rejected.
- [x] All three schemas reach readiness through the same generic engine.

## Clarification

- [ ] Missing/invalid fields can create blocking clarification.
- [ ] Only owner can answer; operator cannot answer on owner behalf.
- [ ] Invalid actor rejected.
- [ ] Invalid lifecycle transition rejected.
- [ ] Blocking/non-blocking and reason are explicit.
- [ ] Waiver requires permission and reason.
- [ ] Answer history preserved on reopen.
- [ ] Open blocking clarification prevents readiness.
- [ ] Resolution recalculates completeness.
- [ ] Clarification answer/resolution and Need reassessment are atomic.
- [ ] Creating/reopening blocking clarification atomically revokes readiness.
- [ ] Original language is preserved.

## Authorization and security

- [x] Self-registration cannot assign helper/operator/admin.
- [ ] Admin role alone does not imply resource ownership.
- [ ] Every operator action requires explicit permission, assignment and reason where specified.
- [ ] Manual analysis uses `need.review` and owner resubmission.
- [ ] Schema lifecycle uses explicit catalog permissions.
- [x] Error does not leak stack, path, credential or secret.
- [ ] Logs/analytics exclude Need and Clarification free text.
- [ ] Local test retention and reset are documented and tested.
- [x] Negative authorization tests exist.
- [x] Browser prototype does not persist bearer token in `localStorage` or `sessionStorage`.
- [x] Invalid, non-object, oversized and unsupported JSON requests fail with safe 4xx errors.
- [x] Live provider handoff timeout fails safely and keeps local evidence.

## Engineering quality

- [ ] SRS requirement IDs appear in traceability.
- [x] Unit tests cover happy path and negative path.
- [x] Typecheck passes.
- [x] Build passes.
- [x] Existing tests do not regress.
- [x] GitHub CI baseline runs docs check, tests, typecheck and build.
- [ ] Documentation and implementation use the same lifecycle terms.
