// hooks/use-tour.ts
'use client'

import { useCallback } from 'react'

const LS_ACTIVE = 'safereport-tour-active'
const LS_STEP   = 'safereport-tour-step'
const LS_SEEN   = 'safereport-tour-seen'

function ls(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private browsing */ }
}
function lsRemove(key: string) {
  try { localStorage.removeItem(key) } catch { /* private browsing */ }
}

export interface UseTourReturn {
  startTour: () => void
  restartTour: () => void
  isFirstVisit: boolean
}

export function useTour(): UseTourReturn {
  const isFirstVisit = ls(LS_SEEN) !== '1'

  const startTour = useCallback(() => {
    lsRemove(LS_SEEN)
    lsSet(LS_STEP, '0')
    lsSet(LS_ACTIVE, '1')
    // Use full navigation so the landing page remounts and the tour effect re-fires.
    // router.push('/') won't remount the page (and the started ref) if already on /.
    window.location.assign('/')
  }, [])

  const restartTour = startTour

  return { startTour, restartTour, isFirstVisit }
}

export { LS_ACTIVE, LS_STEP, LS_SEEN }
