'use client'

import { useState } from 'react'

interface LocationCaptureProps {
  onLocation: (lat: number, lng: number, accuracy: number) => void
}

export function LocationCapture({ onLocation }: LocationCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  function capture() {
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('success')
        onLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 0)
      },
      () => {
        setStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      <button type="button" onClick={capture}
        style={{
          background:   status === 'success' ? 'var(--severity-low)' : 'var(--surface-card)',
          color:        status === 'success' ? '#0A0A0A' : 'var(--text-primary)',
          border:       '1px solid var(--border)',
          borderRadius:  8,
          padding:      '12px 20px',
          cursor:        'pointer',
          fontFamily:   'var(--font-barlow-condensed)',
          fontWeight:    600,
          fontSize:      14,
          width:         '100%',
        }}
      >
        {status === 'idle' && '📍 Capture My Location'}
        {status === 'loading' && '⏳ Getting location...'}
        {status === 'success' && `✅ Location captured (${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)})`}
        {status === 'error' && '❌ Location failed — tap to retry'}
      </button>
    </div>
  )
}
