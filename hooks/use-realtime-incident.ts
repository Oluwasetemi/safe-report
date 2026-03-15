'use client'

import { useState } from 'react'
import { usePartySocket } from 'partysocket/react'
import type { ServerEvent } from '@/lib/types'

export type IncidentStatus = {
  status: string
  authorityName?: string
  updatedAt: string
}

export function useRealtimeIncident(incidentId: string) {
  const [statusUpdates, setStatusUpdates] = useState<IncidentStatus[]>([])
  const [connected, setConnected] = useState(false)

  usePartySocket({
    host:  process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room:  `incident:${incidentId}`,
    party: 'incident',

    onOpen() { setConnected(true) },
    onClose() { setConnected(false) },

    onMessage(msg: MessageEvent) {
      try {
        const event = JSON.parse(msg.data) as ServerEvent
        if (event.type === 'STATUS_UPDATE') {
          setStatusUpdates((prev) => [
            ...prev,
            {
              status:        event.status,
              authorityName: event.authorityName,
              updatedAt:     new Date().toISOString(),
            },
          ])
        }
      } catch {}
    },
  })

  return { statusUpdates, connected }
}
