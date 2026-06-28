import { Pool } from "pg";

import {
  getRuntimeDatabaseUrl,
  PostgresContactRequestRepository
} from "@cifedra/postgres";

import type { ContactRequestTransactionalRepository } from "./contact-request-service.js";

let pool: Pool | null = null;
let repository: PostgresContactRequestRepository | null = null;

export function getConfiguredContactRequestRepository():
  | ContactRequestTransactionalRepository
  | null {
  if (process.env.CIFEDRA_CONTACT_REQUEST_STORE !== "postgres") {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: getRuntimeDatabaseUrl(),
      max: positiveIntegerEnv("CIFEDRA_CONTACT_REQUEST_DB_POOL_MAX", 4)
    });
    repository = new PostgresContactRequestRepository(pool);
  }

  return repository;
}

function positiveIntegerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}
