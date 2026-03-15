import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { SAFEGUIDE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

const MAX_MESSAGES = 20

export async function POST(req: NextRequest) {
  const body = await req.json()
  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : []

  if (!messages.length) {
    return new Response('messages array is required', { status: 400 })
  }

  const result = streamText({
    model:    anthropic('claude-sonnet-4-5'),
    system:   SAFEGUIDE_SYSTEM_PROMPT,
    messages,
  })

  return result.toTextStreamResponse()
}
