# CIFEDRA Local Security Baseline Evidence

Дата: 2026-06-21
Статус: verified increment
Scope: sprint items `D3-01`, `D3-02`, `D3-03`

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

## Проверка

Обязательный verification set:

```bash
npm test
npm run typecheck
npm run build
npm run local:smoke
```

API security test использует временные auth/handoff directories and does not
write test identities into the working local store.

## Остаточный риск

Gate `S0` еще не закрыт. В Day 4 остаются:

1. убрать bearer token из persistent browser storage;
2. добавить request schemas, body limits and provider timeout handling;
3. добавить GitHub CI baseline.
