# SafeReport — Implementation Design
**Version:** 1.0.0
**Date:** 2026-03-14
**Spec source:** SafeReport-Spec-v2.0.0.md
**Scope:** Full hackathon MVP (22 features, Must-Have + Should-Have)

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Full hackathon MVP | All Must-Have + Should-Have features |
| Backend | Next.js API routes (monorepo) | Single deployment, no Hono/Workers split |
| External services | All real (no mocks) | Accounts + keys ready |
| Authority auth | Full Supabase Auth + RLS | Production-grade, pre-seeded accounts |
| Photo storage | Supabase Storage | Already on Supabase, RLS carries over |
| Email | Resend | Replaces SendGrid |
| AI SDK | Vercel AI SDK + `@ai-sdk/anthropic` | Unified interface, streaming, structured output |
| UI components | shadcn/ui | Accessible primitives, customised to Hi-Vis Signal brand |
| App structure | Multi-route flat (Approach B) | Clean separation, independently buildable |
| Brand | Hi-Vis Signal | Chartreuse + midnight black, Barlow Condensed |
| Parallel async | `better-all` npm package | Replaces `Promise.all` |

---

## Section 1: Route Structure & App Architecture

Next.js 16 App Router with route groups separating citizen, authority, and public surfaces.

```
app/
├── (citizen)/
│   ├── page.tsx                        → /           Live map
│   ├── report/
│   │   ├── page.tsx                    → /report     Report form
│   │   └── [id]/page.tsx              → /report/:id  Confirmation + emergency card
│   ├── incidents/[id]/page.tsx        → /incidents/:id  Incident detail
│   ├── leaderboard/page.tsx           → /leaderboard
│   └── complaints/[ticket]/page.tsx  → /complaints/:ticket
│
├── (authority)/
│   ├── layout.tsx                     → Auth guard (Supabase session check)
│   ├── authority/
│   │   ├── login/page.tsx             → /authority/login
│   │   ├── queue/page.tsx             → /authority/queue  Triage feed
│   │   ├── map/page.tsx               → /authority/map
│   │   └── analytics/page.tsx         → /authority/analytics
│
├── (public)/
│   └── transparency/page.tsx          → /transparency
│
├── api/
│   ├── reports/route.ts               POST /api/reports
│   ├── reports/[id]/route.ts          GET/PATCH
│   ├── reports/[id]/corroborate/route.ts
│   ├── authority/[id]/acknowledge/route.ts
│   ├── authority/[id]/enroute/route.ts
│   ├── authority/[id]/resolve/route.ts
│   ├── authority/[id]/flag/route.ts
│   ├── alerts/route.ts
│   ├── ai/classify/route.ts
│   ├── ai/guide/route.ts
│   ├── leaderboard/route.ts
│   └── stats/route.ts
│
└── layout.tsx                         Root layout — fonts, globals
```

**Key decisions:**
- Route groups share no layout — each has its own `layout.tsx`
- Authority layout wraps all `/authority/*` routes with session check — redirects to `/authority/login` if unauthorized
- API routes are flat Next.js route handlers with typed request/response
- PartyKit connections established client-side in each page that needs real-time

---

## Section 2: Data Layer & External Services

### Database Schema (PostgreSQL + pgvector via Supabase)

```sql
-- Core reports table
reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint    text NOT NULL,
  lat                   float8 NOT NULL,
  lng                   float8 NOT NULL,
  accuracy              float4,
  address               text,
  parish                text,
  description           text NOT NULL,
  photo_url             text,
  voice_transcript      text,
  category              text NOT NULL,
  subcategory           text,
  severity              text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  ai_summary            text,
  ai_confidence         float4,
  is_duplicate          bool DEFAULT false,
  parent_incident_id    uuid REFERENCES reports(id),
  embedding             vector(1536),
  confidence_score      float4 DEFAULT 0,
  corroboration_count   int DEFAULT 0,
  reporter_trust_multiplier float4 DEFAULT 1.0,
  status                text NOT NULL DEFAULT 'active',
  departments_alerted   text[],
  alerts_sent_at        timestamptz,
  acknowledged_by       text,
  acknowledged_at       timestamptz,
  en_route_at           timestamptz,
  resolved_at           timestamptz,
  resolution_description text,
  is_crime              bool DEFAULT false,
  suspect_description   text,
  direction_of_travel   text,
  contact_number        text,
  police_ref_number     text,
  ticket_number         text,
  escalated             bool DEFAULT false,
  flagged               bool DEFAULT false,
  expires_at            timestamptz NOT NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
)

-- Reporter profiles (pseudonymous)
reporter_profiles (
  fingerprint           text PRIMARY KEY,
  display_name          text,
  trust_level           int DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5),
  total_points          int DEFAULT 0,
  monthly_points        int DEFAULT 0,
  total_reports         int DEFAULT 0,
  verified_reports      int DEFAULT 0,
  accuracy_rate         float4 DEFAULT 0,
  joined_at             timestamptz DEFAULT now()
)

-- Authority organizations
authority_organizations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  type                  text NOT NULL CHECK (type IN ('police','fire','ambulance','odpem','parish_council','jps')),
  parish                text[],
  alert_phone           text,
  alert_whatsapp        text,
  alert_email           text
)

-- Authority users (linked to Supabase auth.users)
authority_users (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id),
  org_id                uuid REFERENCES authority_organizations(id),
  name                  text NOT NULL,
  role                  text DEFAULT 'officer'
)
```

### External Services Map

| Service | Purpose | Called from |
|---|---|---|
| Supabase DB | All persistence | API routes |
| Supabase Auth | Authority login/session | Authority layout guard |
| Supabase Storage | Photo uploads | `POST /api/reports` |
| PartyKit | Real-time broadcast | API routes (server→party) + client hooks |
| Vercel AI SDK + `@ai-sdk/anthropic` | Classification, SafeGuide, summarization | `/api/ai/classify`, `/api/ai/guide` |
| Voyage AI | Embeddings for pgvector dedup | `/api/ai/classify` (direct) |
| Nominatim | Reverse geocoding (GPS → address) | `POST /api/reports` |
| Twilio SMS | Department SMS alerts | `POST /api/alerts` |
| Twilio WhatsApp | Department WhatsApp alerts | `POST /api/alerts` |
| Resend | Department email alerts | `POST /api/alerts` |

### Report Submission Flow (server-side)

```
POST /api/reports
  1. Validate + sanitize input
  2. Reverse geocode via Nominatim (lat/lng → address + parish)
  3. Hash+salt device fingerprint (SHA-256 + server-side SALT env)
  4. POST to AI classify pipeline:
       a. generateObject → category + severity + urgencySignals + confidence
       b. Voyage AI → generate embedding vector(1536)
       c. pgvector similarity search (500m radius, 6h window, threshold 0.85)
       d. If duplicate → corroborate parent, return { isDuplicate: true, parentId }
       e. If new → generateText → AI summary (1–2 sentences)
  5. Insert report row to Supabase
  6. POST /api/alerts → fire Twilio SMS + WhatsApp + Resend email in parallel via better-all
  7. POST to PartyKit map:global room → INCIDENT_CREATED broadcast
  8. Return { reportId, ticketNumber, policeRefNumber, departmentsAlerted }
```

---

## Section 3: Real-Time Architecture (PartyKit)

PartyKit runs as a separate service. Next.js API routes broadcast via HTTP; clients connect via WebSocket using `usePartySocket` (mandated by project config).

### Room Structure

| Room | Subscribers | Purpose |
|---|---|---|
| `map:global` | All visitors | New pins, confidence updates, status changes |
| `map:region:{parish}` | Location-granted users | Proximity alerts within parish |
| `authority:{orgId}` | Authority dashboard | Private triage feed |
| `incident:{incidentId}` | Report confirmation page | Two-way status updates to reporter |

### Event Types

```ts
// Server → Client
type ServerEvent =
  | { type: 'SNAPSHOT';              incidents: Incident[] }
  | { type: 'INCIDENT_CREATED';      incident: Incident }
  | { type: 'INCIDENT_UPDATED';      incident: Incident }
  | { type: 'INCIDENT_RESOLVED';     incidentId: string }
  | { type: 'INCIDENT_CORROBORATED'; incidentId: string; confidenceScore: number; count: number }
  | { type: 'STATUS_UPDATE';         incidentId: string; status: string; authorityName: string }
  | { type: 'PROXIMITY_ALERT';       incident: Incident; distanceMeters: number }

// Client → Server
type ClientEvent =
  | { type: 'CORROBORATE';     incidentId: string }
  | { type: 'LOCATION_UPDATE'; lat: number; lng: number }
```

### PartyKit Server Files

```
party/
├── map.ts           → map:global + map:region:* (snapshot on connect, broadcast on event)
├── authority.ts     → authority:{orgId} (private room, requires orgId validation)
└── incident.ts      → incident:{incidentId} (per-incident status relay)
```

### Client Hooks

```
hooks/
├── use-realtime-map.ts       → usePartySocket → map:global → manages incident state
├── use-realtime-region.ts    → usePartySocket → map:region:{parish} → proximity alerts
├── use-realtime-incident.ts  → usePartySocket → incident:{id} → confirmation page updates
└── use-authority-feed.ts     → usePartySocket → authority:{orgId} → triage dashboard
```

**Broadcasting from API routes:**
```ts
await fetch(`${process.env.PARTYKIT_HOST}/parties/map/map:global`, {
  method: 'POST',
  body: JSON.stringify({ type: 'INCIDENT_CREATED', incident }),
})
```

**Connection strategy:**
- `/` → `map:global` on load; `map:region:{parish}` after location grant
- `/report/[id]` → `incident:{id}` for live status updates back to reporter
- `/authority/queue` → `authority:{orgId}` after session confirmed
- Offline: map caches last snapshot in component state; reconnects with exponential backoff

---

## Section 4: AI Pipeline

All AI via **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`). Model: `claude-sonnet-4-5`.

### Classification Pipeline — `POST /api/ai/classify`

```
Step 1 — generateObject → { category, subcategory, severity, urgencySignals[], confidence }
Step 2 — Voyage AI → vector(1536) embedding
Step 3 — pgvector similarity search (500m, 6h, threshold < 0.15 distance = > 0.85 similarity)
          → If match: return { isDuplicate: true, parentId }
Step 4 — Urgency signals present → upgrade severity to min HIGH
Step 5 — Quality score: has GPS + description length > 20 + no spam → if low, flagged: true
Step 6 — generateText → 1–2 sentence AI summary for pin detail card
```

**Zod schema for Step 1:**
```ts
const ClassificationSchema = z.object({
  category:       z.enum([...ALL_CATEGORIES]),
  subcategory:    z.string(),
  severity:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  urgencySignals: z.array(z.string()),
  confidence:     z.number().min(0).max(1),
})

const result = await generateObject({
  model:  anthropic('claude-sonnet-4-5'),
  schema: ClassificationSchema,
  prompt: classifyPrompt(description, parish, landmarks),
})
```

### SafeGuide — `POST /api/ai/guide`

Streaming chat. Uses `streamText` with Patois-aware system prompt.

```ts
const result = streamText({
  model:    anthropic('claude-sonnet-4-5'),
  system:   SAFEGUIDE_SYSTEM_PROMPT,
  messages,
})
return result.toDataStreamResponse()
```

**`SAFEGUIDE_SYSTEM_PROMPT` covers:**
- Understands + responds in Jamaican Patois natively
- Extracts report type, severity, location from natural speech
- Reads back summary before submitting
- Guides user through report flow step-by-step
- Never requests personal information
- Falls back to English if user writes in English

**Client:** `useChat` (Vercel AI SDK) + Web Speech API (input) + Web Speech Synthesis API (output).

### File Structure

```
app/api/ai/
├── classify/route.ts
└── guide/route.ts

lib/ai/
├── classify.ts       → 6-step pipeline orchestration
├── prompts.ts        → classifier prompt + SafeGuide Patois system prompt
├── embeddings.ts     → Voyage AI embedding generation
└── dedup.ts          → pgvector similarity search
```

---

## Section 5: Alert System

Fires immediately after a new (non-duplicate) report is inserted. Three channels in parallel via `better-all`.

### Department Routing

```ts
// lib/alerts/routing.ts
const ROUTING: Record<Category, DepartmentType[]> = {
  'fire_explosion':    ['fire', 'ambulance'],
  'flash_flood':       ['police', 'odpem'],
  'medical_emergency': ['police', 'ambulance'],
  'building_collapse': ['fire', 'ambulance', 'odpem'],
  'downed_power_line': ['fire', 'odpem', 'jps'],
  'crime':             ['police'],
  'road_collapse':     ['police', 'parish_council'],
  'pothole':           ['parish_council'],
  'power_outage':      ['jps'],
  'environmental':     ['odpem', 'parish_council'],
  // ... full table per spec §9
}
```

Parish used to select the specific parish council / police division from `authority_organizations`.

### Alert Payload

```ts
type AlertPayload = {
  reportId:   string
  category:   string
  severity:   'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  address:    string
  parish:     string
  lat:        number
  lng:        number
  aiSummary:  string
  timestamp:  string
  mapUrl:     string   // /incidents/{id}
  respondUrl: string   // /authority/login
}
```

### Channels

- **SMS (Twilio):** Formatted text block with severity, location, address, AI summary, map link
- **WhatsApp (Twilio):** Same format sent to dept operational WhatsApp number
- **Email (Resend):** HTML React email template — same data + static map tile + "Acknowledge" CTA button

### File Structure

```
app/api/alerts/route.ts
lib/alerts/
├── routing.ts
├── sms.ts
├── whatsapp.ts
├── email.ts
└── templates/
    ├── sms.ts
    └── email.tsx        → Resend React Email template
```

**Parallel execution:**
```ts
import betterAll from 'better-all'

await betterAll([
  sendSMS(departments, payload),
  sendWhatsApp(departments, payload),
  sendEmail(departments, payload),
])
```

---

## Section 6: UI Layer

### Technology

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (customised to Hi-Vis Signal brand via CSS variables)
- **Fonts:** `next/font/google` → Barlow Condensed + Barlow + Space Mono
- **Icons:** Lucide React (stroke-width 1.5, never filled)
- **Map:** Leaflet.js via `react-leaflet` (dynamic import, `ssr: false`)
- **Geocoding:** Nominatim (free, no API key)
- **Brand:** Hi-Vis Signal — see `docs/brand-guide.md`

### Page Inventory

| Route | Page | Key UI Elements |
|---|---|---|
| `/` | Live Map | Full-screen Leaflet map, report FAB, pin clusters, SafeGuide FAB, layer toggles |
| `/report` | Report Form | Category picker, GPS capture, description, photo upload, AI preview |
| `/report/[id]` | Confirmation | Emergency card, dept contacts, one-tap call buttons, status tracker |
| `/incidents/[id]` | Incident Detail | AI summary, corroboration count, timeline, severity badge |
| `/leaderboard` | Leaderboard | Reporter table, trust badges, tabs (global/monthly/regional/category) |
| `/complaints/[ticket]` | Complaint Lookup | Ticket status, timeline, escalation indicator |
| `/transparency` | Public Dashboard | Aggregate stats, charts, authority response scores |
| `/authority/login` | Authority Login | Supabase email/password form |
| `/authority/queue` | Triage Queue | Live feed, priority-sorted triage cards, action buttons |
| `/authority/map` | Authority Map | Full map, all pins including crime exact locations |
| `/authority/analytics` | Analytics | Resolution times, SLA compliance, hotspot heatmap |

### Component Tree

```
components/
├── map/
│   ├── live-map.tsx
│   ├── incident-pin.tsx
│   ├── crime-zone.tsx
│   ├── evacuation-zone.tsx
│   ├── pin-cluster.tsx
│   └── map-controls.tsx
│
├── report/
│   ├── category-picker.tsx
│   ├── location-capture.tsx
│   ├── description-input.tsx
│   ├── photo-upload.tsx
│   ├── ai-preview.tsx
│   └── discreet-mode-toggle.tsx
│
├── incident/
│   ├── emergency-card.tsx
│   ├── status-tracker.tsx
│   ├── corroborate-button.tsx
│   └── incident-timeline.tsx
│
├── authority/
│   ├── triage-card.tsx
│   ├── triage-actions.tsx
│   ├── authority-map-pin.tsx
│   └── sla-timer.tsx
│
├── safe-guide/
│   ├── safe-guide-fab.tsx
│   ├── safe-guide-chat.tsx
│   └── voice-input.tsx
│
├── leaderboard/
│   ├── reporter-row.tsx
│   └── trust-badge.tsx
│
└── ui/
    └── [shadcn generated components]
```

### Layout Details

**Citizen (light surface):**
- `/` — zero chrome, map fills full viewport, report FAB bottom-center (brand-primary), SafeGuide FAB bottom-right
- `/report` — white card page, progress steps at top, back arrow to map
- `/report/[id]` — emergency card slides up from bottom over dimmed background

**Authority (dark surface):**
- All `/authority/*` share dark sidebar layout (surface-raised `#0D1829`)
- Sidebar nav: Queue (with unread badge), Map, Analytics
- Active nav item: left border `brand-primary` chartreuse

**Leaflet SSR exclusion:**
```ts
const LiveMap = dynamic(() => import('@/components/map/live-map'), { ssr: false })
```

---

## Section 7: Auth & Security

### Authority Auth Flow

```
POST /authority/login
  → supabase.auth.signInWithPassword({ email, password })
  → Session stored in Supabase cookie (SSR-compatible via @supabase/ssr)
  → Redirect to /authority/queue

app/(authority)/layout.tsx
  → createServerClient → getUser()
  → No session → redirect('/authority/login')
  → Session valid → fetch authority_users row → provide orgId via context
```

### Middleware (`middleware.ts`)
Refreshes Supabase session on every request. Protects all `/authority/*` routes.

### RLS Policies (key rules)

```sql
-- Public: non-sensitive fields only, non-expired, non-crime
CREATE POLICY "public_read_reports" ON reports FOR SELECT
  USING (auth.role() = 'anon' AND expires_at > NOW() AND NOT is_crime);

-- Authority: full rows in their parish
CREATE POLICY "authority_read_reports" ON reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM authority_users au
    JOIN authority_organizations ao ON au.org_id = ao.id
    WHERE au.id = auth.uid() AND reports.parish = ANY(ao.parish)
  ));

-- Police only: crime-sensitive fields
CREATE POLICY "police_read_crime_fields" ON reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM authority_users au
    JOIN authority_organizations ao ON au.org_id = ao.id
    WHERE au.id = auth.uid() AND ao.type = 'police'
  ));

-- Status updates: authority only
CREATE POLICY "authority_update_status" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM authority_users WHERE id = auth.uid()));
```

### Device Fingerprint (Citizen Anonymity)

```ts
// Client: collected on report submission
const raw = [navigator.userAgent, screen.width, screen.height, timezone, language].join('|')

// Server: POST /api/reports — hashed, never stored raw
const fingerprint = createHash('sha256').update(raw + process.env.FINGERPRINT_SALT).digest('hex')
```

### Security Checklist

| Concern | Mitigation |
|---|---|
| Crime report exposure | RLS excludes `is_crime = true` rows from all public queries |
| Authority impersonation | Pre-seeded accounts only — no self-signup route |
| Fingerprint reversal | SHA-256 + server-side salt env variable |
| Rate limiting | Max 5 reports per fingerprint per 10 min (Supabase check in `/api/reports`) |
| Photo upload abuse | Supabase Storage — uploads only via API route, not direct client upload |
| API route protection | `/api/authority/*` routes check Supabase session before executing |
| XSS | All user content sanitized before DB insert; AI summary never rendered as innerHTML |

### File Structure

```
lib/supabase/
├── client.ts         → createBrowserClient
├── server.ts         → createServerClient
└── types.ts          → generated Supabase TypeScript types

middleware.ts         → session refresh + /authority/* route protection
```

---

## Full Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Hi-Vis Signal themed) |
| Fonts | Barlow Condensed + Barlow + Space Mono (Google Fonts via next/font) |
| Icons | Lucide React |
| Map | Leaflet.js + react-leaflet + OpenStreetMap |
| Geocoding | Nominatim (free) |
| Voice Input | Web Speech API (browser built-in) |
| Voice Output | Web Speech Synthesis API (browser built-in) |
| Real-time | PartyKit (`usePartySocket` on client) |
| Database | Supabase (PostgreSQL + pgvector + RLS) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Storage | Supabase Storage (photos) |
| AI | Vercel AI SDK + `@ai-sdk/anthropic` (claude-sonnet-4-5) |
| Embeddings | Voyage AI (direct, for pgvector dedup) |
| SMS | Twilio SMS API |
| WhatsApp | Twilio WhatsApp API |
| Email | Resend (React Email templates) |
| Parallel async | `better-all` npm package |
| Deployment | Vercel (Next.js) + PartyKit (separate service) |

---

*SafeReport Design Doc — 2026-03-14*
*Ready for implementation planning.*
