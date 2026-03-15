import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Incident Map',
  description: 'Real-time incidents across all 14 parishes of Jamaica. See live threats and community reports.',
  openGraph: {
    title: 'Live Incident Map | SafeReport',
    description: 'Real-time incidents across all 14 parishes of Jamaica.',
    images: [{ url: '/api/og?title=LIVE+INCIDENT+MAP&description=Real-time+incidents+across+all+14+parishes+of+Jamaica.', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og?title=LIVE+INCIDENT+MAP&description=Real-time+incidents+across+all+14+parishes+of+Jamaica.'],
  },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
