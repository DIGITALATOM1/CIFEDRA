CREATE SCHEMA IF NOT EXISTS need AUTHORIZATION cifedra_migrator;

CREATE TABLE IF NOT EXISTS need.needs (
  id text PRIMARY KEY,
  owner_user_profile_id text NOT NULL,
  schema_id text NOT NULL,
  schema_version integer NOT NULL,
  aggregate_version integer NOT NULL CHECK (aggregate_version > 0),
  status text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS needs_owner_user_profile_id_idx
  ON need.needs (owner_user_profile_id);

CREATE INDEX IF NOT EXISTS needs_schema_idx
  ON need.needs (schema_id, schema_version);

CREATE INDEX IF NOT EXISTS needs_status_idx
  ON need.needs (status);

CREATE TABLE IF NOT EXISTS need.clarifications (
  id text PRIMARY KEY,
  need_id text NOT NULL REFERENCES need.needs (id) ON DELETE RESTRICT,
  target_field_id text,
  target_topic text,
  status text NOT NULL,
  blocking boolean NOT NULL,
  reason text NOT NULL,
  aggregate_version integer NOT NULL CHECK (aggregate_version > 0),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT clarifications_exactly_one_target CHECK (
    (target_field_id IS NOT NULL AND target_topic IS NULL)
    OR (target_field_id IS NULL AND target_topic IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS clarifications_need_id_idx
  ON need.clarifications (need_id);

CREATE INDEX IF NOT EXISTS clarifications_need_status_idx
  ON need.clarifications (need_id, status);

GRANT USAGE ON SCHEMA need TO
  cifedra_api,
  cifedra_worker,
  cifedra_readonly;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  need.needs,
  need.clarifications
TO
  cifedra_api,
  cifedra_worker;

GRANT SELECT ON TABLE
  need.needs,
  need.clarifications
TO
  cifedra_readonly;

ALTER DEFAULT PRIVILEGES FOR ROLE cifedra_migrator IN SCHEMA need
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cifedra_api, cifedra_worker;

ALTER DEFAULT PRIVILEGES FOR ROLE cifedra_migrator IN SCHEMA need
  GRANT SELECT ON TABLES TO cifedra_readonly;
