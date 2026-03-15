-- ============================================================
-- 004: Push subscriptions table for Web Push (VAPID)
-- ============================================================

CREATE TABLE push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  type       text        NOT NULL CHECK (type IN ('citizen', 'authority')),
  lat        float8,
  lng        float8,
  org_id     uuid        REFERENCES authority_organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service_role can write; no public read (endpoints are credentials)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; these explicit policies
-- ensure anon/authenticated cannot read or write subscription data.
CREATE POLICY "deny_public_read_push_subscriptions"
  ON push_subscriptions FOR SELECT
  USING (false);
