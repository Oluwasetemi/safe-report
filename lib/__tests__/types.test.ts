import { describe, it, expect } from 'vitest'
import type { Report, ReporterProfile, AuthorityOrg, AlertPayload } from '../types'

describe('Types', () => {
  it('Report type has required fields', () => {
    const report: Report = {
      id: 'uuid',
      device_fingerprint: 'abc123',
      lat: 17.9927,
      lng: -76.7928,
      description: 'test',
      category: 'fire_explosion',
      severity: 'HIGH',
      status: 'active',
      corroboration_count: 0,
      confidence_score: 0,
      is_duplicate: false,
      is_crime: false,
      escalated: false,
      flagged: false,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(report.severity).toBe('HIGH')
  })

  it('AlertPayload has all required alert fields', () => {
    const payload: AlertPayload = {
      reportId: 'uuid',
      category: 'fire_explosion',
      severity: 'HIGH',
      address: '1 Test St',
      parish: 'Kingston',
      lat: 17.9927,
      lng: -76.7928,
      aiSummary: 'Fire reported',
      timestamp: new Date().toISOString(),
      mapUrl: '/incidents/uuid',
      respondUrl: '/authority/login',
    }
    expect(payload.severity).toBe('HIGH')
  })
})
