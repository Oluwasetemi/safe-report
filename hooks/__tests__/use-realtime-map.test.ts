import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Report, ServerEvent } from '../../lib/types'

// Mock partysocket
vi.mock('partysocket/react', () => ({
  usePartySocket: vi.fn(),
}))

const mockReport: Report = {
  id: 'uuid-1',
  device_fingerprint: 'fp',
  lat: 17.99,
  lng: -76.79,
  description: 'Test',
  category: 'fire_explosion',
  severity: 'HIGH',
  status: 'active',
  corroboration_count: 0,
  confidence_score: 0.8,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('useRealtimeMap', () => {
  it('initializes with empty incidents', async () => {
    const { usePartySocket } = await import('partysocket/react')
    vi.mocked(usePartySocket).mockReturnValue(null as never)
    const { useRealtimeMap } = await import('../use-realtime-map')
    const { result } = renderHook(() => useRealtimeMap())
    expect(result.current.incidents).toEqual([])
  })

  it('adds incident on INCIDENT_CREATED event', async () => {
    let capturedOnMessage: ((msg: MessageEvent) => void) | undefined

    const { usePartySocket } = await import('partysocket/react')
    vi.mocked(usePartySocket).mockImplementation(({ onMessage }: { onMessage?: (msg: MessageEvent) => void }) => {
      capturedOnMessage = onMessage
      return null as never
    })

    const { useRealtimeMap } = await import('../use-realtime-map')
    const { result } = renderHook(() => useRealtimeMap())

    act(() => {
      capturedOnMessage?.({
        data: JSON.stringify({ type: 'INCIDENT_CREATED', incident: mockReport } satisfies ServerEvent),
      } as MessageEvent)
    })

    expect(result.current.incidents).toHaveLength(1)
    expect(result.current.incidents[0].id).toBe('uuid-1')
  })
})
