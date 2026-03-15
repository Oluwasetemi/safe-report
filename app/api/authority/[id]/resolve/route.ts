import { NextRequest } from 'next/server'
import { applyStatusUpdate } from '@/lib/api/authority-update'

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const body = await req.json().catch(() => ({}))
  return applyStatusUpdate(req, params.id, 'resolved', {
    resolved_at: new Date().toISOString(),
    resolution_description: (body as { description?: string }).description,
  })
}
