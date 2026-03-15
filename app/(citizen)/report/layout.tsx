import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Report an Incident',
  description: 'Report a dangerous situation in your community. Takes under 60 seconds. AI classifies and routes to the right agency.',
  openGraph: {
    title: 'Report an Incident | SafeReport',
    description: 'Help your community. Report a dangerous situation in under 60 seconds.',
    images: [{ url: '/api/og?title=REPORT+AN+INCIDENT&description=Help+your+community.+Report+a+dangerous+situation+in+under+60+seconds.', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og?title=REPORT+AN+INCIDENT&description=Help+your+community.+Report+a+dangerous+situation+in+under+60+seconds.'],
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
