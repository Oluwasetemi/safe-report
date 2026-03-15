import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Community Leaderboard',
  description: 'Top reporters keeping Jamaica safe. See who is making a difference in their parish.',
  openGraph: {
    title: 'Community Leaderboard | SafeReport',
    description: 'Top reporters keeping Jamaica safe — ranked by parish across all 14 parishes.',
    images: [{ url: '/api/og?title=COMMUNITY+LEADERBOARD&description=Top+reporters+keeping+Jamaica+safe.+Ranked+by+parish.', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og?title=COMMUNITY+LEADERBOARD&description=Top+reporters+keeping+Jamaica+safe.+Ranked+by+parish.'],
  },
}

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()

  const [
    { data: globalTop },
    { data: monthlyTop },
  ] = await Promise.all([
    supabase.from('reporter_profiles').select('*').order('total_points', { ascending: false }).limit(20),
    supabase.from('reporter_profiles').select('*').order('monthly_points', { ascending: false }).limit(20),
  ])

  const TRUST_BADGES = ['🌱', '🥉', '🥈', '🥇', '⭐']

  function TrustBadge({ level }: { level: number }) {
    return <span title={`Trust Level ${level}`}>{TRUST_BADGES[level - 1] ?? '🌱'}</span>
  }

  function ReporterTable({ reporters }: { reporters: typeof globalTop }) {
    if (!reporters?.length) return <p style={{ color: 'var(--text-muted)' }}>No reporters yet.</p>
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-barlow-condensed)' }}>
            <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>REPORTER</th>
            <th style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>REPORTS</th>
            <th style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>POINTS</th>
          </tr>
        </thead>
        <tbody>
          {reporters.map((r, i) => (
            <tr key={r.fingerprint} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
              <td style={{ padding: '10px 0' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{r.display_name || `Reporter #${i + 1}`}</span>
                {' '}<TrustBadge level={r.trust_level} />
              </td>
              <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>{r.total_reports}</td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-space-mono)', fontSize: 13 }}>{r.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>← Back</a>
      <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 32, margin: '0 0 8px' }}>LEADERBOARD</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Top community safety reporters</p>

      <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 12 }}>ALL TIME</h2>
      <ReporterTable reporters={globalTop} />

      <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 16, color: 'var(--text-muted)', margin: '32px 0 12px' }}>THIS MONTH</h2>
      <ReporterTable reporters={monthlyTop} />
    </main>
  )
}
