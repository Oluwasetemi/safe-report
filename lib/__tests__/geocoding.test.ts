import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()

describe('reverseGeocode', () => {
  it('returns address and parish from Nominatim response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        display_name: '1 Hope Road, Kingston, Kingston Parish, Jamaica',
        address: {
          road: 'Hope Road',
          city: 'Kingston',
          county: 'Kingston Parish',
          country: 'Jamaica',
        },
      }),
    } as Response)

    const { reverseGeocode } = await import('../geocoding')
    const result = await reverseGeocode(17.9927, -76.7928)
    expect(result.address).toContain('Hope Road')
    expect(result.parish).toBe('Kingston Parish')
  })

  it('returns empty strings on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const { reverseGeocode } = await import('../geocoding')
    const result = await reverseGeocode(17.9927, -76.7928)
    expect(result.address).toBe('')
    expect(result.parish).toBe('')
  })
})
