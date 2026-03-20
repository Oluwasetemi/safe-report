// app/api/tts/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock AI SDK modules — avoids real API calls in tests
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Rewritten in Jamaican English' }),
}))
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn().mockReturnValue('mock-haiku-model'),
}))

const MOCK_AUDIO = new ArrayBuffer(256)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRawRequest(body: string) {
  return new NextRequest('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

function mockAzureSuccess() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => MOCK_AUDIO,
  }))
}

describe('POST /api/tts', () => {
  beforeEach(() => {
    vi.stubEnv('AZURE_TTS_KEY', 'test-azure-key')
    vi.stubEnv('AZURE_TTS_REGION', 'eastus')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // ── Input validation ─────────────────────────────────────────────────────

  it('returns 500 when AZURE_TTS_KEY is not set', async () => {
    vi.stubEnv('AZURE_TTS_KEY', '')
    const res = await POST(makeRequest({ text: 'Hello' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('TTS not configured')
  })

  it('returns 500 when AZURE_TTS_REGION is not set', async () => {
    vi.stubEnv('AZURE_TTS_REGION', '')
    const res = await POST(makeRequest({ text: 'Hello' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('TTS not configured')
  })

  it('returns 400 when text is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('text is required')
  })

  it('returns 400 when text is empty string', async () => {
    const res = await POST(makeRequest({ text: '' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('text is required')
  })

  it('returns 400 when text is whitespace only', async () => {
    const res = await POST(makeRequest({ text: '   ' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('text is required')
  })

  it('returns 400 when text is not a string', async () => {
    const res = await POST(makeRequest({ text: 123 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('text is required')
  })

  it('returns 400 on malformed JSON body', async () => {
    const res = await POST(makeRawRequest('not-json'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid request body')
  })

  // ── Happy path ───────────────────────────────────────────────────────────

  it('returns 200 audio/mpeg on success', async () => {
    mockAzureSuccess()
    const res = await POST(makeRequest({ text: 'Wah gwan' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
  })

  it('returns X-Tts-Text header with base64-encoded pre-processed text', async () => {
    mockAzureSuccess()
    const res = await POST(makeRequest({ text: 'Hello there' }))
    const header = res.headers.get('X-Tts-Text')
    expect(header).toBeTruthy()
    const decoded = Buffer.from(header!, 'base64').toString('utf-8')
    expect(decoded).toBe('Rewritten in Jamaican English')
  })

  it('calls Azure TTS with correct endpoint, key, and SSML', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => MOCK_AUDIO })
    vi.stubGlobal('fetch', fetchMock)
    await POST(makeRequest({ text: 'Test' }))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://eastus.tts.speech.microsoft.com/cognitiveservices/v1')
    expect(options.headers['Ocp-Apim-Subscription-Key']).toBe('test-azure-key')
    expect(options.headers['X-Microsoft-OutputFormat']).toBe('audio-16khz-128kbitrate-mono-mp3')
    expect(options.body).toContain('en-US-GuyNeural')
  })

  it('truncates text longer than 2000 characters before sending to Claude', async () => {
    const { generateText } = await import('ai')
    const generateTextMock = vi.mocked(generateText)
    mockAzureSuccess()
    await POST(makeRequest({ text: 'a'.repeat(3000) }))
    const promptArg = generateTextMock.mock.calls[0][0].prompt as string
    expect(promptArg.length).toBeLessThan(3100)
  })

  // ── XML escaping ─────────────────────────────────────────────────────────

  it('XML-escapes special characters in SSML body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => MOCK_AUDIO })
    vi.stubGlobal('fetch', fetchMock)
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({ text: 'Tom & Jerry <say> "hello" \'world\'' } as never)
    await POST(makeRequest({ text: 'Tom & Jerry' }))
    const ssml = fetchMock.mock.calls[0][1].body as string
    expect(ssml).toContain('Tom &amp; Jerry')
    expect(ssml).toContain('&lt;say&gt;')
    expect(ssml).toContain('&quot;hello&quot;')
    expect(ssml).toContain('&apos;world&apos;')
  })

  // ── Claude fallback ───────────────────────────────────────────────────────

  it('falls back to original text when Claude fails', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Claude down'))
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => MOCK_AUDIO })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ text: 'Hello Jamaica' }))
    expect(res.status).toBe(200)
    const decoded = Buffer.from(res.headers.get('X-Tts-Text')!, 'base64').toString('utf-8')
    expect(decoded).toBe('Hello Jamaica')
  })

  it('falls back to original text when Claude returns empty string', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({ text: '   ' } as never)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => MOCK_AUDIO })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ text: 'Hello Jamaica' }))
    const decoded = Buffer.from(res.headers.get('X-Tts-Text')!, 'base64').toString('utf-8')
    expect(decoded).toBe('Hello Jamaica')
  })

  // ── Azure failure ─────────────────────────────────────────────────────────

  it('returns 502 with X-Tts-Text header when Azure returns non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad SSML',
    }))
    const res = await POST(makeRequest({ text: 'Test' }))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe('TTS service unavailable')
    expect(res.headers.get('X-Tts-Text')).toBeTruthy()
  })

  it('returns 502 with X-Tts-Text header when Azure fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const res = await POST(makeRequest({ text: 'Test' }))
    expect(res.status).toBe(502)
    expect(res.headers.get('X-Tts-Text')).toBeTruthy()
  })
})
