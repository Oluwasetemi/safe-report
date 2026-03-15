'use client'

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import type { Map } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface ReportPinMapProps {
  lat: number
  lng: number
  severity: string
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFB800',
  LOW:      '#00C853',
}

export function ReportPinMap({ lat, lng, severity }: ReportPinMapProps) {
  const mapRef = useRef<Map | null>(null)

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const color = SEVERITY_COLOR[severity] ?? '#D4FF00'

  return (
    <MapContainer
      ref={mapRef}
      center={[lat, lng]}
      zoom={15}
      style={{ width: '100%', height: 200, borderRadius: 10 }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={12}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
      />
    </MapContainer>
  )
}
