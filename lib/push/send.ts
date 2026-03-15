import { webpush } from './vapid'
import { createServiceSupabaseClient } from '../supabase/server'
import type { PushSubscriptionRow } from '../types'

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data: { url: string }
  requireInteraction?: boolean
}

export async function sendPushNotification(
  sub: PushSubscriptionRow,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ icon: '/icon-192.png', badge: '/badge-72.png', ...payload })
    )
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      // Subscription expired — remove from DB
      const supabase = createServiceSupabaseClient()
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    } else {
      console.error('[push] delivery error:', err)
    }
  }
}
