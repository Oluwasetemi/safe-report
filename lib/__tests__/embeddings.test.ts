import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('embeddings', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{ embedding: Array(1536).fill(0.1) }],
      }),
    }))
  })

  it('generateEmbedding returns a 1536-dimension vector', async () => {
    const { generateEmbedding } = await import('../ai/embeddings')
    const result = await generateEmbedding('Test incident description')
    expect(result).toHaveLength(1536)
    expect(typeof result[0]).toBe('number')
  })
})
