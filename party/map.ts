import type * as Party from 'partykit/server'
import type { Report, ServerEvent } from '../lib/types'

const SNAPSHOT_KEY = 'incidents'
const SYNC_INTERVAL_MS = 120_000 // 2 minutes

async function fetchActiveReports(supabaseUrl: string, serviceRoleKey: string): Promise<Report[]> {
  const now = new Date().toISOString()
  const fields = [
    'id', 'lat', 'lng', 'address', 'parish', 'category', 'subcategory',
    'severity', 'status', 'description', 'ai_summary', 'is_crime',
    'corroboration_count', 'confidence_score', 'created_at', 'expires_at',
    'ticket_number',
  ].join(',')

  const url = `${supabaseUrl}/rest/v1/reports` +
    `?select=${fields}` +
    `&expires_at=gt.${encodeURIComponent(now)}` +
    `&status=not.in.(resolved,flagged)` +
    `&order=created_at.desc`

  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
  }

  return res.json() as Promise<Report[]>
}

export default class MapParty implements Party.Server {
  private incidents: Report[] = []

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Restore snapshot from durable storage on (re)start
    const stored = await this.room.storage.get<Report[]>(SNAPSHOT_KEY)
    this.incidents = stored ?? []
  }

  onConnect(conn: Party.Connection) {
    // Send full snapshot to new client immediately
    conn.send(JSON.stringify({ type: 'SNAPSHOT', incidents: this.incidents }))
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const event = JSON.parse(message) as ServerEvent

      if (event.type === 'INCIDENT_CREATED') {
        this.incidents = [...this.incidents, event.incident]
        void this.room.storage.put(SNAPSHOT_KEY, this.incidents)
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_UPDATED') {
        this.incidents = this.incidents.map((i) =>
          i.id === event.incident.id ? event.incident : i
        )
        void this.room.storage.put(SNAPSHOT_KEY, this.incidents)
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_RESOLVED') {
        this.incidents = this.incidents.filter((i) => i.id !== event.incidentId)
        void this.room.storage.put(SNAPSHOT_KEY, this.incidents)
        this.room.broadcast(JSON.stringify(event), [sender.id])
      }

      if (event.type === 'INCIDENT_CORROBORATED') {
        this.incidents = this.incidents.map((i) =>
          i.id === event.incidentId
            ? { ...i, confidence_score: event.confidenceScore, corroboration_count: event.count }
            : i
        )
        void this.room.storage.put(SNAPSHOT_KEY, this.incidents)
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
        this.incidents = [...this.incidents, event.incident]
        void this.room.storage.put(SNAPSHOT_KEY, this.incidents)
      }

      return new Response('OK', { status: 200 })
    }
    return new Response('Method not allowed', { status: 405 })
  }
}

MapParty satisfies Party.Worker
