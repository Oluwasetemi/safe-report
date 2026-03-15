import { describe, it, expect, vi } from 'vitest'
import type { AlertPayload } from '../types'

vi.mock('twilio', () => ({
  default: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'test-sid' }),
    },
  }),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockReturnValue({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  }),
}))

const mockPayload: AlertPayload = {
  reportId: 'uuid',
  category: 'fire_explosion',
  severity: 'HIGH',
  address: '1 Test Road, Kingston',
  parish: 'Kingston',
  lat: 17.99,
  lng: -76.79,
  aiSummary: 'A fire was reported at a residential building.',
  timestamp: new Date().toISOString(),
  mapUrl: '/incidents/uuid',
  respondUrl: '/authority/login',
}

describe('SMS template', () => {
  it('formats SMS message with severity and location', async () => {
    const { formatSMSMessage } = await import('../alerts/templates/sms')
    const msg = formatSMSMessage(mockPayload)
    expect(msg).toContain('HIGH')
    expect(msg).toContain('Kingston')
    expect(msg).toContain('fire')
  })
})

describe('sendSMS', () => {
  it('calls twilio for each department with a phone number', async () => {
    const twilio = await import('twilio')
    const { sendSMS } = await import('../alerts/sms')
    const orgs = [
      { alert_phone: '+18761234567', name: 'Kingston Fire', type: 'fire' as const, id: '1', parish: ['Kingston'], org_id: '1' },
    ]
    await sendSMS(orgs as never, mockPayload)
    expect(twilio.default().messages.create).toHaveBeenCalled()
  })
})
