// components/tour/tour-button.tsx
'use client'

import { useTour } from '@/hooks/use-tour'

export function TourButton() {
  const { restartTour, isFirstVisit } = useTour()

  // Only show for returning users who have already seen/dismissed the tour
  if (isFirstVisit) return null

  return (
    <button
      onClick={restartTour}
      className="font-condensed font-semibold text-[13px] tracking-[2px] text-steel uppercase px-4 py-2 transition-colors duration-200 hover:text-snow"
    >
      Take a Tour
    </button>
  )
}
