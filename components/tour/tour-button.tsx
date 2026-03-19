// components/tour/tour-button.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTour, LS_SEEN } from '@/hooks/use-tour'

function ls(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

export function TourButton() {
  // Start false on both server and client to avoid hydration mismatch.
  // After mount, read localStorage to decide whether to show the button.
  const [hasSeen, setHasSeen] = useState(false)
  const { restartTour } = useTour()
  const searchParams = useSearchParams()

  useEffect(() => {
    setHasSeen(ls(LS_SEEN) === '1')
  }, [])

  // Allow tour restart via URL: ?tour=1
  // The Suspense boundary in page.tsx makes useSearchParams safe to use here.
  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      restartTour()
    }
  }, [searchParams, restartTour])

  if (!hasSeen) return null

  return (
    <button
      onClick={restartTour}
      className="font-condensed font-semibold text-[13px] tracking-[2px] text-steel uppercase px-4 py-2 rounded-[4px] transition-all duration-200 hover:text-snow hover:bg-white/[0.07]"
    >
      Take a Tour
    </button>
  )
}
