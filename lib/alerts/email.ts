import { Resend } from 'resend'
import { createElement } from 'react'
import type { AuthorityOrg, AlertPayload } from '../types'
import { AlertEmailTemplate } from './templates/email'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendEmail(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  const targets = orgs.filter((o) => o.alert_email)
  await Promise.allSettled(
    targets.map((org) =>
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL!,
        to:      org.alert_email!,
        subject: `[${payload.severity}] SafeReport Alert — ${payload.category.replace('_', ' ')} in ${payload.parish}`,
        react:   createElement(AlertEmailTemplate, { payload }),
      })
    )
  )
}
