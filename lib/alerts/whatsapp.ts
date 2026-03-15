import twilio from 'twilio'
import type { AuthorityOrg, AlertPayload } from '../types'
import { formatSMSMessage } from './templates/sms'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length < 7) return null
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('876')) return `+1${digits}`
  if (digits.length === 7) return null
  if (digits.length >= 10) return `+${digits}`
  return null
}

export async function sendWhatsApp(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  const testOverride = process.env.ALERT_TEST_WHATSAPP ?? process.env.ALERT_TEST_PHONE

  const body = formatSMSMessage(payload)
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`

  const fromNumber = process.env.TWILIO_WHATSAPP_FROM!
  if (testOverride && toE164(testOverride) === toE164(fromNumber)) {
    console.error('[WhatsApp] ALERT_TEST_WHATSAPP cannot be the same as TWILIO_WHATSAPP_FROM — set it to your personal mobile number')
    return
  }

  const targets = testOverride
    ? [{ name: 'TEST', alert_whatsapp: testOverride }]
    : orgs
        .filter((o) => o.alert_whatsapp)
        .map((o) => ({ name: o.name, alert_whatsapp: toE164(o.alert_whatsapp!) }))
        .filter((o): o is { name: string; alert_whatsapp: string } => o.alert_whatsapp !== null)

  if (!targets.length) {
    console.warn('[WhatsApp] No dialable numbers found for orgs:', orgs.map(o => o.name))
    return
  }

  const results = await Promise.allSettled(
    targets.map((t) =>
      client.messages.create({ body, from, to: `whatsapp:${t.alert_whatsapp}` })
    )
  )

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[WhatsApp] ✓ sent to ${targets[i].name} (${targets[i].alert_whatsapp}) — sid: ${r.value.sid}`)
    } else {
      console.error(`[WhatsApp] ✗ failed to ${targets[i].name} (${targets[i].alert_whatsapp}):`, r.reason?.message ?? r.reason)
    }
  })
}
