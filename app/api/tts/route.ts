// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

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

  // ── Step 2: Azure TTS ────────────────────────────────────────────────────
  const ssml = `<speak version='1.0' xml:lang='en-JM'><voice name='en-JM-EthanNeural'>${escapeXml(rewrittenText)}</voice></speak>`

  let azureRes: Response
  try {
    azureRes = await fetch(
      `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'X-Microsoft-OutputFormat':  'audio-16khz-128kbitrate-mono-mp3',
          'Content-Type':              'application/ssml+xml',
        },
        body: ssml,
      }
    )
  } catch (e) {
    console.error('[tts] Azure fetch failed:', e)
    return NextResponse.json(
      { error: 'TTS service unavailable' },
      { status: 502, headers: { 'X-Tts-Text': ttsTextHeader } }
    )
  }

  if (!azureRes.ok) {
    console.error('[tts] Azure error:', azureRes.status, await azureRes.text())
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
