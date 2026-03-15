import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock browser APIs
const mockSubscription = {
  endpoint: 'https://fcm.example.com/push/abc',
  toJSON: () => ({
    endpoint: 'https://fcm.example.com/push/abc',
    keys: { p256dh: 'key', auth: 'authval' },
  }),
  unsubscribe: vi.fn().mockResolvedValue(true),
}

const mockPushManager = {
  getSubscription: vi.fn().mockResolvedValue(null),
  subscribe: vi.fn().mockResolvedValue(mockSubscription),
}

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
}

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
      ready: Promise.resolve(mockServiceWorkerRegistration),
    },
    geolocation: {
      getCurrentPosition: vi.fn((cb) =>
        cb({ coords: { latitude: 17.99, longitude: -76.79 } })
      ),
    },
  },
  writable: true,
})

Object.defineProperty(global, 'Notification', {
  value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
  writable: true,
})

// jsdom does not implement PushManager — define it so the unsupported guard doesn't fire
Object.defineProperty(global, 'PushManager', { value: {}, writable: true })

global.fetch = vi.fn().mockResolvedValue({ ok: true })

describe('usePushSubscription', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)
    vi.mocked(Notification.requestPermission).mockResolvedValue('granted')
    mockPushManager.getSubscription.mockResolvedValue(null)
  })

  it('initializes with idle status', async () => {
    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() => usePushSubscription())
    expect(result.current.status).toBe('idle')
  })

  it('subscribes and posts to /api/push/subscribe', async () => {
    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() =>
      usePushSubscription({ type: 'citizen', lat: 17.99, lng: -76.79 })
    )

    await act(async () => {
      await result.current.subscribe()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/push/subscribe',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.current.status).toBe('subscribed')
  })

  it('returns denied status when permission is denied', async () => {
    vi.mocked(Notification.requestPermission).mockResolvedValue('denied')

    const { usePushSubscription } = await import('../use-push-subscription')
    const { result } = renderHook(() => usePushSubscription())

    await act(async () => {
      await result.current.subscribe()
    })

    expect(result.current.status).toBe('denied')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
