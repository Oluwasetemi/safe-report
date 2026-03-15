'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Leaflet must be client-only
const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0D1829]" /> }
)

// Dynamically loaded — splits capabilities + channels into a separate chunk
const PlatformFeatures = dynamic(
  () => import('@/components/landing/platform-features').then((m) => m.PlatformFeatures),
  {
    ssr: false,
    loading: () => (
      <div className="bg-ink border-t border-white/[0.04] py-24 flex justify-center items-center min-h-[320px]">
        <span className="font-data text-[11px] tracking-[3px] text-fog animate-pulse uppercase">
          Loading capabilities...
        </span>
      </div>
    ),
  }
)

const CATEGORIES = [
  { icon: '🔥', label: 'Fire / Explosion',   color: '#FF2D2D' },
  { icon: '🌊', label: 'Flash Flood',         color: '#1A8FFF' },
  { icon: '🚑', label: 'Medical Emergency',   color: '#00C853' },
  { icon: '🏚️', label: 'Building Collapse',   color: '#FF7A00' },
  { icon: '⚡', label: 'Downed Power Line',   color: '#FFD600' },
  { icon: '🔫', label: 'Crime',               color: '#9B5DE5' },
  { icon: '🕳️', label: 'Road Collapse',       color: '#8B5E3C' },
  { icon: '🚧', label: 'Pothole',             color: '#FF7A00' },
  { icon: '💡', label: 'Power Outage',        color: '#FFD600' },
  { icon: '🌿', label: 'Environmental',       color: '#00C853' },
  { icon: '⚠️', label: 'Violence',            color: '#FF2D2D' },
  { icon: '🛑', label: 'Road Hazard',         color: '#FF7A00' },
  { icon: '📋', label: 'Other',               color: '#8A9BC0' },
]

const STEPS = [
  {
    num: '01',
    title: 'WITNESS & REPORT',
    body: 'Tap once. Describe what you see, drop your location, attach a photo. Takes under 60 seconds.',
    icon: '📡',
    accent: '#D4FF00',
  },
  {
    num: '02',
    title: 'AI CLASSIFIES & ROUTES',
    body: 'Our model identifies severity, category, and the right agencies — eliminating false alarms before they waste resources.',
    icon: '🧠',
    accent: '#8A9BC0',
  },
  {
    num: '03',
    title: 'AUTHORITIES RESPOND',
    body: 'JCF, JFB, NAS, ODPEM — all 14 parishes. Officers receive triage alerts in real time and acknowledge on mobile.',
    icon: '🚨',
    accent: '#FF2D2D',
  },
]

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland',
  'St. Mary', 'St. Ann', 'Trelawny', 'St. James',
  'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester',
  'Clarendon', 'St. Catherine',
]

const TICKER_ITEMS = [
  { icon: '🔥', text: 'Structure fire reported near Half Way Tree', parish: 'Kingston',     severity: 'HIGH'     },
  { icon: '🌊', text: 'Flash flood alert — low-lying roads impassable', parish: 'St. Catherine', severity: 'CRITICAL' },
  { icon: '⚡', text: 'Power line down across main road',             parish: 'St. James',   severity: 'HIGH'     },
  { icon: '🚑', text: 'Pedestrian struck — ambulance dispatched',     parish: 'St. Andrew',  severity: 'CRITICAL' },
  { icon: '🕳️', text: 'Road collapse — 2m sinkhole reported',        parish: 'Manchester',  severity: 'MEDIUM'   },
  { icon: '🔫', text: 'Armed robbery near market district',           parish: 'Clarendon',   severity: 'HIGH'     },
  { icon: '🏚️', text: 'Partial building collapse — residents evacuating', parish: 'Portland', severity: 'CRITICAL' },
  { icon: '💡', text: 'Island-wide power fluctuations reported',      parish: 'St. Elizabeth', severity: 'MEDIUM' },
]

const SEVERITY_TEXT_COLORS: Record<string, string> = {
  CRITICAL: '#FF2D2D', HIGH: '#FF7A00', MEDIUM: '#FFD600', LOW: '#00C853',
}

function LiveBadge() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), 1200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-flex items-center gap-2 font-data text-[11px] tracking-[2px] text-brand">
      <span
        className="inline-block w-2 h-2 rounded-full bg-brand transition-shadow duration-700"
        style={{ boxShadow: visible ? '0 0 0 4px rgba(212,255,0,0.25)' : '0 0 0 2px rgba(212,255,0,0.1)' }}
      />
      LIVE
    </span>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="bg-ink min-h-screen text-snow">

      {/* ─── NAV ─── */}
      <nav
        className={`fixed top-0 inset-x-0 z-[9000] h-16 flex items-center justify-between px-8 transition-all duration-300 ${
          scrolled
            ? 'bg-ink/95 backdrop-blur-md border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/logo-shield.png"
            alt="SafeReport"
            width={22}
            height={24}
            className="object-contain"
          />
          <span className="font-condensed font-bold text-[22px] tracking-[3px] text-snow uppercase">
            SAFE<span className="text-brand">REPORT</span>
          </span>
          <span className="font-data text-[9px] tracking-[2px] text-fog border-l border-white/10 pl-3 leading-[1.4] hidden sm:block">
            JAMAICA<br />EST. 2026
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {/* Text links — hidden on mobile to prevent overflow */}
          <div className="hidden md:flex items-center gap-1">
            {([
              ['Live Map',     '/map'],
              ['Transparency', '/transparency'],
              ['Leaderboard',  '/leaderboard'],
            ] as [string, string][]).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="font-condensed font-semibold text-[13px] tracking-[2px] text-steel uppercase px-4 py-2 transition-colors duration-200 hover:text-snow"
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            href="/authority/login"
            className="font-condensed font-bold text-[13px] tracking-[2px] text-ink bg-brand uppercase px-4 md:px-5 py-[9px] rounded-[4px] ml-2 transition-[background,transform] duration-150 hover:bg-brand-dark hover:-translate-y-px"
          >
            <span className="hidden sm:inline">Authority Portal</span>
            <span className="sm:hidden">Portal</span>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative w-full h-screen min-h-[640px] overflow-hidden">

        {/* Live map — full bleed background */}
        <div className="absolute inset-0 z-[1]">
          <LiveMap />
        </div>

        {/* Dark overlay */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.75) 100%)' }}
        />

        {/* Scan-line texture */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)' }}
        />

        {/* Hero content */}
        <div className="absolute inset-0 z-[4] flex flex-col justify-center px-8 md:px-12 max-w-[760px] pt-16">

          {/* Live badge */}
          <div className="flex items-center gap-4 mb-6">
            <LiveBadge />
            <span className="font-data text-[10px] tracking-[2px] text-fog">
              JAMAICA COMMUNITY SAFETY NETWORK
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-condensed font-bold uppercase text-snow leading-[0.92] tracking-[-1px] m-0"
            style={{ fontSize: 'clamp(52px, 7vw, 96px)' }}
          >
            THE ISLAND<br />
            <span className="text-brand">WATCHES</span><br />
            OVER ITSELF
          </h1>

          {/* Subheadline */}
          <p
            className="font-body text-steel mt-6 mb-0 max-w-[480px] leading-relaxed font-normal"
            style={{ fontSize: 'clamp(15px, 1.8vw, 19px)' }}
          >
            Real-time incident reporting for all 14 parishes.
            Report dangers. See threats. Help authorities respond faster.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 mt-9 flex-wrap">
            <Link
              href="/map"
              className="font-condensed font-bold text-[16px] tracking-[2px] text-ink bg-brand uppercase px-8 py-[14px] rounded-[4px] inline-block shadow-[0_4px_24px_rgba(212,255,0,0.35)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,255,0,0.5)]"
            >
              VIEW LIVE MAP →
            </Link>
            <Link
              href="/report"
              className="font-condensed font-bold text-[16px] tracking-[2px] text-brand uppercase px-8 py-[13px] rounded-[4px] inline-block border border-brand/40 transition-[border-color,background] duration-150 hover:border-brand hover:bg-brand/[0.08]"
            >
              + REPORT INCIDENT
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 mt-10 sm:mt-12 flex-wrap">
            {[
              { value: '14',   label: 'PARISHES'  },
              { value: '6',    label: 'AGENCIES'  },
              { value: '< 60s', label: 'TO REPORT' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-data font-bold text-[28px] text-brand leading-none">{stat.value}</div>
                <div className="font-condensed text-[11px] tracking-[2px] text-fog mt-1 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident ticker */}
        <div className="absolute bottom-0 inset-x-0 z-[5] bg-ink/92 border-t border-brand/15 h-11 overflow-hidden flex items-center">
          <div
            className="flex items-center whitespace-nowrap"
            style={{ animation: 'ticker 40s linear infinite' }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-6 whitespace-nowrap">
                <span
                  className="font-data text-[10px] font-bold tracking-[2px]"
                  style={{ color: SEVERITY_TEXT_COLORS[item.severity] ?? '#8A9BC0' }}
                >
                  {item.severity}
                </span>
                <span className="text-base">{item.icon}</span>
                <span className="font-body text-[13px] text-snow">{item.text}</span>
                <span className="font-data text-[10px] text-fog">— {item.parish}</span>
                <span className="text-[#1A2235] ml-3">|</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM FEATURES (dynamically loaded) ─── */}
      <PlatformFeatures />

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-navy border-t border-white/[0.04] py-24 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto">

          <div className="mb-16">
            <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">HOW IT WORKS</p>
            <h2
              className="font-condensed font-bold uppercase text-snow leading-[0.95] m-0 tracking-[-0.5px]"
              style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
            >
              FROM WITNESS<br />TO RESPONSE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-panel p-10 relative"
                style={{ borderTop: `3px solid ${step.accent}` }}
              >
                <div className="font-data text-[64px] font-bold text-white/[0.04] absolute top-6 right-6 leading-none select-none">
                  {step.num}
                </div>
                <div className="text-[36px] mb-5">{step.icon}</div>
                <h3 className="font-condensed font-bold text-[22px] tracking-[1px] uppercase text-snow m-0 mb-4">
                  {step.title}
                </h3>
                <p className="font-body text-[15px] text-steel leading-[1.65] m-0">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="bg-ink border-t border-white/[0.04] py-24 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto">

          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">WHAT TO REPORT</p>
              <h2
                className="font-condensed font-bold uppercase text-snow leading-[0.95] m-0 tracking-[-0.5px]"
                style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
              >
                13 INCIDENT<br />CATEGORIES
              </h2>
            </div>
            <p className="font-body text-[15px] text-fog max-w-[320px] m-0 leading-relaxed">
              AI automatically classifies your report and routes it to the right agency — police, fire, ambulance, ODPEM, NWA, or JPS.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5">
            {CATEGORIES.map(cat => (
              <div
                key={cat.label}
                className="bg-panel p-6 flex flex-col gap-2.5 cursor-default transition-colors duration-150 hover:bg-ink-card"
                style={{ borderLeft: `2px solid ${cat.color}` }}
              >
                <span className="text-[28px]">{cat.icon}</span>
                <span className="font-condensed font-semibold text-[13px] tracking-[0.5px] uppercase text-snow leading-[1.3]">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARISHES COVERAGE ─── */}
      <section className="bg-navy border-t border-white/[0.04] py-20 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          <div>
            <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">COVERAGE</p>
            <h2
              className="font-condensed font-bold uppercase text-snow leading-[0.95] tracking-[-0.5px] m-0 mb-6"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
            >
              ALL 14<br />PARISHES.<br />
              <span className="text-brand">COVERED.</span>
            </h2>
            <p className="font-body text-[15px] text-steel leading-[1.65] m-0 mb-8 max-w-[400px]">
              From Kingston to Portland, Westmoreland to St. Thomas — every community in Jamaica has direct access to the emergency response network.
            </p>
            <Link
              href="/map"
              className="font-condensed font-bold text-[14px] tracking-[2px] text-brand uppercase border-b border-brand/40 pb-0.5 transition-[border-color] duration-150 hover:border-brand"
            >
              See live incidents →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-0.5">
            {PARISHES.map(parish => (
              <div
                key={parish}
                className="bg-panel px-4 py-[14px] font-condensed text-[13px] tracking-[0.5px] uppercase text-steel border-l-2 border-brand/20 transition-[color,border-color] duration-150 cursor-default hover:text-snow hover:border-brand"
              >
                {parish}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTHORITY CTA ─── */}
      <section className="bg-ink border-t border-white/[0.04] py-24 px-8 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="bg-panel border border-brand/15 p-8 md:p-16 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center">
            <div>
              <p className="font-data text-[11px] tracking-[3px] text-brand uppercase mb-3">FOR EMERGENCY SERVICES</p>
              <h2
                className="font-condensed font-bold uppercase text-snow leading-[0.95] tracking-[-0.5px] m-0 mb-5"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
              >
                JCF · JFB · NAS<br />ODPEM · NWA · JPS
              </h2>
              <p className="font-body text-[15px] text-steel leading-[1.65] m-0 max-w-[560px]">
                A dedicated authority dashboard provides triage queues, SLA timers, parish-scoped incident filtering, and acknowledgement tracking. Receive push notifications the moment a report enters your parish.
              </p>
            </div>
            <Link
              href="/authority/login"
              className="font-condensed font-bold text-[15px] tracking-[2px] text-ink bg-brand uppercase px-9 py-4 rounded-[4px] whitespace-nowrap shadow-[0_4px_24px_rgba(212,255,0,0.25)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,255,0,0.45)]"
            >
              ACCESS PORTAL →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#050505] border-t border-white/[0.04] px-8 md:px-12 pt-12 pb-10">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image
              src="/logo-shield.png"
              alt="SafeReport"
              width={16}
              height={18}
              className="object-contain"
            />
            <span className="font-condensed font-bold text-[18px] tracking-[3px] text-snow uppercase">
              SAFE<span className="text-brand">REPORT</span>
            </span>
            <span className="font-data text-[9px] tracking-[2px] text-fog">
              JAMAICA · {new Date().getFullYear()}
            </span>
          </Link>

          {/* Links */}
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-start sm:justify-end">
            {([
              ['Live Map',         '/map'],
              ['Report Incident',  '/report'],
              ['Leaderboard',      '/leaderboard'],
              ['Transparency',     '/transparency'],
              ['Authority Portal', '/authority/login'],
            ] as [string, string][]).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="font-condensed text-[12px] tracking-[1.5px] text-fog uppercase transition-colors duration-150 hover:text-steel"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="max-w-[1100px] mx-auto mt-6 pt-6 border-t border-white/[0.04]">
          <p className="font-data text-[10px] tracking-[1.5px] text-[#2A3A5A] m-0 text-center">
            SAFEREPORT IS A COMMUNITY SAFETY PLATFORM. IN AN EMERGENCY, ALWAYS CALL 119 (POLICE) · 110 (FIRE &amp; AMBULANCE) · 1-888-225-5637 (ODPEM)
          </p>
        </div>
      </footer>

    </div>
  )
}
