import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const supabase = createServiceSupabaseClient()

  const { error: rpcError } = await supabase.rpc('corroborate_report', {
    p_report_id: params.id,
    p_trust_multiplier: 1.0,
  })
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })

  const { data: report, error } = await supabase
    .from('reports')
    .select('corroboration_count, confidence_score')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Broadcast corroboration to PartyKit
  await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_HOST}/parties/map/map:global`, {
    method: 'POST',
    body: JSON.stringify({
      type:            'INCIDENT_CORROBORATED',
      incidentId:      params.id,
      confidenceScore: report.confidence_score,
      count:           report.corroboration_count,
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true, corroborationCount: report.corroboration_count })
}
