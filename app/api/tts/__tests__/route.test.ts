// app/api/tts/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_URL = 'https://media.easy-peasy.ai/tts/test/audio.mp3'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/tts', () => {
  beforeEach(() => {
    vi.stubEnv('EASY_PEASY_API_KEY', 'test-key-123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns 500 when API key is not set', async () => {
    vi.stubEnv('EASY_PEASY_API_KEY', '')
    const res = await POST(makeRequest({ text: 'Hello' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('TTS not configured')
  })

  it('returns 400 when text is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('text is required')
  })

  it('returns 400 when text is empty string', async () => {
    const res = await POST(makeRequest({ text: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('text is required')
  })

  it('returns 400 when text is not a string', async () => {
    const res = await POST(makeRequest({ text: 123 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('text is required')
  })

  it('returns url on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uuid: 'abc', url: MOCK_URL, status: 'completed' }),
    }))
    const res = await POST(makeRequest({ text: 'Wah gwan' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe(MOCK_URL)
  })

  it('calls Easy-Peasy.AI with correct headers and voice ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uuid: 'abc', url: MOCK_URL, status: 'completed' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await POST(makeRequest({ text: 'Test' }))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://easy-peasy.ai/api/generate-text-to-speech',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'test-key-123' }),
        body: expect.stringContaining('"voiceID":"mrDMz4sYNCz18XYFpmyV"'),
      })
    )
  })

  it('truncates text longer than 2000 characters', async () => {
    const longText = 'a'.repeat(3000)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uuid: 'abc', url: MOCK_URL, status: 'completed' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await POST(makeRequest({ text: longText }))
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sentBody.text.length).toBe(2000)
  })

  it('returns 500 when Easy-Peasy.AI returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Upstream error',
    }))
    const res = await POST(makeRequest({ text: 'Test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('TTS API error')
  })

  it('returns 500 when status is not completed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uuid: 'abc', url: MOCK_URL, status: 'processing' }),
    }))
    const res = await POST(makeRequest({ text: 'Test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('processing')
  })

  it('returns 400 on malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid request body')
  })
})
