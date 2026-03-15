import { describe, it, expectTypeOf } from 'vitest'
import type { PushSubscriptionRow } from '../types'

describe('PushSubscriptionRow type', () => {
  it('has correct shape', () => {
    const row: PushSubscriptionRow = {
      id: 'uuid',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh: 'base64key',
      auth: 'base64auth',
      type: 'citizen',
      lat: 17.99,
      lng: -76.79,
      org_id: null,
      created_at: new Date().toISOString(),
    }
    expectTypeOf(row.type).toMatchTypeOf<'citizen' | 'authority'>()
    expectTypeOf(row.lat).toMatchTypeOf<number | null>()
    expectTypeOf(row.org_id).toMatchTypeOf<string | null>()
  })
})
