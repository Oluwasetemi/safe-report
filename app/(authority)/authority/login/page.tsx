import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/authority/login-form'

export const metadata: Metadata = {
  title: 'Authority Portal Login',
  description: 'Secure login for JCF, JFB, NAS, ODPEM, NWA, and JPS authority officers.',
  openGraph: {
    title: 'Authority Portal | SafeReport',
    description: 'Secure triage dashboard for emergency authority officers across Jamaica.',
    images: [{ url: '/api/og?title=AUTHORITY+PORTAL&description=Triage+dashboard+for+JCF%2C+JFB%2C+NAS%2C+ODPEM%2C+NWA%2C+and+JPS+officers.', width: 1200, height: 630 }],
  },
}

export default function AuthorityLoginPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-block', background: 'var(--brand-primary)', padding: '6px 16px', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, color: '#0A0A0A', fontSize: 20, letterSpacing: 2 }}>
              SAFEREPORT
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            AUTHORITY PORTAL
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Restricted access — authorised personnel only
          </p>
        </div>
        <LoginForm />
        <p style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-barlow-condensed)', textDecoration: 'none', letterSpacing: 1 }}>
            ← Public site
          </Link>
        </p>
      </div>
    </main>
  )
}
