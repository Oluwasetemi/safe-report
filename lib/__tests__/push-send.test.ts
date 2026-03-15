import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PushSubscriptionRow } from '../types'

vi.mock('../push/vapid', () => ({
  webpush: {
    sendNotification: vi.fn(),
  },
}))

// Mock Supabase service client for 410 cleanup
vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}))

const sub: PushSubscriptionRow = {
  id: 'uuid-1',
  endpoint: 'https://fcm.example.com/push/abc',
  p256dh: 'key',
  auth: 'auth',
  type: 'citizen',
  lat: 17.99,
  lng: -76.79,
  org_id: null,
  created_at: new Date().toISOString(),
}

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls webpush.sendNotification with correct arguments', async () => {
    const { webpush } = await import('../push/vapid')
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never)

    const { sendPushNotification } = await import('../push/send')
    await sendPushNotification(sub, { title: 'Test', body: 'Body', data: { url: '/incidents/1' } })

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      expect.stringContaining('Test')
    )
  })

  it('deletes subscription on 410 Gone', async () => {
    const { webpush } = await import('../push/vapid')
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)

    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({ from: fromMock } as never)

    const { sendPushNotification } = await import('../push/send')
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()

    expect(eqMock).toHaveBeenCalledWith('endpoint', sub.endpoint)
  })

  it('deletes subscription on 404 Not Found', async () => {
    const { webpush } = await import('../push/vapid')
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)

    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({ from: fromMock } as never)

    const { sendPushNotification } = await import('../push/send')
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()

    expect(eqMock).toHaveBeenCalledWith('endpoint', sub.endpoint)
  })

  it('swallows other delivery errors', async () => {
    const { webpush } = await import('../push/vapid')
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('Network error'))

    const { sendPushNotification } = await import('../push/send')
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()
  })
})
