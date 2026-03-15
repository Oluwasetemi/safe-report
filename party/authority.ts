import type * as Party from 'partykit/server'
import type { ServerEvent } from '../lib/types'

export default class AuthorityParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Authority rooms get snapshot on connect
    conn.send(JSON.stringify({ type: 'CONNECTED', roomId: this.room.id }))
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      const event = await req.json() as ServerEvent
      this.room.broadcast(JSON.stringify(event))
      return new Response('OK', { status: 200 })
    }
    return new Response('Method not allowed', { status: 405 })
  }
}

AuthorityParty satisfies Party.Worker
