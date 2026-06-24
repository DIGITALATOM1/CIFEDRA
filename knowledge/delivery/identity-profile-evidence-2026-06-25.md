# CIFEDRA Identity and Profile Evidence

Дата: 2026-06-25
Статус: verified increment
Scope: sprint item `D5-01`

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Stable identity | `IdentityRef.id` детерминирован по `issuer + subject`; email не входит в key. | `packages/core/src/identity.ts`, `identity-profile.test.ts` |
| Trusted mapping boundary | Local issuer `cifedra-local` and OIDC issuer normalization use one Core boundary. | `packages/core/src/identity.ts` |
| Invalid identity rejection | Empty/padded/control-char subject/issuer rejected; OIDC query/fragment rejected. | `identity-profile.test.ts` |
| Auth mapping | Local auth session and `/auth/me` expose `identityRef`; integrated apps receive actor with identity ref. | `packages/core/src/auth.ts`, `apps/api/src/auth-store.ts`, API security test |
| User profile ownership | `UserProfile` has immutable owner `IdentityRef`; cross-owner update rejected. | `packages/core/src/profile.ts`, `identity-profile.test.ts` |
| Provider profile ownership | `ProviderProfile` has owner `UserProfile.id`; cross-owner update rejected. | `packages/core/src/profile.ts`, `identity-profile.test.ts` |
| Language metadata | `ru/en`, `ru-RU/en-US` and IANA timezone validation implemented. | `packages/core/src/language.ts`, `identity-profile.test.ts` |
| Provider profile baseline | Directions/categories validate against catalog; provider spoken languages are normalized; profile private by default. | `packages/core/src/profile.ts`, `identity-profile.test.ts` |
| Public preview | Provider public preview excludes owner identity and private claims. | `identity-profile.test.ts` |

## Проверка

```bash
npm test
npm run typecheck
npm run build
npm run local:smoke
```

## Остаточный риск

Этот increment не закрывает весь authorization layer. Осталось:

1. explicit permission policy for operator/admin actions;
2. one-user-profile/one-provider-profile uniqueness through persistence;
3. suspended provider exclusion inside matching guard;
4. profile persistence and audit events;
5. profile-backed Need ownership in `NeedSchema`/intake increment.
