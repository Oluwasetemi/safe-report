'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapControls } from '@/components/map/map-controls'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import { TourProvider } from '@/components/tour/tour-provider'

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
  const [mapReady, setMapReady] = useState(false)
  const push = usePushSubscription({ type: 'citizen', lat: userLat, lng: userLng })

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 300)
    return () => clearTimeout(t)
  }, [])

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
    <TourProvider page="map" mapReady={mapReady}>
      <main data-tour="tour-map" style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <LiveMap userLat={userLat} userLng={userLng} />
        <Link
          href="/"
          className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-[#111318]/90 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition-colors shadow-md"
        >
          ← Home
        </Link>
        <div data-tour="tour-alerts-wrapper">
          {push.status !== 'unsupported' && (
            <button
              onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
              title={push.status === 'denied' ? 'Add to home screen to enable notifications on iOS' : undefined}
              className="absolute top-4 right-4 z-[1000] bg-white rounded-full px-3 py-2 text-sm text-black shadow-md border border-gray-200"
            >
              {push.status === 'subscribed' ? '🔔 Alerts on' : push.status === 'denied' ? '🔕 Blocked' : '🔔 Nearby alerts'}
            </button>
          )}
        </div>
        <MapControls
          onReportClick={() => router.push('/report')}
          onLocateClick={handleLocate}
          onGuideClick={() => setGuideOpen(true)}
        />
        {guideOpen && (
          <SafeGuideChat onClose={() => setGuideOpen(false)} />
        )}
      </main>
    </TourProvider>
  )
}
