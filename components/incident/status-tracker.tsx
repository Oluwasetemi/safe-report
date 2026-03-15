'use client'

import type { ReportStatus } from '@/lib/types'

const STATUS_STEPS: { status: ReportStatus; label: string; icon: string }[] = [
  { status: 'active',       label: 'Reported',    icon: '📨' },
  { status: 'acknowledged', label: 'Acknowledged', icon: '👀' },
  { status: 'en_route',     label: 'En Route',     icon: '🚔' },
  { status: 'resolved',     label: 'Resolved',     icon: '✅' },
]

const STATUS_ORDER = ['active', 'acknowledged', 'en_route', 'resolved']

interface StatusTrackerProps {
  currentStatus: ReportStatus
}

export function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {STATUS_STEPS.map((step, i) => (
        <div key={step.status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            flex:            1,
          }}>
            <div style={{
              width:         32,
              height:        32,
              borderRadius: '50%',
              background:    i <= currentIndex ? 'var(--brand-primary)' : 'var(--surface-card)',
              border:        `1px solid ${i <= currentIndex ? 'var(--brand-primary)' : 'var(--border)'}`,
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              fontSize:       14,
            }}>
              {step.icon}
            </div>
            <span style={{ fontSize: 9, marginTop: 4, color: i <= currentIndex ? 'var(--brand-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-barlow-condensed)', textAlign: 'center' }}>
              {step.label}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div style={{ height: 1, flex: 0.5, background: i < currentIndex ? 'var(--brand-primary)' : 'var(--border)', marginBottom: 20 }} />
          )}
        </div>
      ))}
    </div>
  )
}
