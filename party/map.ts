import type * as Party from 'partykit/server'
import type { ServerEvent } from '../lib/types'

// Stores latest snapshot of all active incidents
let snapshot: ServerEvent & { type: 'SNAPSHOT' } = { type: 'SNAPSHOT', incidents: [] }

export default class MapParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send full snapshot to new client immediately
    conn.send(JSON.stringify(snapshot))
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const event = JSON.parse(message) as ServerEvent

      if (event.type === 'INCIDENT_CREATED') {
        snapshot = {
          type: 'SNAPSHOT',
          incidents: [...snapshot.incidents, event.incident],
        }
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_UPDATED') {
        snapshot = {
          type: 'SNAPSHOT',
          incidents: snapshot.incidents.map((i) =>
            i.id === event.incident.id ? event.incident : i
          ),
        }
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_RESOLVED') {
        snapshot = {
          type: 'SNAPSHOT',
          incidents: snapshot.incidents.filter((i) => i.id !== event.incidentId),
        }
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_CORROBORATED') {
        snapshot = {
          type: 'SNAPSHOT',
          incidents: snapshot.incidents.map((i) =>
            i.id === event.incidentId
              ? { ...i, confidence_score: event.confidenceScore, corroboration_count: event.count }
              : i
          ),
        }
        this.room.broadcast(JSON.stringify(event))
      }
    } catch {
      // ignore malformed messages
    }
  }

  // API routes POST to this endpoint to broadcast events
  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      const event = await req.json() as ServerEvent
      this.room.broadcast(JSON.stringify(event))

      // Update snapshot for new connections
      if (event.type === 'INCIDENT_CREATED') {
        snapshot = {
          type: 'SNAPSHOT',
          incidents: [...snapshot.incidents, event.incident],
        }
      }

      return new Response('OK', { status: 200 })
    }
    return new Response('Method not allowed', { status: 405 })
  }
}

MapParty satisfies Party.Worker
