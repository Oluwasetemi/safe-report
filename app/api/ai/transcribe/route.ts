import { NextRequest, NextResponse } from 'next/server'
import { experimental_transcribe as transcribe } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const result = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: new Uint8Array(await audio.arrayBuffer()),
      mimeType: audio.type || 'audio/webm',
    })

    return NextResponse.json({ transcript: result.text })
  } catch (err) {
    console.error('transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
