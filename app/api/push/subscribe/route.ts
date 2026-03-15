import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth, type, lat, lng, org_id } = await req.json()

    if (!endpoint || !p256dh || !auth || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (type !== 'citizen' && type !== 'authority') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (type === 'authority' && !org_id) {
      return NextResponse.json({ error: 'org_id required for authority subscriptions' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { endpoint, p256dh, auth, type, lat: lat ?? null, lng: lng ?? null, org_id: org_id ?? null },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('POST /api/push/subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
