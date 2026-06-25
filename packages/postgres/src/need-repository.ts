import type { Pool, PoolClient, QueryResult } from "pg";

import type { Clarification, VersionedNeed } from "@cifedra/core";

type Queryable = Pick<Pool | PoolClient, "query">;

export interface NeedAggregateRecord {
  readonly need: VersionedNeed;
  readonly clarifications: readonly Clarification[];
}

export class RepositoryConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PostgresNeedRepository {
  constructor(private readonly pool: Pool) {}

  async saveNeedAggregate(record: NeedAggregateRecord): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await saveNeed(client, record.need);

      for (const clarification of record.clarifications) {
        await saveClarification(client, clarification);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async findNeedAggregateById(needId: string): Promise<NeedAggregateRecord | null> {
    const need = await findNeedById(this.pool, needId);

    if (!need) {
      return null;
    }

    return {
      need,
      clarifications: await listClarificationsByNeedId(this.pool, needId)
    };
  }
}

async function saveNeed(client: Queryable, need: VersionedNeed): Promise<void> {
  const result = await query<{ id: string }>(client, `
    INSERT INTO need.needs (
      id,
      owner_user_profile_id,
      schema_id,
      schema_version,
      aggregate_version,
      status,
      payload,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::timestamptz, $9::timestamptz)
    ON CONFLICT (id) DO UPDATE SET
      owner_user_profile_id = EXCLUDED.owner_user_profile_id,
      schema_id = EXCLUDED.schema_id,
      schema_version = EXCLUDED.schema_version,
      aggregate_version = EXCLUDED.aggregate_version,
      status = EXCLUDED.status,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
    WHERE need.needs.aggregate_version <= EXCLUDED.aggregate_version
    RETURNING id
  `, [
    need.id,
    need.ownerUserProfileId,
    need.schemaId,
    need.schemaVersion,
    need.aggregateVersion,
    need.status,
    JSON.stringify(need),
    need.createdAt,
    need.updatedAt
  ]);

  if (result.rowCount !== 1) {
    throw new RepositoryConflictError(`Need ${need.id} has a newer persisted version`);
  }
}

async function saveClarification(client: Queryable, clarification: Clarification): Promise<void> {
  const result = await query<{ id: string }>(client, `
    INSERT INTO need.clarifications (
      id,
      need_id,
      target_field_id,
      target_topic,
      status,
      blocking,
      reason,
      aggregate_version,
      payload,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz, $11::timestamptz)
    ON CONFLICT (id) DO UPDATE SET
      need_id = EXCLUDED.need_id,
      target_field_id = EXCLUDED.target_field_id,
      target_topic = EXCLUDED.target_topic,
      status = EXCLUDED.status,
      blocking = EXCLUDED.blocking,
      reason = EXCLUDED.reason,
      aggregate_version = EXCLUDED.aggregate_version,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
    WHERE need.clarifications.aggregate_version <= EXCLUDED.aggregate_version
    RETURNING id
  `, [
    clarification.id,
    clarification.needId,
    clarification.target.fieldId ?? null,
    clarification.target.topic ?? null,
    clarification.status,
    clarification.blocking,
    clarification.reason,
    clarification.aggregateVersion,
    JSON.stringify(clarification),
    clarification.createdAt,
    clarification.updatedAt
  ]);

  if (result.rowCount !== 1) {
    throw new RepositoryConflictError(
      `Clarification ${clarification.id} has a newer persisted version`
    );
  }
}

async function findNeedById(client: Queryable, needId: string): Promise<VersionedNeed | null> {
  const result = await query<{ payload: unknown }>(
    client,
    "SELECT payload FROM need.needs WHERE id = $1",
    [needId]
  );

  return result.rows[0]?.payload as VersionedNeed | undefined ?? null;
}

async function listClarificationsByNeedId(
  client: Queryable,
  needId: string
): Promise<Clarification[]> {
  const result = await query<{ payload: unknown }>(client, `
    SELECT payload
    FROM need.clarifications
    WHERE need_id = $1
    ORDER BY created_at, id
  `, [needId]);

  return result.rows.map((row) => row.payload as Clarification);
}

async function query<T extends object>(
  client: Queryable,
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return client.query<T>(text, [...values]);
}
