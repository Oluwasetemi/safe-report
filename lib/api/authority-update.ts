import { createServerSupabaseClient } from '../supabase/server'
import type { ReportStatus } from '../types'
import { NextRequest, NextResponse } from 'next/server'

export async function applyStatusUpdate(
  req: NextRequest,
  reportId: string,
  status: ReportStatus,
  extraFields: Record<string, unknown> = {}
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: authorityUser } = await supabase
    .from('authority_users')
    .select('*, org:authority_organizations(*)')
    .eq('id', user.id)
    .single()

  if (!authorityUser) {
    return NextResponse.json({ error: 'Not an authority user' }, { status: 403 })
  }

  const updateFields: Record<string, unknown> = { status, ...extraFields }
  if (status === 'acknowledged') {
    updateFields.acknowledged_by = authorityUser.name
    updateFields.acknowledged_at = new Date().toISOString()
  }
  if (status === 'en_route') {
    updateFields.en_route_at = new Date().toISOString()
  }

  const { data: report, error } = await supabase
    .from('reports')
    .update(updateFields)
    .eq('id', reportId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Broadcast to PartyKit
  await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_HOST}/parties/incident/incident:${reportId}`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'STATUS_UPDATE',
      incidentId: reportId,
      status,
      authorityName: (authorityUser.org as { name?: string } | null)?.name ?? authorityUser.name,
    }),
  }).catch(() => {})

  await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_HOST}/parties/map/map:global`, {
    method: 'POST',
    body: JSON.stringify({ type: 'INCIDENT_UPDATED', incident: report }),
  }).catch(() => {})

  return NextResponse.json({ success: true, report })
}
