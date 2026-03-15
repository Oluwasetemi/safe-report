import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))

describe('POST /api/push/subscribe', () => {
  beforeEach(() => vi.resetModules())

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when authority type has no org_id', async () => {
    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://example.com', p256dh: 'key', auth: 'auth', type: 'authority' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/org_id/)
  })

  it('returns 200 on valid citizen subscription', async () => {
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)

    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://fcm.example.com/1', p256dh: 'key', auth: 'auth', type: 'citizen', lat: 17.99, lng: -76.79 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

describe('DELETE /api/push/unsubscribe', () => {
  beforeEach(() => vi.resetModules())

  it('returns 400 when endpoint is missing', async () => {
    const { DELETE } = await import('../unsubscribe/route')
    const req = new NextRequest('http://localhost/api/push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({}),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid unsubscribe', async () => {
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as never)

    const { DELETE } = await import('../unsubscribe/route')
    const req = new NextRequest('http://localhost/api/push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: 'https://fcm.example.com/1' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })
})
