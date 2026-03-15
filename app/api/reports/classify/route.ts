import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { reverseGeocode } from '@/lib/geocoding'
import { ALL_CATEGORIES, type Category } from '@/lib/types'
import { classifyPrompt } from '@/lib/ai/prompts'

const ClassificationSchema = z.object({
  category:       z.enum(ALL_CATEGORIES as [Category, ...Category[]]),
  subcategory:    z.string(),
  severity:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  urgencySignals: z.array(z.string()),
  confidence:     z.number(),
})

export async function POST(req: NextRequest) {
  try {
    const { description, lat, lng } = await req.json()
    if (!description || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { parish } = await reverseGeocode(lat, lng)
    const { object } = await generateObject({
      model:  anthropic('claude-sonnet-4-5'),
      schema: ClassificationSchema,
      prompt: classifyPrompt(description, parish),
    })
    return NextResponse.json({ ...object, parish })
  } catch (err) {
    console.error('classify error:', err)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
