-- Atomic upsert for reporter profiles: insert on first report, increment on subsequent ones.
-- Monthly points share the same counter (reset via a separate cron job when needed).
CREATE OR REPLACE FUNCTION upsert_reporter_stats(
  p_fingerprint text,
  p_points      int
) RETURNS void AS $$
BEGIN
  INSERT INTO reporter_profiles (fingerprint, total_points, monthly_points, total_reports)
  VALUES (p_fingerprint, p_points, p_points, 1)
  ON CONFLICT (fingerprint) DO UPDATE SET
    total_points   = reporter_profiles.total_points   + EXCLUDED.total_points,
    monthly_points = reporter_profiles.monthly_points + EXCLUDED.monthly_points,
    total_reports  = reporter_profiles.total_reports  + 1;
END;
$$ LANGUAGE plpgsql;
