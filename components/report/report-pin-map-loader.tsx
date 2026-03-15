'use client'

import dynamic from 'next/dynamic'

const ReportPinMap = dynamic(
  () => import('./report-pin-map').then(m => m.ReportPinMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 200, borderRadius: 10, background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Loading map...
      </div>
    ),
  }
)

export function ReportPinMapLoader({ lat, lng, severity }: { lat: number; lng: number; severity: string }) {
  return <ReportPinMap lat={lat} lng={lng} severity={severity} />
}
