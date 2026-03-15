# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add VAPID-based Web Push notifications so citizens within 2km of a new incident and authority officers in the affected parish receive browser push alerts even when the tab is closed.

**Architecture:** Seven new files handle the full lifecycle — migration adds the `push_subscriptions` table, `lib/push/` contains server-side VAPID signing and delivery, `hooks/use-push-subscription.ts` manages browser-side registration, two API routes handle subscribe/unsubscribe, `public/sw.js` is the service worker that renders the notification. Push delivery is wired into the two existing trigger points: `app/api/reports/route.ts` for new reports and `lib/api/authority-update.ts` for status changes.

**Tech Stack:** `web-push` (VAPID signing + HTTP push delivery), Web Push API, Service Worker API, Supabase (push_subscriptions table, service role client)

---

## Chunk 1: Foundation — package, types, migration, VAPID module

### Task 1: Install `web-push` dependency

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install packages**

```bash
npm install web-push
npm install --save-dev @types/web-push
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('web-push'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install web-push for VAPID push notifications"
```

---

### Task 2: Add `PushSubscriptionRow` type to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/push-types.test.ts`:

```ts
import { describe, it, expectTypeOf } from 'vitest'
import type { PushSubscriptionRow } from '../types'

describe('PushSubscriptionRow type', () => {
  it('has correct shape', () => {
    const row: PushSubscriptionRow = {
      id: 'uuid',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh: 'base64key',
      auth: 'base64auth',
      type: 'citizen',
      lat: 17.99,
      lng: -76.79,
      org_id: null,
      created_at: new Date().toISOString(),
    }
    expectTypeOf(row.type).toMatchTypeOf<'citizen' | 'authority'>()
    expectTypeOf(row.lat).toMatchTypeOf<number | null>()
    expectTypeOf(row.org_id).toMatchTypeOf<string | null>()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/push-types.test.ts
```

Expected: FAIL — `PushSubscriptionRow` not found in `lib/types.ts`

- [ ] **Step 3: Add interface to `lib/types.ts`**

Append to the end of `lib/types.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/push-types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/__tests__/push-types.test.ts
git commit -m "feat: add PushSubscriptionRow type"
```

---

### Task 3: Create `supabase/migrations/004_push_subscriptions.sql`

**Files:**
- Create: `supabase/migrations/004_push_subscriptions.sql`

- [ ] **Step 1: Verify migration numbering**

```bash
ls supabase/migrations/*.sql
```

Expected: `001_initial_schema.sql`, `002_similarity_fn.sql`, `003_seed_and_storage.sql` — confirm `004` is next.

- [ ] **Step 2: Create migration**

Create `supabase/migrations/004_push_subscriptions.sql`:

```sql
-- ============================================================
-- 004: Push subscriptions table for Web Push (VAPID)
-- ============================================================

CREATE TABLE push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  type       text        NOT NULL CHECK (type IN ('citizen', 'authority')),
  lat        float8,
  lng        float8,
  org_id     uuid        REFERENCES authority_organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service_role can write; no public read (endpoints are credentials)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; these explicit policies
-- ensure anon/authenticated cannot read or write subscription data.
CREATE POLICY "deny_public_read_push_subscriptions"
  ON push_subscriptions FOR SELECT
  USING (false);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/004_push_subscriptions.sql
git commit -m "feat: add push_subscriptions migration"
```

---

### Task 4: Create `lib/push/vapid.ts`

**Files:**
- Create: `lib/push/vapid.ts`

- [ ] **Step 0: Create the `lib/push/` directory**

```bash
mkdir -p lib/push
```

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/push-vapid.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('initVapid', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws when VAPID_PUBLIC_KEY is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv')
    vi.stubEnv('VAPID_EMAIL', 'mailto:test@example.com')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_PUBLIC_KEY')
  })

  it('throws when VAPID_PRIVATE_KEY is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
    vi.stubEnv('VAPID_EMAIL', 'mailto:test@example.com')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_PRIVATE_KEY')
  })

  it('throws when VAPID_EMAIL is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv')
    vi.stubEnv('VAPID_EMAIL', '')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_EMAIL')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/push-vapid.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `lib/push/vapid.ts`**

```ts
import webpush from 'web-push'

const publicKey  = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const email      = process.env.VAPID_EMAIL

if (!publicKey)  throw new Error('Missing env var: VAPID_PUBLIC_KEY')
if (!privateKey) throw new Error('Missing env var: VAPID_PRIVATE_KEY')
if (!email)      throw new Error('Missing env var: VAPID_EMAIL')

webpush.setVapidDetails(email, publicKey, privateKey)

export { webpush }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/push-vapid.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/push/vapid.ts lib/__tests__/push-vapid.test.ts
git commit -m "feat: add VAPID initialisation module"
```

---

### Task 5: Create `lib/push/send.ts`

**Files:**
- Create: `lib/push/send.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/push-send.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PushSubscriptionRow } from '../types'

vi.mock('../push/vapid', () => ({
  webpush: {
    sendNotification: vi.fn(),
  },
}))

// Mock Supabase service client for 410 cleanup
vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}))

const sub: PushSubscriptionRow = {
  id: 'uuid-1',
  endpoint: 'https://fcm.example.com/push/abc',
  p256dh: 'key',
  auth: 'auth',
  type: 'citizen',
  lat: 17.99,
  lng: -76.79,
  org_id: null,
  created_at: new Date().toISOString(),
}

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls webpush.sendNotification with correct arguments', async () => {
    const { webpush } = await import('../push/vapid')
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never)

    const { sendPushNotification } = await import('../push/send')
    await sendPushNotification(sub, { title: 'Test', body: 'Body', data: { url: '/incidents/1' } })

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      expect.stringContaining('Test')
    )
  })

  it('deletes subscription on 410 Gone', async () => {
    const { webpush } = await import('../push/vapid')
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)

    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({ from: fromMock } as never)

    const { sendPushNotification } = await import('../push/send')
    // Should not throw — errors are swallowed
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()

    expect(eqMock).toHaveBeenCalledWith('endpoint', sub.endpoint)
  })

  it('deletes subscription on 404 Not Found', async () => {
    const { webpush } = await import('../push/vapid')
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)

    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({ from: fromMock } as never)

    const { sendPushNotification } = await import('../push/send')
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()

    expect(eqMock).toHaveBeenCalledWith('endpoint', sub.endpoint)
  })

  it('swallows other delivery errors', async () => {
    const { webpush } = await import('../push/vapid')
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('Network error'))

    const { sendPushNotification } = await import('../push/send')
    await expect(sendPushNotification(sub, { title: 'T', body: 'B', data: { url: '/' } })).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/push-send.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `lib/push/send.ts`**

```ts
import { webpush } from './vapid'
import { createServiceSupabaseClient } from '../supabase/server'
import type { PushSubscriptionRow } from '../types'

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data: { url: string }
  requireInteraction?: boolean
}

export async function sendPushNotification(
  sub: PushSubscriptionRow,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ icon: '/icon-192.png', badge: '/badge-72.png', ...payload })
    )
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      // Subscription expired — remove from DB
      const supabase = createServiceSupabaseClient()
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    } else {
      console.error('[push] delivery error:', err)
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/push-send.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/push/send.ts lib/__tests__/push-send.test.ts
git commit -m "feat: add sendPushNotification with 410 auto-cleanup"
```

---

## Chunk 2: Delivery functions and API routes

### Task 6: Create `lib/push/citizen-push.ts`

**Files:**
- Create: `lib/push/citizen-push.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/push-citizen.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Report, PushSubscriptionRow } from '../types'

vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))
vi.mock('../push/send', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

const baseReport: Report = {
  id: 'rep-1',
  device_fingerprint: 'fp',
  lat: 17.99,
  lng: -76.79,
  description: 'Test fire',
  category: 'fire_explosion',
  severity: 'HIGH',
  status: 'active',
  corroboration_count: 2,
  confidence_score: 0.8,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  expires_at: new Date(Date.now() + 1000 * 3600).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ai_summary: 'Test fire near Half Way Tree',
  address: 'Half Way Tree, Kingston',
  parish: 'Kingston',
}

const nearSub: PushSubscriptionRow = {
  id: 'sub-1',
  endpoint: 'https://fcm.example.com/1',
  p256dh: 'key1',
  auth: 'auth1',
  type: 'citizen',
  lat: 17.991,  // ~110m away
  lng: -76.791,
  org_id: null,
  created_at: new Date().toISOString(),
}

const farSub: PushSubscriptionRow = {
  id: 'sub-2',
  endpoint: 'https://fcm.example.com/2',
  p256dh: 'key2',
  auth: 'auth2',
  type: 'citizen',
  lat: 18.1,    // ~12km away — outside 2km
  lng: -76.9,
  org_id: null,
  created_at: new Date().toISOString(),
}

describe('citizenPush', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('sends only to subscribers within 2km', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [nearSub, farSub], error: null }),
        }),
      }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    const { citizenPush } = await import('../push/citizen-push')

    await citizenPush(baseReport)

    expect(sendPushNotification).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendPushNotification).mock.calls[0][0].endpoint).toBe(nearSub.endpoint)
  })

  it('does nothing when no subscribers', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    const { citizenPush } = await import('../push/citizen-push')

    await citizenPush(baseReport)

    expect(sendPushNotification).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/push-citizen.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `lib/push/citizen-push.ts`**

```ts
import { createServiceSupabaseClient } from '../supabase/server'
import { sendPushNotification } from './send'
import type { Report, PushSubscriptionRow } from '../types'

/** Haversine distance in metres between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export async function citizenPush(report: Report): Promise<void> {
  const supabase = createServiceSupabaseClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('type', 'citizen')

  if (!subs?.length) return

  const nearby = (subs as PushSubscriptionRow[]).filter(
    (s) => s.lat !== null && s.lng !== null && haversineMeters(s.lat!, s.lng!, report.lat, report.lng) <= 2000
  )

  const distanceLabel = (s: PushSubscriptionRow) => {
    const m = Math.round(haversineMeters(s.lat!, s.lng!, report.lat, report.lng))
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
  }

  await Promise.allSettled(
    nearby.map((sub) =>
      sendPushNotification(sub, {
        title: `${report.severity === 'CRITICAL' ? '🚨' : report.severity === 'HIGH' ? '🔥' : '⚠️'} ${report.severity}: ${report.category.replaceAll('_', ' ')} reported ${distanceLabel(sub)} from you`,
        body: report.ai_summary ?? report.description.slice(0, 100),
        data: { url: `/incidents/${report.id}` },
      })
    )
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/push-citizen.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/push/citizen-push.ts lib/__tests__/push-citizen.test.ts
git commit -m "feat: add citizenPush with inline haversine 2km filter"
```

---

### Task 7: Create `lib/push/authority-push.ts`

**Files:**
- Create: `lib/push/authority-push.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/push-authority.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Report, PushSubscriptionRow } from '../types'

vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))
vi.mock('../push/send', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

const baseReport: Report = {
  id: 'rep-1',
  device_fingerprint: 'fp',
  lat: 17.99,
  lng: -76.79,
  description: 'Warehouse fire',
  category: 'fire_explosion',
  severity: 'CRITICAL',
  status: 'active',
  corroboration_count: 5,
  confidence_score: 0.95,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  expires_at: new Date(Date.now() + 1000 * 3600 * 48).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ai_summary: 'Warehouse fire near Half Way Tree',
  address: 'Half Way Tree, Kingston',
  parish: 'Kingston',
}

const authSub: PushSubscriptionRow = {
  id: 'sub-auth-1',
  endpoint: 'https://fcm.example.com/auth/1',
  p256dh: 'key',
  auth: 'auth',
  type: 'authority',
  lat: null,
  lng: null,
  org_id: 'org-uuid-1',
  created_at: new Date().toISOString(),
}

describe('authorityPush', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('sends to authority subscribers for the given org', async () => {
    const { createServiceSupabaseClient } = await import('../supabase/server')
    const eqOrgMock = vi.fn().mockResolvedValue({ data: [authSub], error: null })
    const eqTypeMock = vi.fn().mockReturnValue({ eq: eqOrgMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqTypeMock })
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as never)

    const { sendPushNotification } = await import('../push/send')
    const { authorityPush } = await import('../push/authority-push')

    await authorityPush('org-uuid-1', baseReport)

    expect(sendPushNotification).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendPushNotification).mock.calls[0][1].requireInteraction).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/push-authority.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `lib/push/authority-push.ts`**

```ts
import { createServiceSupabaseClient } from '../supabase/server'
import { sendPushNotification } from './send'
import type { Report, PushSubscriptionRow } from '../types'

export async function authorityPush(orgId: string, report: Report): Promise<void> {
  const supabase = createServiceSupabaseClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('type', 'authority')
    .eq('org_id', orgId)

  if (!subs?.length) return

  const confirmations = report.corroboration_count > 0
    ? ` ${report.corroboration_count} confirmation${report.corroboration_count > 1 ? 's' : ''}.`
    : ''

  await Promise.allSettled(
    (subs as PushSubscriptionRow[]).map((sub) =>
      sendPushNotification(sub, {
        title: `🚨 ${report.severity}: ${report.category.replaceAll('_', ' ')} — ${report.parish ?? 'Unknown'}`,
        body: `${report.ai_summary ?? report.description.slice(0, 80)}${confirmations} Acknowledge now.`,
        data: { url: '/authority/queue' },
        requireInteraction: true,
      })
    )
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/push-authority.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/push/authority-push.ts lib/__tests__/push-authority.test.ts
git commit -m "feat: add authorityPush for parish triage alerts"
```

---

### Task 8: Create API routes `subscribe` and `unsubscribe`

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/unsubscribe/route.ts`
- Test: `app/api/push/__tests__/push-routes.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/api/push/__tests__/push-routes.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))

describe('POST /api/push/subscribe', () => {
  beforeEach(() => vi.resetModules())

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when authority type has no org_id', async () => {
    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://example.com', p256dh: 'key', auth: 'auth', type: 'authority' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/org_id/)
  })

  it('returns 200 on valid citizen subscription', async () => {
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)

    const { POST } = await import('../subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://fcm.example.com/1', p256dh: 'key', auth: 'auth', type: 'citizen', lat: 17.99, lng: -76.79 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

describe('DELETE /api/push/unsubscribe', () => {
  beforeEach(() => vi.resetModules())

  it('returns 400 when endpoint is missing', async () => {
    const { DELETE } = await import('../unsubscribe/route')
    const req = new NextRequest('http://localhost/api/push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({}),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid unsubscribe', async () => {
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as never)

    const { DELETE } = await import('../unsubscribe/route')
    const req = new NextRequest('http://localhost/api/push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: 'https://fcm.example.com/1' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run app/api/push/__tests__/push-routes.test.ts
```

Expected: FAIL — modules not found

- [ ] **Step 3: Create `app/api/push/subscribe/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth, type, lat, lng, org_id } = await req.json()

    if (!endpoint || !p256dh || !auth || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (type !== 'citizen' && type !== 'authority') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (type === 'authority' && !org_id) {
      return NextResponse.json({ error: 'org_id required for authority subscriptions' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { endpoint, p256dh, auth, type, lat: lat ?? null, lng: lng ?? null, org_id: org_id ?? null },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('POST /api/push/subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create `app/api/push/unsubscribe/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/push/unsubscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run app/api/push/__tests__/push-routes.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/push/subscribe/route.ts app/api/push/unsubscribe/route.ts app/api/push/__tests__/push-routes.test.ts
git commit -m "feat: add push subscribe/unsubscribe API routes with tests"
```

---

## Chunk 3: Service worker, hook, trigger wiring, and config

### Task 9: Create `public/sw.js` service worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Create the service worker**

Create `public/sw.js`:

```js
self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:                payload.body,
      icon:                payload.icon  ?? '/icon-192.png',
      badge:               payload.badge ?? '/badge-72.png',
      data:                payload.data,
      requireInteraction:  payload.requireInteraction ?? false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add service worker for push notification display"
```

---

### Task 10: Add SW headers to `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add headers config**

In `next.config.ts`, add a `headers()` function to the `nextConfig` object:

```ts
async headers() {
  return [
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ]
},
```

- [ ] **Step 2: Verify build still works**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no errors

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add service worker headers for Firefox compatibility"
```

---

### Task 11: Create `hooks/use-push-subscription.ts`

**Files:**
- Create: `hooks/use-push-subscription.ts`

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/use-push-subscription.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock browser APIs
const mockSubscription = {
  endpoint: 'https://fcm.example.com/push/abc',
  toJSON: () => ({
    endpoint: 'https://fcm.example.com/push/abc',
    keys: { p256dh: 'key', auth: 'authval' },
  }),
  unsubscribe: vi.fn().mockResolvedValue(true),
}

const mockPushManager = {
  getSubscription: vi.fn().mockResolvedValue(null),
  subscribe: vi.fn().mockResolvedValue(mockSubscription),
}

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
}

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
      ready: Promise.resolve(mockServiceWorkerRegistration),
    },
    geolocation: {
      getCurrentPosition: vi.fn((cb) =>
        cb({ coords: { latitude: 17.99, longitude: -76.79 } })
      ),
    },
  },
  writable: true,
})

Object.defineProperty(global, 'Notification', {
  value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
  writable: true,
})

// jsdom does not implement PushManager — define it so the unsupported guard doesn't fire
Object.defineProperty(global, 'PushManager', { value: {}, writable: true })

global.fetch = vi.fn().mockResolvedValue({ ok: true })

describe('usePushSubscription', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)
    vi.mocked(Notification.requestPermission).mockResolvedValue('granted')
    mockPushManager.getSubscription.mockResolvedValue(null)
  })

  it('initializes with idle status', async () => {
    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() => usePushSubscription())
    expect(result.current.status).toBe('idle')
  })

  it('subscribes and posts to /api/push/subscribe', async () => {
    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() =>
      usePushSubscription({ type: 'citizen', lat: 17.99, lng: -76.79 })
    )

    await act(async () => {
      await result.current.subscribe()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/push/subscribe',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.current.status).toBe('subscribed')
  })

  it('returns denied status when permission is denied', async () => {
    vi.mocked(Notification.requestPermission).mockResolvedValue('denied')

    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() => usePushSubscription())

    await act(async () => {
      await result.current.subscribe()
    })

    expect(result.current.status).toBe('denied')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run hooks/__tests__/use-push-subscription.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `hooks/use-push-subscription.ts`**

```ts
'use client'

import { useState, useEffect } from 'react'

export type PushStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error'

interface Options {
  type?: 'citizen' | 'authority'
  lat?: number
  lng?: number
  org_id?: string
}

/** Convert a base64url string to Uint8Array (required by Safari and some Chrome versions) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushSubscription(options: Options = {}) {
  const { type = 'citizen', lat, lng, org_id } = options
  const [status, setStatus] = useState<PushStatus>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
    }
  }, [])

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          type,
          lat: lat ?? null,
          lng: lng ?? null,
          org_id: org_id ?? null,
        }),
      })

      setStatus('subscribed')
    } catch (err) {
      console.error('[push] subscribe error:', err)
      setStatus('error')
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      setStatus('idle')
    } catch (err) {
      console.error('[push] unsubscribe error:', err)
    }
  }

  return { status, subscribe, unsubscribe }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run hooks/__tests__/use-push-subscription.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-push-subscription.ts hooks/__tests__/use-push-subscription.test.ts
git commit -m "feat: add usePushSubscription hook with iOS Safari compatibility"
```

---

### Task 12: Wire `citizenPush` and `authorityPush` into trigger points

**Files:**
- Modify: `app/api/reports/route.ts`
- Modify: `lib/api/authority-update.ts`

- [ ] **Step 1: Wire `citizenPush` into `app/api/reports/route.ts`**

Add the import at the top of the file (after the existing alert imports):

```ts
import { citizenPush } from '@/lib/push/citizen-push'
import { authorityPush } from '@/lib/push/authority-push'
```

In the existing `await Promise.all([...])` block at the bottom of the POST handler, add push calls. The existing block fires alerts and PartyKit — extend it to also fire push after the `departments_alerted` update:

After the `await supabase.from('reports').update({ departments_alerted: ... })` block, add:

```ts
// Fire push notifications (non-blocking — don't let push failures affect the response)
citizenPush(report).catch((e) => console.error('[push] citizenPush error:', e))

if (departments?.length) {
  for (const dept of departments) {
    authorityPush(dept.id, report).catch((e) => console.error('[push] authorityPush error:', e))
  }
}
```

- [ ] **Step 2: Wire `authorityPush` into `lib/api/authority-update.ts`**

Add import at top of file:

```ts
import { authorityPush } from '../push/authority-push'
```

After the existing PartyKit broadcast calls (the two `fetch` calls), add:

```ts
if (status === 'acknowledged' || status === 'en_route') {
  authorityPush(authorityUser.org_id, report).catch((e) =>
    console.error('[push] authorityPush error:', e)
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes with no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/reports/route.ts lib/api/authority-update.ts
git commit -m "feat: wire citizenPush and authorityPush into report/status triggers"
```

---

### Task 13: Add push notification UI buttons

**Files:**
- Modify: `app/(citizen)/page.tsx` — add `🔔 Nearby alerts` button
- Modify: `components/authority/sidebar-nav.tsx` — add `🔔 Enable push alerts` button

- [ ] **Step 1: Add push button to citizen map page**

In `app/(citizen)/page.tsx`, import the hook and add a button near the map controls:

```ts
import { usePushSubscription } from '@/hooks/use-push-subscription'
```

Inside the component, add:

```ts
const push = usePushSubscription({ type: 'citizen', lat: userLocation?.lat, lng: userLocation?.lng })
```

Add a button in the UI (position it near the map controls, e.g. top-right):

```tsx
{push.status === 'unsupported' ? null : (
  <button
    onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
    title={push.status === 'denied' ? 'Add to home screen to enable notifications on iOS' : undefined}
    className="..."
  >
    {push.status === 'subscribed' ? '🔔 Alerts on' : push.status === 'denied' ? '🔕 Blocked' : '🔔 Nearby alerts'}
  </button>
)}
```

- [ ] **Step 2: Add push button to authority sidebar**

In `components/authority/sidebar-nav.tsx`, import and use the hook:

```ts
import { usePushSubscription } from '@/hooks/use-push-subscription'
```

Inside the component, add (using `orgId` prop which the sidebar already receives):

```ts
const push = usePushSubscription({ type: 'authority', org_id: orgId })
```

Add a button in the sidebar navigation:

```tsx
{push.status !== 'unsupported' && (
  <button
    onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
    className="..."
  >
    {push.status === 'subscribed' ? '🔔 Push on' : '🔔 Enable push alerts'}
  </button>
)}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes with no errors

- [ ] **Step 4: Commit**

```bash
git add app/(citizen)/page.tsx components/authority/sidebar-nav.tsx
git commit -m "feat: add push notification subscription buttons to citizen map and authority sidebar"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (no regressions)

- [ ] **Run production build**

```bash
npm run build
```

Expected: all routes compile, no TypeScript errors

- [ ] **Generate VAPID keys for local dev (one-time)**

```bash
npx web-push generate-vapid-keys
```

Copy output to `.env.local`:
```
VAPID_PUBLIC_KEY=<paste public key>
VAPID_PRIVATE_KEY=<paste private key>
VAPID_EMAIL=mailto:alerts@safereport.gov.jm
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```
