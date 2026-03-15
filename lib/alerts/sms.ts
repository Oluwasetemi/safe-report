import twilio from 'twilio'
import type { AuthorityOrg, AlertPayload } from '../types'
import { formatSMSMessage } from './templates/sms'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSMS(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  const targets = orgs.filter((o) => o.alert_phone)
  await Promise.allSettled(
    targets.map((org) =>
      client.messages.create({
        body: formatSMSMessage(payload),
        from: process.env.TWILIO_FROM_NUMBER!,
        to: org.alert_phone!,
      })
    )
  )
}
