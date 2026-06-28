CREATE TABLE IF NOT EXISTS need.contact_requests (
  id text PRIMARY KEY,
  need_id text NOT NULL REFERENCES need.needs (id) ON DELETE RESTRICT,
  profile_id text NOT NULL,
  decision_id text NOT NULL,
  client_user_profile_id text NOT NULL,
  provider_profile_id text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('requested', 'accepted', 'declined', 'expired', 'cancelled')
  ),
  idempotency_key text UNIQUE,
  requested_at timestamptz NOT NULL,
  expires_at timestamptz,
  responded_at timestamptz,
  cancelled_at timestamptz,
  decline_reason text,
  disclosure_snapshot jsonb NOT NULL,
  consent_snapshot jsonb NOT NULL,
  aggregate_version integer NOT NULL CHECK (aggregate_version > 0),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_requests_need_id_idx
  ON need.contact_requests (need_id);

CREATE INDEX IF NOT EXISTS contact_requests_client_status_idx
  ON need.contact_requests (client_user_profile_id, status);

CREATE INDEX IF NOT EXISTS contact_requests_provider_status_idx
  ON need.contact_requests (provider_profile_id, status);

CREATE INDEX IF NOT EXISTS contact_requests_status_expires_at_idx
  ON need.contact_requests (status, expires_at)
  WHERE expires_at IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  need.contact_requests
TO
  cifedra_api,
  cifedra_worker;

GRANT SELECT ON TABLE
  need.contact_requests
TO
  cifedra_readonly;
