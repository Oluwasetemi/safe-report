'use client'

import { useState } from 'react'
import { usePartySocket } from 'partysocket/react'
import type { Report, ServerEvent } from '@/lib/types'

export function useAuthorityFeed(orgId: string) {
  const [incidents, setIncidents] = useState<Report[]>([])
  const [connected, setConnected] = useState(false)

  usePartySocket({
    host:  process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room:  `authority:${orgId}`,
    party: 'authority',

    onOpen() { setConnected(true) },
    onClose() { setConnected(false) },

    onMessage(msg: MessageEvent) {
      try {
        const event = JSON.parse(msg.data) as ServerEvent
        if (event.type === 'INCIDENT_CREATED') {
          setIncidents((prev) => [event.incident, ...prev])
        }
        if (event.type === 'INCIDENT_UPDATED') {
          setIncidents((prev) =>
            prev.map((i) => (i.id === event.incident.id ? event.incident : i))
          )
        }
      } catch {}
    },
  })

  return { incidents, connected }
}
