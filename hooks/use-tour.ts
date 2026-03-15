// hooks/use-tour.ts
'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const isFirstVisit = ls(LS_SEEN) !== '1'

  const startTour = useCallback(() => {
    lsRemove(LS_SEEN)
    lsSet(LS_STEP, '0')
    lsSet(LS_ACTIVE, '1')
    router.push('/')
  }, [router])

  const restartTour = startTour

  return { startTour, restartTour, isFirstVisit }
}

export { LS_ACTIVE, LS_STEP, LS_SEEN }
