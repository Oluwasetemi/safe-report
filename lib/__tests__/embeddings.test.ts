import { describe, it, expect, vi } from 'vitest'

vi.mock('voyageai', () => ({
  default: class VoyageAIMock {
    embed = vi.fn().mockResolvedValue({
      data: [{ embedding: Array(1536).fill(0.1) }],
    })
  },
}))

describe('embeddings', () => {
  it('generateEmbedding returns a 1536-dimension vector', async () => {
    const { generateEmbedding } = await import('../ai/embeddings')
    const result = await generateEmbedding('Test incident description')
    expect(result).toHaveLength(1536)
    expect(typeof result[0]).toBe('number')
  })
})
