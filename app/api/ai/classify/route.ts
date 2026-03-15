import { NextRequest, NextResponse } from 'next/server'
import { classifyReport } from '@/lib/ai/classify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, parish, lat, lng } = body
    if (!description || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: description, lat, lng' }, { status: 400 })
    }
    const result = await classifyReport({ description, parish: parish ?? '', lat, lng })
    return NextResponse.json(result)
  } catch (err) {
    console.error('Classification error:', err)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
