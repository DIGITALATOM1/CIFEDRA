# CIFEDRA NeedSchema Evidence

Дата: 2026-06-25
Статус: verified increment
Scope: sprint items `D6-01`, `D6-02`

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Versioned schemas | `NeedSchema` содержит `schemaId`, `version`, `status`, direction/category and field declarations. | `packages/core/src/intake.ts` |
| Published schema gate | New Need creation accepts only `published` schema and rejects unknown/deprecated schemas. | `intake.test.ts` |
| Version pinning | Versioned Need stores `schemaId + schemaVersion`. | `intake.test.ts` |
| Generic completeness | Required, conditional, invalid and unknown fields produce deterministic `missingFieldIds` and `invalidFieldIds`. | `intake.test.ts` |
| Work schema v1 | `work.srs-review@1` validates Quick Review metadata, size limit and future deadline. | `intake.test.ts` |
| Life schema v1 | `life.outdoor-maintenance@1` validates pool/lawn variants, combined visit rule and synthetic privacy boundary. | `intake.test.ts` |
| Skills schema v1 | `skills.interview-preparation@1` validates role/seniority/interview language and mock interview format. | `intake.test.ts` |
| Language metadata | Versioned Need stores original, communication and preferred result languages as supported `ru/en`. | `intake.ts`, `intake.test.ts` |
| Matching guard | `rankProfilesForNeed` and `scoreProfileForNeed` reject incomplete/non-ready Need with `NEED_NOT_READY_FOR_MATCHING`. | `matching.ts`, `intake.test.ts` |

## Проверка

```bash
npm run docs:check
npm test
npm run typecheck
npm run build
npm run local:smoke
```

## Остаточный риск

Этот increment закрывает schema/completeness baseline, но не весь intake
workflow. Осталось:

1. profile-backed active owner validation through persistence;
2. synthetic fixture registry with checksum and predefined actions;
3. aggregate version and stale update rejection;
4. Clarification lifecycle and atomic reassessment;
5. API endpoints for versioned Need intake;
6. product confirmation for Quick Review limit/turnaround and combined Life rule.
