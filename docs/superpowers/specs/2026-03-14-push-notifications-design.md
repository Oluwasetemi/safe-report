# SafeReport Push Notifications — Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Web Push (VAPID) for citizens (2km nearby alerts) and authority users (parish triage alerts)

---

## 0. Prerequisites

Before implementation, install the required package:

```bash
npm install web-push
npm install --save-dev @types/web-push
```

All API routes that write to `push_subscriptions` must use `createServiceSupabaseClient()` (the service-role client) — the same pattern used in `app/api/reports/route.ts`. The RLS policy blocks all writes from the anon client.

---

## 1. Goals

- Citizens near a new incident (≤2km) receive a native browser push notification even when the tab is closed
- Authority officers receive a push notification when a new incident arrives in their parish or when a report status changes
- Zero external paid services — uses the Web Push API (VAPID) and `web-push` npm package only
- Subscriptions are stored in Supabase; delivery failures auto-clean stale rows

---

## 2. Data Model

### New table: `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  type       text        NOT NULL CHECK (type IN ('citizen', 'authority')),
  lat        float8,                                         -- citizen only
  lng        float8,                                         -- citizen only
  org_id     uuid        REFERENCES authority_organizations(id), -- authority only
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- `endpoint` is UNIQUE — re-subscribing from the same browser upserts, never duplicates
- `lat`/`lng` store the citizen's location at subscription time (2km geo-filter target); refreshed on re-subscribe so a citizen who moves gets updated coordinates
- `org_id` links authority subscriptions to their organization for parish-scoped delivery
- Migration file: `004_push_subscriptions.sql` — verify no migration exists with that number before creating (check `supabase/migrations/` for current highest number)

### TypeScript type (add to `lib/types.ts`)

```ts
export interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  type: 'citizen' | 'authority'
  lat: number | null
  lng: number | null
  org_id: string | null
  created_at: string
}
```

### RLS
- `service_role` only for INSERT/UPDATE/DELETE (all writes go through the API using service role)
- No public read — subscription endpoints are sensitive credentials

### Upsert strategy (`subscribe/route.ts`)

Use Supabase `.upsert()` with `onConflict: 'endpoint'`. On conflict, update `lat`, `lng`, `org_id`, and `type` so a citizen who moves or an officer who changes org gets fresh data:

```ts
await supabase.from('push_subscriptions').upsert(
  { endpoint, p256dh, auth, type, lat, lng, org_id },
  { onConflict: 'endpoint' }
)
```

---

## 3. New Files

```
public/sw.js                        Service worker: receives push event, shows notification, handles click
lib/push/
  vapid.ts                          Loads VAPID keys from env, configures web-push client (throws at load if missing)
  send.ts                           sendPushNotification(sub, payload) — wraps web-push.sendNotification
  citizen-push.ts                   Query subscribers within 2km of report, batch-send via Promise.allSettled
  authority-push.ts                 Query authority subscribers for org, batch-send via Promise.allSettled
hooks/
  use-push-subscription.ts          register SW → requestPermission → subscribe → POST /api/push/subscribe
app/api/push/
  subscribe/route.ts                POST: upsert subscription into push_subscriptions (service role client)
  unsubscribe/route.ts              DELETE: remove subscription by endpoint (body JSON: { endpoint })
supabase/migrations/
  004_push_subscriptions.sql        Table DDL + RLS policies
```

### `next.config.ts` addition

Add response headers so Firefox accepts the service worker:

```ts
async headers() {
  return [{
    source: '/sw.js',
    headers: [
      { key: 'Content-Type', value: 'application/javascript' },
      { key: 'Service-Worker-Allowed', value: '/' },
    ],
  }]
}
```

---

## 4. Trigger Points

Push calls piggyback existing routes — no new trigger infrastructure needed:

| Location | Event | Push function |
|---|---|---|
| `app/api/reports/route.ts` | After report insert | `citizenPush(report)` |
| `app/api/reports/route.ts` | After report insert (when `departments_alerted` set) | `authorityPush(orgId, report)` for each alerted org |
| `lib/api/authority-update.ts` | After status update `acknowledged`/`en_route` | `authorityPush(authorityUser.org_id, report)` |

`orgId` for the last row is obtained from `authorityUser.org_id`, which is already resolved inside `applyStatusUpdate()`.

---

## 5. Data Flow

### Citizen subscription
1. Map page mounts → `usePushSubscription()` checks `pushManager.getSubscription()`
2. User clicks **🔔 Nearby alerts** button
3. `navigator.serviceWorker.register('/sw.js')`
4. `Notification.requestPermission()` — if denied, show muted label, stop
5. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY) })` — key must be a `Uint8Array` for iOS Safari ≥16.4 compatibility; use a `urlBase64ToUint8Array` helper in `use-push-subscription.ts`
6. `POST /api/push/subscribe` `{ endpoint, p256dh, auth, type:'citizen', lat, lng }`
7. Upserted into `push_subscriptions`

### Citizen notification delivery
1. `POST /api/reports` creates a report
2. `citizenPush(report)` queries all `push_subscriptions WHERE type='citizen'`
3. Filters rows in TypeScript using the existing `haversine_distance_meters` logic: `haversineMeters(sub.lat, sub.lng, report.lat, report.lng) <= 2000` — implemented inline in `citizen-push.ts` (no RPC needed; the Haversine formula is a few lines of JS and avoids a round-trip)
4. `Promise.allSettled(subscribers.map(sub => sendPushNotification(sub, payload)))`
5. Browser push service (Google FCM / Mozilla Autopush) delivers to device
6. Service worker `push` event fires → `showNotification(title, { body, data: { url } })`
7. `notificationclick` event → `clients.openWindow(url)` → opens `/incidents/{id}`

### Authority subscription
1. After login, authority sidebar shows **🔔 Enable push alerts** button
2. Same subscription flow → `POST /api/push/subscribe` `{ ..., type:'authority', org_id }`

### Authority notification delivery
1. `applyStatusUpdate()` in `lib/api/authority-update.ts` or new report insert in `app/api/reports/route.ts`
2. `authorityPush(orgId, report)` queries `push_subscriptions WHERE type='authority' AND org_id = orgId`
3. Sends notification: "🚨 NEW CRITICAL: fire_explosion in Kingston — Acknowledge now"
4. Click → service worker opens `/authority/queue`

---

## 6. Service Worker Notification Payloads

### Citizen payload
```json
{
  "title": "🔥 HIGH: Fire reported 800m from you",
  "body": "A residential fire was reported near Half Way Tree, Kingston",
  "icon": "/icon-192.png",
  "badge": "/badge-72.png",
  "data": { "url": "/incidents/{id}" }
}
```

### Authority payload
```json
{
  "title": "🚨 CRITICAL: fire_explosion — Kingston",
  "body": "Warehouse fire near Half Way Tree. 5 confirmations. Acknowledge now.",
  "icon": "/icon-192.png",
  "badge": "/badge-72.png",
  "data": { "url": "/authority/queue" },
  "requireInteraction": true
}
```

`requireInteraction: true` keeps authority notifications visible until dismissed on desktop Chrome/Firefox/Edge. Mobile browsers and iOS ignore this hint — it is a best-effort improvement for desktop officers.

---

## 7. Error Handling

| Scenario | Handling |
|---|---|
| Permission denied | `usePushSubscription` returns `status:'denied'`; UI shows muted label, no retry |
| 410 Gone (expired subscription) | `send.ts` catches 410/404, deletes row from `push_subscriptions` |
| Other delivery failure | Logged, skipped — `Promise.allSettled` ensures one failure doesn't abort batch |
| VAPID keys missing | `vapid.ts` throws at module load — fails loud at startup |
| iOS <16.4 / non-PWA | Button shows tooltip: "Add to home screen to enable notifications on iOS" |
| DELETE with endpoint in body | `unsubscribe/route.ts` reads `const { endpoint } = await req.json()` — endpoint is sensitive, never put in URL path or query string |

---

## 8. Environment Variables

Both `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must be set to the **same value** in `.env.local`. Next.js only exposes `NEXT_PUBLIC_`-prefixed variables to the browser bundle — `VAPID_PUBLIC_KEY` is used server-side in `vapid.ts`, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is read client-side in `use-push-subscription.ts`.

```bash
VAPID_PUBLIC_KEY=        # base64url — used by vapid.ts on the server
VAPID_PRIVATE_KEY=       # base64url — server only, never exposed
VAPID_EMAIL=mailto:alerts@safereport.gov.jm
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # same value as VAPID_PUBLIC_KEY, exposed to browser
```

Generate once with:
```bash
npx web-push generate-vapid-keys
```

---

## 9. Out of Scope (MVP)

- Push notification analytics / delivery receipts dashboard
- Mobile app (APNs) — web push only
- User-configurable radius (hardcoded 2km)
- Quiet hours / do-not-disturb settings
- iOS PWA install prompt
