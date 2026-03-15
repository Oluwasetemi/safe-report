// lib/telegram/conversations/status.ts
import type { Conversation } from '@grammyjs/conversations'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { BotContext } from '../bot'
import { sendMainMenu } from '../menu'

type StatusConversation = Conversation<BotContext, BotContext>

export async function statusConversation(
  conversation: StatusConversation,
  ctx: BotContext
) {
  await ctx.reply('Enter your ticket number (e.g. SR-LQMCQJRK):')

  const msgCtx = await conversation.waitFor('message:text')
  const ticketNumber = msgCtx.message.text.trim()

  const supabase = createServiceSupabaseClient()
  const { data: report, error: lookupError } = await supabase
    .from('reports')
    .select('ticket_number, category, address, parish, severity, status, created_at')
    .eq('ticket_number', ticketNumber)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.error('[tg/status]', lookupError)
    await ctx.reply('⚠️ Could not look up that ticket. Please try again later.')
    await sendMainMenu(ctx)
    return
  }

  if (!report) {
    await ctx.reply('❌ No report found for that ticket number. Check the number and try again.')
  } else {
    const severityEmoji: Record<string, string> = {
      CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢',
    }
    const created = new Date(report.created_at).toLocaleString('en-JM', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const location = report.parish && report.parish !== 'Unknown'
      ? `${report.address ?? ''}, ${report.parish}`.replace(/^, /, '')
      : (report.address ?? 'Unknown')

    const text =
      `🎫 Ticket: ${report.ticket_number}\n` +
      `📂 Category: ${report.category ?? 'Unknown'}\n` +
      `📍 Location: ${location}\n` +
      `${severityEmoji[report.severity] ?? '⚪'} Severity: ${report.severity}\n` +
      `📊 Status: ${report.status}\n` +
      `🕐 Reported: ${created}`

    await ctx.reply(text)
  }

  // Always show main menu after
  await sendMainMenu(ctx)
}
