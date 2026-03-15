import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('initVapid', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws when VAPID_PUBLIC_KEY is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv')
    vi.stubEnv('VAPID_EMAIL', 'mailto:test@example.com')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_PUBLIC_KEY')
  })

  it('throws when VAPID_PRIVATE_KEY is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
    vi.stubEnv('VAPID_EMAIL', 'mailto:test@example.com')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_PRIVATE_KEY')
  })

  it('throws when VAPID_EMAIL is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv')
    vi.stubEnv('VAPID_EMAIL', '')
    await expect(import('../push/vapid')).rejects.toThrow('VAPID_EMAIL')
  })
})
