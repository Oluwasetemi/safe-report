import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { EmergencyCard } from '@/components/incident/emergency-card'
import { ReportPinMapLoader } from '@/components/report/report-pin-map-loader'
import type { Severity } from '@/lib/types'

const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFB800',
  LOW:      '#00C853',
}

const DEPT_COLOR: Record<string, string> = {
  police:        '#1A56DB',
  fire:          '#FF2D2D',
  ambulance:     '#00C853',
  odpem:         '#FF7A00',
  parish_council:'#7C3AED',
  jps:           '#0891B2',
}

const DEPT_ICON: Record<string, string> = {
  police: '🚔', fire: '🚒', ambulance: '🚑',
  odpem: '⚠️', parish_council: '🏛', jps: '⚡',
}

function fmt(date: string) {
  return new Date(date).toLocaleString('en-JM', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface FeedEvent {
  icon: string
  iconBg: string
  label: string
  sub?: string
  time?: string
}

export default async function ReportConfirmationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = createServiceSupabaseClient()

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!report) notFound()

  // Fetch alerted departments for contacts
  const { data: departments } = report.departments_alerted?.length
    ? await supabase
        .from('authority_organizations')
        .select('*')
        .in('name', report.departments_alerted)
    : { data: [] }

  const sev: Severity = report.severity as Severity
  const sevColor = SEVERITY_COLOR[sev] ?? '#D4FF00'

  // Build feed timeline events
  const feedEvents: FeedEvent[] = [
    {
      icon: '📨',
      iconBg: '#1A56DB',
      label: 'Report submitted',
      sub: `Ticket ${report.ticket_number}`,
      time: fmt(report.created_at),
    },
    {
      icon: '🤖',
      iconBg: '#7C3AED',
      label: `AI classified as ${report.category?.replace(/_/g, ' ')}`,
      sub: report.subcategory ?? undefined,
      time: fmt(report.created_at),
    },
  ]

  if (report.departments_alerted?.length) {
    feedEvents.push({
      icon: '📣',
      iconBg: '#FF7A00',
      label: `${report.departments_alerted.length} department${report.departments_alerted.length > 1 ? 's' : ''} alerted`,
      sub: report.departments_alerted.join(', '),
      time: report.alerts_sent_at ? fmt(report.alerts_sent_at) : undefined,
    })
  }

  if (report.status === 'acknowledged' && report.acknowledged_at) {
    feedEvents.push({
      icon: '👀',
      iconBg: '#0891B2',
      label: 'Acknowledged by authorities',
      sub: report.acknowledged_by ?? undefined,
      time: fmt(report.acknowledged_at),
    })
  }

  if (report.status === 'en_route' && report.en_route_at) {
    feedEvents.push({
      icon: '🚔',
      iconBg: '#FF2D2D',
      label: 'Response unit en route',
      time: fmt(report.en_route_at),
    })
  }

  if (report.status === 'resolved' && report.resolved_at) {
    feedEvents.push({
      icon: '✅',
      iconBg: '#00C853',
      label: 'Incident resolved',
      sub: report.resolution_description ?? undefined,
      time: fmt(report.resolved_at),
    })
  }

  // Pending event — what happens next
  const pendingLabel: Record<string, string> = {
    active: 'Awaiting acknowledgement from authorities',
    acknowledged: 'Response unit being dispatched',
    en_route: 'Response unit arriving soon',
    resolved: 'Incident closed',
  }
  if (report.status !== 'resolved') {
    feedEvents.push({
      icon: '⏳',
      iconBg: 'var(--border)',
      label: pendingLabel[report.status] ?? 'Awaiting update',
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 22, fontWeight: 700, margin: 0 }}>
          REPORT SUBMITTED
        </h1>
        <div style={{
          marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
          background: sevColor + '22', border: `1px solid ${sevColor}`,
          color: sevColor, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
        }}>
          {sev}
        </div>
      </div>

      {/* Ticket card */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px', letterSpacing: 1 }}>TICKET NUMBER</p>
          <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 20, fontWeight: 700, color: 'var(--brand-primary)', margin: 0 }}>
            {report.ticket_number}
          </p>
          {report.police_ref_number && (
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              JCF REF: {report.police_ref_number}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px', letterSpacing: 1 }}>CATEGORY</p>
          <p style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 15, margin: 0 }}>
            {report.category?.replace(/_/g, ' ').toUpperCase()}
          </p>
          {report.subcategory && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0' }}>{report.subcategory}</p>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {report.ai_summary && (
        <div style={{ background: '#7C3AED18', border: '1px solid #7C3AED44', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ color: '#A78BFA', fontSize: 10, margin: '0 0 6px', letterSpacing: 1, fontFamily: 'var(--font-barlow-condensed)' }}>
            AI SUMMARY
          </p>
          <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5, color: 'var(--text-primary)' }}>{report.ai_summary}</p>
        </div>
      )}

      {/* Description */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 6px', letterSpacing: 1 }}>YOUR REPORT</p>
        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>{report.description}</p>
        {report.address && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '10px 0 0' }}>📍 {report.address}</p>
        )}
      </div>

      {/* Photos */}
      {(() => {
        const urls: string[] = (() => {
          if (!report.photo_url) return []
          try { return JSON.parse(report.photo_url) } catch { return [report.photo_url] }
        })()
        if (!urls.length) return null
        return (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, margin: '0 0 8px', fontFamily: 'var(--font-barlow-condensed)' }}>
              PHOTOS ({urls.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: urls.length === 1 ? '1fr' : 'repeat(3, 1fr)', gap: 6 }}>
              {urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', aspectRatio: urls.length === 1 ? '16/9' : '1' }}>
                  <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </a>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Mini map */}
      {report.lat && report.lng && (
        <div style={{ marginBottom: 16 }}>
          <ReportPinMapLoader lat={report.lat} lng={report.lng} severity={report.severity} />
        </div>
      )}

      {/* Timeline feed */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, margin: '0 0 16px', fontFamily: 'var(--font-barlow-condensed)' }}>
          ACTIVITY TIMELINE
        </p>
        <div style={{ position: 'relative', paddingLeft: 44 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 19, top: 20, bottom: 20,
            width: 2, background: 'var(--border)',
          }} />

          {feedEvents.map((ev, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: i < feedEvents.length - 1 ? 24 : 0 }}>
              {/* Circle icon */}
              <div style={{
                position: 'absolute', left: -44, top: 0,
                width: 38, height: 38, borderRadius: '50%',
                background: ev.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, border: '2px solid var(--surface-base)',
                zIndex: 1,
              }}>
                {ev.icon}
              </div>

              {/* Content */}
              <div style={{ paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{ev.label}</p>
                  {ev.time && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap', paddingTop: 2, fontFamily: 'var(--font-space-mono)' }}>
                      {ev.time}
                    </span>
                  )}
                </div>
                {ev.sub && (
                  <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>{ev.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerted department contacts */}
      {departments && departments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, margin: '0 0 12px', fontFamily: 'var(--font-barlow-condensed)' }}>
            ALERTED DEPARTMENTS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.map((dept: {
              id: string; name: string; type: string;
              alert_phone?: string; alert_whatsapp?: string; alert_email?: string
            }) => {
              const dc = DEPT_COLOR[dept.type] ?? '#888'
              const di = DEPT_ICON[dept.type] ?? '📋'
              return (
                <div key={dept.id} style={{
                  background: 'var(--surface-card)', border: `1px solid ${dc}44`,
                  borderLeft: `3px solid ${dc}`, borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: dc + '22', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {di}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{dept.name}</p>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {dept.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {dept.alert_phone && (
                      <a href={`tel:${dept.alert_phone}`}
                        style={{ padding: '8px 12px', background: dc, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, letterSpacing: 0.5 }}>
                        CALL
                      </a>
                    )}
                    {dept.alert_whatsapp && (
                      <a href={`https://wa.me/${dept.alert_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        style={{ padding: '8px 12px', background: '#00C853', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, letterSpacing: 0.5 }}>
                        WA
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fallback emergency contacts */}
      <EmergencyCard />

      {/* CTA */}
      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <Link href="/map"
          style={{ flex: 1, padding: '14px', background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 14 }}>
          VIEW MAP
        </Link>
        <Link href="/report"
          style={{ flex: 1, padding: '14px', background: 'var(--brand-primary)', color: '#0A0A0A', borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 14 }}>
          NEW REPORT
        </Link>
      </div>
    </main>
  )
}
