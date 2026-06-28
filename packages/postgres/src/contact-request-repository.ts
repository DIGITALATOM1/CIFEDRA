import type { Pool, PoolClient, QueryResult } from "pg";

import type { ContactRequest } from "@cifedra/core";

import { RepositoryConflictError } from "./need-repository.js";

type Queryable = Pick<Pool | PoolClient, "query">;

export class PostgresContactRequestRepository {
  constructor(private readonly pool: Pool) {}

  async saveContactRequest(request: ContactRequest): Promise<void> {
    await saveContactRequest(this.pool, request);
  }

  async findContactRequestById(requestId: string): Promise<ContactRequest | null> {
    const result = await query<{ payload: unknown }>(
      this.pool,
      "SELECT payload FROM need.contact_requests WHERE id = $1",
      [requestId]
    );

    return result.rows[0]?.payload as ContactRequest | undefined ?? null;
  }

  async findContactRequestByIdempotencyKey(
    idempotencyKey: string
  ): Promise<ContactRequest | null> {
    const result = await query<{ payload: unknown }>(
      this.pool,
      "SELECT payload FROM need.contact_requests WHERE idempotency_key = $1",
      [idempotencyKey]
    );

    return result.rows[0]?.payload as ContactRequest | undefined ?? null;
  }

  async listContactRequestsByNeedId(needId: string): Promise<ContactRequest[]> {
    const result = await query<{ payload: unknown }>(this.pool, `
      SELECT payload
      FROM need.contact_requests
      WHERE need_id = $1
      ORDER BY requested_at, id
    `, [needId]);

    return result.rows.map((row) => row.payload as ContactRequest);
  }
}

async function saveContactRequest(client: Queryable, request: ContactRequest): Promise<void> {
  const result = await query<{ id: string }>(client, `
    INSERT INTO need.contact_requests (
      id,
      need_id,
      profile_id,
      decision_id,
      client_user_profile_id,
      provider_profile_id,
      status,
      idempotency_key,
      requested_at,
      expires_at,
      responded_at,
      cancelled_at,
      decline_reason,
      disclosure_snapshot,
      consent_snapshot,
      aggregate_version,
      payload,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9::timestamptz,
      $10::timestamptz,
      $11::timestamptz,
      $12::timestamptz,
      $13,
      $14::jsonb,
      $15::jsonb,
      $16,
      $17::jsonb,
      $18::timestamptz,
      $19::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      need_id = EXCLUDED.need_id,
      profile_id = EXCLUDED.profile_id,
      decision_id = EXCLUDED.decision_id,
      client_user_profile_id = EXCLUDED.client_user_profile_id,
      provider_profile_id = EXCLUDED.provider_profile_id,
      status = EXCLUDED.status,
      idempotency_key = EXCLUDED.idempotency_key,
      requested_at = EXCLUDED.requested_at,
      expires_at = EXCLUDED.expires_at,
      responded_at = EXCLUDED.responded_at,
      cancelled_at = EXCLUDED.cancelled_at,
      decline_reason = EXCLUDED.decline_reason,
      disclosure_snapshot = EXCLUDED.disclosure_snapshot,
      consent_snapshot = EXCLUDED.consent_snapshot,
      aggregate_version = EXCLUDED.aggregate_version,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
    WHERE need.contact_requests.aggregate_version <= EXCLUDED.aggregate_version
    RETURNING id
  `, [
    request.id,
    request.needId,
    request.profileId,
    request.decisionId,
    request.clientUserProfileId,
    request.providerProfileId,
    request.status,
    request.idempotencyKey ?? null,
    request.requestedAt,
    request.expiresAt ?? null,
    request.respondedAt ?? null,
    request.cancelledAt ?? null,
    request.declineReason ?? null,
    JSON.stringify(request.disclosureSnapshot),
    JSON.stringify(request.consentSnapshot),
    request.aggregateVersion,
    JSON.stringify(request),
    request.createdAt,
    request.updatedAt
  ]);

  if (result.rowCount !== 1) {
    throw new RepositoryConflictError(
      `ContactRequest ${request.id} has a newer persisted version`
    );
  }
}

async function query<T extends object>(
  client: Queryable,
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return client.query<T>(text, [...values]);
}
