import type { AlertPayload } from '../../types'

export function formatSMSMessage(payload: AlertPayload): string {
  return `🚨 SAFEREPORT ALERT [${payload.severity}]
Category: ${payload.category.replace('_', ' ').toUpperCase()}
Location: ${payload.address}
Parish: ${payload.parish}
Summary: ${payload.aiSummary}
Map: ${process.env.NEXT_PUBLIC_APP_URL}${payload.mapUrl}
Respond: ${process.env.NEXT_PUBLIC_APP_URL}${payload.respondUrl}
Time: ${new Date(payload.timestamp).toLocaleString('en-JM')}`
}
