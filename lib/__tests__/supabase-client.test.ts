import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ from: vi.fn() })),
  createServerClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('Supabase client factory', () => {
  it('createClient returns a Supabase client', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    const { createClient } = await import('../supabase/client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })
})
