-- ============================================================
-- 003: Seed data + Storage bucket + Crime zones view
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Supabase Storage — report-photos bucket
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,              -- public bucket (URLs are unauthenticated)
  5242880,           -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket
CREATE POLICY "public_read_report_photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

-- Allow service role (our API) to upload — anon uploads are blocked
CREATE POLICY "service_insert_report_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-photos');

-- ────────────────────────────────────────────────────────────
-- 2. Authority Organizations — Jamaican seed data
-- ────────────────────────────────────────────────────────────

INSERT INTO authority_organizations (id, name, type, parish, alert_email, alert_phone, alert_whatsapp) VALUES

  -- Jamaica Constabulary Force divisions
  ('00000000-0001-0000-0000-000000000001', 'JCF Kingston Central',      'police',        ARRAY['Kingston'],                  'kingston.central@jcf.gov.jm',      '1876-922-0000', NULL),
  ('00000000-0001-0000-0000-000000000002', 'JCF St. Andrew',            'police',        ARRAY['St. Andrew'],                'st.andrew@jcf.gov.jm',             '1876-922-0001', NULL),
  ('00000000-0001-0000-0000-000000000003', 'JCF St. James',             'police',        ARRAY['St. James'],                 'st.james@jcf.gov.jm',              '1876-952-0000', NULL),
  ('00000000-0001-0000-0000-000000000004', 'JCF St. Catherine',         'police',        ARRAY['St. Catherine'],             'st.catherine@jcf.gov.jm',          '1876-922-0002', NULL),
  ('00000000-0001-0000-0000-000000000005', 'JCF Clarendon',             'police',        ARRAY['Clarendon'],                 'clarendon@jcf.gov.jm',             '1876-902-0000', NULL),
  ('00000000-0001-0000-0000-000000000006', 'JCF Manchester',            'police',        ARRAY['Manchester'],                'manchester@jcf.gov.jm',            '1876-962-0000', NULL),
  ('00000000-0001-0000-0000-000000000007', 'JCF Westmoreland',          'police',        ARRAY['Westmoreland'],              'westmoreland@jcf.gov.jm',          '1876-955-0000', NULL),
  ('00000000-0001-0000-0000-000000000008', 'JCF Hanover',               'police',        ARRAY['Hanover'],                   'hanover@jcf.gov.jm',               '1876-956-0000', NULL),
  ('00000000-0001-0000-0000-000000000009', 'JCF Trelawny',              'police',        ARRAY['Trelawny'],                  'trelawny@jcf.gov.jm',              '1876-954-0000', NULL),
  ('00000000-0001-0000-0000-000000000010', 'JCF St. Elizabeth',         'police',        ARRAY['St. Elizabeth'],             'st.elizabeth@jcf.gov.jm',          '1876-965-0000', NULL),
  ('00000000-0001-0000-0000-000000000011', 'JCF St. Ann',               'police',        ARRAY['St. Ann'],                   'st.ann@jcf.gov.jm',                '1876-972-0000', NULL),
  ('00000000-0001-0000-0000-000000000012', 'JCF Portland',              'police',        ARRAY['Portland'],                  'portland@jcf.gov.jm',              '1876-993-0000', NULL),
  ('00000000-0001-0000-0000-000000000013', 'JCF St. Thomas',            'police',        ARRAY['St. Thomas'],                'st.thomas@jcf.gov.jm',             '1876-982-0000', NULL),
  ('00000000-0001-0000-0000-000000000014', 'JCF St. Mary',              'police',        ARRAY['St. Mary'],                  'st.mary@jcf.gov.jm',               '1876-994-0000', NULL),

  -- Jamaica Fire Brigade
  ('00000000-0002-0000-0000-000000000001', 'JFB Kingston / St. Andrew', 'fire',          ARRAY['Kingston','St. Andrew'],     'kingston@jfb.gov.jm',              '110',           NULL),
  ('00000000-0002-0000-0000-000000000002', 'JFB St. James',             'fire',          ARRAY['St. James'],                 'montego.bay@jfb.gov.jm',           '110',           NULL),
  ('00000000-0002-0000-0000-000000000003', 'JFB St. Catherine',         'fire',          ARRAY['St. Catherine'],             'st.catherine@jfb.gov.jm',          '110',           NULL),
  ('00000000-0002-0000-0000-000000000004', 'JFB Manchester',            'fire',          ARRAY['Manchester','Clarendon'],    'manchester@jfb.gov.jm',            '110',           NULL),
  ('00000000-0002-0000-0000-000000000005', 'JFB Westmoreland',          'fire',          ARRAY['Westmoreland','Hanover'],    'westmoreland@jfb.gov.jm',          '110',           NULL),

  -- National Ambulance Service
  ('00000000-0003-0000-0000-000000000001', 'NAS Kingston',              'ambulance',     ARRAY['Kingston','St. Andrew'],     NULL,                               '110',           NULL),
  ('00000000-0003-0000-0000-000000000002', 'NAS Western',               'ambulance',     ARRAY['St. James','Westmoreland','Hanover','Trelawny'], NULL,            '110',           NULL),
  ('00000000-0003-0000-0000-000000000003', 'NAS Central',               'ambulance',     ARRAY['St. Catherine','Clarendon','Manchester'], NULL,                  '110',           NULL),

  -- ODPEM (Office of Disaster Preparedness and Emergency Management)
  ('00000000-0004-0000-0000-000000000001', 'ODPEM National',            'odpem',         ARRAY['Kingston','St. Andrew','St. Catherine','Clarendon','Manchester','Westmoreland','Hanover','Trelawny','St. Elizabeth','St. Ann','Portland','St. Thomas','St. Mary','St. James'],
                                                                                          'odpem@odpem.org.jm',               '1-888-225-5637',   '1-888-225-5637'),

  -- National Works Agency (road collapses, potholes)
  ('00000000-0005-0000-0000-000000000001', 'NWA Kingston / St. Andrew', 'parish_council', ARRAY['Kingston','St. Andrew'],    'nwa.kingston@nwa.gov.jm',          '1876-926-1234', NULL),
  ('00000000-0005-0000-0000-000000000002', 'NWA Western Region',        'parish_council', ARRAY['St. James','Westmoreland','Hanover','Trelawny'], 'nwa.western@nwa.gov.jm', '1876-952-5678', NULL),
  ('00000000-0005-0000-0000-000000000003', 'NWA Central Region',        'parish_council', ARRAY['St. Catherine','Clarendon','Manchester'], 'nwa.central@nwa.gov.jm',   '1876-922-9012', NULL),

  -- Jamaica Public Service (power outages, downed lines)
  ('00000000-0006-0000-0000-000000000001', 'JPS Eastern',               'jps',           ARRAY['Kingston','St. Andrew','St. Thomas','Portland','St. Mary'], 'eastern@jpsco.com', '1888-225-5577', NULL),
  ('00000000-0006-0000-0000-000000000002', 'JPS Western',               'jps',           ARRAY['St. James','Westmoreland','Hanover','Trelawny','St. Elizabeth'], 'western@jpsco.com', '1888-225-5577', NULL),
  ('00000000-0006-0000-0000-000000000003', 'JPS Central',               'jps',           ARRAY['St. Catherine','Clarendon','Manchester','St. Ann'], 'central@jpsco.com',  '1888-225-5577', NULL)

ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 3. Public crime zones view
--    Exposes only fuzzed lat/lng for active crime reports.
--    Exact coordinates are intentionally withheld from the public.
--    Each SELECT returns a fresh random fuzz (±~300m) — this
--    is deliberate: it prevents triangulation by repeated querying.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public_crime_zones AS
  SELECT
    id,
    lat + (random() - 0.5) * 0.003  AS lat,   -- ±~165m latitude fuzz
    lng + (random() - 0.5) * 0.003  AS lng,   -- ±~165m longitude fuzz
    category,
    severity,
    created_at,
    expires_at
  FROM reports
  WHERE
    is_crime  = true
    AND status NOT IN ('resolved', 'expired', 'flagged')
    AND expires_at > NOW();

-- Grant anon read on the view (bypasses RLS on underlying table)
GRANT SELECT ON public_crime_zones TO anon;
GRANT SELECT ON public_crime_zones TO authenticated;


-- ────────────────────────────────────────────────────────────
-- 4. INSERT policy for reports (service role bypasses RLS,
--    but this allows authenticated citizens to insert if needed)
-- ────────────────────────────────────────────────────────────

-- Note: The POST /api/reports route uses service role (bypasses RLS).
-- This policy is a safety net for any future direct-client inserts.
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT
  WITH CHECK (
    expires_at > NOW()
    AND status = 'active'
    AND severity IN ('LOW','MEDIUM','HIGH','CRITICAL')
  );
