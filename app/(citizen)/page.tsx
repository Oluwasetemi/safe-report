'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapControls } from '@/components/map/map-controls'

// Leaflet must be client-only — no SSR
const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false, loading: () => <div style={{ width: '100vw', height: '100vh', background: '#111318' }} /> }
)

const SafeGuideChat = dynamic(
  () => import('@/components/safe-guide/safe-guide-chat').then((m) => m.SafeGuideChat),
  { ssr: false }
)

export default function LiveMapPage() {
  const router = useRouter()
  const [userLat, setUserLat] = useState<number>()
  const [userLng, setUserLng] = useState<number>()
  const [guideOpen, setGuideOpen] = useState(false)

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
      },
      () => {}
    )
  }

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LiveMap userLat={userLat} userLng={userLng} />
      <MapControls
        onReportClick={() => router.push('/report')}
        onLocateClick={handleLocate}
        onGuideClick={() => setGuideOpen(true)}
      />
      {guideOpen && (
        <SafeGuideChat onClose={() => setGuideOpen(false)} />
      )}
    </main>
  )
}
