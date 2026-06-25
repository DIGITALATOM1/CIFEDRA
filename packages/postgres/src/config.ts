export const localPostgres = {
  composeFile: "infra/postgres/docker-compose.yml",
  serviceName: "postgres",
  host: "127.0.0.1",
  port: 54327,
  database: "cifedra_core",
  migratorUrl:
    "postgresql://cifedra_migrator:cifedra_migrator_local_only@127.0.0.1:54327/cifedra_core",
  apiUrl:
    "postgresql://cifedra_api:cifedra_api_local_only@127.0.0.1:54327/cifedra_core"
} as const;

export function getMigrationDatabaseUrl(): string {
  return process.env.CIFEDRA_MIGRATION_DATABASE_URL ?? localPostgres.migratorUrl;
}

export function getRuntimeDatabaseUrl(): string {
  return process.env.CIFEDRA_DATABASE_URL ?? localPostgres.apiUrl;
}
