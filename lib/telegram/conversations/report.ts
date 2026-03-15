// lib/telegram/conversations/report.ts
import { randomBytes } from 'crypto'
import type { Conversation } from '@grammy/conversations'
import type { InlineKeyboard } from 'grammy'
import { InlineKeyboard as KB } from 'grammy'
import { classifyReport } from '@/lib/ai/classify'
import { reverseGeocode } from '@/lib/geocoding'
import { hashFingerprint } from '@/lib/fingerprint'
import { getDepartmentsForCategory } from '@/lib/alerts/routing'
import { sendSMS } from '@/lib/alerts/sms'
import { sendEmail } from '@/lib/alerts/email'
import { authorityPush } from '@/lib/push/authority-push'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { AlertPayload, Category } from '@/lib/types'
import type { BotContext } from '../bot'

export const CATEGORY_MAP: Record<string, string> = {
  crime:          'crime',
  fire:           'fire_explosion',
  flood:          'flash_flood',
  road_damage:    'road_collapse',
  power_outage:   'power_outage',
  medical:        'medical_emergency',
  missing_person: 'other',
  noise:          'other',
  environmental:  'environmental',
  disturbance:    'violence',
  gas_leak:       'fire_explosion',
  water_main:     'environmental',
  other:          'other',
}

export const CATEGORY_LABELS: Record<string, string> = {
  crime:          'Crime',
  fire:           'Fire',
  flood:          'Flood',
  road_damage:    'Road Damage',
  power_outage:   'Power Outage',
  medical:        'Medical Emergency',
  missing_person: 'Missing Person',
  noise:          'Noise Complaint',
  environmental:  'Environmental Hazard',
  disturbance:    'Public Disturbance',
  gas_leak:       'Gas Leak',
  water_main:     'Water Main Break',
  other:          'Other',
}

const POINTS: Record<string, number> = {
  CRITICAL: 50, HIGH: 30, MEDIUM: 20, LOW: 10,
}

function categoryKeyboard(): InlineKeyboard {
  return new KB()
    .text('🔫 Crime',           'category:crime').text('🔥 Fire',           'category:fire').row()
    .text('🌊 Flood',           'category:flood').text('🚧 Road Damage',    'category:road_damage').row()
    .text('⚡ Power Outage',    'category:power_outage').text('🚑 Medical',  'category:medical').row()
    .text('🔍 Missing Person',  'category:missing_person').text('📢 Noise',   'category:noise').row()
    .text('🌿 Environmental',   'category:environmental').text('😤 Disturbance', 'category:disturbance').row()
    .text('💨 Gas Leak',        'category:gas_leak').text('🔧 Water Main',  'category:water_main').row()
    .text('❓ Other',            'category:other')
}

type ReportConversation = Conversation<BotContext>

export async function reportConversation(
  conversation: ReportConversation,
  ctx: BotContext
) {
  // ── Step 1: Category ──────────────────────────────────────────────────────
  await ctx.reply('Choose a category:', { reply_markup: categoryKeyboard() })

  const catCtx = await conversation.waitFor('callback_query:data')
  const catData = catCtx.callbackQuery.data  // e.g. "category:fire"
  const catSlug = catData.replace('category:', '')
  const dbCategory = CATEGORY_MAP[catSlug] ?? 'other'
  const catLabel = CATEGORY_LABELS[catSlug] ?? 'Other'
  await catCtx.answerCallbackQuery()

  // ── Step 2: Location ──────────────────────────────────────────────────────
  await ctx.reply(
    'Share your location — tap the button below or type a parish/address:',
    { reply_markup: { keyboard: [[{ text: '📍 Send My Location', request_location: true }]], resize_keyboard: true, one_time_keyboard: true } }
  )

  let lat = 0, lng = 0, address = 'Unknown location', parish = 'Unknown'
  let locationAttempts = 0

  while (true) {
    const locCtx = await conversation.waitFor('message')
    const msg = locCtx.message

    if (msg?.location) {
      lat = msg.location.latitude
      lng = msg.location.longitude
      address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      parish = 'Unknown'  // will be overwritten by reverseGeocode on submit
      break
    } else if (msg?.text) {
      address = msg.text.slice(0, 200)
      // lat/lng stay 0 — skip geocoding on submit
      break
    } else {
      locationAttempts++
      if (locationAttempts >= 2) {
        // Give up and proceed with unknown location
        break
      }
      await ctx.reply('Please share your location or type a parish/address:')
    }
  }

  // Remove location request keyboard
  await ctx.reply('Got it!', { reply_markup: { remove_keyboard: true } })

  // ── Step 3: Description ───────────────────────────────────────────────────
  await ctx.reply('Describe what you saw (at least 10 characters):')

  let description = ''
  while (true) {
    const descCtx = await conversation.waitFor('message:text')
    const text = descCtx.message.text
    if (text.length >= 10) {
      description = text
      break
    }
    await ctx.reply('Please describe in at least 10 characters:')
  }

  // ── Step 4: Confirm ───────────────────────────────────────────────────────
  const summary =
    `📋 *Confirm your report:*\n\n` +
    `📂 Category: ${catLabel}\n` +
    `📍 Location: ${address}\n` +
    `📝 Description: ${description}`

  const confirmKeyboard = new KB()
    .text('✅ Submit', 'report:submit')
    .text('❌ Cancel', 'report:cancel')

  await ctx.reply(summary, {
    parse_mode: 'Markdown',
    reply_markup: confirmKeyboard,
  })

  const confirmCtx = await conversation.waitFor('callback_query:data')
  const action = confirmCtx.callbackQuery.data
  await confirmCtx.answerCallbackQuery()

  if (action === 'report:cancel') {
    await ctx.reply('Report cancelled.', { reply_markup: { remove_keyboard: true } })
    await sendMainMenuMessage(ctx)
    return
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const fingerprint = hashFingerprint(
    String(ctx.chat!.id),
    process.env.FINGERPRINT_SALT ?? 'default-salt'
  )

  // 1. Geocode GPS if available
  if (lat !== 0) {
    try {
      const geo = await reverseGeocode(lat, lng)
      address = geo.address
      parish = geo.parish
    } catch {
      // silently fall back to stored values
    }
  }

  // 2. Classify — classifyReport returns { aiSummary, confidence, severity,
  //    category, subcategory, embedding, isDuplicate, parentId }
  //    (no is_crime field — derive from category)
  let classification: Awaited<ReturnType<typeof classifyReport>>
  try {
    classification = await classifyReport({ description, parish, lat, lng })
  } catch {
    await ctx.reply('⚠️ Failed to process your report. Please try again.')
    await sendMainMenuMessage(ctx)
    return
  }

  // If duplicate, corroborate and inform user
  if (classification.isDuplicate && classification.parentId) {
    const supabaseForDup = createServiceSupabaseClient()
    await supabaseForDup.rpc('corroborate_report', {
      p_report_id: classification.parentId,
      p_trust_multiplier: 1.0,
    })
    await ctx.reply('ℹ️ This incident has already been reported. Your confirmation helps authorities prioritise it.')
    await sendMainMenuMessage(ctx)
    return
  }

  const sev = (classification.severity ?? 'LOW').toUpperCase()
  // is_crime is derived from category — same logic as web app
  const isCrime = classification.category === 'crime' || classification.category === 'violence'

  // 3. Rate limit
  const supabase = createServiceSupabaseClient()
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('device_fingerprint', fingerprint)
    .gte('created_at', tenMinsAgo)

  if ((count ?? 0) >= 5) {
    await ctx.reply('⚠️ Too many reports submitted recently. Please wait a few minutes.')
    await sendMainMenuMessage(ctx)
    return
  }

  // 4. Generate ticket + JCF police ref for crime/violence
  const ticketNumber = `SR-${Date.now().toString(36).toUpperCase()}`
  const policeRefNumber = isCrime
    ? `JCF-${randomBytes(3).toString('hex').toUpperCase()}`
    : null

  // 5. Insert report — column names match the reports table exactly
  const { data: inserted, error: insertError } = await supabase
    .from('reports')
    .insert({
      lat, lng, address, parish,
      description,
      category:           dbCategory,
      subcategory:        classification.subcategory,
      severity:           sev,
      ai_summary:         classification.aiSummary,
      ai_confidence:      classification.confidence,
      embedding:          classification.embedding,
      is_crime:           isCrime,
      device_fingerprint: fingerprint,
      ticket_number:      ticketNumber,
      police_ref_number:  policeRefNumber,
    })
    .select()
    .single()

  if (insertError) {
    await ctx.reply('⚠️ Failed to save your report. Please try again.')
    await sendMainMenuMessage(ctx)
    return
  }

  // 6. Update reporter stats (non-blocking)
  Promise.resolve(
    supabase.rpc('upsert_reporter_stats', {
      p_fingerprint: fingerprint,
      p_points: POINTS[sev] ?? 10,
    })
  ).catch((e: unknown) => console.error('[tg/reporter_stats]', e))

  // 7. Fire-and-forget alerts
  // getDepartmentsForCategory is SYNCHRONOUS and returns dept type strings.
  // We must query Supabase for actual org objects before calling send functions.
  const deptTypes = getDepartmentsForCategory(dbCategory as Category)
  Promise.resolve(
    supabase
      .from('authority_organizations')
      .select('*')
      .in('type', deptTypes)
      .contains('parish', parish !== 'Unknown' ? [parish] : [])
  ).then(({ data: departments }) => {
    if (!departments?.length) return
    const alertPayload: AlertPayload = {
      reportId:   inserted.id,
      category:   dbCategory as Category,
      severity:   sev as AlertPayload['severity'],
      address,
      parish:     parish || 'Unknown',
      lat,
      lng,
      aiSummary:  classification.aiSummary,
      timestamp:  inserted.created_at,
      mapUrl:     `/incidents/${inserted.id}`,
      respondUrl: '/authority/login',
    }
    return Promise.allSettled([
      sendSMS(departments, alertPayload),
      sendEmail(departments, alertPayload),
      ...departments.map(d => authorityPush(d.id, inserted)),
    ])
  }).catch((e: unknown) => console.error('[tg/alert]', e))

  // 8. Reply with ticket
  await ctx.reply(
    `✅ Report submitted!\nYour ticket: *${ticketNumber}*` +
    (policeRefNumber ? `\nPolice Ref: *${policeRefNumber}*` : ''),
    { parse_mode: 'Markdown' }
  )
  await sendMainMenuMessage(ctx)
}

// Helper — avoids circular import with bot.ts
async function sendMainMenuMessage(ctx: BotContext) {
  const keyboard = new KB()
    .text('📋 Report Incident', 'menu:report')
    .text('🔍 Check Status',   'menu:status')
    .text('🏆 Leaderboard',    'menu:leaderboard')
  await ctx.reply(
    '👮 *SafeReport Jamaica*\nJamaica\'s community safety network — now on Telegram.',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
}
