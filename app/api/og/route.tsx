import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

// Cache the font so we don't re-fetch on every request
let cachedFont: ArrayBuffer | null = null

async function loadBarlowCondensed(): Promise<ArrayBuffer | null> {
  if (cachedFont) return cachedFont
  try {
    // Fetch font CSS from Google Fonts, extract woff2 URL
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SafeReport/1.0)' } }
    )
    const css = await cssRes.text()
    const match = css.match(/src:\s*url\(([^)]+\.woff2)\)/)
    if (!match) return null
    cachedFont = await fetch(match[1]).then(r => r.arrayBuffer())
    return cachedFont
  } catch {
    return null
  }
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFD600',
  LOW:      '#00C853',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title       = searchParams.get('title')       ?? 'SafeReport'
  const description = searchParams.get('description') ?? 'Real-time incident reporting across all 14 parishes of Jamaica.'
  const severity    = searchParams.get('severity')    // CRITICAL | HIGH | MEDIUM | LOW
  const parish      = searchParams.get('parish')

  // Load logo from public dir (transparent PNG shield icon)
  let logoSrc: string | null = null
  try {
    const buf = readFileSync(join(process.cwd(), 'public/logo-shield.png'))
    logoSrc = `data:image/png;base64,${buf.toString('base64')}`
  } catch { /* no logo */ }

  const fontData = await loadBarlowCondensed()
  const fontFamily = fontData ? 'Barlow Condensed' : 'sans-serif'
  const severityColor = severity ? (SEVERITY_COLORS[severity] ?? '#8A9BC0') : null

  // Dynamic font size based on title length
  const titleSize = title.length > 50 ? 52 : title.length > 30 ? 64 : 76

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0A0A0A',
          padding: '56px 72px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Chartreuse left accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: '#D4FF00' }} />

        {/* Dot-grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,255,0,0.07) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        {/* Corner glow */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(212,255,0,0.06) 0%, transparent 70%)',
        }} />

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} width={44} height={44} style={{ objectFit: 'contain' }} alt="" />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', fontFamily, fontWeight: 700, fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' }}>
                <span style={{ color: '#F2F4F7' }}>SAFE</span>
                <span style={{ color: '#D4FF00' }}>REPORT</span>
              </div>
              <span style={{ fontSize: 10, letterSpacing: 2, color: '#4A5A7A', textTransform: 'uppercase' }}>
                Jamaica Community Safety Network
              </span>
            </div>
          </div>

          {/* Severity badge */}
          {severity && severityColor && (
            <div style={{
              background: severityColor,
              color: severityColor === '#FFD600' ? '#0A0A0A' : '#0A0A0A',
              padding: '8px 22px',
              fontFamily,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              {severity}
            </div>
          )}
        </div>

        {/* ── Main title ── */}
        <div style={{
          fontFamily,
          fontWeight: 700,
          fontSize: titleSize,
          lineHeight: 0.95,
          letterSpacing: -1,
          color: '#F2F4F7',
          textTransform: 'uppercase',
          marginBottom: 20,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          {title}
        </div>

        {/* ── Description ── */}
        <div style={{
          fontSize: 21,
          color: '#8A9BC0',
          lineHeight: 1.45,
          marginBottom: 36,
          maxWidth: 820,
        }}>
          {description}
        </div>

        {/* ── Footer bar ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, letterSpacing: 2, color: '#4A5A7A', textTransform: 'uppercase' }}>
            {parish ? `${parish} · Jamaica` : 'All 14 Parishes · Jamaica'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#D4FF00' }} />
            <span style={{ fontSize: 12, letterSpacing: 2, color: '#D4FF00', textTransform: 'uppercase' }}>
              safereport.gov.jm
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [{ name: 'Barlow Condensed', data: fontData, weight: 700, style: 'normal' }]
        : undefined,
    }
  )
}
