import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const [{ count: totalReports }, { count: resolvedReports }, { data: categoryData }] =
    await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('reports').select('category'),
    ])

  const categoryBreakdown = categoryData?.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return NextResponse.json({
    totalReports:    totalReports ?? 0,
    resolvedReports: resolvedReports ?? 0,
    resolutionRate:  totalReports ? ((resolvedReports ?? 0) / totalReports * 100).toFixed(1) : '0',
    categoryBreakdown,
  })
}
