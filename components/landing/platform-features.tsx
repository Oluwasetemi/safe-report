'use client'

/* ─────────────────────────────────────────────────────────
   PlatformFeatures — dynamically imported landing section
   Contains:
     1. System Capabilities  (core features)
     2. How It Works         (4-phase flow: detect → respond)
     3. Transmission Channels (web = live, 6 = coming soon)
   ───────────────────────────────────────────────────────── */

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ── Data ─────────────────────────────────────────────────

const CAPABILITIES = [
  {
    num: '01', icon: '🗺️',
    title: 'Live Incident Map',
    body: 'Interactive map showing active incidents across all 14 parishes, refreshing in real time via Supabase Realtime subscriptions.',
    stat: '< 1s update latency',
    color: '#1A8FFF',
  },
  {
    num: '02', icon: '🧠',
    title: 'AI-Powered Triage',
    body: 'A fine-tuned model classifies every report by category and severity, then routes it to the right agency — without human review.',
    stat: '< 3s classification',
    color: '#D4FF00',
  },
  {
    num: '03', icon: '📡',
    title: 'Multi-Agency Routing',
    body: 'Six response agencies — JCF, JFB, NAS, ODPEM, NWA, JPS — each receive only incidents matching their parish and category.',
    stat: '6 agencies · 14 parishes',
    color: '#FF7A00',
  },
  {
    num: '04', icon: '👁️',
    title: 'Anonymous Reporting',
    body: 'No account required. Submit via web, SMS, or USSD. Your identity is never stored against a report.',
    stat: 'Zero PII collected',
    color: '#9B5DE5',
  },
  {
    num: '05', icon: '🔔',
    title: 'Push Notifications',
    body: 'Browser push alerts for new incidents within 2km of your subscribed location — delivered even when the tab is closed.',
    stat: '2km proximity radius',
    color: '#00C853',
  },
  {
    num: '06', icon: '✅',
    title: 'Community Verification',
    body: 'Citizens confirm or dispute active reports. Corroboration scores surface high-confidence incidents and suppress noise.',
    stat: 'Trust-weighted scoring',
    color: '#FF2D2D',
  },
]

const PHASES = [
  {
    num: '01',
    name: 'DETECT',
    color: '#D4FF00',
    steps: ['Witness the incident', 'Note the exact location', 'Open SafeReport'],
  },
  {
    num: '02',
    name: 'REPORT',
    color: '#1A8FFF',
    steps: ['Drop a pin on the map', 'Describe what you see', 'Attach photo (optional)'],
  },
  {
    num: '03',
    name: 'TRIAGE',
    color: '#FF7A00',
    steps: ['AI reads the description', 'Assigns severity + category', 'Routes to right agency'],
  },
  {
    num: '04',
    name: 'RESPOND',
    color: '#FF2D2D',
    steps: ['Officer receives alert', 'Acknowledges on dashboard', 'Dispatches to scene'],
  },
]

type Channel = {
  id: string
  icon: string
  name: string
  tagline: string
  description: string
  steps: string[]
  hint?: string
  live: boolean
}

const CHANNELS: Channel[] = [
  {
    id: 'web',
    icon: '🌐',
    name: 'Web App',
    tagline: 'Browser-based · zero install required',
    description:
      'The full SafeReport experience in any modern browser. Live map, incident reporting, push notifications, and incident tracking — no download, no account.',
    steps: ['Open safereport.gov.jm', 'Tap + REPORT INCIDENT', 'Drop pin · describe · submit'],
    hint: 'safereport.gov.jm',
    live: true,
  },
  {
    id: 'pwa',
    icon: '📲',
    name: 'PWA Install',
    tagline: 'App-like · no app store',
    description: 'Add to home screen for offline-queued reports, full-screen mode, and app-speed load times.',
    steps: ['Open in Chrome or Safari', 'Tap "Add to Home Screen"', 'Launch like a native app'],
    live: true,
  },
  {
    id: 'telegram',
    icon: '✈️',
    name: 'Telegram Bot',
    tagline: 'Report via @SafeReportJM',
    description: 'Chat-based reporting directly inside Telegram. Share location, photo, and description — guided in three messages.',
    steps: ['Message @SafeReportJM', 'Send REPORT', 'Follow guided prompts'],
    hint: '@SafeReportJM',
    live: true,
  },
  {
    id: 'whatsapp',
    icon: '💬',
    name: 'WhatsApp Bot',
    tagline: 'Your most-used app',
    description: 'Send a single message to the SafeReport WhatsApp number. The bot guides you through a report in under 90 seconds.',
    steps: ['Save SafeReport number', 'Send "REPORT"', 'Follow the guided flow'],
    live: false,
  },
  {
    id: 'sms',
    icon: '📩',
    name: 'SMS Keyword',
    tagline: 'No data connection needed',
    description: 'Text REPORT to the SafeReport shortcode from any phone — feature phones included. Zero internet required.',
    steps: ['Open SMS', 'Text REPORT to shortcode', 'Reply with location + details'],
    hint: 'Text REPORT to XXXXX',
    live: false,
  },
  {
    id: 'ussd',
    icon: '#️⃣',
    name: 'USSD Menu',
    tagline: 'Any phone · any network',
    description: 'Dial the SafeReport USSD code for a structured menu-driven report. Zero data, zero internet — works on any Jamaican SIM.',
    steps: ['Dial *123*789#', 'Select incident type', 'Confirm with your location'],
    hint: 'Dial *123*789#',
    live: false,
  },
  {
    id: 'voice',
    icon: '📞',
    name: 'Voice IVR',
    tagline: 'Speak your report',
    description: 'Call the SafeReport hotline and state your incident. AI transcribes and classifies your spoken report in real time.',
    steps: ['Call SafeReport line', 'State location + incident', 'AI transcribes instantly'],
    live: false,
  },
  {
    id: 'authority',
    icon: '🏛',
    name: 'Authority Partnership',
    tagline: 'Integrated agency reporting',
    description: 'Verified government agencies and NGOs submit incident data directly into SafeReport, enriching the map with official ground-truth reports.',
    steps: ['Agency onboarding & verification', 'Submit via secure portal', 'Data merged into public feed'],
    hint: 'Partners: JCF · ODPEM · NWA · JPS',
    live: false,
  },
  {
    id: 'api',
    icon: '⚡',
    name: 'Public API',
    tagline: 'Programmatic incident submission',
    description: 'REST API for third-party apps, news platforms, and civic-tech developers to read the incident feed or submit verified reports.',
    steps: ['Request API key', 'POST /api/v1/reports', 'Receive ticket + webhook URL'],
    hint: 'api.safereport.gov.jm/v1',
    live: false,
  },
  {
    id: 'webhooks',
    icon: '🔗',
    name: 'Webhooks',
    tagline: 'Real-time event delivery',
    description: 'Subscribe to incident events — new reports, status changes, resolutions — delivered as signed JSON payloads to your endpoint within seconds.',
    steps: ['Register endpoint URL', 'Select event types', 'Receive signed payloads'],
    hint: 'HMAC-SHA256 signed · TLS only',
    live: false,
  },
]

// ── Sub-components ────────────────────────────────────────

function SignalBars({ live, size = 'sm' }: { live: boolean; size?: 'sm' | 'lg' }) {
  const heights = size === 'lg' ? ['h-2', 'h-3.5', 'h-5'] : ['h-1.5', 'h-2.5', 'h-3.5']
  return (
    <div className="flex items-end gap-[3px]">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[4px] rounded-[1px] transition-colors duration-500 ${
            live ? 'bg-brand' : 'bg-fog/30'
          } ${h}`}
        />
      ))}
    </div>
  )
}

function StatusBadge({ live }: { live: boolean }) {
  const [pulse, setPulse] = useState(true)
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setPulse(p => !p), 1000)
    return () => clearInterval(t)
  }, [live])

  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 font-data text-[10px] tracking-[2px] text-brand">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-brand transition-opacity duration-500"
          style={{ opacity: pulse ? 1 : 0.3 }}
        />
        BROADCASTING
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-data text-[10px] tracking-[2px] text-fog">
      <span className="inline-block w-1.5 h-1.5 rounded-full border border-fog/40" />
      STANDBY
    </span>
  )
}

// Fade-up on intersection
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────

export function PlatformFeatures() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          SECTION 1 — SYSTEM CAPABILITIES
      ═══════════════════════════════════════════════════ */}
      <section className="bg-ink border-t border-white/[0.04] py-24 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto">

          {/* Header */}
          <FadeUp>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
              <div>
                <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">
                  SYSTEM CAPABILITIES
                </p>
                <h2
                  className="font-condensed font-bold uppercase text-snow leading-[0.95] m-0 tracking-[-0.5px]"
                  style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
                >
                  BUILT FOR<br />REAL EMERGENCIES
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-data text-[10px] tracking-[2px] text-fog">
                <span className="text-brand">▓▓▓▓▓▓</span>
                <span>6 CAPABILITIES ACTIVE</span>
              </div>
            </div>
          </FadeUp>

          {/* Capability cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
            {CAPABILITIES.map((cap, i) => (
              <FadeUp key={cap.num} delay={i * 60}>
                <div
                  className="group relative bg-panel overflow-hidden h-full flex flex-col p-8 transition-colors duration-200 hover:bg-ink-card"
                  style={{ borderTop: `2px solid ${cap.color}` }}
                >
                  {/* Ghost number */}
                  <span
                    className="absolute top-4 right-5 font-data font-bold text-[72px] leading-none select-none pointer-events-none"
                    style={{ color: 'rgba(255,255,255,0.03)' }}
                  >
                    {cap.num}
                  </span>

                  {/* Active indicator — appears on hover */}
                  <span className="absolute top-4 left-4 font-data text-[9px] tracking-[2px] text-brand opacity-0 group-hover:opacity-100 transition-opacity duration-200 uppercase">
                    ● ACTIVE
                  </span>

                  <span className="text-[34px] mb-5 mt-2">{cap.icon}</span>

                  <h3 className="font-condensed font-bold text-[20px] tracking-[0.5px] uppercase text-snow m-0 mb-3">
                    {cap.title}
                  </h3>

                  <p className="font-body text-[14px] text-steel leading-relaxed m-0 flex-1">
                    {cap.body}
                  </p>

                  {/* Stat pill */}
                  <div className="mt-6 inline-flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: cap.color }}
                    />
                    <span
                      className="font-data text-[10px] tracking-[1.5px] uppercase"
                      style={{ color: cap.color }}
                    >
                      {cap.stat}
                    </span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — HOW IT WORKS (4-phase flow)
      ═══════════════════════════════════════════════════ */}
      <section className="bg-navy border-t border-white/[0.04] py-24 px-8 md:px-12 overflow-hidden">
        <div className="max-w-[1100px] mx-auto">

          <FadeUp>
            <div className="mb-14">
              <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">
                HOW IT WORKS
              </p>
              <h2
                className="font-condensed font-bold uppercase text-snow leading-[0.95] m-0 tracking-[-0.5px]"
                style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
              >
                60 SECONDS.<br />REAL RESPONSE.
              </h2>
            </div>
          </FadeUp>

          {/* Phase flow — horizontal on desktop, vertical stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5 lg:gap-0">
            {PHASES.map((phase, i) => (
              <FadeUp key={phase.num} delay={i * 100}>
                <div className="relative bg-panel p-8 h-full">

                  {/* Arrow connector (desktop only, not on last) */}
                  {i < PHASES.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-[52px] -right-[1px] z-10 font-data text-[16px]"
                      style={{ color: phase.color }}
                    >
                      →
                    </div>
                  )}

                  {/* Phase number */}
                  <span className="font-data text-[11px] tracking-[2px]" style={{ color: phase.color }}>
                    {phase.num}
                  </span>

                  {/* Phase name */}
                  <h3
                    className="font-condensed font-bold text-[28px] tracking-[1px] uppercase m-0 mt-1 mb-5"
                    style={{ color: phase.color }}
                  >
                    {phase.name}
                  </h3>

                  {/* Divider bar */}
                  <div className="w-8 h-[2px] mb-5" style={{ background: phase.color }} />

                  {/* Steps */}
                  <ol className="flex flex-col gap-2.5 m-0 p-0 list-none">
                    {phase.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-2.5">
                        <span
                          className="font-data text-[9px] tracking-[1px] mt-[2px] shrink-0"
                          style={{ color: phase.color }}
                        >
                          {String(si + 1).padStart(2, '0')} →
                        </span>
                        <span className="font-body text-[13px] text-steel leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Time estimate bar */}
          <FadeUp delay={400}>
            <div className="mt-0.5 bg-panel px-8 py-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {PHASES.map((phase, i) => (
                  <div key={phase.num} className="flex items-center gap-1">
                    <span className="font-data text-[9px] tracking-[1px] text-fog">{phase.num}</span>
                    {i < PHASES.length - 1 && (
                      <span className="font-data text-[8px] text-fog/30 mx-1">— — —</span>
                    )}
                  </div>
                ))}
              </div>
              <span className="font-data text-[10px] tracking-[2px] text-brand uppercase">
                TOTAL: ≤ 60 SECONDS CITIZEN-TO-OFFICER
              </span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — TRANSMISSION CHANNELS
      ═══════════════════════════════════════════════════ */}
      <section className="bg-panel border-t border-white/[0.04] py-24 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto">

          {/* Header */}
          <FadeUp>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">
                  TRANSMISSION CHANNELS
                </p>
                <h2
                  className="font-condensed font-bold uppercase text-snow leading-[0.95] m-0 tracking-[-0.5px]"
                  style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
                >
                  10 WAYS TO<br />
                  <span className="text-brand">REPORT.</span>
                </h2>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <div className="font-data text-[10px] tracking-[2px] text-brand mb-1">3 LIVE</div>
                <div className="font-data text-[10px] tracking-[2px] text-fog">7 COMING SOON</div>
              </div>
            </div>
          </FadeUp>

          {/* ── Featured Web App card ── */}
          <FadeUp>
            <div className="relative bg-ink border border-brand/25 mb-0.5 overflow-hidden">
              {/* Chartreuse corner glow */}
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,255,0,0.08) 0%, transparent 70%)' }}
              />

              <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  {/* Status + signal */}
                  <div className="flex items-center gap-4 mb-5">
                    <StatusBadge live={true} />
                    <SignalBars live={true} size="lg" />
                  </div>

                  {/* Channel name */}
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[32px]">🌐</span>
                    <div>
                      <h3 className="font-condensed font-bold text-[32px] uppercase text-snow m-0 leading-none tracking-[1px]">
                        Web App
                      </h3>
                      <p className="font-data text-[10px] tracking-[2px] text-fog uppercase mt-1">
                        Browser-based · zero install required
                      </p>
                    </div>
                  </div>

                  <p className="font-body text-[15px] text-steel leading-relaxed max-w-[520px] mb-6">
                    The full SafeReport experience in any modern browser. Live map, incident reporting,
                    push notifications, and tracking — available now, on every device.
                  </p>

                  {/* Steps — vertical on mobile/tablet, horizontal on desktop */}
                  <ol className="flex flex-col md:flex-row gap-3 md:gap-0 list-none m-0 p-0">
                    {CHANNELS[0].steps.map((step, si) => (
                      <li key={si} className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand text-ink font-data text-[10px] font-bold shrink-0">
                            {si + 1}
                          </span>
                          <span className="font-body text-[13px] text-snow">{step}</span>
                        </span>
                        {si < CHANNELS[0].steps.length - 1 && (
                          <span className="font-data text-brand/40 text-[12px] mx-2 hidden md:block">——</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
                  <Link
                    href="/report"
                    className="font-condensed font-bold text-[15px] tracking-[2px] text-ink bg-brand uppercase px-8 py-4 rounded-[4px] whitespace-nowrap shadow-[0_4px_24px_rgba(212,255,0,0.3)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,255,0,0.5)]"
                  >
                    OPEN WEB APP →
                  </Link>
                  <span className="font-data text-[10px] tracking-[1.5px] text-fog">
                    safereport.gov.jm
                  </span>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* ── Coming-soon channel grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
            {CHANNELS.slice(1).map((ch, i) => (
              <FadeUp key={ch.id} delay={i * 80}>
                <div className="relative bg-ink overflow-hidden group h-full min-h-[240px]">

                  {/* COMING SOON badge */}
                  {!ch.live && (
                    <div className="absolute top-4 right-4 z-20 font-data text-[9px] tracking-[2px] text-fog/70 border border-fog/20 px-2 py-[3px] uppercase leading-none">
                      COMING SOON
                    </div>
                  )}

                  {/* Subtle overlay to mute content for coming-soon channels */}
                  {!ch.live && <div className="absolute inset-0 bg-ink/40 z-10 pointer-events-none" />}

                  <div className="relative z-0 p-7 flex flex-col h-full">
                    {/* Status + signal */}
                    <div className="flex items-center gap-3 mb-5">
                      <StatusBadge live={ch.live} />
                      <SignalBars live={ch.live} />
                    </div>

                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[24px] ${ch.live ? '' : 'opacity-60'}`}>{ch.icon}</span>
                      <div>
                        <h3 className={`font-condensed font-bold text-[20px] uppercase m-0 leading-none tracking-[0.5px] ${ch.live ? 'text-snow' : 'text-steel'}`}>
                          {ch.name}
                        </h3>
                        <p className={`font-data text-[9px] tracking-[1.5px] uppercase mt-0.5 ${ch.live ? 'text-fog' : 'text-fog/60'}`}>
                          {ch.tagline}
                        </p>
                      </div>
                    </div>

                    <p className={`font-body text-[13px] leading-relaxed mb-5 flex-1 ${ch.live ? 'text-steel' : 'text-fog'}`}>
                      {ch.description}
                    </p>

                    {/* Steps */}
                    <ol className="flex flex-col gap-1.5 list-none m-0 p-0">
                      {ch.steps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2">
                          <span className={`font-data text-[9px] tracking-[1px] mt-[1px] shrink-0 ${ch.live ? 'text-brand/70' : 'text-fog/40'}`}>
                            {String(si + 1).padStart(2, '0')} →
                          </span>
                          <span className={`font-body text-[12px] leading-snug ${ch.live ? 'text-snow' : 'text-fog/50'}`}>{step}</span>
                        </li>
                      ))}
                    </ol>

                    {/* Hint */}
                    {ch.hint && (
                      <div className={`mt-4 font-data text-[9px] tracking-[1.5px] uppercase border-t border-white/[0.04] pt-4 ${ch.live ? 'text-brand/60' : 'text-fog/30'}`}>
                        {ch.hint}
                      </div>
                    )}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Footer note */}
          <FadeUp delay={300}>
            <p className="font-data text-[10px] tracking-[1.5px] text-fog/40 text-center mt-8 uppercase">
              WhatsApp · SMS · USSD · Voice IVR · Authority Partnership · Public API · Webhooks — launching 2025 · notify me at alerts@safereport.gov.jm
            </p>
          </FadeUp>
        </div>
      </section>
    </>
  )
}
