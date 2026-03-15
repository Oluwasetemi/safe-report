import type { Metadata } from 'next'
import { Barlow_Condensed, Barlow, Space_Mono } from 'next/font/google'
import './globals.css'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow-condensed',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-barlow',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://safereport.gov.jm'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'SafeReport — Jamaica Community Safety Network',
    template: '%s | SafeReport',
  },
  description:
    'Real-time incident reporting for all 14 parishes of Jamaica. Report dangers, see live threats, and help authorities respond faster.',
  keywords: [
    'Jamaica', 'emergency', 'incident reporting', 'community safety',
    'JCF', 'JFB', 'ODPEM', 'parish', 'real-time',
  ],
  authors: [{ name: 'SafeReport Team' }],
  creator: 'SafeReport',
  publisher: 'SafeReport',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_JM',
    url: APP_URL,
    siteName: 'SafeReport',
    title: 'SafeReport — Jamaica Community Safety Network',
    description:
      'Real-time incident reporting for all 14 parishes of Jamaica. Report dangers, see live threats, and help authorities respond faster.',
    images: [
      {
        url: `/api/og?title=THE+ISLAND+WATCHES+OVER+ITSELF&description=Real-time+incident+reporting+for+all+14+parishes+of+Jamaica`,
        width: 1200,
        height: 630,
        alt: 'SafeReport — Jamaica Community Safety Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeReport — Jamaica Community Safety Network',
    description:
      'Real-time incident reporting for all 14 parishes of Jamaica.',
    images: [`/api/og?title=THE+ISLAND+WATCHES+OVER+ITSELF&description=Real-time+incident+reporting+for+all+14+parishes+of+Jamaica`],
  },
  icons: {
    icon: '/2-Photoroom.png',
    shortcut: '/2-Photoroom.png',
    apple: '/2-Photoroom.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlowCondensed.variable} ${barlow.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
