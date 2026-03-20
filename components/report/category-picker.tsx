'use client'

import type { Category } from '@/lib/types'

interface CategoryOption {
  value: Category
  label: string
  icon: string
  description: string
}

const CATEGORIES: CategoryOption[] = [
  { value: 'fire_explosion',    label: 'Fire / Explosion',    icon: '🔥', description: 'Structure fire, gas explosion' },
  { value: 'flash_flood',       label: 'Flash Flood',         icon: '🌊', description: 'Flooding, road underwater' },
  { value: 'medical_emergency', label: 'Medical Emergency',   icon: '🚑', description: 'Injuries, unconscious person' },
  { value: 'building_collapse', label: 'Building Collapse',   icon: '🏚', description: 'Structural failure, landslide' },
  { value: 'downed_power_line', label: 'Downed Power Line',   icon: '⚡', description: 'JPS cable down, electrocution risk' },
  { value: 'crime',             label: 'Crime',               icon: '🚨', description: 'Robbery, shooting, assault' },
  { value: 'violence',          label: 'Violence / Unrest',   icon: '⚠️', description: 'Gang activity, mob violence' },
  { value: 'road_collapse',     label: 'Road Collapse',       icon: '🕳', description: 'Sinkhole, washed-away section' },
  { value: 'pothole',           label: 'Pothole',             icon: '🛣', description: 'Road damage, surface deterioration' },
  { value: 'power_outage',      label: 'Power Outage',        icon: '💡', description: 'Blackout, JPS issue' },
  { value: 'environmental',     label: 'Environmental',       icon: '☣', description: 'Illegal dump, pollution, spill' },
  { value: 'road_hazard',       label: 'Road Hazard',         icon: '⚠️', description: 'Fallen tree, debris, accident' },
  { value: 'other',             label: 'Other',               icon: '📍', description: 'Does not fit above categories' },
]

interface CategoryPickerProps {
  value: Category | null
  onChange: (category: Category) => void
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          aria-label={cat.label}
          aria-pressed={value === cat.value}
          onClick={() => onChange(cat.value)}
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'flex-start',
            padding:        12,
            background:     value === cat.value ? 'var(--brand-primary)' : 'var(--surface-card)',
            color:          value === cat.value ? '#0A0A0A' : 'var(--text-primary)',
            border:         `1px solid ${value === cat.value ? 'var(--brand-primary)' : 'var(--border)'}`,
            borderRadius:    8,
            cursor:          'pointer',
            textAlign:       'left',
            transition:      'background 0.15s, color 0.15s, border-color 0.15s',
          }}
        >
          <span style={{ fontSize: 24, marginBottom: 4 }} aria-hidden="true">{cat.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-barlow-condensed)' }}>
            {cat.label}
          </span>
          <span style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{cat.description}</span>
        </button>
      ))}
    </div>
  )
}
