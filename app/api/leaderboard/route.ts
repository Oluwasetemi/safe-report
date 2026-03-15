import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') ?? 'global'
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from('reporter_profiles')
    .select('*')
    .order(tab === 'monthly' ? 'monthly_points' : 'total_points', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
