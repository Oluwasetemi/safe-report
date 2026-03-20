import { NextRequest, NextResponse } from 'next/server'
import { experimental_transcribe as transcribe } from 'ai'
import { openai } from '@ai-sdk/openai'

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/m4a', 'audio/x-m4a',
])
const MAX_AUDIO_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioEntry = formData.get('audio')
    if (!(audioEntry instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }
    const audio = audioEntry

    if (audio.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 10 MB)' }, { status: 413 })
    }

    const mimeType = audio.type || 'audio/webm'
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 415 })
    }

    const result = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: new Uint8Array(await audio.arrayBuffer()),
      mimeType,
    })

    return NextResponse.json({ transcript: result.text })
  } catch (err) {
    console.error('transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
