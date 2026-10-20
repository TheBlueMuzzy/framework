// THE ONLINE SERVER'S FRONT DOOR — Cloudflare runs this file (wrangler.json "main") on Muzzy's own account.
// It hands every room to GameServer (./server.ts), which knows nothing about Cloudflare.
//   Local:  npm run party:dev   (port 1999)   ·   Live: npm run party:deploy (Muzzy's call — it's public)
//
// PartyServer (the open-source successor of PartyKit) gives us rooms on plain Cloudflare (Workers free plan):
// one room code = one Durable Object = one copy of the server, at /parties/main/<room code> —
// the address PartySocket uses by default, so the game's client needs nothing special.
//
// A match being played is kept in the room's own storage (rooms 0.10.0): a server restart, or Cloudflare clearing
// an empty room, loses nothing — players come back to it until it ends, or until keepMatchDays (content/rooms.json)
// pass with no move. The room says when to save (once per change, never for a message that changed nothing) and
// when to wake up (a storage alarm, for its timers). Free plan: 100,000 rows written a day — one save = 1 row,
// moving the alarm = 1 more (developers.cloudflare.com/durable-objects/platform/pricing).
import { Server, routePartykitRequest } from 'partyserver'
import type { Connection } from 'partyserver'
import { healthResponse } from '../src/rooms/server/health'
import { LiveConnections } from '../src/rooms/server/liveConnections'
import GameServer from './server'

// Where the match is kept in the room's storage (one key: one row)
const SAVED_ROOM = 'room'

// The bits of the Durable Object's storage this file uses
interface RoomStorage {
  get(key: string): Promise<unknown>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<boolean>
  getAlarm(): Promise<number | null>
  setAlarm(time: number): Promise<void>
  deleteAlarm(): Promise<void>
}

// The class name is the address: "Main" → /parties/main/… (PartySocket's default). Keep it in step with wrangler.json.
// (Keep PartyServer's `hibernate` option off: it would recreate connection objects and wipe the room in memory.)
export class Main extends Server {
  private room!: GameServer
  // Our own list of live sockets — PartyServer's forgets a reconnected phone's NEW socket when the old one closes late
  private live = new LiveConnections<Connection>()
  // When the storage alarm is set for (null = none) — so it's only moved when the time really changes
  private alarmAt: number | null = null
  // The room's own storage (SQLite, wrangler.json "new_sqlite_classes") — taken from the Durable Object's state, as
  // Glyphtender's Words list does (Cloudflare's types aren't loaded in the game's tsconfig, so `this.ctx` isn't known)
  private storage: RoomStorage

  constructor(...args: ConstructorParameters<typeof Server>) {
    super(...args)
    this.storage = (args[0] as unknown as { storage: RoomStorage }).storage
  }

  // Runs before anything reaches the room (a join, the alarm): a match that was kept is loaded back first
  async onStart() {
    this.room = new GameServer({
      id: this.name,
      getConnection: (id) => this.live.get(id),
      saveRoom: (savedRoom, wakeUpAt) => this.keep(savedRoom, wakeUpAt),
    })
    const saved = await this.storage.get(SAVED_ROOM)
    this.alarmAt = await this.storage.getAlarm()
    if (saved !== undefined && !this.room.restore(saved)) {
      // Unreadable (or from an older rooms version): that match is gone — start clean
      await this.storage.delete(SAVED_ROOM)
      await this.storage.deleteAlarm()
      this.alarmAt = null
    }
  }

  // The room changed: keep the match (or wipe it — game over, back to the lobby, cleared, expired), and set the alarm
  // for its earliest timer. Not awaited: Cloudflare finishes the writes before anything else goes out.
  private keep(savedRoom: string | null, wakeUpAt: number | null) {
    void (savedRoom === null ? this.storage.delete(SAVED_ROOM) : this.storage.put(SAVED_ROOM, savedRoom))
    if (wakeUpAt === this.alarmAt) return
    this.alarmAt = wakeUpAt
    void (wakeUpAt === null ? this.storage.deleteAlarm() : this.storage.setAlarm(wakeUpAt))
  }

  // The alarm went off (onStart has already loaded the match): run the room's timers that are due
  onAlarm() {
    this.alarmAt = null // (an alarm goes off once)
    this.room.wakeUp()
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
