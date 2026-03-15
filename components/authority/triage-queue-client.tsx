'use client'

import { useState } from 'react'
import { useAuthorityFeed } from '@/hooks/use-authority-feed'
import { TriageCard } from './triage-card'
import type { Report } from '@/lib/types'

interface TriageQueueClientProps {
  initialReports: Report[]
  orgId: string
  orgName: string
}

export function TriageQueueClient({ initialReports, orgId, orgName }: TriageQueueClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const { incidents: liveUpdates, connected } = useAuthorityFeed(orgId)

  // Merge live updates into reports list (live updates take priority, no duplicates)
  const mergedReports = [...liveUpdates, ...reports].reduce((acc, r) => {
    if (!acc.find((e) => e.id === r.id)) acc.push(r)
    return acc
  }, [] as Report[])

  // Sort by severity priority then created_at
  const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sorted = [...mergedReports].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (sev !== 0) return sev
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function handleAction(id: string, action: string) {
    const statusMap: Record<string, string> = {
      acknowledge: 'acknowledged',
      enroute:     'en_route',
      resolve:     'resolved',
      flag:        'flagged',
    }
    setReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: statusMap[action] as Report['status'] } : r)
    )
  }

  const active = sorted.filter((r) => r.status === 'active')
  const acked  = sorted.filter((r) => r.status === 'acknowledged' || r.status === 'en_route')

  return (
    <div style={{ padding: 24, color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, margin: 0 }}>TRIAGE QUEUE</h1>
        <span style={{ fontSize: 12, color: connected ? 'var(--severity-low)' : 'var(--severity-critical)', fontFamily: 'var(--font-space-mono)' }}>
          ● {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Unacknowledged */}
      {active.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 14, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>
            NEEDS RESPONSE ({active.length})
          </h2>
          {active.map((r) => (
            <TriageCard key={r.id} report={r} onAction={handleAction} />
          ))}
        </section>
      )}

      {/* In progress */}
      {acked.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 14, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>
            IN PROGRESS ({acked.length})
          </h2>
          {acked.map((r) => (
            <TriageCard key={r.id} report={r} onAction={handleAction} />
          ))}
        </section>
      )}

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 48 }}>✅</p>
          <p>No active incidents for {orgName}.</p>
        </div>
      )}
    </div>
  )
}
