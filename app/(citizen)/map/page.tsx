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
        <div data-tour="tour-alerts-wrapper" className="absolute top-4 right-4 z-[1000]">
          {push.status !== 'unsupported' && (
            <button
              onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
              title={push.status === 'denied' ? 'Add to home screen to enable notifications on iOS' : undefined}
              className={[
                'flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 text-[13px] font-semibold',
                'backdrop-blur-sm shadow-lg border transition-all duration-200 active:scale-95',
                push.status === 'subscribed'
                  ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/40 hover:bg-[#00C853]/30'
                  : push.status === 'denied'
                    ? 'bg-black/60 text-white/40 border-white/10 cursor-not-allowed'
                    : 'bg-black/80 text-white border-[#D4FF00]/60 hover:border-[#D4FF00] hover:bg-black/90',
              ].join(' ')}
            >
              {push.status !== 'subscribed' && push.status !== 'denied' && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF00]" />
                </span>
              )}
              {push.status === 'subscribed' ? '🔔 Alerts On' : push.status === 'denied' ? '🔕 Blocked' : '🔔 Nearby Alerts'}
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
