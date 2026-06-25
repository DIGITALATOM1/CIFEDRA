# CIFEDRA PostgreSQL Persistence Evidence

Дата: 2026-06-26
Статус: verified technical spike
Scope: sprint items `D8-01`, `D8-02`

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Tracked compose | `cifedra-core` compose project поднимает PostgreSQL 18 на `127.0.0.1:54327`. | `infra/postgres/docker-compose.yml` |
| Healthcheck | Compose healthcheck and `npm run db:health` use `pg_isready`. | `scripts/db/health.mjs` |
| Local role model | Init SQL создает `cifedra_migrator`, `cifedra_api`, `cifedra_worker`, `cifedra_readonly`. | `infra/postgres/init/001-local-roles.sql` |
| Runtime role without DDL | Smoke проверяет, что `cifedra_api` не может создать таблицу в schema `need`. | `packages/postgres/src/local-smoke.ts` |
| Versioned migrations | Migration runner records applied SQL files in `migration.schema_migrations`. | `packages/postgres/src/migrate.ts` |
| Need repository spike | `PostgresNeedRepository` сохраняет `VersionedNeed` and `Clarification` в одной transaction. | `packages/postgres/src/need-repository.ts` |
| Aggregate persistence | Smoke writes Need + Clarification, restarts PostgreSQL container and reads aggregate back. | `npm run db:smoke` |
| CI-safe package test | Repository test skips without `CIFEDRA_DATABASE_URL`, but passes against local PostgreSQL. | `packages/postgres/test/need-repository.test.ts` |

## Проверка

```bash
npm run db:smoke
CIFEDRA_DATABASE_URL=postgresql://cifedra_api:cifedra_api_local_only@127.0.0.1:54327/cifedra_core npm -w @cifedra/postgres run test
npm run db:health
```

Фактический результат:

- PostgreSQL 18 image pulled and container became healthy;
- migration `001_need_clarification.sql` applied;
- runtime role DDL probe rejected with PostgreSQL permission error;
- synthetic `Need` and `Clarification` persisted and survived container restart.

## Ограничения spike

1. Локальный compose использует `postgres:18`, а не `postgis/postgis:18-3.6`,
   потому что на текущем Apple Silicon окружении `postgis/postgis:18-3.6`
   не имеет arm64 manifest. Target architecture с PostGIS/pgvector остается
   актуальной и требует отдельного image/digest hardening.
2. Таблицы пока хранят aggregate payload в `jsonb` плюс минимальные query columns.
   Нормализация полей будет выполняться постепенно по мере появления queries.
3. Repository spike покрывает `Need + Clarification`, но не переносит весь API
   на PostgreSQL.
4. Нет rollback migrations, backup/restore rehearsal and outbox.
5. Local-only passwords committed intentionally as disposable development
   credentials; production secrets будут через secret manager/env injection.

## Команды

```bash
npm run db:start
npm run db:migrate
npm run db:health
npm run db:smoke
npm run db:stop
npm run db:reset
```
