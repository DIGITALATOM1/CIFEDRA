# CIFEDRA Local Security Baseline Evidence

Дата: 2026-06-25
Статус: verified increment
Scope: sprint items `D3-01`, `D3-02`, `D3-03`, `D4-01`, `D4-02`, `D4-03`

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Public self-registration | Создает только `client`; запрос `helper/operator/admin` отклоняется `400`. | `apps/api/src/auth-store.ts`, API security test |
| Demo mutations | `match`, `handoff`, `result` требуют bearer session and allowed product role. | `apps/api/src/server.ts`, `401/403` tests |
| Network exposure | API и local web server bind `127.0.0.1` по умолчанию. | `apps/api/src/server.ts`, `scripts/local/start.mjs` |
| Browser origins | CORS использует explicit allowlist; неизвестный Origin отклоняется `403`. | API security test |
| External writes | Нужны одновременно `CIFEDRA_INTEGRATIONS_LIVE=1` и `CIFEDRA_ALLOW_EXTERNAL_WRITES=1`. | integration status and handoff test |
| Local artifacts | Auth store and handoff records создаются с mode `0600`; `local:start` также усиливает права старых sensitive files. | filesystem assertion |
| Error disclosure | Unhandled API errors возвращают generic `500` response. | `apps/api/src/server.ts` |
| Browser token storage | Test console хранит bearer token только in memory and removes legacy `localStorage` key. | `web/test-console/app.js`, static grep |
| JSON request contract | POST JSON должен быть object, `application/json`, within body limit. Invalid/non-object/oversized/unsupported requests return safe `400/413/415`. | API security test, local smoke |
| Request timeout | API server sets request/header/socket timeouts through env-overridable baseline. | `apps/api/src/server.ts` |
| Provider timeout | Live Plane/Chatwoot writes use explicit timeout and return failed handoff evidence instead of crashing API. | API security test |
| CI baseline | GitHub Actions runs clean install, docs check, tests, typecheck and build. | `.github/workflows/ci.yml` |

## Проверка

Обязательный verification set:

```bash
npm run docs:check
npm test
npm run typecheck
npm run build
npm run local:smoke
```

Browser token persistence check:

```bash
rg -n "localStorage\\.(getItem|setItem)|sessionStorage\\.(getItem|setItem)" web/test-console/app.js
```

Expected result: no matches.

API security test использует временные auth/handoff directories and does not
write test identities into the working local store.

## Остаточный риск

Локальный `S0` baseline для текущего прототипа закрыт, но это не production
security approval. До staging/production остаются отдельные security tasks:

1. OIDC/Keycloak integration and token/session policy;
2. rate limiting and abuse controls;
3. secrets management outside local env files;
4. persistent audit log and retention policy;
5. full request DTO validation for versioned Core schemas.
