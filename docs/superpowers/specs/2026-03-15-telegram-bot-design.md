# Telegram Bot Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** `app/api/telegram/webhook/route.ts`, `lib/telegram/bot.ts`, `lib/telegram/conversations/report.ts`, `lib/telegram/conversations/status.ts`, `lib/telegram/storage.ts`, `supabase/migrations/006_telegram_sessions.sql`

---

## Goal

Expose SafeReport's core citizen features — incident reporting, ticket status lookup, and leaderboard — as a Telegram bot. The bot lives inside the existing Next.js repo as a webhook API route and reuses all existing lib functions (AI classify, geocoding, fingerprint, Supabase client, department alerting).

---

## Architecture

```
Telegram → POST /api/telegram/webhook
                 ↓ verify X-Telegram-Bot-Api-Secret-Token
           lib/telegram/bot.ts  (grammY Bot instance)
                 ↓ routes updates to commands + conversations
   ┌─────────────────────────────────────────────┐
   │  conversations/report.ts   (4-step flow)    │
   │  conversations/status.ts   (ticket lookup)  │
   │  command: leaderboard                        │
   └─────────────────────────────────────────────┘
                 ↓ all DB access
   createServiceSupabaseClient() — existing tables
   telegram_sessions table — grammY session storage
```

### File structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/api/telegram/webhook/route.ts` | Create | POST handler; verifies webhook secret; passes update to bot |
| `lib/telegram/bot.ts` | Create | grammY `Bot` instance; registers commands + conversations; exports `handleUpdate` |
| `lib/telegram/conversations/report.ts` | Create | 4-step guided report conversation |
| `lib/telegram/conversations/status.ts` | Create | Ticket number → report status lookup conversation |
| `lib/telegram/storage.ts` | Create | grammY `StorageAdapter` backed by Supabase `telegram_sessions` table |
| `supabase/migrations/006_telegram_sessions.sql` | Create | `telegram_sessions` table DDL |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | From BotFather — authenticates all Telegram API calls |
| `TELEGRAM_WEBHOOK_SECRET` | Arbitrary secret set when registering webhook; verified on every incoming request |

Both must be added to `.env.local` and production environment.

---

## Session Storage

grammY requires a storage adapter to persist conversation state (which step the user is on) across HTTP requests.

**Table:** `telegram_sessions`

```sql
CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id   bigint PRIMARY KEY,
  session_data jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

The `StorageAdapter` in `lib/telegram/storage.ts` implements grammY's `read / write / delete` interface using `createServiceSupabaseClient()`.

---

## Bot Commands & Flow

### Main menu

Triggered by `/start` or any unrecognised message:

```
👮 Welcome to SafeReport Jamaica
Jamaica's community safety network — now on Telegram.

[📋 Report Incident]  [🔍 Check Status]  [🏆 Leaderboard]
```

Buttons are inline keyboard `callback_data` values: `menu:report`, `menu:status`, `menu:leaderboard`.

---

### Report Incident — 4-step conversation

| Step | Bot prompt | User input |
|------|-----------|------------|
| 1 | "Choose a category:" | Inline keyboard — 13 category buttons |
| 2 | "Share your location — tap the button below or type a parish/address:" | Telegram location share button OR free text |
| 3 | "Describe what you saw (at least 10 characters):" | Free text |
| 4 | Summary of category + location + description | [✅ Submit] [❌ Cancel] |

**On submit:**
1. `reverseGeocode(lat, lng)` → derive `address` + `parish` (if GPS sent) or use typed text directly
2. `classifyReport(description, category)` → `{ severity, ai_summary, is_crime, confidence_score }`
3. Insert into `reports` table with `device_fingerprint = hashFingerprint(String(chat_id), FINGERPRINT_SALT)`
4. `upsert_reporter_stats(fingerprint, points)` RPC
5. `getDepartmentsForCategory(category)` → fire SMS/email/push alerts
6. Reply: "✅ Report submitted! Your ticket: **SR-XXXXXXXX-XXXX**"

**On cancel:** clear conversation state, show main menu.

**Validation:**
- Description must be ≥ 10 characters — bot re-prompts if too short
- Location step: if user skips both GPS and text, bot re-prompts once then defaults to "Unknown location"

---

### Check Status — conversation

1. Bot: "Enter your ticket number (e.g. SR-20260315-XXXX):"
2. User types ticket number
3. Query `reports` table by `ticket_number`
4. If found — reply with formatted card:
   ```
   🎫 Ticket: SR-20260315-XXXX
   📂 Category: Road Damage
   📍 Location: Washington Blvd, Kingston
   🔴 Severity: HIGH
   📊 Status: active
   🕐 Reported: 15 Mar 2026, 10:42 AM
   ```
5. If not found — "No report found for that ticket number. Check the number and try again."

---

### Leaderboard — single reply (no conversation)

Query `reporter_profiles` ordered by `total_points` DESC, limit 10.

```
🏆 Top SafeReport Contributors

1. Reporter #A3F2 — 420 pts (38 reports)
2. Reporter #B91C — 310 pts (27 reports)
...
```

Fingerprints are displayed as the last 4 chars of the hash for privacy.

---

## Reporter Identity

The Telegram `chat_id` (bigint) is used as the raw fingerprint input:

```ts
hashFingerprint(String(ctx.chat.id), process.env.FINGERPRINT_SALT ?? 'default-salt')
```

This means Telegram reporters accumulate points on the same leaderboard as web reporters.

---

## Webhook Security

The route handler checks the `X-Telegram-Bot-Api-Secret-Token` header against `TELEGRAM_WEBHOOK_SECRET`. Requests that fail this check receive a `403` response immediately, before any bot logic runs.

---

## Categories (13)

Crime, Fire, Flood, Road Damage, Power Outage, Medical Emergency, Missing Person, Noise Complaint, Environmental Hazard, Public Disturbance, Gas Leak, Water Main Break, Other

---

## What Does NOT Change

- No changes to the `reports`, `reporter_profiles`, or any existing Supabase tables
- No changes to existing API routes
- No changes to the web app UI
- No PartyKit changes
- The bot does not implement SafeGuide AI, push alert subscriptions, or photo uploads in this version

---

## Acceptance Criteria

1. `/start` shows the main menu with 3 buttons.
2. Tapping "Report Incident" walks through all 4 steps; submitting inserts a row in `reports` and replies with a ticket number.
3. Tapping "Check Status" and entering a valid ticket number returns the formatted status card.
4. Tapping "Leaderboard" returns the top 10 formatted list.
5. Webhook requests without the correct `X-Telegram-Bot-Api-Secret-Token` return 403.
6. Conversation state survives a serverless cold start (persisted in `telegram_sessions`).
7. Cancelling mid-report clears session state and returns to the main menu.
