// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_VOICE_ID = 'mrDMz4sYNCz18XYFpmyV' // Nicole — professional Caribbean female
const MAX_TEXT_LENGTH = 2000

export async function POST(req: NextRequest) {
  const apiKey = process.env.EASY_PEASY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
  }

  let text: unknown
  try {
    const body = await req.json()
    text = body?.text
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  // Truncate silently — long AI responses still readable on screen
  const safeText = text.slice(0, MAX_TEXT_LENGTH)

  const res = await fetch('https://easy-peasy.ai/api/generate-text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ voiceID: DEFAULT_VOICE_ID, text: safeText }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: `TTS API error: ${body}` }, { status: 500 })
  }

  const data = await res.json() as { uuid: string; url: string; status: string }

  if (data.status !== 'completed') {
    return NextResponse.json({ error: `Unexpected TTS status: ${data.status}` }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
