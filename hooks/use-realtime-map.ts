'use client'

import { useState, useCallback } from 'react'
import { usePartySocket } from 'partysocket/react'
import type { Report, ServerEvent } from '@/lib/types'

export function useRealtimeMap() {
  const [incidents, setIncidents] = useState<Report[]>([])
  const [connected, setConnected] = useState(false)

  const socket = usePartySocket({
    host:  process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room:  'map:global',
    party: 'map',

    onOpen() {
      setConnected(true)
    },

    onClose() {
      setConnected(false)
    },

    onMessage(msg: MessageEvent) {
      try {
        const event = JSON.parse(msg.data) as ServerEvent

        if (event.type === 'SNAPSHOT') {
          setIncidents(event.incidents)
        }

        if (event.type === 'INCIDENT_CREATED') {
          setIncidents((prev) => [...prev, event.incident])
        }

        if (event.type === 'INCIDENT_UPDATED') {
          setIncidents((prev) =>
            prev.map((i) => (i.id === event.incident.id ? event.incident : i))
          )
        }

        if (event.type === 'INCIDENT_RESOLVED') {
          setIncidents((prev) => prev.filter((i) => i.id !== event.incidentId))
        }

        if (event.type === 'INCIDENT_CORROBORATED') {
          setIncidents((prev) =>
            prev.map((i) =>
              i.id === event.incidentId
                ? { ...i, confidence_score: event.confidenceScore, corroboration_count: event.count }
                : i
            )
          )
        }

        // STATUS_UPDATE and PROXIMITY_ALERT are handled in useRealtimeIncident
        // and are not relevant to the global map room
      } catch {
        // ignore malformed messages
      }
    },
  })

  const corroborate = useCallback((incidentId: string) => {
    socket?.send(JSON.stringify({ type: 'CORROBORATE', incidentId }))
  }, [socket])

  return { incidents, connected, corroborate }
}
