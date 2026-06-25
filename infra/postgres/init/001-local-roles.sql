\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cifedra_migrator') THEN
    CREATE ROLE cifedra_migrator LOGIN PASSWORD 'cifedra_migrator_local_only';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cifedra_api') THEN
    CREATE ROLE cifedra_api LOGIN PASSWORD 'cifedra_api_local_only';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cifedra_worker') THEN
    CREATE ROLE cifedra_worker LOGIN PASSWORD 'cifedra_worker_local_only';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cifedra_readonly') THEN
    CREATE ROLE cifedra_readonly LOGIN PASSWORD 'cifedra_readonly_local_only';
  END IF;
END $$;

ALTER DATABASE cifedra_core OWNER TO cifedra_migrator;

GRANT CONNECT ON DATABASE cifedra_core TO
  cifedra_migrator,
  cifedra_api,
  cifedra_worker,
  cifedra_readonly;
