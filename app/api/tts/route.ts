// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const MAX_TEXT_LENGTH = 2000

function escapeXml(str: string): string {
  // Order matters: & must be first to avoid double-encoding
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Strip markdown syntax, emoji, and normalise whitespace before sending to Azure. */
function cleanForTts(str: string): string {
  return str
    // Remove markdown bold/italic
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove emoji (Unicode ranges for common emoji blocks)
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '')
    // Collapse multiple blank lines to a single space
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

async function azureTts(
  text: string,
  voice: string,
  region: string,
  key: string,
): Promise<Response> {
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${escapeXml(text)}</voice></speak>`
  console.log('[tts] Azure request — region:', region, 'voice:', voice)
  return fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'X-Microsoft-OutputFormat':  'audio-16khz-128kbitrate-mono-mp3',
        'Content-Type':              'application/ssml+xml',
      },
      body: ssml,
    }
  )
}

export async function POST(req: NextRequest) {
  const azureKey    = process.env.AZURE_TTS_KEY
  const azureRegion = process.env.AZURE_TTS_REGION

  if (!azureKey || !azureRegion) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
  }

  let text: unknown
  try {
    const body = await req.json()
    text = body?.text
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const safeText = text.slice(0, MAX_TEXT_LENGTH)

  // ── Step 1: Claude Haiku pre-processing ──────────────────────────────────
  let rewrittenText = safeText
  try {
    const { text: result } = await generateText({
      model:  anthropic('claude-haiku-4-5-20251001'),
      prompt: `Rewrite the following for Jamaican English text-to-speech. Keep the meaning intact. Use natural Jamaican English patterns and expressions where appropriate. Output ONLY the rewritten text, nothing else.\n\n${safeText}`,
    })
    if (typeof result === 'string' && result.trim()) {
      rewrittenText = result
    }
  } catch (e) {
    console.warn('[tts] Claude pre-processing failed, using original text:', e)
  }

  // Header carries pre-processed text so client can use it for speechSynthesis fallback
  const ttsTextHeader = Buffer.from(rewrittenText, 'utf-8').toString('base64')

  const cleanText = cleanForTts(rewrittenText)

  // ── Step 2a: ElevenLabs TTS (primary) ────────────────────────────────────
  const elevenKey  = process.env.ELEVENLABS_API_KEY
  const elevenVoice = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB' // Adam

  if (elevenKey) {
    try {
      const eleven = new ElevenLabsClient({ apiKey: elevenKey })
      const audioStream = await eleven.textToSpeech.convert(elevenVoice, {
        text: cleanText,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      })
      // audioStream is a ReadableStream<Uint8Array>
      const chunks: Uint8Array[] = []
      const reader = (audioStream as ReadableStream<Uint8Array>).getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      const total = chunks.reduce((a, c) => a + c.byteLength, 0)
      const merged = new Uint8Array(total)
      let offset = 0
      for (const c of chunks) { merged.set(c, offset); offset += c.byteLength }

      console.log('[tts] ElevenLabs success — bytes:', total)
      return new NextResponse(merged.buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'X-Tts-Text': ttsTextHeader },
      })
    } catch (e) {
      console.warn('[tts] ElevenLabs failed, falling back to Azure:', e)
    }
  }

  // ── Step 2b: Azure TTS (fallback) ────────────────────────────────────────
  // en-JM voices are not available in Azure Cognitive Services; fall back to en-US
  const voices = ['en-US-GuyNeural']

  let azureRes: Response | null = null
  for (const voice of voices) {
    try {
      const res = await azureTts(cleanText, voice, azureRegion, azureKey)
      if (res.ok) { azureRes = res; break }
      const body = await res.text()
      console.warn(`[tts] Azure voice ${voice} failed — status: ${res.status} | body: ${body}`)
    } catch (e) {
      console.error(`[tts] Azure fetch error for voice ${voice}:`, e)
    }
  }

  if (!azureRes) {
    return NextResponse.json(
      { error: 'TTS service unavailable' },
      { status: 502, headers: { 'X-Tts-Text': ttsTextHeader } }
    )
  }

  const audio = await azureRes.arrayBuffer()
  return new NextResponse(audio, {
    status:  200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Tts-Text':   ttsTextHeader,
    },
  })
}
