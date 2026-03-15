import { NextRequest, NextResponse } from 'next/server'
import { classifyReport } from '@/lib/ai/classify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await classifyReport(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Classification error:', err)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
