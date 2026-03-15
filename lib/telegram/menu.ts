// lib/telegram/menu.ts
// Shared main menu builder used by all conversation handlers.
// Lives here to avoid circular imports between bot.ts and conversations/*.ts.
import { InlineKeyboard } from 'grammy'
import type { BotContext } from './bot'

export async function sendMainMenu(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
    .text('📋 Report Incident', 'menu:report')
    .text('🔍 Check Status',   'menu:status')
    .text('🏆 Leaderboard',    'menu:leaderboard')
  await ctx.reply(
    '👮 *SafeReport Jamaica*\nJamaica\'s community safety network — now on Telegram.',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
}
