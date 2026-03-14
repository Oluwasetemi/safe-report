-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Core reports table
CREATE TABLE IF NOT EXISTS reports (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint        text NOT NULL,
  lat                       float8 NOT NULL,
  lng                       float8 NOT NULL,
  accuracy                  float4,
  address                   text,
  parish                    text,
  description               text NOT NULL,
  photo_url                 text,
  voice_transcript          text,
  category                  text NOT NULL,
  subcategory               text,
  severity                  text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  ai_summary                text,
  ai_confidence             float4,
  is_duplicate              bool DEFAULT false,
  parent_incident_id        uuid REFERENCES reports(id),
  embedding                 vector(1536),
  confidence_score          float4 DEFAULT 0,
  corroboration_count       int DEFAULT 0,
  reporter_trust_multiplier float4 DEFAULT 1.0,
  status                    text NOT NULL DEFAULT 'active',
  departments_alerted       text[],
  alerts_sent_at            timestamptz,
  acknowledged_by           text,
  acknowledged_at           timestamptz,
  en_route_at               timestamptz,
  resolved_at               timestamptz,
  resolution_description    text,
  is_crime                  bool DEFAULT false,
  suspect_description       text,
  direction_of_travel       text,
  contact_number            text,
  police_ref_number         text,
  ticket_number             text,
  escalated                 bool DEFAULT false,
  flagged                   bool DEFAULT false,
  expires_at                timestamptz NOT NULL,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- Reporter profiles (pseudonymous)
CREATE TABLE IF NOT EXISTS reporter_profiles (
  fingerprint      text PRIMARY KEY,
  display_name     text,
  trust_level      int DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5),
  total_points     int DEFAULT 0,
  monthly_points   int DEFAULT 0,
  total_reports    int DEFAULT 0,
  verified_reports int DEFAULT 0,
  accuracy_rate    float4 DEFAULT 0,
  joined_at        timestamptz DEFAULT now()
);

-- Authority organizations
CREATE TABLE IF NOT EXISTS authority_organizations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  type           text NOT NULL CHECK (type IN ('police','fire','ambulance','odpem','parish_council','jps')),
  parish         text[],
  alert_phone    text,
  alert_whatsapp text,
  alert_email    text
);

-- Authority users (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS authority_users (
  id     uuid PRIMARY KEY REFERENCES auth.users(id),
  org_id uuid REFERENCES authority_organizations(id),
  name   text NOT NULL,
  role   text DEFAULT 'officer'
);

-- Atomic corroborate function
CREATE OR REPLACE FUNCTION corroborate_report(p_report_id uuid, p_trust_multiplier float4)
RETURNS TABLE(new_score float4, new_count int) AS $$
BEGIN
  UPDATE reports
  SET
    corroboration_count = corroboration_count + 1,
    confidence_score    = LEAST(1.0, confidence_score + (0.1 * p_trust_multiplier)),
    updated_at          = now()
  WHERE id = p_report_id;

  RETURN QUERY
    SELECT confidence_score, corroboration_count
    FROM reports WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_parish     ON reports(parish);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_embedding  ON reports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS
ALTER TABLE reports                ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporter_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_users        ENABLE ROW LEVEL SECURITY;

-- Public: non-sensitive fields, non-expired, non-crime
CREATE POLICY "public_read_reports" ON reports FOR SELECT
  USING (expires_at > NOW() AND NOT is_crime);

-- Authority: full rows in their parish
CREATE POLICY "authority_read_reports" ON reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM authority_users au
    JOIN authority_organizations ao ON au.org_id = ao.id
    WHERE au.id = auth.uid() AND reports.parish = ANY(ao.parish)
  ));

-- Status updates: authority only
CREATE POLICY "authority_update_status" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM authority_users WHERE id = auth.uid()));

-- Public read orgs
CREATE POLICY "public_read_orgs" ON authority_organizations FOR SELECT
  USING (true);

-- Leaderboard: public read reporter profiles
CREATE POLICY "public_read_profiles" ON reporter_profiles FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
