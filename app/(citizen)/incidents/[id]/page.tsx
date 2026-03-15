import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StatusTracker } from '@/components/incident/status-tracker'

export default async function IncidentDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  const { data: report } = await supabase.from('reports').select('*').eq('id', params.id).single()

  if (!report || report.is_crime) notFound()

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#FF2D2D', HIGH: '#FF7A00', MEDIUM: '#FFD600', LOW: '#00C853',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>← Back to map</a>

      <div style={{ marginBottom: 16 }}>
        <span style={{ background: SEVERITY_COLORS[report.severity], color: '#0A0A0A', padding: '2px 10px', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-barlow-condensed)', borderRadius: 2 }}>
          {report.severity}
        </span>
        <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
          {report.category.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 24, margin: '0 0 8px' }}>
        {report.ai_summary || report.description}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        {report.address} · {new Date(report.created_at).toLocaleString('en-JM')}
      </p>

      <StatusTracker currentStatus={report.status} />

      <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 16, marginTop: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 4px' }}>DESCRIPTION</p>
        <p style={{ fontSize: 14 }}>{report.description}</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <div style={{ flex: 1, background: 'var(--surface-card)', borderRadius: 12, padding: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 4px' }}>CONFIRMATIONS</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed)' }}>
            {report.corroboration_count}
          </p>
        </div>
        <div style={{ flex: 1, background: 'var(--surface-card)', borderRadius: 12, padding: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 4px' }}>CONFIDENCE</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed)' }}>
            {Math.round(report.confidence_score * 100)}%
          </p>
        </div>
      </div>
    </main>
  )
}
