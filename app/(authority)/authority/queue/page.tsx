import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TriageQueueClient } from '@/components/authority/triage-queue-client'

export const metadata: Metadata = {
  title: 'Triage Queue',
  description: 'Authority incident triage queue for JCF, JFB, NAS, ODPEM, NWA, and JPS officers.',
  robots: { index: false, follow: false },
}

export default async function TriageQueuePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/authority/login')

  const { data: authorityUser } = await supabase
    .from('authority_users')
    .select('*, org:authority_organizations(*)')
    .eq('id', user.id)
    .single()

  if (!authorityUser) redirect('/authority/login')

  // Initial load: active + acknowledged + en_route reports for this org's parishes
  const { data: initialReports } = await supabase
    .from('reports')
    .select('*')
    .in('status', ['active', 'acknowledged', 'en_route'])
    .in('parish', authorityUser.org?.parish ?? [])
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <TriageQueueClient
      initialReports={initialReports ?? []}
      orgId={authorityUser.org_id}
      orgName={authorityUser.org?.name ?? ''}
    />
  )
}
