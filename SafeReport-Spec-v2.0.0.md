# SafeReport — Full Product Specification
**Version:** 2.0.0
**Status:** Draft
**Author:** Unstoppable Hackers
**Date:** March 2026
**Hackathon:** Social Impact · 24-Hour Build ()

> *"When disaster strikes, the most dangerous thing is not knowing where the danger is."*

---

## Table of Contents

1. [Concept Overview](#1-concept-overview)
2. [Problem Statement](#2-problem-statement)
3. [Vision & Goals](#3-vision--goals)
4. [Target Users](#4-target-users)
5. [Core Features](#5-core-features)
   - [Anonymous Incident Reporting](#51-anonymous-incident-reporting)
   - [Live Safety Map](#52-live-safety-map)
   - [Real-Time Engine with PartyKit](#53-real-time-engine-with-partykit)
   - [AI-Powered Report Categorization](#54-ai-powered-report-categorization)
   - [SafeGuide — AI Accessibility Assistant](#55-safeguide--ai-accessibility-assistant)
   - [Reporter Leaderboard & Trust System](#56-reporter-leaderboard--trust-system)
   - [Authority Triage Dashboard](#57-authority-triage-dashboard)
   - [Two-Way Confirmation Loop](#58-two-way-confirmation-loop)
   - [Public Transparency Dashboard](#59-public-transparency-dashboard)
6. [Incident Categories](#6-incident-categories)
7. [Pin Types & Map Behaviour](#7-pin-types--map-behaviour)
8. [Emergency Contact System](#8-emergency-contact-system)
9. [Department Routing Logic](#9-department-routing-logic)
10. [Data Models](#10-data-models)
11. [System Architecture](#11-system-architecture)
12. [Real-Time Architecture (PartyKit)](#12-real-time-architecture-partykit)
13. [AI Pipeline](#13-ai-pipeline)
14. [Tech Stack](#14-tech-stack)
15. [API Design](#15-api-design)
16. [Authority Integration Roadmap](#16-authority-integration-roadmap)
17. [MVP Scope & 24-Hour Build Timeline](#17-mvp-scope--24-hour-build-timeline)
18. [Post-Hackathon Roadmap](#18-post-hackathon-roadmap)
19. [Business Model](#19-business-model)
20. [Open Questions](#20-open-questions)
21. [Appendix — Key Numbers](#21-appendix--key-numbers)

---

## 1. Concept Overview

SafeReport is a **civic intelligence platform** that turns every smartphone into a community safety sensor. Citizens anonymously report dangers, disasters, and civic issues — which appear instantly on a live map shared with local authorities and the public.

Every emergency report instantly alerts the relevant department via SMS, WhatsApp, email, and push notification simultaneously — under 3 seconds. An AI accessibility assistant (SafeGuide) understands Jamaican Patois, supports voice input, and ensures the app is usable by anyone regardless of literacy level.

Think **Waze for community safety**, with an **AI intake layer**, a **Patois-speaking assistant**, and a **public dashboard** that holds institutions accountable.

---

## 2. Problem Statement

Community safety knowledge is decentralized and has no infrastructure. Residents know where the flooding road is, which intersection is dangerous at night, where potholes have swallowed tyres for months — but this knowledge evaporates into WhatsApp groups or neighborhood gossip with no path to the people who can fix it.

**Current gaps:**

- Communities have no real-time visibility into floods, fires, crime, or road collapses
- Emergency info spreads as unverified WhatsApp rumours — slow, chaotic, and often wrong
- Local authorities lack ground-truth data to prioritize where to send help
- Existing apps (Waze, Google Maps) ignore civic and disaster categories entirely
- No tool is designed for low-literacy, Patois-speaking, or disabled users
- Reports made to authorities vanish with no feedback loop to the citizen who filed them

---

## 3. Vision & Goals

**Vision:** Every danger in every community is visible, actionable, and tracked to resolution.

| Goal | Metric |
|------|--------|
| Enable anonymous, frictionless reporting | < 60 seconds from observation to pin on map |
| Surface active incidents in real time | < 2 second propagation from report to live map |
| Alert relevant departments instantly | < 3 seconds from submission to SMS + WhatsApp + email |
| Reduce duplicate reports via AI deduplication | > 80% duplicate catch rate |
| Drive authority accountability | Resolution timelines visible publicly |
| Build a trusted reporter network | Leaderboard-driven quality incentive |
| Serve every user regardless of literacy | SafeGuide supports voice + Patois + accessibility mode |

---

## 4. Target Users

### Citizen Reporter
- Anonymous, zero signup required
- Taps map, describes hazard, submits in under 60 seconds
- Can use voice instead of typing (SafeGuide)
- Can report in English or Jamaican Patois
- Receives real-time status updates when authorities respond

### Community Viewer
- Sees live danger map with colour-coded pins
- Can confirm/upvote existing reports to boost credibility
- Plans safer routes around flagged areas
- No account required to view the map

### Emergency Authority
- Police (JCF), Fire Brigade, Ambulance, ODPEM
- Receives instant SMS + WhatsApp + email + push notification on every report in their category
- Has access to restricted authority triage dashboard
- Can acknowledge, mark en route, and resolve reports — status visible to reporter in real time

### Parish Council / Municipal Authority
- NWA, parish councils, utility departments
- Receives instant alerts for civic infrastructure issues
- Access to complaint management dashboard with ticket tracking
- Daily digest email summarizing all open complaints in their area

### Journalist / Researcher
- Uses public transparency dashboard to analyze patterns
- Holds authorities accountable via resolution timeline data
- No account required

---

## 5. Core Features

### 5.1 Anonymous Incident Reporting

Citizens submit reports without creating an account. A pseudonymous device fingerprint (hashed and salted, never reversible to a real identity) persists across sessions to enable reputation scoring and the leaderboard.

**Submission flow:**
1. User taps "Report an Incident" — no login screen, no form gate
2. GPS auto-captures location (manual pin drop fallback)
3. Free-text description OR voice-to-text via SafeGuide
4. Optional photo attachment
5. AI classifies category, severity, and urgency in real time before submission
6. User reviews AI classification and confirms or corrects it
7. Report submitted — pin appears on map within 2 seconds via PartyKit
8. Relevant departments alerted via SMS + WhatsApp + email simultaneously
9. Emergency card slides up showing department contacts with one-tap call buttons

**Anonymity model:**
- No email, phone, or name required at any point
- Device fingerprint hashed and salted — cannot be reversed to identify user
- Reporter sees their contribution count and trust level
- Authorities cannot deanonymize reporters

**Corroboration:**
- Any user can "confirm" an existing report (adds weight without creating a duplicate pin)
- Reports gain a confidence score: `base_score + (confirmations × 0.2) + (ai_confidence × 0.3)`
- Confidence score displayed publicly on each pin

**Crime report privacy special handling:**
- Crime reports are never shown in full detail on the public map
- Public map shows only a vague 300m radius zone — no exact location, no description
- Full details (suspect description, direction of travel, reporter note) visible only on the police dashboard
- Reporter can optionally leave a contact number for police follow-up — or stay fully anonymous
- **Discreet mode** — screen looks like a plain notes app if someone glances at it. Activated by a toggle or a preset code
- Generates a police reference number (e.g. `CRM-482910-07`) for follow-up

**Civic complaint ticket tracking:**
- Every civic complaint generates a unique ticket number (e.g. `POT-482910-07`)
- Citizen can check complaint status anytime using their ticket number — no account needed
- 7-day auto-escalation: if a civic complaint has no authority action after 7 days, it is automatically flagged to senior council level

---

### 5.2 Live Safety Map

A public-facing map showing all active and recent incidents as categorized pins. Built on Leaflet.js + OpenStreetMap — works on low bandwidth, no API key required.

**Map features:**
- Colour-coded pins by severity and category
- Pin size scales with confidence score
- Emergency pins pulse with red animation and always render on top layer
- Crime pins show as vague 300m purple zone — no exact location
- Cluster view at low zoom — expands to individual pins at street level
- Heatmap overlay toggle: reports within 300m cluster into a danger zone coloured by highest severity (red = critical, yellow = medium, green = low)
- Toggleable map layers: emergencies, crime zones, civic complaints, official authority alerts
- Filter by category, severity, time range, and authority status
- Each pin opens a detail card: AI summary, report count, confidence score, authority status, resolution timeline
- Official evacuation zones — orange authority-set pins that remain until an authority removes them

**Pin lifecycle:**

```
REPORTED → CORROBORATED → ACKNOWLEDGED → EN ROUTE → RESOLVED → ARCHIVED
```

**Pin auto-expiry:**

| Pin type | Expiry |
|----------|--------|
| Active emergency | Never — stays until authority marks resolved |
| Crime zone | 72 hours active, then archived |
| Civic complaint | 30 days if no action taken |
| Resolved (any type) | Visible greyed-out for 7 days, then hidden |

---

### 5.3 Real-Time Engine with PartyKit

All map updates, report submissions, corroborations, and authority status changes propagate to all connected clients in under 2 seconds via PartyKit WebSocket rooms backed by Cloudflare Durable Objects.

**PartyKit room structure:**

| Room | Purpose |
|------|---------|
| `map:global` | All users — receives new pins, confidence updates, status changes |
| `map:region:{regionId}` | Region-scoped updates for proximity alerts |
| `authority:{orgId}` | Private room for triage dashboard — receives new reports and AI summaries |
| `incident:{incidentId}` | Per-incident room — live corroboration count, two-way status updates |

**Events broadcast via PartyKit:**

```
INCIDENT_CREATED       — new pin appears on map
INCIDENT_CORROBORATED  — confidence score updates on existing pin
INCIDENT_ESCALATED     — severity upgraded, pin pulses
AUTHORITY_ACKNOWLEDGED — pin status → acknowledged, reporter notified
AUTHORITY_EN_ROUTE     — response dispatched, reporter notified
INCIDENT_RESOLVED      — pin → resolved, resolution time recorded
ALERT_PROXIMITY        — sent to region room when high-severity incident confirmed
```

**Connection handling:**
- Clients connect to `map:global` on load
- On location permission grant, also connect to nearest `map:region:{regionId}`
- Authority dashboard connects to `authority:{orgId}` on login
- Reconnection with exponential backoff — map stays functional offline (cached last state)

---

### 5.4 AI-Powered Report Categorization

Every report submission is processed through an AI pipeline (Claude API) before being pinned on the map. The AI handles classification, deduplication, severity scoring, urgency flagging, and summary generation.

**Classification pipeline (per report):**

**Step 1 — Category & subcategory classification**
Free-text or voice-transcribed description → primary category + subcategory + confidence score

**Step 2 — Severity estimation**
Urgency signals in language → `LOW | MEDIUM | HIGH | CRITICAL`

**Step 3 — Semantic duplicate detection**
Report description embedded → pgvector similarity search against reports in 500m radius created in last 6 hours. Similarity > 0.85 → route as corroboration of existing incident, not new pin.

**Step 4 — Urgency signal extraction**
Detects phrases indicating active danger (rising water, active altercation, fire, blocked road). Upgrades severity and triggers priority notification to authority triage room.

**Step 5 — Quality scoring**
Evaluates completeness: has location, coherent description, no spam signals. Low-quality reports flagged for review before display.

**Step 6 — AI summary generation**
Generates a 1–2 sentence plain-language summary combining description + location context, used on the pin detail card.

**Classification prompt (simplified):**

```
System: You are a civic safety report classifier for SafeReport Jamaica.
Classify the following report. Return JSON only — no preamble.

Schema: { category, subcategory, severity, urgencySignals: string[], confidence: 0–1 }

Severity rules:
- CRITICAL: immediate threat to life or property, active and worsening
- HIGH: significant hazard, needs attention within hours
- MEDIUM: notable issue, needs attention within days
- LOW: minor or non-urgent

Report: "{description}"
Location context: {parish}, {nearbyLandmarks}
```

All AI decisions surface on the authority dashboard with confidence scores. Authorities can override any classification.

---

### 5.5 SafeGuide — AI Accessibility Assistant

SafeGuide is the AI companion built into SafeReport. It makes the app usable by anyone — including people who cannot read, are visually impaired, only speak Patois, or have never used a smartphone form before.

**The three modes:**

**Standard Mode** — Normal UI with a floating SafeGuide button in the corner. Tap to open the AI chat assistant.

**Voice Mode** — Full voice control. The user never needs to tap or read anything. SafeGuide guides them verbally through the entire report flow and reads all responses aloud.

**Accessibility Mode** — High contrast colours, large buttons, simplified layout with only essential elements. Triggered manually or suggested by SafeGuide if it detects the user struggling.

**Core features:**

**Voice Reporting**
- User speaks freely — no commands to memorise
- SafeGuide extracts report type, severity, and location from natural speech
- Reads back a summary before submitting: *"Mi hear yuh — yuh a report road damage near Barnett Street. Dat correct?"*
- User confirms with voice: "Yes" — report is filed

**Patois / Creole Language Support**
- SafeGuide understands Jamaican Patois natively via Claude API with custom Patois system prompt
- Responds in the same language the user spoke
- Does not require the user to switch to English at any point

| What the user says | What SafeGuide does |
|---|---|
| "Di road mash up near Barnett Street" | Files road damage complaint, Barnett Street |
| "Dem a shoot up di place pon Fustic Road" | Opens crime report, gunshots, Fustic Road |
| "Fire deh pon di building side a market" | Opens emergency report, fire category |
| "Garbage man nuh come fi three week now" | Files missed collection complaint |
| "Mi need help, someone a follow mi" | Opens crime report, suspicious person, current location |
| "Weh mi fi do fi report flooding?" | Guides user to flooding report |

**Text-to-Speech Readout**
- Every screen element, confirmation, and message can be read aloud on request
- Automatic in Voice Mode, manual via speaker icon in Standard Mode

**Smart Location Extraction**
- Parses Jamaican place names from natural speech
- *"Near di big supermarket pon Barnett"* → geocoded to Barnett Street, Montego Bay
- Falls back to GPS if no place name detected

**Language Detection**
- Auto-detects English, Patois, or Spanish — no language selection screen required

**Technology:**

| Feature | Technology |
|---------|-----------|
| Voice input | Web Speech API (free, built into browsers) |
| Patois understanding | Claude API with custom Patois system prompt |
| Text-to-speech | Web Speech Synthesis API (free, built-in) |
| Navigation assistant | Claude API |
| Language detection | Claude API auto-detects from input |
| Location extraction | Claude API parses place names from speech |

---

### 5.6 Reporter Leaderboard & Trust System

A public leaderboard gamifies quality reporting, creating a community of trusted contributors. Trust level affects how much weight a report carries in the confidence score.

**Trust levels:**

| Level | Name | Reports Needed | Trust Multiplier |
|-------|------|---------------|-----------------|
| 1 | Observer | 1+ | 1.0× |
| 2 | Watchman | 10+ verified | 1.2× |
| 3 | Sentinel | 30+ verified | 1.5× |
| 4 | Guardian | 75+ verified | 2.0× |
| 5 | Community Shield | 150+ + accuracy > 85% | 3.0× |

A **verified report** is one that received 2+ corroborations OR was acknowledged by an authority.

**Points system:**

| Action | Points |
|--------|--------|
| Report submitted | 5 pts |
| Report corroborated by others (+1 per corroboration) | 3 pts |
| Report acknowledged by authority | 15 pts |
| Report leads to resolution | 25 pts |
| First report of a new incident (bonus) | +10 pts |
| Accurate AI classification confirmed by user | 5 pts |

**Leaderboard dimensions:** All-time, Monthly (resets each month), Regional (by parish), Category (top road / flooding reporters).

**Anti-abuse:**
- Duplicate submissions detected by AI do not award points
- Reports flagged false/spam deduct 20 points
- Rapid-fire submissions (> 5 in 10 minutes) are rate-limited and reviewed
- Points from same GPS cluster within 5 minutes count only once

**Privacy:** Leaderboard shows pseudonymous IDs or user-chosen display names. No real identity required.

---

### 5.7 Authority Triage Dashboard

A private, authenticated dashboard for approved authority organizations. Two dashboard views based on authority type.

**Emergency & Crime Dashboard** — Police, Fire Brigade, Ambulance, ODPEM
- Live feed of all active reports via PartyKit `authority:{orgId}` room
- Red alert badge and alarm sound on new critical reports
- Map view with all active pins
- Full report details including AI summary and reporter note
- Crime reports show full suspect description (never visible to public)
- Filter by category, severity, time range, location

**Civic Complaints Dashboard** — NWA, Parish Council, utility departments
- All complaints in their jurisdiction with ticket tracking
- Escalated complaints flagged in red (7-day overdue)
- Analytics: most common complaint types, average resolution time, recurring hotspots
- Export to CSV for council records
- Daily digest email at 7am summarising all open complaints

**Triage priority formula:**

```
priority_score = (severity_weight × 3) + (confidence_score × 2) + (recency_score × 1)
```

Where `severity_weight`: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1.

**Triage actions:**

| Action | Effect |
|--------|--------|
| Acknowledge | Status → ACKNOWLEDGED, reporter's app updates instantly |
| En Route | Status → EN ROUTE, reporter sees "Response dispatched" |
| Assign | Route to specific team or officer |
| Escalate | Upgrade severity, alerts supervisors |
| Add note | Internal note (authority-only) |
| Request more info | Public note on pin asking community for more details |
| Mark resolved | Status → RESOLVED, red pin turns green on public map |
| Mark false/spam | Pin removed, reporter points deducted, device fingerprint flagged |

**SLA defaults by category:**

| Category | Acknowledge SLA | Resolution SLA |
|----------|----------------|----------------|
| Critical / Active Danger | 15 min | 2 hrs |
| Road Hazard — Critical | 1 hr | 24 hrs |
| Flooding | 30 min | 48 hrs |
| Crime Hotspot | 15 min | Authority discretion |
| Infrastructure | 4 hrs | 7 days |
| General Hazard | 8 hrs | 14 days |

---

### 5.8 Two-Way Confirmation Loop

Every status change by an authority propagates back to the reporter's device in real time via PartyKit.

```
Citizen submits → all departments alerted instantly (SMS + WhatsApp + email)
       ↓
Officer opens alert → taps "Acknowledge"
       ↓
Reporter's app: "✅ Acknowledged by Jamaica Fire Brigade"
       ↓
Officer taps "En Route"
       ↓
Reporter's app: "🚗 Response dispatched"
       ↓
Officer taps "Resolved"
       ↓
Red pin turns green on public map
Reporter's app: "✅ Issue resolved"
```

This loop turns SafeReport from a messaging tool into a full two-way communication channel — with a timestamped accountability record on both sides.

---

### 5.9 Public Transparency Dashboard

A public analytics dashboard showing aggregate data — no individual report details — for residents, journalists, and researchers.

**Metrics displayed:**
- Total incidents reported (by category, by month)
- Average authority acknowledge time by organization
- Average resolution time by category
- Resolution rate (% of incidents resolved vs. expired unresolved)
- Top incident categories by parish
- Active incident heatmap
- Authority response score (composite 0–100 metric, updated monthly)

---

## 6. Incident Categories

### Emergency
- Fire / Explosion
- Flash Flood / Landslide *(active, immediate)*
- Medical Emergency / Injury
- Building Collapse
- Downed Power Line *(life-threatening)*

### Road & Infrastructure
- Pothole / Road Damage
- Road Collapse
- Missing / Damaged Signage
- Broken Traffic Light
- Blocked Drain
- Bridge Damage
- Abandoned Vehicle on Road *(road obstruction — routes to NWA / Traffic Division)*

### Flooding & Weather
- Road Flooding
- Residential Flooding
- Landslide Risk
- Flash Flood Warning

### Crime & Safety
- Suspicious Activity
- Active Altercation
- Robbery / Theft
- Abandoned Vehicle *(suspicious / not obstructing road — routes to JCF)*
- Gunshots Heard
- Break-in / Burglary
- Gender-Based Violence
- Drug Activity

### Public Health
- Illegal Waste Dumping
- Water Supply Issue
- Sewage Overflow
- Environmental Hazard

### Utility Failure
- Power Outage
- Fallen Power Line *(immediate danger — routes to JPS + Fire Brigade)*
- Water Main Break
- Streetlight Failure
- Missed Garbage Collection

### Community Hazard
- Abandoned Structure (danger)
- Stray Animal Danger
- General Public Hazard

---

## 7. Pin Types & Map Behaviour

| Pin | Colour | Animation | Public visibility | Auto-expiry |
|-----|--------|-----------|------------------|-------------|
| Active emergency | Red | Pulsing | Full details | Never (until resolved) |
| Active crime | Purple | None | Vague 300m zone only | 72 hrs, then archived |
| Civic complaint | Blue | None | Full details | 30 days |
| Resolved (any type) | Green | None | Greyed out | 7 days, then hidden |
| Official evacuation zone | Orange | None | Full details | Until authority removes |

---

## 8. Emergency Contact System

### Post-Submission Emergency Card

After submitting any report, a card slides up showing:
- Confirmation the report was submitted and which departments were notified
- One-tap call button for each relevant department
- Confirmation that SMS + WhatsApp + email alert was sent

### Department Directory

| Department | Number | Categories |
|-----------|--------|-----------|
| Jamaica Constabulary Force | 119 | Crime, Road collapse, Medical |
| Jamaica Fire Brigade | 110 | Fire, Downed power line, Building collapse |
| National Ambulance Service | 110 | Medical, Fire, Landslide |
| ODPEM | 1-888-225-5637 | Flood, Landslide, Power, Environmental |
| Parish Council | Varies by parish | Road, Garbage, Lighting, Drain |
| JPS (Jamaica Public Service) | 888-CALL-JPS | Power outage, Fallen power line |

### Alert Message Format

```
🚨 SAFEREPORT ALERT — [CATEGORY]
━━━━━━━━━━━━━━━━━━━━
Severity:  [CRITICAL / HIGH / MEDIUM / LOW]
Location:  [LAT], [LNG]
Address:   [Reverse geocoded address]
Parish:    [Parish name]
Time:      [Timestamp]
Report ID: [Unique ID]
Note:      "[AI summary of report]"
━━━━━━━━━━━━━━━━━━━━
Map:     safereport.app/map?id=[ID]
Respond: safereport.app/auth/respond
```

---

## 9. Department Routing Logic

| Report Category | Police | Fire | Ambulance | ODPEM | Parish Council | JPS |
|----------------|--------|------|-----------|-------|----------------|-----|
| Fire / Explosion | | ✅ | ✅ | | | |
| Flash flood | ✅ | | | ✅ | | |
| Medical emergency | ✅ | | ✅ | | | |
| Building collapse | | ✅ | ✅ | ✅ | | |
| Downed power line | | ✅ | | ✅ | | ✅ |
| Landslide | | | ✅ | ✅ | | |
| Crime (all types) | ✅ | | | | | |
| Road collapse | ✅ | | | | ✅ | |
| Pothole / road damage | | | | | ✅ | |
| Abandoned vehicle on road | ✅ | | | | ✅ | |
| Garbage / utilities | | | | | ✅ | |
| Power outage | | | | | | ✅ |
| Environmental | | | | ✅ | ✅ | |

**Urgent vs. non-urgent crime:**
- **Urgent (immediate alert):** Robbery, assault, GBV, break-in, gunshots
- **Standard (lower priority flag):** Suspicious activity, drug activity

---

## 10. Data Models

### Report

```typescript
type Report = {
  id: string
  deviceFingerprint: string     // hashed + salted, not reversible

  location: {
    lat: number
    lng: number
    accuracy: number
    address?: string            // via Nominatim reverse geocoding
    parish?: string
  }

  description: string
  photoUrl?: string
  voiceTranscript?: string

  // AI-generated
  category: Category
  subcategory: Subcategory
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  aiSummary: string
  aiConfidence: number
  isDuplicate: boolean
  parentIncidentId?: string

  // Crime-specific
  isOngoing?: boolean
  suspectDescription?: string   // authority-only
  directionOfTravel?: string    // authority-only
  hasContact?: boolean
  contactNumber?: string        // encrypted, police-only
  policeRefNumber?: string      // e.g. CRM-482910-07
  publicZoneOnly?: boolean

  // Civic-specific
  ticketNumber?: string         // e.g. POT-482910-07
  escalated?: boolean
  dueBy?: Date

  // Scoring
  confidenceScore: number
  corroborationCount: number
  reporterTrustMultiplier: number

  // Lifecycle
  status: IncidentStatus
  departmentsAlerted: string[]
  alertsSentAt?: Date
  acknowledgedBy?: string
  acknowledgedAt?: Date
  enRouteAt?: Date
  resolvedAt?: Date
  resolutionDescription?: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}
```

**Status values:**
- Emergency: `active` → `acknowledged` → `en_route` → `resolved`
- Crime: `reported` → `acknowledged` → `investigating` → `closed`
- Civic: `submitted` → `under_review` → `in_progress` → `resolved`

### Reporter Profile

```typescript
type ReporterProfile = {
  fingerprint: string
  displayName?: string
  trustLevel: 1 | 2 | 3 | 4 | 5
  totalPoints: number
  monthlyPoints: number
  totalReports: number
  verifiedReports: number
  accuracyRate: number
  joinedAt: Date
}
```

---

## 11. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│   Citizen PWA (Leaflet map)  │  Authority Dashboard (Web)   │
└──────────────┬───────────────┴──────────────┬──────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARTYKIT LAYER                           │
│  map:global │ map:region:* │ authority:* │ incident:*       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│           Hono on Cloudflare Workers (REST + WS)            │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────────────┐
│   ALERT CHANNELS    │    │          DATA LAYER              │
│  Twilio SMS         │    │  Supabase (PostgreSQL + RLS)      │
│  Twilio WhatsApp    │    │  pgvector (embeddings / dedup)   │
│  SendGrid Email     │    │  Upstash Redis (leaderboard)     │
│  FCM Push           │    │  Cloudflare R2 (photos)          │
└─────────────────────┘    └──────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│    AI PIPELINE      │
│  Claude API         │
│  Voyage AI embeds   │
└─────────────────────┘
```

---

## 12. Real-Time Architecture (PartyKit)

```typescript
// party/map.ts
export class MapRoom implements Party.Server {
  incidents: Map<string, Incident> = new Map()

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({
      type: 'SNAPSHOT',
      incidents: Array.from(this.incidents.values())
    }))
  }

  onMessage(message: string) {
    const event = JSON.parse(message)
    switch (event.type) {
      case 'INCIDENT_CREATED':
        this.incidents.set(event.incident.id, event.incident)
        this.party.broadcast(message)
        break
      case 'INCIDENT_UPDATED':
        this.incidents.set(event.incident.id, event.incident)
        this.party.broadcast(message)
        break
      case 'INCIDENT_RESOLVED':
        this.incidents.delete(event.incidentId)
        this.party.broadcast(message)
        break
    }
  }
}
```

```typescript
// hooks/useRealtimeMap.ts
export function useRealtimeMap() {
  const socket = usePartySocket({
    host: process.env.PARTYKIT_HOST,
    room: 'map:global',
    onMessage(event) {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'SNAPSHOT':         setIncidents(msg.incidents); break
        case 'INCIDENT_CREATED': addPin(msg.incident); break
        case 'INCIDENT_UPDATED': updatePin(msg.incident); break
        case 'INCIDENT_RESOLVED': removePin(msg.incidentId); break
      }
    }
  })
  return socket
}
```

---

## 13. AI Pipeline

```
User submits description (text or voice transcript)
         │
         ▼
┌─────────────────────┐
│  Text Preprocessing  │   Clean, normalize, extract GPS context
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Category Classifier  │   Claude API → category + subcategory + confidence
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Severity Scorer     │   Urgency signals → LOW / MEDIUM / HIGH / CRITICAL
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Embedding + Search  │   pgvector — 500m radius / 6hrs
└─────────┬───────────┘
          │
    duplicate?
    ┌──────┴──────┐
   YES            NO
    │              │
    ▼              ▼
Corroborate    Create new incident
existing pin   + generate AI summary
               + fire alert channels
```

---

## 14. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript | Performant, type-safe |
| Styling | Tailwind CSS | Rapid UI, consistent tokens |
| Map | Leaflet.js + OpenStreetMap | Free, no API key, low bandwidth, open source |
| Geocoding | Nominatim | Free reverse geocoding (GPS → address) |
| Voice input | Web Speech API | Free, built into browsers |
| Text-to-speech | Web Speech Synthesis API | Free, built-in |
| Real-time | PartyKit | Durable Object WebSockets, edge-deployed |
| Backend | Hono on Cloudflare Workers | Edge-first, TypeScript native, zero cold starts |
| Database | Supabase (PostgreSQL) | RLS, managed infra |
| Vector Search | pgvector (via Supabase) | Semantic dedup, no extra DB |
| Cache / Leaderboard | Upstash Redis | Serverless Redis, sorted sets |
| AI / SafeGuide | Anthropic Claude API | Classification, Patois NLP, summarization |
| Embeddings | Voyage AI | Semantic similarity for dedup |
| SMS alerts | Twilio SMS API | Reliable, lands on duty officer phones |
| WhatsApp alerts | Twilio WhatsApp API | Most reliable channel in Jamaica |
| Email alerts | SendGrid API | Paper trail + map embed |
| Push notifications | FCM | Lock screen alerts to authority devices |
| File storage | Cloudflare R2 | Photo uploads, cheap egress |
| Auth (Authority) | Supabase Auth + RLS | Row-level security, SSO-ready |
| Deployment | Cloudflare Pages + Workers | Global edge |

**Estimated demo cost: Under $5 USD**

---

## 15. API Design

### Public Endpoints

```
GET  /incidents                 List active incidents (with filters)
GET  /incidents/:id             Incident detail
GET  /incidents/:id/timeline    Full status timeline
POST /reports                   Submit a new report
POST /reports/:id/corroborate   Corroborate an existing report
GET  /leaderboard               Top reporters (global / monthly / regional)
GET  /stats                     Aggregate stats for transparency dashboard
GET  /categories                Full taxonomy
GET  /complaints/:ticket        Civic complaint status by ticket number
```

### Authority Endpoints (authenticated)

```
GET  /authority/queue                      Prioritized triage queue
POST /authority/incidents/:id/acknowledge
POST /authority/incidents/:id/enroute
POST /authority/incidents/:id/assign
POST /authority/incidents/:id/escalate
POST /authority/incidents/:id/resolve
POST /authority/incidents/:id/flag
POST /authority/incidents/:id/notes
GET  /authority/analytics
```

### PartyKit WebSocket Events

```
Client → Server:
  CORROBORATE      { incidentId }
  LOCATION_UPDATE  { lat, lng }

Server → Client:
  SNAPSHOT           { incidents[] }
  INCIDENT_CREATED   { incident }
  INCIDENT_UPDATED   { incident }
  INCIDENT_RESOLVED  { incidentId }
  PROXIMITY_ALERT    { incident, distanceMeters }
  STATUS_UPDATE      { incidentId, status, authorityName }
```

---

## 16. Authority Integration Roadmap

### Tier 1 — Live at Hackathon (Zero Setup Required)

Every report automatically triggers multi-channel notifications the moment it is submitted. No onboarding, no IT engagement, no setup required on the department's end.

- **SMS** (Twilio) — report summary + GPS to the duty officer's phone
- **WhatsApp** (Twilio) — formatted message to the department's operational group
- **Email** (SendGrid) — structured incident email with AI summary, map link, confidence score
- **Dashboard** — red alert badge in real time via PartyKit
- **Push notification** (FCM) — hits lock screen even if the app is closed

A road collapse at 11pm on a Sunday reaches the NWA duty officer's phone within seconds.

### Tier 2 — Post-Hackathon (Scalable Bridges)

- **Zapier integration** — pre-built SafeReport trigger connects to any Zapier-supported tool
- **Webhook support** — departments register a URL, receive structured JSON per incident
- **Email-to-ticket parsing** — auto-parse into Freshdesk / Zendesk with correct priority fields

### Tier 3 — Long-Term (Official Infrastructure)

Formal MOU with ODPEM and JCF:
- **CAD integration** — incidents flow directly into Computer-Aided Dispatch systems
- **GIS integration** — ODPEM's national hazard layers updated in real time
- **Official data sharing** — anonymized aggregate data feeds national preparedness datasets
- **Government API access** — NWA road database and ODPEM flood zone layer cross-reference

**The progression: Working today → Scalable bridges → Official partnership.**

---

## 17. MVP Scope & 24-Hour Build Timeline

### Must-Have (Hours 0–12)

1. Leaflet map loads, centred on Jamaica, real-time pins via PartyKit
2. Report form — category picker, GPS location, description, submit (no login)
3. Red pulsing pin appears on map within 2 seconds of submission
4. AI classification fires on submission (Claude API)
5. Twilio SMS + WhatsApp alert sent to correct department within 3 seconds
6. Emergency card UI with department numbers and one-tap call buttons
7. Crime report — discreet mode toggle, vague 300m zone on public map
8. Civic complaint — ticket number generated, status tracker

### Should-Have (Hours 12–20)

9. SendGrid email alert to department inbox
10. Authority triage dashboard — live feed with acknowledge / en route / resolved
11. Two-way status loop — reporter's app updates when authority acts
12. Upvote / confirm on existing reports
13. Leaderboard (global, total points)
14. AI deduplication
15. Auto-expiry logic (civic 30 days, crime zones 72 hrs)
16. SafeGuide floating button — basic AI chat navigation

### Nice-to-Have (Hours 20–24)

17. Voice input via Web Speech API + SafeGuide Patois understanding
18. Push notification via FCM to authority device
19. Map layer toggles (emergencies / complaints / crime / heatmap)
20. Civic complaint status lookup by ticket number
21. PWA manifest for installable, offline-capable build
22. Severity colour coding and confidence score on pin detail card

### 24-Hour Build Timeline

| Time | Focus |
|------|-------|
| 0–2h | Project setup: Vite + React + Supabase + PartyKit + Leaflet, map loads |
| 2–5h | Report form + Supabase write + red pulsing pin via PartyKit |
| 5–8h | Hono Worker → Twilio SMS + WhatsApp alert on submission |
| 8–11h | Emergency card UI + one-tap call buttons + department routing |
| 11–14h | Crime report + discreet mode + 300m zone on public map |
| 14–17h | Civic complaint + ticket generator + authority triage dashboard |
| 17–19h | Two-way status loop (authority action → reporter update via PartyKit) |
| 19–21h | SafeGuide AI chat + voice input + Claude API Patois hook |
| 21–23h | Full demo flow polish, bug fixes, map layers, leaderboard |
| 23–24h | Pitch practice + backup demo video recording |

### Recommended Team Roles

- **2 Frontend devs** — map, forms, UI components, SafeGuide widget
- **1 Backend dev** — Hono Workers, Supabase, Twilio, alert pipeline
- **1 Designer** — UI polish, authority dashboard, demo flow
- **1 Pitch lead** — pitch deck, demo script, presenter

### Demo Script (90 seconds)

1. Open app — live map with pre-seeded pins visible
2. Tap map — report form slides up instantly, no login
3. Select "Fire", confirm location, hit submit
4. Red pulsing pin appears on map in real time
5. Emergency card shows Fire Brigade + Ambulance with call buttons
6. Switch to second device — SMS and WhatsApp have arrived at "department"
7. Switch to Authority Dashboard — report is already there with red alert badge
8. Mark "Acknowledged" — reporter's app updates in real time
9. **Done. 90 seconds. Every second was visual.**

---

## 18. Post-Hackathon Roadmap

### Phase 1 — Pilot (Months 1–3)
- Deploy in St. James parish (recommended — Montego Bay as base)
- Onboard parish council and St. James Police Division
- Zapier + webhook bridges for departments with existing tools
- User testing with 50–100 community members
- Photo upload + voice input shipped
- Patois voice model fine-tuning

### Phase 2 — Scale (Months 3–6)
- Expand to 3–5 parishes
- Formal MOU discussions with JCF and ODPEM
- CAD and GIS integration exploration
- Public transparency dashboard with authority accountability scores
- Spanish + French Creole language support

### Phase 3 — Regional (Months 6–18)
- White-label for other Caribbean islands
- UN / World Bank civic tech grant applications
- Two-way GIS integration with national disaster management agencies
- Analytics platform for government budget allocation
- Academic partnership for disaster response research
- WebAssembly map clustering for performance at scale

---

## 19. Business Model

**Government SaaS** — $500–$2,000 USD/month per parish for advanced dashboard, analytics, and export.

**NGO / INGO Partnerships** — API access to real-time hazard data during disaster events. $5,000–$20,000 per event deployment. (Red Cross, ODPEM, UNICEF, USAID)

**Grant Funding** — UN Innovation, World Bank CivicTech Fund, USAID Digital Development, IADB Lab. Target: $50,000–$250,000 for Phase 1–2.

**White-Label Licensing** — Turnkey civic reporting platform for other Caribbean island governments. $10,000–$50,000 per island per year.

**Why it's defensible:**
- Patois AI training data is a moat — nobody else has built this
- Government partnerships create institutional lock-in
- Network effects — more users → more valuable map
- First-mover advantage in Caribbean civic tech is wide open
- Immediate value on day one, before any government meeting happens

---

## 20. Open Questions

1. **Anonymity vs. accountability** — Should authorities be able to request deanonymization for malicious false reports? Legal framework in Jamaica?

2. **Authority onboarding** — NWA (roads) is the easiest first partner. JCF (crime) is most sensitive. Start with infrastructure?

3. **Data retention** — How long do resolved reports stay in the DB? Who owns the data if an authority departs?

4. **Abuse vectors** — Coordinated false reporting against a neighborhood or business. What beyond rate limiting and the points penalty?

5. **Offline-first priority** — Given Jamaica's coverage gaps, how early does offline report queuing need to ship?

6. **Crime report legal obligations** — If a crime report describes an active life-threatening situation, does SafeReport have a legal obligation to contact police even if the reporter chose full anonymity?

---

## 21. Appendix — Key Numbers

| Metric | Value |
|--------|-------|
| Report submission to department alert | < 3 seconds |
| Report submission to map pin | < 2 seconds |
| Alert channels fired simultaneously | 5 (SMS, WhatsApp, Email, Dashboard, Push) |
| Emergency categories | 5 |
| Crime categories | 8 |
| Civic / infrastructure categories | 14+ |
| Departments covered | JCF, Fire, Ambulance, ODPEM, Parish Council, JPS |
| Languages supported (v1) | English + Jamaican Patois |
| Trust levels | 5 (Observer → Community Shield) |
| Estimated hackathon demo cost | < $5 USD |
| Pin auto-expiry — civic complaint | 30 days |
| Pin auto-expiry — crime zone | 72 hours |
| Civic complaint escalation trigger | 7 days without response |
| Semantic dedup radius | 500m |
| Semantic dedup time window | 6 hours |
| AI duplicate catch rate target | > 80% |

---

*SafeReport — Every danger seen. Every report counted. Every resolution tracked.*
*Built for the Caribbean. Designed for everyone.*
