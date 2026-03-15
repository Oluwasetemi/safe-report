import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the bot module
vi.mock('@/lib/telegram/bot', () => ({
  bot: {
    handleUpdate: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock env
vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'test-secret-abc')

// Dynamically import after mocks are set up
const { POST } = await import('./route')

function makeRequest(secret: string | null, body = {}) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (secret !== null) headers.set('x-telegram-bot-api-secret-token', secret)
  return new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/telegram/webhook', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 403 when secret is missing', async () => {
    const req = makeRequest(null)
    const res = await POST(req as never)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 when secret is wrong', async () => {
    const req = makeRequest('wrong-secret')
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('returns 200 ok:true when secret is correct', async () => {
    const req = makeRequest('test-secret-abc', { update_id: 1 })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 200 even when bot.handleUpdate throws', async () => {
    const { bot } = await import('@/lib/telegram/bot')
    vi.mocked(bot.handleUpdate).mockRejectedValueOnce(new Error('bot exploded'))

    const req = makeRequest('test-secret-abc', { update_id: 2 })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
