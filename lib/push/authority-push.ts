import { createServiceSupabaseClient } from '../supabase/server'
import { sendPushNotification } from './send'
import type { Report, PushSubscriptionRow } from '../types'

export async function authorityPush(orgId: string, report: Report): Promise<void> {
  const supabase = createServiceSupabaseClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('type', 'authority')
    .eq('org_id', orgId)

  if (!subs?.length) return

  const confirmations = report.corroboration_count > 0
    ? ` ${report.corroboration_count} confirmation${report.corroboration_count > 1 ? 's' : ''}.`
    : ''

  await Promise.allSettled(
    (subs as PushSubscriptionRow[]).map((sub) =>
      sendPushNotification(sub, {
        title: `🚨 ${report.severity}: ${(report.category as string).replaceAll('_', ' ')} — ${report.parish ?? 'Unknown'}`,
        body: `${report.ai_summary ?? report.description.slice(0, 80)}${confirmations} Acknowledge now.`,
        data: { url: '/authority/queue' },
        requireInteraction: true,
      })
    )
  )
}
