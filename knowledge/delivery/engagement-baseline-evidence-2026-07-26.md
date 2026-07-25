# Engagement Baseline Evidence: 2026-07-26

Дата: 2026-07-26
Статус: completed for `N6-01`
Scope: Core Engagement aggregate, local demo API and WEB MVP lifecycle controls

## Summary

Добавлен первый baseline для post-acceptance execution step:

```text
accepted ContactRequest
  -> Engagement planned
  -> Engagement in_progress
  -> Engagement completed / cancelled
```

`Engagement` не создается из `requested ContactRequest`: provider acceptance
остается обязательной границей перед началом выполнения.

## Implementation artifacts

| Artifact | Purpose |
| --- | --- |
| `packages/core/src/engagement.ts` | Core aggregate creation and lifecycle transitions. |
| `packages/core/src/domain.ts` | `Engagement`, `EngagementStatus`, execution brief and Markdown result artifact types. |
| `packages/core/src/vertical-flows.ts` | Synthetic Life/Work/Skills flows now simulate accepted ContactRequest and planned Engagement. |
| `packages/core/test/engagement.test.ts` | Unit tests for create/start/complete/cancel and invalid transitions. |
| `apps/api/src/server.ts` | Local MVP endpoints `/demo/engagements/simulate` and `/demo/engagements/transition`. |
| `apps/api/openapi/cifedra-v1-draft.json` | Draft OpenAPI updated with Engagement DTOs and demo endpoints. |
| `apps/web/src/*` | WEB MVP now shows Engagement column and allows accept/start/complete checks. |
| `apps/web/public/favicon.svg` | Removes favicon 404 noise during local browser checks. |
| `scripts/local/smoke-test.mjs` | Local smoke verifies Engagement creation, start and Markdown completion. |

## Requirement coverage

| Requirement area | Evidence |
| --- | --- |
| Engagement starts after provider acceptance. | Core rejects creation from `requested ContactRequest`; demo simulation first accepts ContactRequest. |
| Lifecycle states exist. | `planned`, `in_progress`, `completed`, `cancelled`. |
| Invalid direct completion is rejected. | Unit test rejects `planned -> completed`. |
| Result artifact baseline. | Completion produces `structured_markdown` result artifact. |
| Local MVP can exercise the flow. | WEB has `Accept -> Engagement`, `Start`, `Complete MD` controls. |
| Synthetic vertical flows stay traceable. | Flows expose both original requested ContactRequest and accepted simulation before Engagement. |

## Remaining gaps

1. Engagement is not persisted in PostgreSQL yet.
2. `/demo/engagements/*` endpoints are local MVP simulation endpoints, not final
   `/api/v1` contracts.
3. Real provider ownership remains blocked by ProviderProfile persistence.
4. Built-in messenger still has preview UI only; message persistence is the next
   product increment.
5. Plane/Chatwoot adapters still need event/outbox-based sync after Engagement
   events are introduced.

## Verification

```text
npm -w @cifedra/core run typecheck
npm -w @cifedra/core run test
npm -w @cifedra/core run build
npm -w @cifedra/api run typecheck
npm -w @cifedra/api run test
npm -w @cifedra/web run typecheck
npm -w @cifedra/web run build
node -e "JSON.parse(require('node:fs').readFileSync('apps/api/openapi/cifedra-v1-draft.json','utf8'))"
npm run docs:check
npm run local:smoke
Playwright CLI: register -> match -> Accept -> Engagement -> Start -> Complete MD
```

Result: passed.

Browser result: WEB MVP reached completed Engagement and `Markdown result`;
console reported `Errors: 0, Warnings: 0`.
