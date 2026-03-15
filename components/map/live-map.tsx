'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Map } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRealtimeMap } from '@/hooks/use-realtime-map'
import { IncidentPin } from './incident-pin'
import { CrimeZone } from './crime-zone'

// Jamaica center
const JAMAICA_CENTER: [number, number] = [18.1096, -77.2975]
const DEFAULT_ZOOM = 10

function MapRecenter({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14)
    }
  }, [map, lat, lng])
  return null
}

interface LiveMapProps {
  userLat?: number
  userLng?: number
  authorityMode?: boolean
}

export function LiveMap({ userLat, userLng, authorityMode }: LiveMapProps) {
  const { incidents, corroborate } = useRealtimeMap()
  const mapRef = useRef<Map | null>(null)

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <MapContainer
      ref={mapRef}
      center={JAMAICA_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {(userLat && userLng) && <MapRecenter lat={userLat} lng={userLng} />}
      {/* Non-crime incidents: always show as pins */}
      {incidents
        .filter((r) => !r.is_crime)
        .map((report) => (
          <IncidentPin
            key={report.id}
            report={report}
            onCorroborate={authorityMode ? undefined : corroborate}
          />
        ))}
      {/* Crime: fuzzy circle on public map */}
      {!authorityMode && incidents
        .filter((r) => r.is_crime)
        .map((report) => (
          <CrimeZone key={report.id} lat={report.lat} lng={report.lng} />
        ))}
      {/* Crime: exact pin for authority map */}
      {authorityMode && incidents
        .filter((r) => r.is_crime)
        .map((report) => (
          <IncidentPin key={report.id} report={report} />
        ))}
    </MapContainer>
  )
}
