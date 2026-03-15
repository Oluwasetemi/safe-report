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

export const metadata: Metadata = {
  title: 'SafeReport — Community Safety Platform',
  description: 'Report dangers. See threats. Stay safe.',
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
