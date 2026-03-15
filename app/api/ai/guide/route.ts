import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { SAFEGUIDE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const result = streamText({
    model:    anthropic('claude-sonnet-4-5'),
    system:   SAFEGUIDE_SYSTEM_PROMPT,
    messages,
  })

  return result.toDataStreamResponse()
}
