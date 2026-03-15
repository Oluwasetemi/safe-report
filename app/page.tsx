'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// Leaflet must be client-only
const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false, loading: () => <div className="w-full h-full" style={{ background: '#0D1829' }} /> }
)

const CATEGORIES = [
  { icon: '🔥', label: 'Fire / Explosion',    color: '#FF2D2D' },
  { icon: '🌊', label: 'Flash Flood',          color: '#1A8FFF' },
  { icon: '🚑', label: 'Medical Emergency',    color: '#00C853' },
  { icon: '🏚️', label: 'Building Collapse',    color: '#FF7A00' },
  { icon: '⚡', label: 'Downed Power Line',    color: '#FFD600' },
  { icon: '🔫', label: 'Crime',                color: '#9B5DE5' },
  { icon: '🕳️', label: 'Road Collapse',        color: '#8B5E3C' },
  { icon: '🚧', label: 'Pothole',              color: '#FF7A00' },
  { icon: '💡', label: 'Power Outage',         color: '#FFD600' },
  { icon: '🌿', label: 'Environmental',        color: '#00C853' },
  { icon: '⚠️', label: 'Violence',             color: '#FF2D2D' },
  { icon: '🛑', label: 'Road Hazard',          color: '#FF7A00' },
  { icon: '📋', label: 'Other',                color: '#8A9BC0' },
]

const STEPS = [
  {
    num: '01',
    title: 'WITNESS & REPORT',
    body: 'Tap once. Describe what you see, drop your location, attach a photo. Takes under 60 seconds.',
    icon: '📡',
  },
  {
    num: '02',
    title: 'AI CLASSIFIES & ROUTES',
    body: 'Our model identifies severity, category, and the right agencies — eliminating false alarms before they waste resources.',
    icon: '🧠',
  },
  {
    num: '03',
    title: 'AUTHORITIES RESPOND',
    body: 'JCF, JFB, NAS, ODPEM — all 14 parishes. Officers receive triage alerts in real time and acknowledge on mobile.',
    icon: '🚨',
  },
]

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland',
  'St. Mary', 'St. Ann', 'Trelawny', 'St. James',
  'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester',
  'Clarendon', 'St. Catherine',
]

function LiveBadge() {
  const [pulse, setPulse] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-flex items-center gap-2" style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: 2, color: '#D4FF00' }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#D4FF00',
        boxShadow: pulse ? '0 0 0 4px rgba(212,255,0,0.25)' : '0 0 0 2px rgba(212,255,0,0.1)',
        transition: 'box-shadow 0.6s ease',
        display: 'inline-block',
      }} />
      LIVE
    </span>
  )
}

function TickerIncident({ icon, text, parish, severity }: { icon: string; text: string; parish: string; severity: string }) {
  const severityColor: Record<string, string> = {
    CRITICAL: '#FF2D2D', HIGH: '#FF7A00', MEDIUM: '#FFD600', LOW: '#00C853',
  }
  return (
    <span className="inline-flex items-center gap-3 px-6" style={{ whiteSpace: 'nowrap' }}>
      <span style={{ color: severityColor[severity] ?? '#8A9BC0', fontFamily: 'var(--font-space-mono)', fontSize: 10, fontWeight: 700 }}>{severity}</span>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color: '#F2F4F7', fontFamily: 'var(--font-barlow)', fontSize: 13 }}>{text}</span>
      <span style={{ color: '#4A5A7A', fontFamily: 'var(--font-space-mono)', fontSize: 10 }}>— {parish}</span>
      <span style={{ color: '#1A2235', marginLeft: 12 }}>|</span>
    </span>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const TICKER_ITEMS = [
    { icon: '🔥', text: 'Structure fire reported near Half Way Tree', parish: 'Kingston', severity: 'HIGH' },
    { icon: '🌊', text: 'Flash flood alert — low-lying roads impassable', parish: 'St. Catherine', severity: 'CRITICAL' },
    { icon: '⚡', text: 'Power line down across main road', parish: 'St. James', severity: 'HIGH' },
    { icon: '🚑', text: 'Pedestrian struck — ambulance dispatched', parish: 'St. Andrew', severity: 'CRITICAL' },
    { icon: '🕳️', text: 'Road collapse — 2m sinkhole reported', parish: 'Manchester', severity: 'MEDIUM' },
    { icon: '🔫', text: 'Armed robbery near market district', parish: 'Clarendon', severity: 'HIGH' },
    { icon: '🏚️', text: 'Partial building collapse — residents evacuating', parish: 'Portland', severity: 'CRITICAL' },
    { icon: '💡', text: 'Island-wide power fluctuations reported', parish: 'St. Elizabeth', severity: 'MEDIUM' },
  ]

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F2F4F7' }}>

      {/* ─── NAV ─── */}
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9000,
          background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'background 0.3s, border-color 0.3s',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 3,
            color: '#F2F4F7',
            textTransform: 'uppercase',
          }}>
            SAFE<span style={{ color: '#D4FF00' }}>REPORT</span>
          </span>
          <span style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: 9,
            letterSpacing: 2,
            color: '#4A5A7A',
            borderLeft: '1px solid #1A2235',
            paddingLeft: 12,
            lineHeight: 1.4,
          }}>
            JAMAICA<br />EST. 2025
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/map"
            style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 2,
              color: '#8A9BC0',
              textDecoration: 'none',
              padding: '8px 16px',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F2F4F7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC0')}
          >
            Live Map
          </Link>
          <Link
            href="/transparency"
            style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 2,
              color: '#8A9BC0',
              textDecoration: 'none',
              padding: '8px 16px',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F2F4F7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC0')}
          >
            Transparency
          </Link>
          <Link
            href="/leaderboard"
            style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 2,
              color: '#8A9BC0',
              textDecoration: 'none',
              padding: '8px 16px',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F2F4F7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC0')}
          >
            Leaderboard
          </Link>
          <Link
            href="/authority/login"
            style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 2,
              color: '#0A0A0A',
              textDecoration: 'none',
              padding: '9px 20px',
              background: '#D4FF00',
              borderRadius: 4,
              textTransform: 'uppercase',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#AACC00'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#D4FF00'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Authority Portal
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: 640,
          overflow: 'hidden',
        }}
      >
        {/* Live Map — full background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <LiveMap />
        </div>

        {/* Overlay gradient — darkens the map for readability */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(135deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.75) 100%)',
        }} />

        {/* Scan-line texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 48px',
          maxWidth: 760,
        }}>

          {/* Live badge */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <LiveBadge />
            <span style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: 10,
              letterSpacing: 2,
              color: '#4A5A7A',
            }}>
              JAMAICA COMMUNITY SAFETY NETWORK
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontWeight: 700,
            fontSize: 'clamp(52px, 7vw, 96px)',
            lineHeight: 0.92,
            letterSpacing: -1,
            textTransform: 'uppercase',
            color: '#F2F4F7',
            margin: 0,
          }}>
            THE ISLAND<br />
            <span style={{ color: '#D4FF00' }}>WATCHES</span><br />
            OVER ITSELF
          </h1>

          {/* Subheadline */}
          <p style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            color: '#8A9BC0',
            marginTop: 24,
            marginBottom: 0,
            maxWidth: 480,
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            Real-time incident reporting for all 14 parishes.
            Report dangers. See threats. Help authorities respond faster.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <Link
              href="/map"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 2,
                color: '#0A0A0A',
                textDecoration: 'none',
                padding: '14px 32px',
                background: '#D4FF00',
                borderRadius: 4,
                textTransform: 'uppercase',
                boxShadow: '0 4px 24px rgba(212,255,0,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,255,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,255,0,0.35)' }}
            >
              VIEW LIVE MAP →
            </Link>
            <Link
              href="/report"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 2,
                color: '#D4FF00',
                textDecoration: 'none',
                padding: '13px 32px',
                background: 'transparent',
                border: '1px solid rgba(212,255,0,0.4)',
                borderRadius: 4,
                textTransform: 'uppercase',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4FF00'; e.currentTarget.style.background = 'rgba(212,255,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,255,0,0.4)'; e.currentTarget.style.background = 'transparent' }}
            >
              + REPORT INCIDENT
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
            {[
              { value: '14', label: 'PARISHES' },
              { value: '6', label: 'AGENCIES' },
              { value: '< 60s', label: 'TO REPORT' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontWeight: 700, fontSize: 28, color: '#D4FF00', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 11, letterSpacing: 2, color: '#4A5A7A', marginTop: 4, textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Ticker — pinned to bottom of hero */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          zIndex: 5,
          background: 'rgba(10,10,10,0.92)',
          borderTop: '1px solid rgba(212,255,0,0.15)',
          height: 44,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            whiteSpace: 'nowrap',
            animation: 'ticker 40s linear infinite',
          }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <TickerIncident key={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{
        background: '#0D1829',
        padding: '96px 48px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: 3, color: '#D4FF00', textTransform: 'uppercase', margin: '0 0 12px' }}>
              HOW IT WORKS
            </p>
            <h2 style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 700,
              fontSize: 'clamp(36px, 5vw, 60px)',
              textTransform: 'uppercase',
              color: '#F2F4F7',
              lineHeight: 0.95,
              margin: 0,
              letterSpacing: -0.5,
            }}>
              FROM WITNESS<br />TO RESPONSE
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  background: '#111318',
                  padding: '40px 36px',
                  borderTop: `3px solid ${i === 0 ? '#D4FF00' : i === 1 ? '#8A9BC0' : '#FF2D2D'}`,
                  position: 'relative',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: 64,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.04)',
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 36, marginBottom: 20 }}>{step.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#F2F4F7',
                  margin: '0 0 16px',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-barlow)',
                  fontSize: 15,
                  color: '#8A9BC0',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section style={{ background: '#0A0A0A', padding: '96px 48px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: 3, color: '#D4FF00', textTransform: 'uppercase', margin: '0 0 12px' }}>
                WHAT TO REPORT
              </p>
              <h2 style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 'clamp(36px, 5vw, 60px)',
                textTransform: 'uppercase',
                color: '#F2F4F7',
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: -0.5,
              }}>
                13 INCIDENT<br />CATEGORIES
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-barlow)', fontSize: 15, color: '#4A5A7A', maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
              AI automatically classifies your report and routes it to the right agency — police, fire, ambulance, ODPEM, NWA, or JPS.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
            {CATEGORIES.map(cat => (
              <div
                key={cat.label}
                style={{
                  background: '#111318',
                  padding: '24px 20px',
                  borderLeft: `2px solid ${cat.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A2235')}
                onMouseLeave={e => (e.currentTarget.style.background = '#111318')}
              >
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#F2F4F7',
                  lineHeight: 1.3,
                }}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARISHES COVERAGE ─── */}
      <section style={{
        background: '#0D1829',
        padding: '80px 48px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          <div>
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: 3, color: '#D4FF00', textTransform: 'uppercase', margin: '0 0 12px' }}>
              COVERAGE
            </p>
            <h2 style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 700,
              fontSize: 'clamp(36px, 4vw, 56px)',
              textTransform: 'uppercase',
              color: '#F2F4F7',
              lineHeight: 0.95,
              letterSpacing: -0.5,
              margin: '0 0 24px',
            }}>
              ALL 14<br />PARISHES.<br /><span style={{ color: '#D4FF00' }}>COVERED.</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-barlow)', fontSize: 15, color: '#8A9BC0', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 400 }}>
              From Kingston to Portland, Westmoreland to St. Thomas — every community in Jamaica has direct access to the emergency response network.
            </p>
            <Link
              href="/map"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 2,
                color: '#D4FF00',
                textDecoration: 'none',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(212,255,0,0.4)',
                paddingBottom: 2,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#D4FF00')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(212,255,0,0.4)')}
            >
              See live incidents →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            {PARISHES.map(parish => (
              <div
                key={parish}
                style={{
                  background: '#111318',
                  padding: '14px 16px',
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: 13,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#8A9BC0',
                  borderLeft: '2px solid rgba(212,255,0,0.2)',
                  transition: 'color 0.15s, border-color 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F2F4F7'; e.currentTarget.style.borderColor = '#D4FF00' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A9BC0'; e.currentTarget.style.borderColor = 'rgba(212,255,0,0.2)' }}
              >
                {parish}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTHORITY CTA ─── */}
      <section style={{
        background: '#0A0A0A',
        padding: '96px 48px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            background: '#111318',
            border: '1px solid rgba(212,255,0,0.15)',
            padding: '64px 56px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 48,
            alignItems: 'center',
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: 3, color: '#D4FF00', textTransform: 'uppercase', margin: '0 0 12px' }}>
                FOR EMERGENCY SERVICES
              </p>
              <h2 style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 'clamp(32px, 4vw, 52px)',
                textTransform: 'uppercase',
                color: '#F2F4F7',
                lineHeight: 0.95,
                letterSpacing: -0.5,
                margin: '0 0 20px',
              }}>
                JCF · JFB · NAS<br />ODPEM · NWA · JPS
              </h2>
              <p style={{ fontFamily: 'var(--font-barlow)', fontSize: 15, color: '#8A9BC0', lineHeight: 1.65, margin: 0, maxWidth: 560 }}>
                A dedicated authority dashboard provides triage queues, SLA timers, parish-scoped incident filtering, and acknowledgement tracking. Receive push notifications the moment a report enters your parish.
              </p>
            </div>
            <Link
              href="/authority/login"
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 2,
                color: '#0A0A0A',
                textDecoration: 'none',
                padding: '16px 36px',
                background: '#D4FF00',
                borderRadius: 4,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 24px rgba(212,255,0,0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,255,0,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,255,0,0.25)' }}
            >
              ACCESS PORTAL →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        background: '#050505',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '48px 48px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 3,
              color: '#F2F4F7',
              textTransform: 'uppercase',
            }}>
              SAFE<span style={{ color: '#D4FF00' }}>REPORT</span>
            </span>
            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 9, letterSpacing: 2, color: '#4A5A7A' }}>
              JAMAICA · {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['Live Map', '/map'],
              ['Report Incident', '/report'],
              ['Leaderboard', '/leaderboard'],
              ['Transparency', '/transparency'],
              ['Authority Portal', '/authority/login'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: 12,
                  letterSpacing: 1.5,
                  color: '#4A5A7A',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#8A9BC0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4A5A7A')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '24px auto 0', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 24 }}>
          <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, letterSpacing: 1.5, color: '#2A3A5A', margin: 0, textAlign: 'center' }}>
            SAFEREPORT IS A COMMUNITY SAFETY PLATFORM. IN AN EMERGENCY, ALWAYS CALL 119 (POLICE) · 110 (FIRE & AMBULANCE) · 1-888-225-5637 (ODPEM)
          </p>
        </div>
      </footer>

      {/* Ticker animation */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
