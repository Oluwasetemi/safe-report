import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/authority/sidebar-nav'

export default async function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/authority/login')

  const { data: authorityUser } = await supabase
    .from('authority_users')
    .select('*, org:authority_organizations(*)')
    .eq('id', user.id)
    .single()

  if (!authorityUser) redirect('/authority/login')

  // Count active/unacked incidents
  const { count: unreadCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .contains('departments_alerted', [authorityUser.org?.name ?? ''])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
      <SidebarNav
        orgName={authorityUser.org?.name ?? 'Authority'}
        userName={authorityUser.name}
        unreadCount={unreadCount ?? 0}
      />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
