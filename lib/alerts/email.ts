import { Resend } from 'resend'
import { createElement } from 'react'
import type { AuthorityOrg, AlertPayload } from '../types'
import { AlertEmailTemplate } from './templates/email'

export async function sendEmail(orgs: AuthorityOrg[], payload: AlertPayload): Promise<void> {
  console.log('[Email] sendEmail called — orgs:', orgs.map(o => o.name), 'testOverride:', process.env.ALERT_TEST_EMAIL ?? 'none')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const testOverride = process.env.ALERT_TEST_EMAIL

  const subject = `[${payload.severity}] SafeReport Alert — ${payload.category.replace(/_/g, ' ')} in ${payload.parish}`

  const targets = testOverride
    ? [{ name: 'TEST', alert_email: testOverride }]
    : orgs.filter((o) => o.alert_email).map((o) => ({ name: o.name, alert_email: o.alert_email! }))

  if (!targets.length) {
    console.warn('[Email] No email addresses found for orgs:', orgs.map(o => o.name))
    return
  }

  console.log('[Email] Sending to:', targets.map(t => t.alert_email))

  const results = await Promise.allSettled(
    targets.map((t) =>
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL!,
        to:      t.alert_email,
        subject,
        react:   createElement(AlertEmailTemplate, { payload }),
      })
    )
  )

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      // SDK threw (older SDK versions)
      console.error(`[Email] ✗ threw for ${targets[i].alert_email}:`, r.reason?.message ?? r.reason)
    } else {
      // Resend SDK v2+ returns { data, error } — never rejects
      const { data, error } = r.value
      if (error) {
        console.error(`[Email] ✗ failed to ${targets[i].name} (${targets[i].alert_email}):`, JSON.stringify(error))
      } else {
        console.log(`[Email] ✓ sent to ${targets[i].name} (${targets[i].alert_email}) — id: ${data?.id}`)
      }
    }
  })
}
