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
  description: 'Warehouse fire',
  category: 'fire_explosion',
  severity: 'CRITICAL',
  status: 'active',
  corroboration_count: 5,
  confidence_score: 0.95,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  expires_at: new Date(Date.now() + 1000 * 3600 * 48).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ai_summary: 'Warehouse fire near Half Way Tree',
  address: 'Half Way Tree, Kingston',
  parish: 'Kingston',
}

const authSub: PushSubscriptionRow = {
  id: 'sub-auth-1',
  endpoint: 'https://fcm.example.com/auth/1',
  p256dh: 'key',
  auth: 'auth',
  type: 'authority',
  lat: null,
  lng: null,
  org_id: 'org-uuid-1',
  created_at: new Date().toISOString(),
}

describe('authorityPush', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('sends to authority subscribers for the given org', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqOrgMock = vi.fn().mockResolvedValue({ data: [authSub], error: null })
    const eqTypeMock = vi.fn().mockReturnValue({ eq: eqOrgMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqTypeMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    const { authorityPush } = await import('../push/authority-push')

    await authorityPush('org-uuid-1', baseReport)

    expect(sendPushNotification).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendPushNotification).mock.calls[0][1].requireInteraction).toBe(true)
  })
})
