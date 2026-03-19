interface EmergencyContact {
  name: string
  number: string
  type: 'police' | 'fire' | 'ambulance' | 'other'
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: 'Police (JCF)',    number: '119', type: 'police' },
  { name: 'Fire Brigade',    number: '110', type: 'fire' },
  { name: 'Ambulance',       number: '110', type: 'ambulance' },
  { name: 'ODPEM',           number: '1-888-225-5637', type: 'other' },
]

const COLORS = {
  police:    '#1A56DB',
  fire:      '#FF2D2D',
  ambulance: '#00C853',
  other:     '#FF7A00',
}

export function EmergencyCard() {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 14, color: 'var(--text-muted)', letterSpacing: 1, margin: '0 0 12px' }}>
        EMERGENCY CONTACTS
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {EMERGENCY_CONTACTS.map((c) => (
          <a
            key={c.name}
            href={`tel:${c.number}`}
            aria-label={`Call ${c.name} at ${c.number}`}
            style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', background: COLORS[c.type], borderRadius: 8, textDecoration: 'none' }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-barlow)' }}>{c.name}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space-mono)', fontVariantNumeric: 'tabular-nums' }}>{c.number}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
