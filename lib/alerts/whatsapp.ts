import twilio from 'twilio'
import type { AuthorityOrg, AlertPayload } from '../types'
import { formatSMSMessage } from './templates/sms'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendWhatsApp(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  const targets = orgs.filter((o) => o.alert_whatsapp)
  await Promise.allSettled(
    targets.map((org) =>
      client.messages.create({
        body: formatSMSMessage(payload),
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`,
        to:   `whatsapp:${org.alert_whatsapp!}`,
      })
    )
  )
}
