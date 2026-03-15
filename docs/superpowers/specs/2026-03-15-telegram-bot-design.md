# Telegram Bot Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** `app/api/telegram/webhook/route.ts`, `lib/telegram/bot.ts`, `lib/telegram/conversations/report.ts`, `lib/telegram/conversations/status.ts`, `lib/telegram/storage.ts`, `supabase/migrations/006_telegram_sessions.sql`

---

## Goal

Expose SafeReport's core citizen features — incident reporting, ticket status lookup, and leaderboard — as a Telegram bot inside the existing Next.js repo, reusing all existing lib functions.

---

## Package

```bash
bun add grammy
```

Package: `grammy` v1.x, TypeScript-first, zero dependencies.

---

## Architecture

```
Telegram → POST /api/telegram/webhook
                 ↓ check x-telegram-bot-api-secret-token header → 403 if wrong/missing
                 ↓ await bot.handleUpdate(update)
                 ↓ return 200 { ok: true }
           lib/telegram/bot.ts  (Bot instance, exported as `bot`)
                 ↓ middleware registration order:
                 1. session plugin  (reads telegram_sessions via StorageAdapter)
                 2. conversations plugin
                 3. /start command handler
                 4. bot.callbackQuery handlers  (menu:*, category:*, report:*)
                 5. fallback handler (on:message)
```

**Runtime:** `export const runtime = 'nodejs'` and `export const maxDuration = 30`. Alert dispatch is fire-and-forget.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/api/telegram/webhook/route.ts` | Create | POST handler; secret check; `bot.handleUpdate`; `200 { ok:true }` or `403` |
| `lib/telegram/bot.ts` | Create | `Bot` instance; all middleware + handler registration; exports `bot` |
| `lib/telegram/conversations/report.ts` | Create | Exports `reportConversation` — the 4-step conversation function |
| `lib/telegram/conversations/status.ts` | Create | Exports `statusConversation` — the ticket lookup conversation function |
| `lib/telegram/storage.ts` | Create | Exports `createStorageAdapter()` — grammY `StorageAdapter<SessionData>` |
| `supabase/migrations/006_telegram_sessions.sql` | Create | `telegram_sessions` DDL only |

---

## Session Data Shape

```ts
// Used as the grammY session type
interface SessionData {
  // grammY conversations plugin stores its state under __conversations
  // No custom fields needed — conversation state (step, collected values) is
  // managed internally by the conversations plugin
}

type BotContext = Context & SessionFlavor<SessionData> & ConversationFlavor
```

The conversations plugin stores all in-progress conversation state (current step, collected category, lat, lng, address, description) inside the grammY session under its own key. No custom session fields are required.

---

## Session Storage

**Table:** `telegram_sessions`

```sql
CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id      bigint      PRIMARY KEY,
  session_data jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

**`StorageAdapter<SessionData>`** (`lib/telegram/storage.ts`):

- `read(key: string)` — `SELECT session_data WHERE chat_id = key`. Returns parsed object if found; returns `undefined` (not throws) if no row. Throws on unexpected DB errors.
- `write(key: string, value: SessionData)` — `INSERT … ON CONFLICT (chat_id) DO UPDATE SET session_data = $value, updated_at = now()`
- `delete(key: string)` — `DELETE WHERE chat_id = key`

DB errors from all methods are re-thrown; grammY catches them and the webhook returns `200`.

---

## Existing Lib Functions Reused

| Function | File | Signature |
|----------|------|-----------|
| `reverseGeocode` | `lib/geocoding.ts` | `(lat: number, lng: number) => Promise<{ address: string, parish: string }>` |
| `classifyReport` | `lib/ai/classify.ts` | `(description: string, category: string) => Promise<{ severity: string, ai_summary: string, is_crime: boolean, confidence_score: number }>` |
| `getDepartmentsForCategory` | `lib/alerts/routing.ts` | `(category: string) => Promise<AuthorityOrg[]>` |
| `sendSMS` | `lib/alerts/sms.ts` | `(orgs: AuthorityOrg[], payload: AlertPayload) => Promise<void>` |
| `sendEmail` | `lib/alerts/email.ts` | `(orgs: AuthorityOrg[], payload: AlertPayload) => Promise<void>` |
| `authorityPush` | `lib/push/authority-push.ts` | `(orgId: string, report: Report) => Promise<void>` |
| `hashFingerprint` | `lib/fingerprint.ts` | `(raw: string, salt: string) => string` |
| `createServiceSupabaseClient` | `lib/supabase/server.ts` | `() => SupabaseClient` |
| `upsert_reporter_stats` RPC | Migration 005 | `p_fingerprint text, p_points int` |

---

## Reports Table Columns (from migration 001, read-only reference)

The bot inserts into the existing `reports` table. Relevant columns:

```
lat float8, lng float8, address text, parish text,
description text NOT NULL, category text NOT NULL,
severity text CHECK IN ('LOW','MEDIUM','HIGH','CRITICAL'),
device_fingerprint text, ticket_number text,
ai_summary text, is_crime bool, confidence_score float8
```

**Ticket number generation** — same as the web app:
```ts
const ticketNumber = `SR-${Date.now().toString(36).toUpperCase()}`
```
(For crime reports where `is_crime === true`, also generate a secondary JCF ref: `JCF-${randomBytes(3).toString('hex').toUpperCase()}`, stored in a separate field if the schema supports it — otherwise just use `ticketNumber`.)

---

## Reporter Identity

```ts
const fingerprint = hashFingerprint(
  String(ctx.chat.id),
  process.env.FINGERPRINT_SALT ?? 'default-salt'
)
```

`FINGERPRINT_SALT` is an existing env var. If absent at runtime the fallback `'default-salt'` is used (same behaviour as the web app). Stored in both `reports.device_fingerprint` and `reporter_profiles.fingerprint`.

---

## Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `TELEGRAM_BOT_TOKEN` | BotFather | Required. Telegram API auth. |
| `TELEGRAM_WEBHOOK_SECRET` | Self-generated string | Required. Compared against `x-telegram-bot-api-secret-token` header. |
| `FINGERPRINT_SALT` | Existing `.env.local` | Already present; no new variable needed. |

---

## Webhook Registration

One-time setup after deployment:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<your-domain>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"

curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Local dev: expose `localhost:3000` with [ngrok](https://ngrok.com) and register the ngrok HTTPS URL.

---

## Bot Commands & Flow

### Main menu

Sent by the **fallback handler** (`bot.on('message', ...)`) — the default reply for any message outside an active conversation:

```
👮 Welcome to SafeReport Jamaica
Jamaica's community safety network — now on Telegram.

[📋 Report Incident]  [🔍 Check Status]  [🏆 Leaderboard]
```

Also sent after completing or cancelling any flow, so the user always has the menu to continue.

**`/start` handler** (registered before conversations plugin):
```ts
bot.command('start', async (ctx) => {
  await ctx.conversation.exit()  // no-op if no conv active; never throws
  await sendMainMenu(ctx)
})
```

`callback_data` for menu buttons: `menu:report`, `menu:status`, `menu:leaderboard`

---

### Handler registration in `bot.ts`

**Session key note:** This bot operates only in private chats. All updates that reach conversations (messages, callback queries from inline keyboards) always have `ctx.chat.id`. The `undefined` guard below handles edge-case updates (channel posts, inline queries) that never enter conversations — grammY safely skips session for those.

**`createConversation` registration:** In grammY v1, conversations are registered via `bot.use(createConversation(...))` — this must come after `bot.use(conversations())` and before any command/callback handlers. Steps 3 and 4 below are `bot.use()` calls, not `bot.command()`/`bot.on()` calls.

**Conversation exit via `return`:** In grammY conversations v1, when the conversation function reaches a `return` statement, the conversation is automatically marked as complete and grammY removes its state from the session. The next message from that user will NOT re-enter the conversation — it falls through to the next registered handler. `ctx.conversation.exit()` is only needed outside the conversation function (e.g. in the `/start` handler).

```ts
// Step 1 — Session
bot.use(session({
  storage: createStorageAdapter(),
  // Returns undefined for updates with no chat (channel posts, inline queries) — grammY skips session safely
  getSessionKey: ctx => ctx.chat?.id != null ? String(ctx.chat.id) : undefined,
  initial: (): SessionData => ({}),
}))

// Step 2 — Conversations plugin (MUST precede createConversation calls)
bot.use(conversations())

// Step 3 — Register conversation functions via bot.use (MUST use bot.use, not bot.command/bot.on)
bot.use(createConversation(reportConversation, 'report'))
bot.use(createConversation(statusConversation, 'status'))

// Step 4 — /start: always clears active conv + shows menu
// ctx.conversation.exit() is part of ConversationFlavor; async; MUST be awaited
bot.command('start', async ctx => {
  await ctx.conversation.exit()   // no-op if none active; returns Promise<void>
  await sendMainMenu(ctx)
})

// Step 5 — Callback queries: enter conversations or handle inline
bot.callbackQuery('menu:report', async ctx => { await ctx.conversation.enter('report') })
bot.callbackQuery('menu:status', async ctx => { await ctx.conversation.enter('status') })
bot.callbackQuery('menu:leaderboard', handleLeaderboard)

// Step 6 — Fallback: any message outside an active conversation
bot.on('message', async ctx => sendMainMenu(ctx))
```

**Webhook route error handling:** The route wraps `bot.handleUpdate` so DB errors bubbling out of the session adapter still return `200`:

```ts
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
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
```

**StorageAdapter error contract:** DB errors from `read`, `write`, and `delete` are thrown. They propagate to `bot.handleUpdate`, are caught by the route's try/catch above, logged, and a `200` is still returned. Telegram will not retry.

---

### Report Conversation (`conversations/report.ts`)

4-step grammY `Conversation` function — `reportConversation(conversation, ctx)`.

| Step | Bot sends | Bot waits for |
|------|-----------|--------------|
| 1 | "Choose a category:" + 13-button inline keyboard | `conversation.waitFor('callback_query:data')` matching `category:*` |
| 2 | "Share your location — tap Send Location or type a parish/address:" + location request keyboard button | `conversation.waitFor('message')` (location or text) |
| 3 | "Describe what you saw (at least 10 characters):" | `conversation.waitFor('message:text')` |
| 4 | Summary of category + location + description | `conversation.waitFor('callback_query:data')` → `report:submit` or `report:cancel` |

**Step 2 — location handling (applied each attempt):**

| Update received | Action |
|----------------|--------|
| `message.location` (GPS) | Store `lat`, `lng`; proceed to step 3 |
| `message.text` | Store `lat=0, lng=0, address=text.slice(0,200), parish='Unknown'`; proceed to step 3. Valid on first and second attempt. |
| Any other message type — 1st attempt | Re-prompt: "Please share your location or type a parish/address:" |
| Any other message type — 2nd attempt | Store `lat=0, lng=0, address='Unknown location', parish='Unknown'`; proceed to step 3 |

**Step 3 — validation loop:**
```ts
while (true) {
  const msg = await conversation.waitFor('message:text')
  if (msg.message.text.length >= 10) { description = msg.message.text; break }
  await ctx.reply("Please describe in at least 10 characters:")
}
```

**On `report:submit`:**

1. **Geocode:** Only call `reverseGeocode` when `lat !== 0` (GPS was provided at step 2). If `lat === 0` (user typed an address), skip geocoding — use stored `address`/`parish` as-is. If `lat !== 0` and `reverseGeocode` throws → silently use step-2 stored values. Result is written to `reports.address` and `reports.parish`.
2. **Classify:** `classifyReport(description, category)` → `{ severity, ai_summary, is_crime, confidence_score }`. Normalize severity to uppercase: `const sev = (severity ?? '').toUpperCase()`. If `classifyReport` throws → reply `"⚠️ Failed to process your report. Please try again."` and `return` — grammY marks the conversation complete on `return`, no further action needed.
3. **Rate limit:** `SELECT count(*) FROM reports WHERE device_fingerprint = fingerprint AND created_at >= now() - interval '10 minutes'`. If count ≥ 5 → reply `"⚠️ Too many reports submitted recently. Please wait a few minutes."` → `return`.
4. Insert `reports` row:
   - `lat`, `lng`, `address`, `parish` (from step 2 / geocode)
   - `description`, `category`
   - `severity`, `ai_summary`, `is_crime`, `confidence_score` (from classify)
   - `device_fingerprint = fingerprint`
   - `ticket_number = \`SR-${Date.now().toString(36).toUpperCase()}\``
5. `upsert_reporter_stats(fingerprint, ({ CRITICAL:50, HIGH:30, MEDIUM:20, LOW:10 }[sev] ?? 10))` — `sev` is the uppercased severity from step 2. The `?? 10` fallback handles any unexpected value.
6. Fire-and-forget alerts (not awaited):
   ```ts
   getDepartmentsForCategory(category)
     .then(orgs => Promise.allSettled([
       sendSMS(orgs, alertPayload),
       sendEmail(orgs, alertPayload),
       ...orgs.map(o => authorityPush(o.id, insertedReport)),
     ]).then(results => results.forEach((r, i) => {
       if (r.status === 'rejected') console.error('[tg/alert]', i, r.reason)
     })))
     .catch(e => console.error('[tg/alert] routing error:', e))
   ```
7. Reply: `"✅ Report submitted!\nYour ticket: **<ticket_number>**"` + main menu buttons. `return`.

**On `report:cancel`:** Reply with main menu + message `"Report cancelled."`. `return`.

---

### Status Conversation (`conversations/status.ts`)

1. `await ctx.reply("Enter your ticket number (e.g. SR-20260315-XXXX):")`
2. `const msg = await conversation.waitFor('message:text')`
3. `SELECT * FROM reports WHERE ticket_number = msg.message.text`
4. Found → reply 6-field formatted card:
   ```
   🎫 Ticket: SR-20260315-XXXX
   📂 Category: Road Damage
   📍 Location: Washington Blvd, Kingston
   🔴 Severity: HIGH
   📊 Status: active
   🕐 Reported: 15 Mar 2026, 10:42 AM
   ```
5. Not found → `"❌ No report found for that ticket number. Check the number and try again."`
6. Reply main menu buttons. `return`.

---

### Leaderboard Handler (`handleLeaderboard`)

Not a conversation — a plain `callbackQuery` handler:

```ts
async function handleLeaderboard(ctx) {
  const { data } = await supabase
    .from('reporter_profiles')
    .select('fingerprint, total_points, total_reports')
    .order('total_points', { ascending: false })
    .limit(10)

  const lines = (data ?? []).map((r, i) =>
    `${i + 1}. Reporter #${r.fingerprint.slice(-4).toUpperCase()} — ${r.total_points} pts (${r.total_reports} reports)`
  )
  const text = lines.length
    ? `🏆 Top SafeReport Contributors\n\n${lines.join('\n')}`
    : '🏆 No contributors yet. Be the first to report!'

  await ctx.reply(text)
  await sendMainMenu(ctx)  // always follow with menu
}
```

If fewer than 10 rows exist, returns however many are in the table. `fingerprint.slice(-4).toUpperCase()` is the display identifier — taken directly from the DB column value.

---

## HTTP Contract

| Condition | Status | Body |
|-----------|--------|------|
| Missing/wrong `x-telegram-bot-api-secret-token` | `403` | `{ error: 'Forbidden' }` |
| Update processed | `200` | `{ ok: true }` |
| Bot logic throws | `200` | `{ ok: true }` — error logged via `console.error` |

---

## Categories (13)

| Display | `callback_data` |
|---------|----------------|
| Crime | `category:crime` |
| Fire | `category:fire` |
| Flood | `category:flood` |
| Road Damage | `category:road_damage` |
| Power Outage | `category:power_outage` |
| Medical Emergency | `category:medical` |
| Missing Person | `category:missing_person` |
| Noise Complaint | `category:noise` |
| Environmental Hazard | `category:environmental` |
| Public Disturbance | `category:disturbance` |
| Gas Leak | `category:gas_leak` |
| Water Main Break | `category:water_main` |
| Other | `category:other` |

---

## What Does NOT Change

- No changes to `reports`, `reporter_profiles`, or any existing Supabase tables
- No changes to existing API routes, web app UI, or PartyKit
- No SafeGuide AI, push alert subscriptions, or photo uploads in this version

---

## Acceptance Criteria

1. `/start` shows the main menu with 3 inline keyboard buttons.
2. `/start` sent during an active conversation clears the conversation and shows the main menu.
3. Completing all 4 report steps and tapping Submit inserts one row in `reports` and the bot replies with the ticket number (format `SR-…`).
4. Check Status with a valid ticket number returns a formatted reply containing all 6 fields: ticket, category, location, severity, status, and reported timestamp.
5. Check Status with an unknown ticket number returns the not-found error message.
6. Leaderboard returns up to 10 entries; returns fewer if fewer than 10 rows exist in `reporter_profiles`.
7. A request with a missing or incorrect `x-telegram-bot-api-secret-token` header returns HTTP 403.
8. All valid webhook requests return HTTP 200 `{ ok: true }`.
9. Mid-conversation persistence: complete step 1 of the report flow (category selected), then simulate a cold start by sending a new webhook update with the same `chat_id` but a different server process — the bot replies with the step 2 prompt ("Share your location…"), confirming session was persisted in `telegram_sessions` and re-read.
10. Cancelling mid-report (step 4 Cancel button) causes the bot to reply "Report cancelled." + main menu; the conversation does not resume on the next message.
11. Submitting a 6th report within 10 minutes returns the rate-limit message and does not insert a new row.
12. A description shorter than 10 characters causes a re-prompt ("Please describe in at least 10 characters:") without advancing to step 4.
13. A text message sent during step 3 of an active report conversation is consumed by the conversation, not the fallback main-menu handler.
14. An unexpected severity string from `classifyReport` results in 10 points being awarded (fallback), with no error thrown.
