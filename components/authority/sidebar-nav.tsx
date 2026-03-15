'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { usePushSubscription } from '@/hooks/use-push-subscription'

interface NavItem {
  href: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/authority/queue',     label: 'Triage Queue', icon: '📋' },
  { href: '/authority/map',       label: 'Live Map',     icon: '🗺' },
  { href: '/authority/analytics', label: 'Analytics',    icon: '📊' },
]

interface SidebarNavProps {
  orgName: string
  userName: string
  unreadCount?: number
  orgId?: string
}

export function SidebarNav({ orgName, userName, unreadCount = 0, orgId }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const push = usePushSubscription({ type: 'authority', org_id: orgId })

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/authority/login')
  }

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: 'var(--surface-raised)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: 'var(--brand-primary)', display: 'inline-block', padding: '3px 10px', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, color: '#0A0A0A', fontSize: 14, letterSpacing: 2 }}>
            SAFEREPORT
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>{orgName}</p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:            12,
                padding:       '12px 16px',
                textDecoration:'none',
                color:          active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                borderLeft:    `3px solid ${active ? 'var(--brand-primary)' : 'transparent'}`,
                background:     active ? 'rgba(212,255,0,0.04)' : 'transparent',
                fontFamily:    'var(--font-barlow)',
                fontSize:       14,
                fontWeight:     active ? 600 : 400,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.href === '/authority/queue' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--severity-critical)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
        {push.status !== 'unsupported' && (
          <button
            onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {push.status === 'subscribed' ? '🔔 Push on' : '🔔 Enable push alerts'}
          </button>
        )}
      </nav>

      {/* User + sign out */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 8px' }}>{userName}</p>
        <button onClick={handleSignOut}
          style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-barlow)' }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
