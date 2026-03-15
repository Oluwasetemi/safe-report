import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/authority/login')

  const { data: authorityUser } = await supabase
    .from('authority_users')
    .select('*, org:authority_organizations(*)')
    .eq('id', user.id)
    .single()

  if (!authorityUser) redirect('/authority/login')

  const parishes = authorityUser.org?.parish ?? []

  const [
    { count: totalInParish },
    { count: resolvedInParish },
    { data: resolvedWithTimes },
    { data: byCategory },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }).in('parish', parishes),
    supabase.from('reports').select('*', { count: 'exact', head: true }).in('parish', parishes).eq('status', 'resolved'),
    supabase.from('reports').select('created_at, resolved_at').in('parish', parishes).eq('status', 'resolved').not('resolved_at', 'is', null).limit(100),
    supabase.from('reports').select('category, severity').in('parish', parishes),
  ])

  // Avg resolution time in minutes
  const avgResolutionMins = resolvedWithTimes?.length
    ? Math.round(
        resolvedWithTimes.reduce((sum, r) => {
          const diff = new Date((r as { resolved_at: string }).resolved_at).getTime() - new Date(r.created_at).getTime()
          return sum + diff / 60000
        }, 0) / resolvedWithTimes.length
      )
    : null

  const categoryBreakdown = byCategory?.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  const resolutionRate = totalInParish ? ((resolvedInParish ?? 0) / totalInParish * 100).toFixed(1) : '0'

  function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
      <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 20 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-barlow-condensed)', letterSpacing: 1, margin: '0 0 8px' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-barlow-condensed)', color: 'var(--brand-primary)', margin: 0 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{sub}</p>}
      </div>
    )
  }

  return (
    <div style={{ padding: 24, color: 'var(--text-primary)' }}>
      <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, marginBottom: 8 }}>ANALYTICS</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 13 }}>
        {authorityUser.org?.name} · {parishes.join(', ')}
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="TOTAL INCIDENTS" value={totalInParish ?? 0} />
        <StatCard label="RESOLVED" value={resolvedInParish ?? 0} />
        <StatCard label="RESOLUTION RATE" value={`${resolutionRate}%`} />
        <StatCard
          label="AVG RESOLUTION TIME"
          value={avgResolutionMins ? `${avgResolutionMins}m` : '—'}
          sub="target: CRITICAL <5m, HIGH <15m"
        />
      </div>

      {/* Category breakdown */}
      <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 18, marginBottom: 16 }}>INCIDENT TYPES</h2>
      <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 20 }}>
        {Object.entries(categoryBreakdown).sort(([,a],[,b]) => b - a).map(([cat, count]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ width: 160, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-barlow-condensed)' }}>
              {cat.replace(/_/g, ' ').toUpperCase()}
            </span>
            <div style={{ flex: 1, height: 6, background: 'var(--surface-raised)', borderRadius: 3 }}>
              <div style={{ height: '100%', background: 'var(--brand-primary)', borderRadius: 3, width: `${(count / (totalInParish || 1)) * 100}%` }} />
            </div>
            <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-space-mono)', color: 'var(--text-muted)' }}>{count}</span>
          </div>
        ))}
        {Object.keys(categoryBreakdown).length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No incident data yet.</p>
        )}
      </div>
    </div>
  )
}
