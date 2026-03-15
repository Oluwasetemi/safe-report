import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StatusTracker } from '@/components/incident/status-tracker'
import { EmergencyCard } from '@/components/incident/emergency-card'

export default async function ReportConfirmationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  const { data: report } = await supabase.from('reports').select('*').eq('id', params.id).single()

  if (!report) notFound()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', paddingTop: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, margin: 0 }}>REPORT SUBMITTED</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Authorities have been alerted</p>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 4px' }}>Ticket Number</p>
        <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 20, fontWeight: 700, color: 'var(--brand-primary)', margin: 0 }}>
          {report.ticket_number}
        </p>
        {report.police_ref_number && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '12px 0 4px' }}>Police Reference</p>
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>
              {report.police_ref_number}
            </p>
          </>
        )}
      </div>

      <StatusTracker currentStatus={report.status} />
      <EmergencyCard />

      {report.departments_alerted?.length ? (
        <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 8px' }}>DEPARTMENTS ALERTED</p>
          {report.departments_alerted.map((d: string) => (
            <div key={d} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14 }}>
              ✓ {d}
            </div>
          ))}
        </div>
      ) : null}
    </main>
  )
}
