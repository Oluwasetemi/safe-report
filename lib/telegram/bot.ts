// lib/telegram/bot.ts
import { Bot, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import type { Context, SessionFlavor } from 'grammy'
import type { ConversationFlavor } from '@grammyjs/conversations'
import { createStorageAdapter } from './storage'
import { sendMainMenu } from './menu'
import { reportConversation } from './conversations/report'
import { statusConversation } from './conversations/status'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

// SessionData is empty — grammY conversations plugin manages its own state
// internally under the __conversations key in the session JSON.
export interface SessionData {}

type BaseContext = Context & SessionFlavor<SessionData>
export type BotContext = ConversationFlavor<BaseContext>

// ── Helpers ────────────────────────────────────────────────────────────────

export { sendMainMenu } from './menu'

async function handleLeaderboard(ctx: BotContext) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('reporter_profiles')
    .select('fingerprint, total_points, total_reports')
    .order('total_points', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[tg/leaderboard]', error)
    await ctx.reply('⚠️ Could not load leaderboard. Please try again later.')
    await sendMainMenu(ctx)
    return
  }

  const lines = (data ?? []).map((r, i) =>
    `${i + 1}. Reporter #${r.fingerprint.slice(-4).toUpperCase()} — ${r.total_points} pts (${r.total_reports} reports)`
  )
  const text = lines.length
    ? `🏆 *Top SafeReport Contributors*\n\n${lines.join('\n')}`
    : '🏆 No contributors yet. Be the first to report!'

  await ctx.reply(text, { parse_mode: 'Markdown' })
  await sendMainMenu(ctx)
}

// ── Bot instance ───────────────────────────────────────────────────────────

// Lazily initialised so that Next.js build-time page data collection does not
// throw when TELEGRAM_BOT_TOKEN is absent from the build environment.
let _bot: Bot<BotContext> | null = null

export function getBot(): Bot<BotContext> {
  if (_bot) return _bot

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

  _bot = new Bot<BotContext>(token)

  // 1. Session — persists conversation state in Supabase telegram_sessions table
  // getSessionKey returns undefined for updates without a chat (inline queries,
  // channel posts) — grammY safely skips session middleware for those.
  _bot.use(session({
    storage: createStorageAdapter(),
    getSessionKey: ctx => ctx.chat?.id != null ? String(ctx.chat.id) : undefined,
    initial: (): SessionData => ({}),
  }))

  // 2. Conversations plugin — MUST come before createConversation registrations
  _bot.use(conversations())

  // 3. Register conversation functions — MUST use bot.use(createConversation(...))
  _bot.use(createConversation(reportConversation, 'report'))
  _bot.use(createConversation(statusConversation, 'status'))

  // 4. /start — always exits any active conversation then shows menu
  _bot.command('start', async ctx => {
    await ctx.conversation.exitAll()  // no-op if none active; exits all active conversations
    await sendMainMenu(ctx)
  })

  // 5. Callback query handlers — enter conversations or handle inline
  _bot.callbackQuery('menu:report', async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('report')
  })

  _bot.callbackQuery('menu:status', async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('status')
  })

  _bot.callbackQuery('menu:leaderboard', async ctx => {
    await ctx.answerCallbackQuery()
    await handleLeaderboard(ctx)
  })

  // 6. Fallback — any message outside an active conversation shows the menu
  _bot.on('message', async ctx => {
    await sendMainMenu(ctx)
  })

  return _bot
}
