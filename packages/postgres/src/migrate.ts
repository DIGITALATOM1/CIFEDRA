import { readdir, readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import { Pool } from "pg";

import { getMigrationDatabaseUrl } from "./config.js";

const migrationsDir = resolve(import.meta.dirname, "../migrations");

export async function runMigrations(databaseUrl = getMigrationDatabaseUrl()): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    await pool.query("SELECT pg_advisory_lock($1)", [2147483001]);
    await ensureMigrationTable(pool);

    const applied = await loadAppliedMigrations(pool);
    const files = await loadMigrationFiles();

    for (const file of files) {
      if (applied.has(file.id)) {
        continue;
      }

      await pool.query("BEGIN");
      try {
        await pool.query(file.sql);
        await pool.query(
          "INSERT INTO migration.schema_migrations (id, filename) VALUES ($1, $2)",
          [file.id, file.filename]
        );
        await pool.query("COMMIT");
        console.log(`Applied migration ${file.filename}`);
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }

    if (files.every((file) => applied.has(file.id))) {
      console.log("No pending migrations.");
    }
  } finally {
    await pool.query("SELECT pg_advisory_unlock($1)", [2147483001]).catch(() => undefined);
    await pool.end();
  }
}

async function ensureMigrationTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS migration AUTHORIZATION cifedra_migrator;

    CREATE TABLE IF NOT EXISTS migration.schema_migrations (
      id text PRIMARY KEY,
      filename text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function loadAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ id: string }>(
    "SELECT id FROM migration.schema_migrations ORDER BY id"
  );

  return new Set(result.rows.map((row) => row.id));
}

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => extname(filename) === ".sql")
    .sort();
  const migrations: MigrationFile[] = [];

  for (const filename of filenames) {
    migrations.push({
      id: basename(filename, ".sql"),
      filename,
      sql: await readFile(resolve(migrationsDir, filename), "utf8")
    });
  }

  return migrations;
}

interface MigrationFile {
  readonly id: string;
  readonly filename: string;
  readonly sql: string;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  runMigrations().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
