import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Report, PushSubscriptionRow } from '../types'

vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))
vi.mock('../push/send', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

const baseReport: Report = {
  id: 'rep-1',
  device_fingerprint: 'fp',
  lat: 17.99,
  lng: -76.79,
  description: 'Test fire',
  category: 'fire_explosion',
  severity: 'HIGH',
  status: 'active',
  corroboration_count: 2,
  confidence_score: 0.8,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  expires_at: new Date(Date.now() + 1000 * 3600).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ai_summary: 'Test fire near Half Way Tree',
  address: 'Half Way Tree, Kingston',
  parish: 'Kingston',
}

const nearSub: PushSubscriptionRow = {
  id: 'sub-1',
  endpoint: 'https://fcm.example.com/1',
  p256dh: 'key1',
  auth: 'auth1',
  type: 'citizen',
  lat: 17.991,  // ~110m away
  lng: -76.791,
  org_id: null,
  created_at: new Date().toISOString(),
}

const farSub: PushSubscriptionRow = {
  id: 'sub-2',
  endpoint: 'https://fcm.example.com/2',
  p256dh: 'key2',
  auth: 'auth2',
  type: 'citizen',
  lat: 18.1,    // ~12km away — outside 2km
  lng: -76.9,
  org_id: null,
  created_at: new Date().toISOString(),
}

describe('citizenPush', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('sends only to subscribers within 2km', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    vi.mocked(createServiceSupabaseClient).mockClear()
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [nearSub, farSub], error: null }),
        }),
      }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    vi.mocked(sendPushNotification).mockClear()

    const { citizenPush } = await import('../push/citizen-push')

    await citizenPush(baseReport)

    expect(sendPushNotification).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendPushNotification).mock.calls[0][0].endpoint).toBe(nearSub.endpoint)
  })

  it('does nothing when no subscribers', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    vi.mocked(createServiceSupabaseClient).mockClear()
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    vi.mocked(sendPushNotification).mockClear()

    const { citizenPush } = await import('../push/citizen-push')

    await citizenPush(baseReport)

    expect(sendPushNotification).not.toHaveBeenCalled()
  })
})
