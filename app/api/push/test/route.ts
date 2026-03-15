import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push/send'

// Only available in development
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const supabase = createServiceSupabaseClient()
  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs?.length) return NextResponse.json({ error: 'No subscriptions found. Open the map page and enable notifications first.' }, { status: 404 })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      sendPushNotification(sub, {
        title: '🔴 TEST — Road Collapse',
        body: 'Washington Blvd, Kingston St. Andrew — road partially collapsed. Use alternate routes.',
        data: { url: '/map' },
        requireInteraction: false,
      })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, total: subs.length })
}
