# Rooms

Online rooms for a web game (React + Vite, PartyKit on Cloudflare): make a room, share a short code, friends join, the host starts, people drop out and come back — and the game's own rules run on the server, so nobody can cheat or peek. Harvested from Roll Better (proven with real players since v0.2), made game-agnostic. Kit **0.1.1** (0.1.1: flood limit, one seat per connection, "nothing changed" answers only the sender, bot seats stay mid-game — from Glyphtender's security review).

## What a game gets
| Part | Does |
|---|---|
| Room codes (`roomCodes.ts`) | 4 letters, consonant–vowel (BAKU, MOTE, ZIRA): easy to say out loud, no C/Q/W/X/Y, a short rude-word list is never handed out. Typing is forgiving (`ba-ku`, `M0T1` work). 6,400 codes; a clash is caught (`code_taken`) |
| Identity (`identity.ts`) | `persistentId` (localStorage) = the player, owns their seat · `tabId` (sessionStorage) = this tab's connection · the player's name, remembered. Works in private windows too |
| `useRoom(roomCode, { name, create })` | The React hook: `status` (idle · connecting · open · reconnecting · closed), `room` (seats, phase, host), `mySeat`, `isHost`, `view` (your view of the game), `error`, `closedReason`, `send(action)`, `setReady`, `start(options)`, `kick`, `addBot(profile?)` (which bot, in the game's words — the game's optional `botProfile(profile) → { profile, name }` checks it and names the seat; repeats are numbered "Ada 2"; 0.3.0), `backToLobby`, **`leave()`**, `clearError`, `idleWarning` (`{ endsAt }` while your screen should show the idle bar, else null), `botPlaysForMe` (a bot holds your seat because you went idle), `active()` ("I'm here" — call it on any tap/key while it matters; throttled to one ping per 5 s, at once while warned or bot-held; 0.4.0). Reconnects by itself; StrictMode-safe |
| Protocol (`protocol.ts`) | Every message, typed, shared by game and server. The server checks every field of every message (junk and huge messages are refused) |
| Server base (`server/roomServer.ts`) | A class the game's `party/server.ts` extends: seats, host, join, rejoin, second-tab takeover, host migration, idle players → warning → bot (and back with a tap), kick, rematch, empty-room clean-up. Sends each player **only their own view** |
| Seat rules (`server/seats.ts`) | The rules above as plain functions (tested on their own) |
| Timers table (`server/timers.ts`) | Every server timer by name: replace, stop, stop all, time left. A crashing timer is logged, not fatal |
| Checks (`server/checks.ts`) | `mustBeObject`, `mustBeOneOf`, `mustBeWholeNumber`, `mustBeText`, `mustBeList`, `mustBeListWithoutRepeats`, `mustBeTrueOrFalse`, `nullOr` — for the game's `checkAction` |
| Installer | `party/server.ts`, an example `party/rules.ts` ("Count to 10"), `content/rooms.json`, `partykit.json` — made once |

**Stays in the game:** its rules (usually its own rules engine, shared with the phone), what each player sees (`viewFor`), the turn clock (it tells the room whose move it waits for: `room.onTheClock`), bots' moves, the screens (the UI kit has Lobby / join screens). Roll Better's dice-specific parts (rolling, locking, unlock backstops, seat picker for mid-game joiners) stay in Roll Better.

## The seat rules (proven in Roll Better)
- **A player's `persistentId` owns their seat.** Reload, lost Wi-Fi, locked phone, even after a bot took over: come back and it's yours again. A player still watching takes it back just by making a move.
- **Lobby:** a player who drops out loses their seat (they rejoin at the end when they're back). An empty lobby is cleared, so the code is free again.
- **Mid-game:** seats are never removed. Dropped = "not connected" (a bot takes over after `botTakesOverAfterMs`); **Leave** = a bot takes over now (for good — only a rejoin brings them back).
- **Idle (0.4.0):** the game says whose move it's waiting for (`room.onTheClock(seatIds)`). A connected player on the clock who does nothing — no move, no tap (`active` ping) — for `idleWarnAfterMs` (30 s) gets `idle_warning` (their screen only: a draining bar until the takeover); at `idleTakeoverAfterMs` (60 s) a bot takes the seat **mid-turn**, as if they'd dropped out (others: `kind: 'bot'` with `connected: true` = "idle — a bot is playing for them"). Any tap or move from them gives the seat straight back (others see it turn human again = "is back"). The game's own turn timer running out calls `room.timedOut(seatId)`: the same takeover, at once. A dropped player has no idle clock (the away timer covers them) and still takes the seat back by reconnecting; a player who pressed Leave has no connection, so no tap can take it back.
- **Host:** stays host while connected; otherwise the first connected human in seat order. No flip-flopping when the old host returns.
- **Same player, second tab:** the new tab gets the seat, the old one is told (`connected_elsewhere`).
- **Kick:** host only; lobby = seat gone, mid-game = a bot takes it. A kicked player can't come back to that room.
- **Everyone gone mid-game:** the room waits `keepEmptyRoomMs`, then clears.
- **Start:** host only, at least `minSeats`, everyone (but the host) Ready. After a game (phase `over`) the host can **start** again (rematch, same seats) or go **back to lobby** (gone players lose their seats).

## Use it in a game
### The server — `party/server.ts` (made by the installer)
```ts
import { RoomServer } from '../src/rooms/server/roomServer'
import type { PartyRoom } from '../src/rooms/server/roomServer'
import settings from '../content/rooms.json'
import { rules } from './rules'
import type { Action, Event, Options, State, View } from './rules'

export default class GameServer extends RoomServer<State, Options, Action, View, Event> {
  constructor(party: PartyRoom) {
    super(party, rules, settings)
  }
}
```

### The game's rules — `party/rules.ts` (the plug-in API, `src/rooms/server/gameRules.ts`)
```ts
export const rules: GameRules<State, Options, Action, View, Event> = {
  checkOptions(raw: unknown): Options                          // host's new-game options → checked, or throw
  checkAction(raw: unknown): Action                            // a player's move → checked shape, or throw
  onStart(options: Options, seats: Seat[], room: RoomTools<State, Event>): State   // new game; shared random setup HERE
  onAction(state: State, seat: Seat, action: Action, room: RoomTools<State, Event>): State  // apply, or throw 'It's not your turn.'
  viewFor(state: State, seat: Seat): View                      // what THIS seat may see (no one else's hand)
  isOver(state: State): boolean
  onSeatChange?(state: State, seat: Seat, change: 'dropped' | 'back' | 'bot', room: RoomTools<State, Event>): State
}
```
- **Say no by throwing** an `Error` with a plain-English reason. The player gets it as `error.message` (`bad_action` from `checkAction`, `action_refused` from `onAction`, `cant_start` from `checkOptions`/`onStart`). The room carries on.
- **Views are sent for you** after every change (and when someone comes back): each connected player gets `viewFor(state, theirSeat)`. Secrets stay out of the data, not just off the screen.
- `seat` in `onAction` is **who sent it** — never trust a seat or player id inside the action.
- `room` (RoomTools): `code`, `settings`, `timers`, `seats()`, `update(state => newState)` (for timers and bots — not inside the callbacks above; return the state there), `sendEvent(seatId, event)`, `broadcastEvent(event, exceptSeatId?)` (one-off messages, e.g. an animation cue; they arrive before the views of the same change), `onTheClock(seatIds)` (whose move the game waits for — call it after every change of turn; [] = nobody), `timedOut(seatId)` (the game's turn timer ran out: a bot takes the seat now), `log(text)`.
- **Timers:** `room.onTheClock([seatId]); room.timers.start('turn', 90_000, () => room.timedOut(seatId))`. One table; starting a name again replaces it; the game's timers stop by themselves when the game is over. Hard phase limits go here too.
- **Bots:** a seat with `kind: 'bot'` has no player. The game plays for it (e.g. in `onSeatChange(…, 'bot')` when it's that seat's turn, and in its turn clock).

### The screens — `useRoom`
```tsx
import { useRoom } from '../rooms/useRoom'
import { cleanRoomCode, makeRoomCode } from '../rooms/roomCodes'
import { getPlayerName, setPlayerName } from '../rooms/identity'

const [code, setCode] = useState<string | null>(null)
const [creating, setCreating] = useState(false)
const online = useRoom<View, Action, Options, Event>(code, { name: playerName, create: creating }, {
  onEvent: (event) => playAnimation(event), // every event, in order
})

// Create:  setCreating(true); setCode(makeRoomCode())
// Join:    const typed = cleanRoomCode(input); if (typed) { setCreating(false); setCode(typed) } else show "4 letters, like BAKU"
// Code clash (rare): if (online.closedReason === 'code_taken') setCode(makeRoomCode())
// Leave:   online.leave(); setCode(null)       ← ALWAYS through leave(), never by closing a socket
// Lobby:   online.room.seats, online.isHost, online.setReady(true), online.start(options)
// Playing: online.view (yours only), online.send(action), online.error?.message → a toast, then online.clearError()
// Shut out: online.status === 'closed' → online.closedReason ('no_room', 'room_full', 'game_started', 'kicked', 'connected_elsewhere', 'room_closed', 'left'…)
```
- Unmounting (or StrictMode's practice unmount in dev) only drops the connection — the seat is kept and the next mount takes it straight back. Only `leave()` gives the seat up.
- `send` only sends while `status` is `'open'` (returns false otherwise) — grey out moves while reconnecting.
- The seat list never contains anyone's `persistentId`.

## Knobs — `content/rooms.json`
`minSeats` (2) · `maxSeats` (4) · `idleWarnAfterMs` (30000; 0 = no warning) · `idleTakeoverAfterMs` (60000; 0 = never) · `botTakesOverAfterMs` (60000; 0 = never) · `keepEmptyRoomMs` (60000) · `allowBots` (false) · `maxMessagesPerSecond` (10; 0 = no limit). `_help` explains each. The turn clock and other game timings belong in the game's own `content/` files.

## Install or update
From this folder: `node scripts/install-rooms.mjs <game-folder>` (add `--dry-run` first to see what would change).
- `kit/` → the game's `src/rooms/` (with `server/` inside) + a `VERSION` stamp. Tests stay here. Files the module dropped are removed, only inside `src/rooms/`.
- Makes once, never overwrites: `party/server.ts`, `party/rules.ts` (example — only when there's no `party/server.ts` yet), `content/rooms.json`, `partykit.json` (`{ "name": <package.json name>, "main": "party/server.ts", "compatibilityDate": "2024-12-01", "port": 1999 }`).
- Prints only the wiring the game is missing:
  1. `npm install partysocket` then `npm install -D partykit`
  2. `package.json` scripts: `"party:dev": "partykit dev"`, `"party:deploy": "partykit deploy"`
  3. `.gitignore`: `.partykit/`
  4. `.env`: no `VITE_PARTY_HOST=localhost…` (unset for local dev — `roomClient.ts` uses the page's own address, port 1999, so a phone on the Wi-Fi reaches the PC's server; `partykit dev` listens on every address)
  5. `tsconfig.app.json`: add `"party"` to `"include"` (so `npm run build` type-checks the server)
- Run: `npm run party:dev` + `npm run dev` (phone: `npx vite --host`, open the Network link).
- **Going live is Muzzy's call (public):** `npm run party:deploy` → `<name>.thebluemuzzy.partykit.dev` (Roll Better's account), then build the game with `VITE_PARTY_HOST=<name>.thebluemuzzy.partykit.dev` (GitHub Actions: `env:` on the build step). A front-end release does NOT update the server — deploy it again whenever `party/` or `src/rooms/server/` changes.

## Decisions
- **The server base lives in the kit (`src/rooms/server/`), and `party/server.ts` imports it** — one copy target, and the game's own `tsc` checks it. Roll Better already imports `../src/...` from `party/`. The server files may only import each other + `protocol.ts` + `roomCodes.ts` (a test enforces it: no React, no Dev Kit, no browser storage, no `import.meta.env`), which also keeps the server bundle small.
- **No PartyKit import in the kit.** `RoomServer` takes the few bits it uses (`id`, `getConnection`, `send`, `close`) as tiny interfaces; PartyKit's objects fit them. Tests use fakes, so every seat/host/rejoin rule is tested without a live server — and it was also smoke-tested against a real `partykit dev` (14/14, incl. reconnect, second tab, leave, wrong code, a LAN address).
- **Game state on the server, views sent automatically.** The game returns new state; the base sends each player `viewFor(state, seat)`. Per-player secrecy is the default, not an extra step (Roll Better sent everything to everyone; Glyphtender must not).
- **`persistentId` is never sent to players** (Roll Better's `RoomPlayer` included it). It owns the seat, so anyone who saw it could take that seat and see that hand. Players get a stable `seat.id` and a `you` field instead.
- **Rejoin always gives the seat back — even from a bot** (Roll Better refused a player whose seat had gone to a bot). A player still connected takes it back by making a move. Simpler rule, and friends who drop out aren't locked out.
- **"Join" is sent on every socket open** (first and every reconnect); the server decides join vs rejoin by `persistentId`. No separate `connected` / `rejoin` handshake. `create: true` only on the first join: a new code already in use → `code_taken`; joining an empty code → `no_room` (Roll Better guessed "not found" on the phone).
- **`closed` vs `error`:** `closed` = you're out, stop reconnecting (useRoom closes the socket); `error` = that request didn't happen, you're still in.
- **Late closes are ignored.** A reconnecting tab can open its new socket before the old one's close arrives (same tab id); the seat keeps the newest connection, matched by object and then by id + `getConnection`. Don't turn on PartyKit's `hibernate` option (it would recreate connection objects and wipe in-memory rooms).
- **Room codes: 4-letter consonant–vowel** (Glyphtender's original wished for word-based codes). Two short words would be friendlier still but need a curated word list and are slower to type on a phone; CVCV reads like a word, is quick to say, and the letters that get misheard are gone. If a game wants real words later, `makeRoomCode`/`isRoomCode` are the only places to change (server and client share them).
- **An action that changes nothing answers only its sender.** If `onAction` returns the very same state object (e.g. "send me my view again"), only the sender gets their view — otherwise one player could make the server message everyone on demand.
- **One connection = one seat, and a flood limit** (`maxMessagesPerSecond`, 10): never trust a raw WebSocket to behave like `useRoom`.
- **Lobby drop = seat gone** (as Roll Better): no "ghost" seats blocking Start; the player rejoins at the end when back.
- **One timers table** with `room:` names for the module's own timers (bot takes over, empty room) and anything else for the game's — so game-over can stop the game's timers without touching the room's.
- **Idle = a warning, then a bot mid-turn, and a tap gives it back (0.4.0, Glyphtender F52).** Before, an idle player only lost their seat after `missedTurnsBeforeBot` (2) turns the game played for them — and only if the game had a turn timer, so with the timer off a friend who wandered off froze the table. Now the room owns it: the game only says whose move it waits for (`onTheClock`; it knows its own turns), the room runs one idle clock per such seat (`room:idle-warn:` / `room:idle-takeover:` timers), warns that player alone, then hands the seat to the bot exactly like a drop-out — so the game's existing bot path plays it. Activity is a tiny `active` message (throttled to one per 5 s by `useRoom`, flood-limited by the server like any message). Only an idle / timed-out seat comes back on a tap (that player is still connected); Leave and kick close the connection, so they can't. The turn timer now hands over the same way (`timedOut`) instead of the game playing one turn for them — one rule for "you weren't there". `Seat.missedTurns` and `missedTurnsBeforeBot` are gone.
- **Dev default server address = the page's own host, port 1999** (Roll Better's `localhost:1999` didn't work from a phone on the Wi-Fi).

## Known limits (0.1.1)
- Rooms live in memory: if Cloudflare restarts the room, it's gone (same as Roll Better). Fine for a party game.
- A *duplicated* browser tab copies sessionStorage, so both tabs share a tab id; the server keeps whichever joined last.
- No spectators and no joining a game in progress (Roll Better's seat picker for mid-game joiners stays in Roll Better until a second game needs it).
- The free PartyKit tier counts every message (~100k/day) — fine for turn-based games.

## Develop
`npm install`, then `npm test` (room codes, identity, protocol checks, seats/host/rejoin rules, the idle clock (warn, takeover, tap back, turn timer), timers, checks, RoomServer with a fake PartyKit and a tiny game incl. private views, server-import guard, useRoom with a fake socket incl. StrictMode, installer incl. "a fresh install type-checks") and `npm run typecheck`.
