import { NextRequest } from 'next/server'
import { applyStatusUpdate } from '@/lib/api/authority-update'

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  return applyStatusUpdate(req, params.id, 'acknowledged')
}
