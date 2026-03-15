// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const update = await req.json()
    await bot.handleUpdate(update)
  } catch (err) {
    console.error('[tg/webhook] unhandled error:', err)
  }

  return NextResponse.json({ ok: true })
}
