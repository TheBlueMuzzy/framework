// THE ONLINE SERVER'S FRONT DOOR — Cloudflare runs this file (wrangler.json "main") on Muzzy's own account.
// It hands every room to GameServer (./server.ts), which knows nothing about Cloudflare.
//   Local:  npm run party:dev   (port 1999)   ·   Live: npm run party:deploy (Muzzy's call — it's public)
//
// PartyServer (the open-source successor of PartyKit) gives us rooms on plain Cloudflare (Workers free plan):
// one room code = one Durable Object = one copy of the server, at /parties/main/<room code> —
// the address PartySocket uses by default, so the game's client needs nothing special.
import { Server, routePartykitRequest } from 'partyserver'
import type { Connection } from 'partyserver'
import { healthResponse } from '../src/rooms/server/health'
import { LiveConnections } from '../src/rooms/server/liveConnections'
import GameServer from './server'

// The class name is the address: "Main" → /parties/main/… (PartySocket's default). Keep it in step with wrangler.json.
export class Main extends Server {
  private room!: GameServer
  // Our own list of live sockets — PartyServer's forgets a reconnected phone's NEW socket when the old one closes late
  private live = new LiveConnections<Connection>()

  onStart() {
    this.room = new GameServer({ id: this.name, getConnection: (id) => this.live.get(id) })
  }

  onConnect(connection: Connection) {
    this.live.opened(connection)
    this.room.onConnect(connection)
  }

  onMessage(connection: Connection, message: string | ArrayBuffer) {
    this.room.onMessage(message, connection)
  }

  onClose(connection: Connection) {
    this.live.closed(connection)
    this.room.onClose(connection)
  }

  onError(connection: Connection) {
    this.live.closed(connection)
    this.room.onError(connection)
  }
}

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    // /health: "the server is up" for live-check.mjs — no room opened
    const health = healthResponse(request)
    if (health) return health
    return (await routePartykitRequest(request, env)) ?? new Response('Not found', { status: 404 })
  },
}
