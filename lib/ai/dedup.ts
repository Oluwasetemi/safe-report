import { createServiceSupabaseClient } from '../supabase/server'

const SIMILARITY_THRESHOLD = 0.85
const RADIUS_METERS = 500
const TIME_WINDOW_HOURS = 6

export async function findDuplicate(
  embedding: number[],
  lat: number,
  lng: number
): Promise<string | null> {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase.rpc('find_similar_reports', {
    query_embedding: embedding,
    query_lat: lat,
    query_lng: lng,
    radius_meters: RADIUS_METERS,
    time_window_hours: TIME_WINDOW_HOURS,
    similarity_threshold: SIMILARITY_THRESHOLD,
  })

  if (error || !data?.length) return null

  return data[0].id
}
