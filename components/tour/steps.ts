// components/tour/steps.ts
// Pure data — no React, no driver.js import (safe for SSR)

export const PAGE_STEP_RANGES = {
  landing: { start: 0, end: 3 },
  map:     { start: 4, end: 7 },
  report:  { start: 8, end: 9 },
} as const

export type TourPage = keyof typeof PAGE_STEP_RANGES

export interface TourStep {
  element: string   // data-tour selector e.g. '[data-tour="tour-hero"]'
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
}

export const TOUR_STEPS: TourStep[] = [
  // ── Landing (0–3) ─────────────────────────────────────────────────────────
  {
    element: '[data-tour="tour-hero"]',
    popover: {
      title: 'Welcome to SafeReport',
      description: "Jamaica's real-time community safety network. Report incidents, see live threats, and help authorities respond faster.",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-ticker"]',
    popover: {
      title: 'Live Incident Feed',
      description: 'Every active incident across all 14 parishes — updated in real time as community reports come in.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-how-it-works"]',
    popover: {
      title: 'How It Works',
      description: 'You report → AI classifies and routes to the right authority → Authorities respond. Three steps, faster response.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-report-cta"]',
    popover: {
      title: 'Ready to Report?',
      description: "Tap here anytime to submit an incident. Takes under 60 seconds. Let's see the live map →",
      side: 'bottom',
      align: 'end',
    },
  },
  // ── Map (4–7) ──────────────────────────────────────────────────────────────
  {
    element: '[data-tour="tour-map"]',
    popover: {
      title: 'The Live Map',
      description: 'Every pin is a real incident reported by someone in your community. Colour shows severity — red is critical.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-report-fab"]',
    popover: {
      title: 'Report an Incident',
      description: 'Tap this button to start a report. Your GPS location is captured automatically.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-safeguide"]',
    popover: {
      title: 'SafeGuide AI',
      description: 'Not sure what to do? Ask SafeGuide — it speaks Jamaican Patois and guides you through any emergency.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '[data-tour="tour-alerts-wrapper"]',
    popover: {
      title: 'Nearby Alerts',
      description: "Subscribe to get push notifications for incidents within 2km of you — even when the app is closed. Now let's try reporting →",
      side: 'bottom',
      align: 'end',
    },
  },
  // ── Report (8–9) ──────────────────────────────────────────────────────────
  {
    element: '[data-tour="tour-category"]',
    popover: {
      title: 'Step 1 — Choose a Category',
      description: 'Select the type of incident. 13 categories cover everything from crime to flooding to power outages.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-report-progress"]',
    popover: {
      title: 'The Report Process',
      description: "This 4-step process — Category → Location → Description → Submit — takes under 60 seconds. AI reviews your report before it's sent. You're all set!",
      side: 'bottom',
      align: 'center',
    },
  },
]
