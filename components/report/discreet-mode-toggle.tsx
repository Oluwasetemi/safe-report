'use client'

interface DiscreetModeToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function DiscreetModeToggle({ enabled, onToggle }: DiscreetModeToggleProps) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>Discreet Mode</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>
            Hides app — shows notes screen if someone looks
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? 'Disable discreet mode' : 'Enable discreet mode'}
          onClick={onToggle}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: enabled ? 'var(--brand-primary)' : 'var(--border)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span aria-hidden="true" style={{
            position: 'absolute', top: 2,
            left: enabled ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%',
            background: enabled ? '#0A0A0A' : 'var(--text-muted)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  )
}
