import twilio from 'twilio'
import type { AuthorityOrg, AlertPayload } from '../types'
import { formatSMSMessage } from './templates/sms'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/** Normalize to E.164. Returns null if number cannot be made dialable. */
function toE164(raw: string): string | null {
  // Strip everything except digits and leading +
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length < 7) return null          // short codes (110, 119) — skip

  // Already has country code (starts with 1876... or 1876...)
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  // Jamaica local: 876XXXXXXX (10 digits without country code)
  if (digits.length === 10 && digits.startsWith('876')) return `+1${digits}`
  // 7-digit local — cannot normalize without knowing country
  if (digits.length === 7) return null
  // Already looks international
  if (digits.length >= 10) return `+${digits}`
  return null
}

export async function sendSMS(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  // In dev/test, override all destinations with a single test number
  const testOverride = process.env.ALERT_TEST_PHONE

  const body = formatSMSMessage(payload)
  const from = process.env.TWILIO_FROM_NUMBER!

  if (testOverride && toE164(testOverride) === toE164(from)) {
    console.error('[SMS] ALERT_TEST_PHONE cannot be the same as TWILIO_FROM_NUMBER — set it to your personal mobile number')
    return
  }

  const targets = testOverride
    ? [{ name: 'TEST', alert_phone: testOverride }]
    : orgs
        .filter((o) => o.alert_phone)
        .map((o) => ({ name: o.name, alert_phone: toE164(o.alert_phone!) }))
        .filter((o): o is { name: string; alert_phone: string } => o.alert_phone !== null)

  if (!targets.length) {
    console.warn('[SMS] No dialable numbers found for orgs:', orgs.map(o => o.name))
    return
  }

  const results = await Promise.allSettled(
    targets.map((t) =>
      client.messages.create({ body, from, to: t.alert_phone })
    )
  )

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[SMS] ✓ sent to ${targets[i].name} (${targets[i].alert_phone}) — sid: ${r.value.sid}`)
    } else {
      console.error(`[SMS] ✗ failed to ${targets[i].name} (${targets[i].alert_phone}):`, r.reason?.message ?? r.reason)
    }
  })
}
