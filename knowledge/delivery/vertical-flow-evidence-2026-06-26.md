# CIFEDRA Vertical Flow Evidence

Дата: 2026-06-26
Статус: verified local UAT increment
Scope: sprint items `D9-01`, `D9-02`

## Проверяемый сценарий

Для каждого направления выполняется одна цепочка:

```text
Trusted identity
  -> UserProfile
  -> Versioned NeedSchema intake with missing required field
  -> blocking Clarification
  -> owner answer
  -> Need readiness reassessment
  -> matching against demo provider profiles
```

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Shared vertical-flow contract | `syntheticVerticalFlowDefinitions` описывает Life, Work, Skills как repository-owned fixtures. | `packages/core/src/vertical-flows.ts` |
| CI coverage | Core test прогоняет все три flows without external services. | `packages/core/test/vertical-flow.test.ts` |
| API visibility | `GET /demo/vertical-flows` возвращает результаты трех flows. | `apps/api/src/server.ts` |
| API regression | API test проверяет ready status, resolved clarification, expected profile and request_contact action. | `apps/api/test/security.test.ts` |
| Local smoke | `npm run local:smoke` проверяет endpoint and scores locally. | `scripts/local/smoke-test.mjs` |
| Diagnostics UI | Local diagnostics page shows readiness and match metrics. | `web/test-console/diagnostics.html` |

## Метрики local smoke

| Direction | Flow | Clarification target | First match | Score | Action |
| --- | --- | --- | --- | --- | --- |
| Life | Уход за территорией | `propertyContext` | `profile_life_anna` | 84 | `request_contact` |
| Work | Ревью SRS | `systemContext` | `profile_work_dmitry` | 91 | `request_contact` |
| Skills | Подготовка к интервью | `vacancyContext` | `profile_skills_maria` | 84 | `request_contact` |

## Проверка

```bash
npm -w @cifedra/core run test
npm -w @cifedra/api run test
npm run local:restart
npm run local:smoke
```

## Остаточный риск

1. API пока возвращает synthetic flow result from in-memory Core, not persisted
   PostgreSQL state.
2. Unknown fixture/action rejection is still a separate UAT fixture registry task.
3. Provider-side acceptance/decline is not part of this increment.
4. Diagnostics page is a local dev surface, not final client UX.
5. Local UAT still uses demo provider profiles, not full provider onboarding and review.
