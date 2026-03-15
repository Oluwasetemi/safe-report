import { describe, it, expect, vi } from 'vitest'

const mockSupabase = {
  rpc: vi.fn(),
}
vi.mock('../supabase/server', () => ({
  createServiceSupabaseClient: vi.fn().mockReturnValue(mockSupabase),
}))

describe('dedup', () => {
  it('returns null when no similar reports found', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null })
    const { findDuplicate } = await import('../ai/dedup')
    const result = await findDuplicate(Array(1536).fill(0.1), 17.99, -76.79)
    expect(result).toBeNull()
  })

  it('returns parentId when similar report found within threshold', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{ id: 'parent-uuid', similarity: 0.92 }],
      error: null,
    })
    const { findDuplicate } = await import('../ai/dedup')
    const result = await findDuplicate(Array(1536).fill(0.1), 17.99, -76.79)
    expect(result).toBe('parent-uuid')
  })
})
