import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/ai/classify', () => ({
  classifyReport: vi.fn().mockResolvedValue({
    category: 'fire_explosion',
    subcategory: 'structure fire',
    severity: 'HIGH',
    urgencySignals: ['flames visible'],
    confidence: 0.92,
    aiSummary: 'A fire was reported.',
    embedding: Array(1536).fill(0.1),
    isDuplicate: false,
  }),
}))

vi.mock('@/lib/geocoding', () => ({
  reverseGeocode: vi.fn().mockResolvedValue({ address: '1 Test St, Kingston', parish: 'Kingston' }),
}))

vi.mock('@/lib/fingerprint', () => ({
  hashFingerprint: vi.fn().mockReturnValue('hashed-fp'),
}))

const mockFrom = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: 'new-uuid',
      ticket_number: 'SR-TEST',
      police_ref_number: null,
      category: 'fire_explosion',
      severity: 'HIGH',
      created_at: new Date().toISOString(),
    },
    error: null,
  }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}

// Mock for rate limit check (returns empty array)
const mockRateLimitSelect = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockResolvedValue({ data: [], error: null }),
}

// Mock for departments query (returns empty array)
const mockDeptSelect = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockResolvedValue({ data: [], error: null }),
}

let callCount = 0
vi.mock('@/lib/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      callCount++
      if (table === 'reports' && callCount <= 1) return mockRateLimitSelect
      if (table === 'authority_organizations') return mockDeptSelect
      return mockFrom
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}))

vi.mock('@/lib/alerts/sms', () => ({ sendSMS: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/alerts/whatsapp', () => ({ sendWhatsApp: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/alerts/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response) as any

describe('POST /api/reports', () => {
  it('returns 400 when description missing', async () => {
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify({ lat: 17.99, lng: -76.79 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when description too short', async () => {
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify({ description: 'fire', lat: 17.99, lng: -76.79 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
