import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFD600',
  LOW:      '#00C853',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title       = searchParams.get('title')       ?? 'SafeReport'
    const description = searchParams.get('description') ?? 'Real-time incident reporting across all 14 parishes of Jamaica.'
    const severity    = searchParams.get('severity')
    const parish      = searchParams.get('parish')

    const severityColor = severity ? (SEVERITY_COLORS[severity] ?? '#8A9BC0') : null
    const titleSize = title.length > 50 ? 52 : title.length > 30 ? 64 : 76
    const words = title.split(' ')

    // Load Barlow Condensed 700 from the local public asset (cached, no external round-trip)
    let fontData: ArrayBuffer | null = null
    try {
      const baseUrl = new URL(request.url).origin
      fontData = await fetch(`${baseUrl}/barlow-condensed-700.woff2`).then(r => r.arrayBuffer())
    } catch { /* fall back to system sans-serif */ }

    const ff = fontData ? 'Barlow Condensed' : 'sans-serif'

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0A0A0A',
            padding: '52px 72px 44px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Chartreuse left accent bar */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: '#D4FF00', display: 'flex' }} />

          {/* Top-right glow */}
          <div style={{
            position: 'absolute', top: -160, right: -160,
            width: 520, height: 520, borderRadius: 260,
            background: 'rgba(212,255,0,0.05)',
            display: 'flex',
          }} />

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 52 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', fontFamily: ff, fontWeight: 700, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase' }}>
                <span style={{ color: '#F2F4F7' }}>SAFE</span>
                <span style={{ color: '#D4FF00' }}>REPORT</span>
              </div>
              <span style={{ fontFamily: ff, fontSize: 11, letterSpacing: 3, color: '#7A8FAD', textTransform: 'uppercase', display: 'flex' }}>
                Jamaica Community Safety Network
              </span>
            </div>

            {severity && severityColor && (
              <div style={{
                background: severityColor,
                color: '#0A0A0A',
                padding: '8px 24px',
                fontFamily: ff,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 3,
                textTransform: 'uppercase',
                display: 'flex',
              }}>
                {severity}
              </div>
            )}
          </div>

          {/* ── Title — first word chartreuse ── */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <div style={{
              fontFamily: ff,
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 0.92,
              letterSpacing: -1,
              textTransform: 'uppercase',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 18,
            }}>
              {words.map((word, i) => (
                <span key={i} style={{ color: i === 0 ? '#D4FF00' : '#F2F4F7' }}>
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* ── Description ── */}
          <div style={{
            fontFamily: ff,
            fontSize: 22,
            color: '#C4D0E8',
            lineHeight: 1.4,
            marginBottom: 32,
            maxWidth: 820,
            display: 'flex',
          }}>
            {description}
          </div>

          {/* ── Footer ── */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: ff, fontSize: 13, letterSpacing: 2, color: '#7A8FAD', textTransform: 'uppercase', display: 'flex' }}>
              {parish ? `${parish} · Jamaica` : 'All 14 Parishes · Jamaica'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: '#D4FF00', display: 'flex' }} />
              <span style={{ fontFamily: ff, fontSize: 13, letterSpacing: 2, color: '#D4FF00', textTransform: 'uppercase', display: 'flex' }}>
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
  } catch (e) {
    console.error('OG generation failed:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
