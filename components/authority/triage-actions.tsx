'use client'

import { useState } from 'react'
import type { Report } from '@/lib/types'

interface TriageActionsProps {
  report: Report
  onAction: (id: string, action: 'acknowledge' | 'enroute' | 'resolve' | 'flag') => void
}

export function TriageActions({ report, onAction }: TriageActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(action: 'acknowledge' | 'enroute' | 'resolve' | 'flag') {
    setLoading(action)
    try {
      await fetch(`/api/authority/${report.id}/${action}`, { method: 'POST' })
      onAction(report.id, action)
    } finally {
      setLoading(null)
    }
  }

  const btnStyle = (color: string, disabled = false) => ({
    padding:      '6px 14px',
    background:   disabled ? 'var(--border)' : color,
    color:        disabled ? 'var(--text-muted)' : '#0A0A0A',
    border:       'none',
    borderRadius:  6,
    cursor:        disabled ? 'not-allowed' : 'pointer',
    fontSize:      12,
    fontFamily:   'var(--font-barlow-condensed)',
    fontWeight:    700,
    letterSpacing:  0.5,
  })

  if (report.status === 'active') return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button style={btnStyle('#D4FF00')} onClick={() => handleAction('acknowledge')} disabled={loading !== null}>
        {loading === 'acknowledge' ? '...' : 'ACKNOWLEDGE'}
      </button>
      <button style={btnStyle('#FF7A00')} onClick={() => handleAction('flag')} disabled={loading !== null}>
        {loading === 'flag' ? '...' : 'FLAG'}
      </button>
    </div>
  )

  if (report.status === 'acknowledged') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={btnStyle('#1A56DB')} onClick={() => handleAction('enroute')} disabled={loading !== null}>
        {loading === 'enroute' ? '...' : 'EN ROUTE'}
      </button>
      <button style={btnStyle('#00C853')} onClick={() => handleAction('resolve')} disabled={loading !== null}>
        {loading === 'resolve' ? '...' : 'RESOLVE'}
      </button>
    </div>
  )

  if (report.status === 'en_route') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={btnStyle('#00C853')} onClick={() => handleAction('resolve')} disabled={loading !== null}>
        {loading === 'resolve' ? '...' : 'MARK RESOLVED'}
      </button>
    </div>
  )

  return (
    <span style={{ fontSize: 12, color: 'var(--severity-low)' }}>✓ {report.status.toUpperCase()}</span>
  )
}
