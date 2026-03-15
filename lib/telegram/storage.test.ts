import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStorageAdapter } from './storage'

// Mock createServiceSupabaseClient
vi.mock('@/lib/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}))

import { createServiceSupabaseClient } from '@/lib/supabase/server'

function makeSupabase(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  }
  return {
    from: vi.fn().mockReturnValue(chain),
  }
}

describe('StorageAdapter', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('read returns undefined when no row found', async () => {
    const supabase = makeSupabase({
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    })
    vi.mocked(createServiceSupabaseClient).mockReturnValue(supabase as never)

    const adapter = createStorageAdapter()
    const result = await adapter.read('42')
    expect(result).toBeUndefined()
  })

  it('read returns parsed session_data when row found', async () => {
    const sessionData = { __conversations: { report: 'step2' } }
    const supabase = makeSupabase({
      single: vi.fn().mockResolvedValue({ data: { session_data: sessionData }, error: null }),
    })
    vi.mocked(createServiceSupabaseClient).mockReturnValue(supabase as never)

    const adapter = createStorageAdapter()
    const result = await adapter.read('42')
    expect(result).toEqual(sessionData)
  })

  it('read throws on unexpected DB error', async () => {
    const supabase = makeSupabase({
      single: vi.fn().mockResolvedValue({ data: null, error: { code: '500', message: 'DB down' } }),
    })
    vi.mocked(createServiceSupabaseClient).mockReturnValue(supabase as never)

    const adapter = createStorageAdapter()
    await expect(adapter.read('42')).rejects.toThrow('DB down')
  })

  it('write upserts session_data', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertMock }) }
    vi.mocked(createServiceSupabaseClient).mockReturnValue(supabase as never)

    const adapter = createStorageAdapter()
    await adapter.write('42', { __conversations: {} })
    expect(upsertMock).toHaveBeenCalledWith({
      chat_id: 42,
      session_data: { __conversations: {} },
      updated_at: expect.any(String),
    })
  })

  it('delete removes row by chat_id', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    }
    vi.mocked(createServiceSupabaseClient).mockReturnValue(supabase as never)

    const adapter = createStorageAdapter()
    await adapter.delete('42')
    expect(eqMock).toHaveBeenCalledWith('chat_id', 42)
  })
})
