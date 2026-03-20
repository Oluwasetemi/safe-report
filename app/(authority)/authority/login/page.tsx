import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from '@/components/authority/login-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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
    <main className="min-h-screen bg-ink flex items-center justify-center px-4 py-12"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,255,0,0.06) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[420px] flex flex-col gap-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <Image src="/logo-shield.png" alt="SafeReport" width={22} height={24} className="object-contain" />
          <span className="font-condensed font-bold text-[22px] tracking-[3px] text-snow uppercase">
            SAFE<span className="text-brand">REPORT</span>
          </span>
        </div>

        {/* Card */}
        <Card className="overflow-hidden">
          {/* Coming Soon banner */}
          <div className="relative flex items-center justify-center gap-3 bg-brand/10 border-b border-brand/20 px-6 py-3">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            <span className="font-condensed font-bold text-[12px] tracking-[3px] text-brand uppercase">
              Coming Soon — Portal in Active Development
            </span>
          </div>

          <CardHeader className="pt-8 pb-2">
            <CardTitle className="text-snow text-[28px]">Authority Portal</CardTitle>
            <CardDescription className="text-[14px] leading-[1.6]">
              Restricted access — authorised personnel only.<br />
              JCF · JFB · NAS · ODPEM · NWA · JPS
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-2">
            <LoginForm />
          </CardContent>

          <CardFooter className="flex-col items-start gap-3 pt-2 pb-6">
            <p className="text-[12px] text-[var(--text-muted)] leading-[1.6]">
              Only pre-authorised accounts can access this portal. Contact your agency administrator to request access.
            </p>
            <div className="w-full border-t border-white/[0.06] pt-4 flex items-center justify-between">
              <Link
                href="/"
                className="font-condensed text-[12px] tracking-[1.5px] text-[var(--text-muted)] uppercase hover:text-snow transition-colors duration-150"
              >
                ← Public site
              </Link>
              <span className="font-data text-[10px] tracking-[1.5px] text-[var(--text-muted)]/40 uppercase">
                v0.1-alpha
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Emergency numbers */}
        <p className="text-center font-data text-[10px] tracking-[1.5px] text-[var(--text-muted)]/40 uppercase">
          Emergency: 119 · Fire: 110 · Ambulance: 113
        </p>

      </div>
    </main>
  )
}
