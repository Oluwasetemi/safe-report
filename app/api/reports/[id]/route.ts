import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  return NextResponse.json({ id: params.id, message: 'TODO' }, { status: 501 })
}

export async function PATCH(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  return NextResponse.json({ id: params.id, message: 'TODO' }, { status: 501 })
}
