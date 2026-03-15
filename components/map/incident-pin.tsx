'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import type { Report, Severity } from '@/lib/types'

const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFD600',
  LOW:      '#00C853',
}

const CATEGORY_ICONS: Record<string, string> = {
  fire_explosion:    '🔥',
  flash_flood:       '🌊',
  medical_emergency: '🚑',
  building_collapse: '🏚',
  downed_power_line: '⚡',
  crime:             '🚨',
  violence:          '⚠️',
  road_collapse:     '🕳',
  pothole:           '🛣',
  power_outage:      '💡',
  environmental:     '☣',
  road_hazard:       '⚠️',
  other:             '📍',
}

function createPinIcon(severity: Severity, category: string) {
  const color = SEVERITY_COLORS[severity]
  const emoji = CATEGORY_ICONS[category] ?? '📍'
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 2px solid #0A0A0A;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">
      <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${emoji}</span>
    </div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 36],
  })
}

interface IncidentPinProps {
  report: Report
  onCorroborate?: (id: string) => void
}

export function IncidentPin({ report, onCorroborate }: IncidentPinProps) {
  const icon = createPinIcon(report.severity, report.category)

  return (
    <Marker position={[report.lat, report.lng]} icon={icon}>
      <Popup>
        <div style={{ minWidth: 200, fontFamily: 'var(--font-barlow)', color: '#0A0A0A' }}>
          <div style={{
            background: SEVERITY_COLORS[report.severity],
            padding: '2px 8px',
            marginBottom: 8,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 1,
          }}>
            {report.severity} · {report.category.replace(/_/g, ' ').toUpperCase()}
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>
            {report.ai_summary || report.description}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: '#666' }}>
            {report.address} · {report.corroboration_count} confirmations
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/incidents/${report.id}`}
              style={{ fontSize: 12, color: '#D4FF00', background: '#0A0A0A', padding: '4px 8px', textDecoration: 'none' }}>
              Details
            </Link>
            {onCorroborate && (
              <button onClick={() => onCorroborate(report.id)}
                style={{ fontSize: 12, background: 'none', border: '1px solid #0A0A0A', padding: '4px 8px', cursor: 'pointer' }}>
                Confirm
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
