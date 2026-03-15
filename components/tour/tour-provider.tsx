// components/tour/tour-provider.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TOUR_STEPS, PAGE_STEP_RANGES, type TourPage } from './steps'

const LS_ACTIVE = 'safereport-tour-active'
const LS_STEP   = 'safereport-tour-step'
const LS_SEEN   = 'safereport-tour-seen'

function ls(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function lsRemove(...keys: string[]) {
  try { keys.forEach((k) => localStorage.removeItem(k)) } catch {}
}

interface TourProviderProps {
  page: TourPage
  mapReady?: boolean
  children: React.ReactNode
}

export function TourProvider({ page, mapReady, children }: TourProviderProps) {
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    // For map page, wait until Leaflet is ready
    if (page === 'map' && !mapReady) return

    if (started.current) return

    // Auto-start for first-time visitors on the landing page
    if (page === 'landing' && ls(LS_ACTIVE) !== '1' && ls(LS_SEEN) !== '1') {
      lsSet(LS_STEP, '0')
      lsSet(LS_ACTIVE, '1')
    }

    if (ls(LS_ACTIVE) !== '1') return

    const globalStep = parseInt(ls(LS_STEP) ?? '0', 10)
    const range = PAGE_STEP_RANGES[page]
    if (globalStep < range.start || globalStep > range.end) return

    started.current = true

    const localStepIndex = globalStep - range.start
    const pageSteps = TOUR_STEPS.slice(range.start, range.end + 1)

    // Dynamically import driver.js to avoid SSR crash
    import('driver.js').then(({ driver }) => {
      // @ts-expect-error driver.js CSS import
      import('driver.js/dist/driver.css')

      function clearTour() {
        lsRemove(LS_ACTIVE, LS_STEP)
        lsSet(LS_SEEN, '1')
      }

      const nextPage: Record<TourPage, string | null> = {
        landing: '/map',
        map:     '/report',
        report:  null,
      }

      const driverObj = driver({
        animate: true,
        overlayOpacity: 0.75,
        stagePadding: 10,
        allowClose: true,
        overlayClickBehavior: 'close',
        showProgress: true,
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done ✓',
        onDestroyStarted: () => {
          clearTour()
          driverObj.destroy()
        },
        steps: pageSteps.map((step, i) => ({
          element: step.element,
          popover: {
            ...step.popover,
            // Override last step of each page to trigger navigation
            ...(i === pageSteps.length - 1 && nextPage[page]
              ? {
                  onNextClick: () => {
                    const next = range.end + 1
                    // Write synchronously before navigation
                    lsSet(LS_STEP, String(next))
                    lsSet(LS_ACTIVE, '1')
                    driverObj.destroy()
                    router.push(nextPage[page]!)
                  },
                }
              : {}),
            // Last step of last page — mark complete
            ...(i === pageSteps.length - 1 && !nextPage[page]
              ? {
                  onNextClick: () => {
                    clearTour()
                    driverObj.destroy()
                  },
                }
              : {}),
          },
        })),
      })

      driverObj.drive(localStepIndex)
    })
  }, [page, mapReady, router])

  return <>{children}</>
}
