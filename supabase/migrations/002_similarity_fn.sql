-- Haversine distance function (no PostGIS dependency)
CREATE OR REPLACE FUNCTION haversine_distance_meters(
  lat1 float8, lng1 float8,
  lat2 float8, lng2 float8
) RETURNS float8 LANGUAGE sql IMMUTABLE AS $$
  SELECT 6371000 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
  ))
$$;

-- Similarity search with haversine spatial filter
CREATE OR REPLACE FUNCTION find_similar_reports(
  query_embedding vector(1536),
  query_lat float8,
  query_lng float8,
  radius_meters int DEFAULT 500,
  time_window_hours int DEFAULT 6,
  similarity_threshold float4 DEFAULT 0.85
)
RETURNS TABLE(id uuid, similarity float4)
LANGUAGE sql
AS $$
  SELECT
    r.id,
    (1 - (r.embedding <=> query_embedding))::float4 AS similarity
  FROM reports r
  WHERE
    r.is_duplicate = false
    AND r.embedding IS NOT NULL
    AND r.created_at > NOW() - (time_window_hours || ' hours')::interval
    AND haversine_distance_meters(r.lat, r.lng, query_lat, query_lng) <= radius_meters
    AND 1 - (r.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT 1;
$$;
