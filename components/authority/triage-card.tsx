'use client'

import type { Report, Severity } from '@/lib/types'
import { TriageActions } from './triage-actions'

const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFD600',
  LOW:      '#00C853',
}

interface TriageCardProps {
  report: Report
  onAction: (id: string, action: 'acknowledge' | 'enroute' | 'resolve' | 'flag') => void
}

function SLATimer({ createdAt, severity }: { createdAt: string; severity: Severity }) {
  const SLA_MINUTES: Record<Severity, number> = { CRITICAL: 5, HIGH: 15, MEDIUM: 30, LOW: 60 }
  const sla = SLA_MINUTES[severity]
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  const remaining = sla - elapsed
  const overdue = remaining < 0

  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-space-mono)', color: overdue ? 'var(--severity-critical)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
      {overdue ? `OVERDUE ${Math.abs(remaining)}m` : `${remaining}m left`}
    </span>
  )
}

export function TriageCard({ report, onAction }: TriageCardProps) {
  return (
    <div style={{
      background:   'var(--surface-card)',
      border:       `1px solid ${report.severity === 'CRITICAL' ? 'var(--severity-critical)' : 'var(--border)'}`,
      borderLeft:   `4px solid ${SEVERITY_COLORS[report.severity]}`,
      borderRadius:  8,
      padding:       16,
      marginBottom:  12,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ background: SEVERITY_COLORS[report.severity], color: '#0A0A0A', padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-barlow-condensed)' }}>
          {report.severity}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-barlow-condensed)' }}>
          {report.category.replace(/_/g, ' ').toUpperCase()}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <SLATimer createdAt={report.created_at} severity={report.severity} />
        </span>
      </div>

      {/* Summary — clamp to 3 lines to prevent card overflow */}
      <p style={{ fontSize: 14, margin: '0 0 6px', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {report.ai_summary || report.description}
      </p>

      {/* Location */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        📍 {report.address || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
        {' · '}
        {report.corroboration_count} confirmations
        {' · '}
        {Math.round(report.confidence_score * 100)}% confidence
      </p>

      {/* Actions */}
      <TriageActions report={report} onAction={onAction} />
    </div>
  )
}
