import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      category: 'fire_explosion',
      subcategory: 'structure fire',
      severity: 'HIGH',
      urgencySignals: ['flames visible'],
      confidence: 0.92,
    },
  }),
  generateText: vi.fn().mockResolvedValue({
    text: 'A structure fire was reported at a residential building.',
  }),
}))

vi.mock('../ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1)),
}))

vi.mock('../ai/dedup', () => ({
  findDuplicate: vi.fn().mockResolvedValue(null),
}))

describe('classifyReport', () => {
  it('returns classification with AI summary when no duplicate', async () => {
    const { classifyReport } = await import('../ai/classify')
    const result = await classifyReport({
      description: 'House on fire near the school',
      parish: 'Kingston',
      lat: 17.99,
      lng: -76.79,
    })
    expect(result.category).toBe('fire_explosion')
    expect(result.severity).toBe('HIGH')
    expect(result.isDuplicate).toBe(false)
    expect(result.aiSummary).toContain('fire')
    expect(result.embedding).toHaveLength(1536)
  })

  it('upgrades severity to HIGH when urgency signals present', async () => {
    vi.mocked((await import('ai')).generateObject).mockResolvedValueOnce({
      object: {
        category: 'fire_explosion',
        subcategory: 'smoke',
        severity: 'LOW',
        urgencySignals: ['person trapped'],
        confidence: 0.7,
      },
    } as never)
    const { classifyReport } = await import('../ai/classify')
    const result = await classifyReport({
      description: 'Smoke with person trapped',
      parish: 'Kingston',
      lat: 17.99,
      lng: -76.79,
    })
    expect(['HIGH', 'CRITICAL']).toContain(result.severity)
  })

  it('returns isDuplicate true when parent found', async () => {
    vi.mocked((await import('../ai/dedup')).findDuplicate).mockResolvedValueOnce('parent-uuid')
    const { classifyReport } = await import('../ai/classify')
    const result = await classifyReport({
      description: 'Same fire again',
      parish: 'Kingston',
      lat: 17.99,
      lng: -76.79,
    })
    expect(result.isDuplicate).toBe(true)
    expect(result.parentId).toBe('parent-uuid')
  })
})
