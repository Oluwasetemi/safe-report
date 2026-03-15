import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function TransparencyPage() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: total },
    { count: resolved },
    { data: categoryData },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('reports').select('category, severity'),
  ])

  const byCategory = categoryData?.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  const resolutionRate = total ? ((resolved ?? 0) / total * 100).toFixed(1) : '0'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 40, margin: '0 0 8px' }}>TRANSPARENCY DASHBOARD</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Public accountability for civic response in Jamaica</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Total Reports', value: total ?? 0 },
          { label: 'Resolved', value: resolved ?? 0 },
          { label: 'Resolution Rate', value: `${resolutionRate}%` },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 24 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-barlow-condensed)', margin: '0 0 8px', letterSpacing: 1 }}>{s.label}</p>
            <p style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-barlow-condensed)', color: 'var(--brand-primary)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 20, marginBottom: 16 }}>INCIDENTS BY CATEGORY</h2>
      <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 16 }}>
        {Object.entries(byCategory).sort(([,a],[,b]) => b - a).map(([cat, count]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ width: 140, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-barlow-condensed)' }}>
              {cat.replace(/_/g, ' ').toUpperCase()}
            </span>
            <div style={{ flex: 1, height: 8, background: 'var(--surface-raised)', borderRadius: 4 }}>
              <div style={{ height: '100%', background: 'var(--brand-primary)', borderRadius: 4, width: `${(count / (total || 1)) * 100}%` }} />
            </div>
            <span style={{ width: 32, textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-space-mono)' }}>{count}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
