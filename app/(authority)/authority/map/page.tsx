'use client'

import dynamic from 'next/dynamic'

const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100vh', background: '#111318' }} /> }
)

export default function AuthorityMapPage() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, background: 'var(--surface-raised)', padding: '6px 12px', border: '1px solid var(--brand-primary)', borderRadius: 4 }}>
        <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 13, color: 'var(--brand-primary)', letterSpacing: 1 }}>
          AUTHORITY VIEW — ALL INCIDENTS INCLUDING CRIME
        </span>
      </div>
      <LiveMap authorityMode={true} />
    </div>
  )
}
