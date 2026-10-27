// THE ONLINE SERVER — one room code = one copy of it. ./worker.ts (Cloudflare's front door, PartyServer) makes it
// and hands it the room; nothing here knows about Cloudflare.
// The rooms module (src/rooms/server/) runs the room: seats, host, join, rejoin, idle players, bots.
// This game's own rules are in ./rules.ts. Room knobs (seats, timings) are in content/rooms.json.
//   Local:  npm run party:dev   (port: wrangler.json dev.port)   ·   Live: npm run party:deploy (Muzzy's call — it's public)
// Server code only: no React, no Dev Kit, nothing that needs a browser.
import { RoomServer } from '../src/rooms/server/roomServer'
import type { PartyRoom } from '../src/rooms/server/roomServer'
import settings from '../content/rooms.json'
import { rules } from './rules'
import type { Action, Event, Options, State, View } from './rules'

// With the emotes module: import emotes from '../content/emotes.json' and pass { emotes } as a 4th argument below —
// the room then relays players' preset phrases (checked and counted here; never stored).
export default class GameServer extends RoomServer<State, Options, Action, View, Event> {
  constructor(party: PartyRoom) {
    super(party, rules, settings)
  }
}
