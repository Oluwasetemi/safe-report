import { createServiceSupabaseClient } from '../supabase/server'
import { sendPushNotification } from './send'
import type { Report, PushSubscriptionRow } from '../types'

/** Haversine distance in metres between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export async function citizenPush(report: Report): Promise<void> {
  const supabase = createServiceSupabaseClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('type', 'citizen')

  if (!subs?.length) return

  const nearby = (subs as PushSubscriptionRow[]).filter(
    (s) => s.lat !== null && s.lng !== null && haversineMeters(s.lat!, s.lng!, report.lat, report.lng) <= 2000
  )

  const distanceLabel = (s: PushSubscriptionRow) => {
    const m = Math.round(haversineMeters(s.lat!, s.lng!, report.lat, report.lng))
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
  }

  await Promise.allSettled(
    nearby.map((sub) =>
      sendPushNotification(sub, {
        title: `${report.severity === 'CRITICAL' ? '🚨' : report.severity === 'HIGH' ? '🔥' : '⚠️'} ${report.severity}: ${report.category.replaceAll('_', ' ')} reported ${distanceLabel(sub)} from you`,
        body: report.ai_summary ?? report.description.slice(0, 100),
        data: { url: `/incidents/${report.id}` },
      })
    )
  )
}
