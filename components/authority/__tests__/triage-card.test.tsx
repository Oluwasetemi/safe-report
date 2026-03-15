import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Report } from '../../../lib/types'

const mockReport: Report = {
  id: 'uuid-1',
  device_fingerprint: 'fp',
  lat: 17.99,
  lng: -76.79,
  description: 'Large fire at the warehouse near Half Way Tree',
  category: 'fire_explosion',
  severity: 'HIGH',
  ai_summary: 'A large warehouse fire was reported near Half Way Tree.',
  address: 'Half Way Tree, Kingston',
  parish: 'Kingston',
  status: 'active',
  corroboration_count: 5,
  confidence_score: 0.85,
  is_duplicate: false,
  is_crime: false,
  escalated: false,
  flagged: false,
  departments_alerted: ['Kingston Fire Brigade'],
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TriageCard', () => {
  it('displays severity badge', async () => {
    const { TriageCard } = await import('../triage-card')
    render(<TriageCard report={mockReport} onAction={vi.fn()} />)
    expect(screen.getByText('HIGH')).toBeDefined()
  })

  it('displays AI summary', async () => {
    const { TriageCard } = await import('../triage-card')
    render(<TriageCard report={mockReport} onAction={vi.fn()} />)
    expect(screen.getByText(/warehouse fire/i)).toBeDefined()
  })

  it('shows action buttons', async () => {
    const { TriageCard } = await import('../triage-card')
    render(<TriageCard report={mockReport} onAction={vi.fn()} />)
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeDefined()
  })
})
