'use client'

import { Circle, Popup } from 'react-leaflet'

interface CrimeZoneProps {
  lat: number
  lng: number
}

export function CrimeZone({ lat, lng }: CrimeZoneProps) {
  // Fuzz exact location to a random point within 300m for privacy
  const fuzzedLat = lat + (Math.random() - 0.5) * 0.003
  const fuzzedLng = lng + (Math.random() - 0.5) * 0.003

  return (
    <Circle
      center={[fuzzedLat, fuzzedLng]}
      radius={300}
      pathOptions={{
        color:       '#9B5DE5',
        fillColor:   '#9B5DE5',
        fillOpacity:  0.15,
        weight:       2,
        dashArray:   '6 4',
      }}
    >
      <Popup>
        <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 12 }}>
          <strong>Crime Activity Reported</strong>
          <p style={{ margin: '4px 0 0', color: '#666' }}>
            Exact location withheld for safety. Exercise caution in this area.
          </p>
        </div>
      </Popup>
    </Circle>
  )
}
