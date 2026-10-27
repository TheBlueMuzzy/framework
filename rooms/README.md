# Rooms

Online rooms for a web game (React + Vite, PartyServer on Muzzy's own Cloudflare — Workers free plan): make a room, share a short code, friends join, the host starts, people drop out and come back — and the game's own rules run on the server, so nobody can cheat or peek. Harvested from Roll Better (proven with real players since v0.2), made game-agnostic. Kit **0.13.1** (0.13.1, F159: the installer reads its version through the framework’s shared `scripts/kitVersion.mjs` (git asked once per run, in one place); the version line it writes is unchanged) (0.13.0, 2026-10-26, F155: **the game picks its local room port** — written once, in its `wrangler.json` `dev.port`; wrangler dev reads it and so does the page through the new Vite plugin `roomsPort()` (`src/rooms/vitePlugin.mjs` → `import.meta.env.PARTY_PORT`, `localPartyPort()`), so two games run online locally side by side; no plugin or no port = 1999 as before; the installer adds just `dev.port` to a game's own wrangler.json that lacks it — "The local room port" below) — 0.12.1 (F128: the installer asks git for the kit’s commit once per run, not on every install) — 0.12.0 (2026-10-23, F107): **emotes travel through the room** — one new message each way (browser → `{ type: 'emote', id }`, server → every seat `{ type: 'emote', seat, id }`); the server decides the sender's seat (the connection's own), checks the id against the game's `content/emotes.json` phrases, keeps its own count per seat (`server.burst` in a row, one back every `server.refillSeconds`, `server.perMatch` a match — `server/emotes.ts`), drops the rest quietly (logged once, no error back), and never stores one. Pass the file as RoomServer's 4th argument (`{ emotes: emotesJson }`); `useRoom` gives `sendEmote(id)` and `onEmote`; server bots say lines with `room.emote(seatId, id)` (F22). Mute is each device's own business (the emotes module drops muted senders). 0.11.0 (2026-10-21, security review): **a match nobody played frees its room code** — a match started where no person has made a move yet, with nobody connected, ends after `keepUnplayedMatchHours` (content/rooms.json, 24) instead of waiting `keepMatchDays`, so a script can't start a match in each of the ~6,400 codes and hold them all for days; a match someone has played waits `keepMatchDays` as before. 0.10.0 (2026-10-20, F100): **a match waits until it ends** — a match being played is kept in the room's Durable Object storage (`server/savedRoom.ts`; seats, phase, game state, bot-turn counts, timer end times), so a server restart loses nothing and players can Rejoin days later; a storage alarm wakes the room for its timers; the stored match is wiped at game over, back to lobby, a cleared room, and after `keepMatchDays` (content/rooms.json — a per-game choice the installer asks for: live ~7, async ~30) with no move; games with their own timers add `onRestore`. 0.9.0 (2026-10-20, F95): **Rejoin match** — the room is remembered on this device (`lastRoom.ts`) so a player who closed the tab gets back into the same seat (from a bot, if one took over) and hears how many turns the bot played; a room that's gone says "That match has ended", never a join error or a new room; an empty mid-game room now waits `keepEmptyRoomMs` = 5 minutes (was 60 s); a new promise check. 0.8.0 (2026-10-20): the server answers `/health` (`server/health.ts`) so `live-check.mjs` can tell it's up after a deploy; the installer tells an older `party/worker.ts` how to add it. 0.7.0: its promise check (the Dev Kit adapter is off online). 0.6.0 (2026-10-12): the server runs on PartyServer + wrangler (Glyphtender's proven setup) — the installer makes `party/worker.ts` + `wrangler.json`, `server/liveConnections.ts` is in the kit, no more `partykit.json` (PartyKit's hosted platform shut down on 23 Oct 2026). (0.1.1: flood limit, one seat per connection, "nothing changed" answers only the sender, bot seats stay mid-game — from Glyphtender's security review). 0.5.0: `room.playedBy(seatId)` → `'seat'` (the person) · `'bot-for-seat'` (a bot holding a person's seat: idle, out of time, left, kicked, away) · `'bot'` (a bot the host added) — the table kit's `PlayedBy` words, so each recorded move can say who played it.

## What a game gets
| Part | Does |
|---|---|
| Room codes (`roomCodes.ts`) | 4 letters, consonant–vowel (BAKU, MOTE, ZIRA): easy to say out loud, no C/Q/W/X/Y, a short rude-word list is never handed out. Typing is forgiving (`ba-ku`, `M0T1` work). 6,400 codes; a clash is caught (`code_taken`) |
| Identity (`identity.ts`) | `persistentId` (localStorage) = the player, owns their seat · `tabId` (sessionStorage) = this tab's connection · the player's name, remembered. Works in private windows too |
| Last room (`lastRoom.ts`, 0.9.0) | `{ code, savedAt, phase }` in localStorage (`rooms:last-room`) — kept up to date by `useRoom`, forgotten on leave / kick / game over / a closed or missing room. `matchToRejoin()` → the match to offer as "Rejoin match" (only one being played, at most 3 hours since this device last heard from it), else null. `roomBeforeReload()` → the room THIS tab was in before a reload (its own sessionStorage copy, `rooms:tab-room`), to go straight back in without the menu |
| `useRoom(roomCode, { name, create, rejoin? })` | The React hook: `status` (idle · connecting · open · reconnecting · closed), `room` (seats, phase, host), `mySeat`, `isHost`, `view` (your view of the game), `error`, `closedReason`, `send(action)`, `setReady`, `start(options)`, `kick`, `addBot(profile?)` (which bot, in the game's words — the game's optional `botProfile(profile) → { profile, name }` checks it and names the seat; repeats are numbered "Ada 2"; 0.3.0), `backToLobby`, **`leave()`**, `clearError`, `idleWarning` (`{ endsAt }` while your screen should show the idle bar, else null), `botPlaysForMe` (a bot holds your seat because you went idle), `active()` ("I'm here" — call it on any tap/key while it matters; throttled to one ping per 5 s, at once while warned or bot-held; 0.4.0), `matchEnded` (the match you were rejoining is gone, or the room closed — "That match has ended"; 0.9.0), `cameBack` (`{ botTurns }` once you're back in a game after being away) + `clearCameBack()`. Reconnects by itself; StrictMode-safe |
| Protocol (`protocol.ts`) | Every message, typed, shared by game and server. The server checks every field of every message (junk and huge messages are refused) |
| Live connections (`server/liveConnections.ts`) | The server's own list of live sockets, one per connection id — a phone's late old-socket close never drops its new one (PartyServer's own list does). `party/worker.ts` uses it |
| Health check (`server/health.ts`) | `GET /health` → `{ ok: true }` (never cached, no room opened). `party/worker.ts` answers it first; `live-check.mjs` pings it after a deploy |
| Server base (`server/roomServer.ts`) | A class the game's `party/server.ts` extends: seats, host, join, rejoin, second-tab takeover, host migration, idle players → warning → bot (and back with a tap), kick, rematch, empty-room clean-up. Sends each player **only their own view** |
| Seat rules (`server/seats.ts`) | The rules above as plain functions (tested on their own) |
| Timers table (`server/timers.ts`) | Every server timer by name: replace, stop, stop all, time left. A crashing timer is logged, not fatal. 0.10.0: `endTimes()` (what's saved), `runDue()` (the alarm woke the room), waits longer than 24.8 days work |
| Saved room (`server/savedRoom.ts`, 0.10.0) | A match being played as plain JSON (`SavedRoom`) + `jsonProblem(state)` (can this state be saved? null = yes, else where it can't: "state.bag is a Map") + `readSavedRoom` + `wakeUpAt` (the alarm time). RoomServer packs (`packRoom`) and restores (`restore`); `party/worker.ts` keeps it |
| Checks (`server/checks.ts`) | `mustBeObject`, `mustBeOneOf`, `mustBeWholeNumber`, `mustBeText`, `mustBeList`, `mustBeListWithoutRepeats`, `mustBeTrueOrFalse`, `nullOr` — for the game's `checkAction` |
| Installer | `party/server.ts`, an example `party/rules.ts` ("Count to 10"), `party/worker.ts` (Cloudflare's front door), `content/rooms.json`, `wrangler.json` — made once |

**Stays in the game:** its rules (usually its own rules engine, shared with the phone), what each player sees (`viewFor`), the turn clock (it tells the room whose move it waits for: `room.onTheClock`), bots' moves, the screens (the UI kit has Lobby / join screens). Roll Better's dice-specific parts (rolling, locking, unlock backstops, seat picker for mid-game joiners) stay in Roll Better.

## The seat rules (proven in Roll Better)
- **A player's `persistentId` owns their seat.** Reload, lost Wi-Fi, locked phone, even after a bot took over: come back and it's yours again. A player still watching takes it back just by making a move.
- **Lobby:** a player who drops out loses their seat (they rejoin at the end when they're back). An empty lobby is cleared, so the code is free again.
- **Mid-game:** seats are never removed. Dropped = "not connected" (a bot takes over after `botTakesOverAfterMs`); **Leave** = a bot takes over now (for good — only a rejoin brings them back).
- **Idle (0.4.0):** the game says whose move it's waiting for (`room.onTheClock(seatIds)`). A connected player on the clock who does nothing — no move, no tap (`active` ping) — for `idleWarnAfterMs` (30 s) gets `idle_warning` (their screen only: a draining bar until the takeover); at `idleTakeoverAfterMs` (60 s) a bot takes the seat **mid-turn**, as if they'd dropped out (others: `kind: 'bot'` with `connected: true` = "idle — a bot is playing for them"). Any tap or move from them gives the seat straight back (others see it turn human again = "is back"). The game's own turn timer running out calls `room.timedOut(seatId)`: the same takeover, at once. A dropped player has no idle clock (the away timer covers them) and still takes the seat back by reconnecting; a player who pressed Leave has no connection, so no tap can take it back.
- **Host:** stays host while connected; otherwise the first connected human in seat order. No flip-flopping when the old host returns.
- **Same player, second tab:** the new tab gets the seat, the old one is told (`connected_elsewhere`).
- **Kick:** host only; lobby = seat gone, mid-game = a bot takes it. A kicked player can't come back to that room.
- **Everyone gone mid-game:** the match is kept (in storage) until `keepMatchDays` pass with no move, then it ends (0.10.0). A match where **no person has made a move yet** (only started — bots and timers don't count) ends sooner: after `keepUnplayedMatchHours` (24) with nobody connected; anyone coming back stops that wait, and leaving again without a move starts it over (0.11.0). A room that isn't kept (a finished game, a server without storage, a state that can't be saved) waits `keepEmptyRoomMs` (5 minutes), then clears.
- **Back after being away (0.9.0):** a player who comes back into a game (reload, lost Wi-Fi, a closed tab and Rejoin match) gets `back` with `botTurns` — how many times the game waited on their seat while a bot held it for them. Turns they watched (idled, then tapped) aren't counted, and no bot turns = no `back` at all (a reload or a Wi-Fi blip isn't news). Known limits: a seat that stays on the clock through several bot moves counts once; "Rejoin match" also shows in a SECOND tab while the first still plays, and pressing it moves the seat there (the first tab is told `connected_elsewhere`); a pre-0.9 server ignores `rejoin`, so deploy the server with the client (live-check / release.mjs say when party/ changed).
- **Rejoin (0.9.0):** a join marked `rejoin` only takes back the player's own seat. No seat of theirs in that room (it was cleared, or the code is a stranger's room now) → `no_room`. It never creates a room.
- **Start:** host only, at least `minSeats`, everyone (but the host) Ready. After a game (phase `over`) the host can **start** again (rematch, same seats) or go **back to lobby** (gone players lose their seats). Anyone a bot was playing for because they idled — still connected — gets their seat back at that point, for either (0.4.1).

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
A game with the emotes module passes its phrases too (0.12.0) — the room then relays, checks and counts emotes:
`import emotes from '../content/emotes.json'` · `super(party, rules, settings, { emotes })`.

`party/worker.ts` (also made by the installer) is the front door Cloudflare runs: a PartyServer class `Main` (one per room code, at `/parties/main/<code>` — PartySocket's default) that keeps a `LiveConnections` list and hands each room to `GameServer` as `{ id, getConnection }`. A game rarely edits it (Glyphtender added its own routes there).

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
  onRestore?(state: State, room: RoomTools<State, Event>, timersEndAt: Record<string, number>): State  // 0.10.0: start the game's own timers again
}
```
- **Say no by throwing** an `Error` with a plain-English reason. The player gets it as `error.message` (`bad_action` from `checkAction`, `action_refused` from `onAction`, `cant_start` from `checkOptions`/`onStart`). The room carries on.
- **Views are sent for you** after every change (and when someone comes back): each connected player gets `viewFor(state, theirSeat)`. Secrets stay out of the data, not just off the screen.
- `seat` in `onAction` is **who sent it** — never trust a seat or player id inside the action.
- `room` (RoomTools): `code`, `settings`, `timers`, `seats()`, `update(state => newState)` (for timers and bots — not inside the callbacks above; return the state there), `sendEvent(seatId, event)`, `broadcastEvent(event, exceptSeatId?)` (one-off messages, e.g. an animation cue; they arrive before the views of the same change), `onTheClock(seatIds)` (whose move the game waits for — call it after every change of turn; [] = nobody), `timedOut(seatId)` (the game's turn timer ran out: a bot takes the seat now), `playedBy(seatId)` (who plays this seat right now — ask it when a move is played, e.g. in the bot step, and keep it with the move; 0.5.0), `log(text)`.
- **Timers:** `room.onTheClock([seatId]); room.timers.start('turn', 90_000, () => room.timedOut(seatId))`. One table; starting a name again replaces it; the game's timers stop by themselves when the game is over. Hard phase limits go here too.
- **Bots:** a seat with `kind: 'bot'` has no player. The game plays for it (e.g. in `onSeatChange(…, 'bot')` when it's that seat's turn, and in its turn clock).

### Kept until it ends — the match in storage (0.10.0, F100)
A match being played is saved in the room's own Durable Object storage (SQLite, one key `room`), so a server restart — or Cloudflare clearing a room nobody is in — loses nothing, and players come back with **Rejoin match** hours or days later.
- **What's kept:** seats + host + phase, the game's state, the bot-turn counts, whose move the game waits for, and when each timer ends. Never the live connections: after a restart every player is "away" (a bot takes over after `botTakesOverAfterMs`, as with any drop) until they rejoin — same seat, same turn.
- **When:** after each change, once (several changes in one go = one write), and only if something kept really changed — a tap (`active`), a "show me again" action or a refused move writes nothing. The lobby and a finished game keep nothing: the stored match is **wiped at game over, back to lobby, a cleared room, and after `keepMatchDays` with no move** (a move = a player's, a bot's or the game's timer; a seat changing hands isn't one).
- **Timers:** a timer is code, so only its end time is saved. A storage alarm is set for the earliest one; when it goes off the room loads and runs what's due. The room starts its own timers again by name (away → bot, the `keepMatchDays` end). **The game starts its own** in `rules.onRestore(state, room, timersEndAt)` — e.g. a turn clock: `room.timers.start('turn', Math.max(0, timersEndAt.turn - Date.now()), () => room.timedOut(seatId))` (past → it fires at once). Bots waiting to move: plan their move again. (Glyphtender keeps `turnEndsAt` in its state and re-plans the turn there.)
- **State must be plain JSON** (numbers, text, true/false, null, lists, plain objects — no Map, Set, Date, class). Test it: `expect(jsonProblem(state)).toBeNull()`. If it isn't, the room says where in the server log ("this match can't be saved — it lives in memory only: state.bag is a Map") and keeps that match in memory only, as before 0.10.0.
- **Free plan (checked 2026-10-20, developers.cloudflare.com/durable-objects/platform/pricing + /limits):** 100,000 rows written a day (a save = 1 row, a delete = 1, each `setAlarm` = 1), 5 million rows read, 5 GB stored in all, 2 MB per value. A turn-based match writes about 2 rows per move (the save + moving the alarm) — a 60-move match ≈ 150 rows, so ~600 such matches a day before the limit. A game that changes state many times a second must not use this as is.

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
// Emotes (0.12.0): useRoom(code, me, { onEmote: (m) => emotes.receive(m) }) and createEmotes({ …, send: (seat, id) => online.sendEmote(id) })
// Shut out: online.status === 'closed' → online.closedReason ('no_room', 'room_full', 'game_started', 'kicked', 'connected_elsewhere', 'room_closed', 'left'…)
```
- Unmounting (or StrictMode's practice unmount in dev) only drops the connection — the seat is kept and the next mount takes it straight back. Only `leave()` gives the seat up.
- `send` only sends while `status` is `'open'` (returns false otherwise) — grey out moves while reconnecting.
- The seat list never contains anyone's `persistentId`.

### Rejoin — back into a match after closing the tab (0.9.0)
Don't keep the room code yourself (sessionStorage forgets it when the tab closes; the check below fails on it) — `useRoom` remembers it in `lastRoom.ts` and forgets it at the right moments. The words are the UI kit's `rejoinWords` / `welcomeBackLine` (online.tsx); MainMenu takes the item through its `items` list.
```tsx
import { matchToRejoin, roomBeforeReload } from '../rooms/lastRoom'

// A reload goes straight back in (this tab only): a match as a rejoin, a lobby as a plain join (its seat went on unload)
const reloaded = roomBeforeReload()
const [code, setCode] = useState(reloaded?.code ?? null)
const [rejoining, setRejoining] = useState(reloaded?.phase === 'playing')

// Main menu: the item only while there's a match to go back to
const rejoin = matchToRejoin()
const items = [...(rejoin ? [{ label: rejoinWords.rejoin, onClick: () => { setRejoining(true); setCreating(false); setCode(rejoin.code) }, primary: true }] : []), …]

const online = useRoom(code, { name, create: creating, rejoin: rejoining })
// Joining:  online.status === 'connecting' && rejoining → <Reconnecting words={{ title: rejoinWords.joiningTitle }} message={rejoinWords.joining} onQuit={…} />
// Back in:  online.cameBack → toast(welcomeBackLine(online.cameBack.botTurns)); online.clearCameBack()   (the match ended meanwhile: the view shows the results)
// Gone:     online.matchEnded → toast(rejoinWords.ended); setCode(null)   — never the join error, and nothing new was made
// Leave:    online.leave() as always — it forgets the room, so no Rejoin offer afterwards
```
**Privacy:** the room code (and the player id that owns the seat) stay on this device, in the browser's own storage, and are only ever sent to the game's own room server — never to anyone else, and never shown to other players.

### The local room port — the game picks it (0.13.0, F155)
Written in ONE place: the game's `wrangler.json` → `"dev": { "port": 6499, "ip": "0.0.0.0" }`. `npm run party:dev` (wrangler dev) listens there, and the page reads the same line:
```ts
// vite.config.ts
import { roomsPort } from './src/rooms/vitePlugin.mjs'
plugins: [react(), roomsPort(), …]   // wrangler.json dev.port → import.meta.env.PARTY_PORT
```
`partyHost()` (roomClient.ts) then connects to **the page's own address** on that port — so a phone on the Wi-Fi (`http://192.168.x.x:…`) still reaches the PC's server — and two games run online side by side on one PC, each on its own port. To change it: edit `dev.port` (any free port), restart `npm run party:dev`; the dev server restarts by itself. No plugin, or no `dev.port` → **1999**, as before 0.13.0. A live build still uses `VITE_PARTY_HOST`. A script that starts its own room server reads the port with `readPartyPort()` (same file) — the starter's `e2e/online.mjs` does.

## Knobs — `content/rooms.json`
`minSeats` (2) · `maxSeats` (4) · `idleWarnAfterMs` (30000; 0 = no warning) · `idleTakeoverAfterMs` (60000; 0 = never) · `botTakesOverAfterMs` (60000; 0 = never) · `keepEmptyRoomMs` (300000 = 5 min; was 60000 before 0.9.0; since 0.10.0 only for a room that isn't kept) · **`keepMatchDays`** (7; days an unfinished match is kept after its last move — a game-style choice: live ~7, async/Scrabble-with-friends ~30, any number; 0.10.0) · **`keepUnplayedMatchHours`** (24; a match nobody has moved in yet, with nobody connected, ends after this many hours and frees its code — 0 = never, otherwise at least 1; never applies once a person has moved, so async games and forgotten live games keep their `keepMatchDays`; 0.11.0) · `allowBots` (false) · `maxMessagesPerSecond` (10; 0 = no limit). `_help` explains each. The turn clock and other game timings belong in the game's own `content/` files.

## What a game must provide
From MODULE-CONTRACTS.md (`~/.claude/config/bmuz/`): online, **the server owns the truth** — so the Dev Kit's tools
that change play are offline-only: the game's Dev Kit adapter answers `canRestore()` (and `canPause()`, if it has one)
`false` while the game is online (`canRestore: () => !isOnline()`).

**How it's checked — `npm run check:framework`** (0.7.0, `kit/conformance.mjs`): fails when the adapter has no
`canRestore`, or one that's always `true`. 0.9.0: a game that uses `useRoom` fails when its online code (files that
import the rooms kit) keeps something in `sessionStorage` (its own room code), or nothing calls `matchToRejoin()`
(no "Rejoin match" offer).

## Install or update
From this folder: `node scripts/install-rooms.mjs <game-folder>` (add `--dry-run` first to see what would change).
- `kit/` → the game's `src/rooms/` (with `server/` inside) + a `VERSION` stamp. Tests stay here. Files the module dropped are removed, only inside `src/rooms/`.
- Makes once, never overwrites: `party/server.ts`, `party/rules.ts` (example — only when there's no `party/server.ts` yet), `party/worker.ts`, `content/rooms.json`, `wrangler.json` (name from package.json, `main: party/worker.ts`, the `Main` Durable Object + its SQLite migration `v1`, `dev: { port: 1999, ip: 0.0.0.0 }` — skipped if the game already has a wrangler file). A game's own `wrangler.json` without `dev.port` gets just that key (0.13.0; every other byte stays, its line ends too; anything it can't place for sure — a `.jsonc`, an `env.dev` — is left alone and the step says what to add).
- Prints only the wiring the game is missing:
  0. Still on PartyKit (`partykit.json` or the `partykit` package)? → delete `partykit.json`, `npm uninstall partykit` (rooms live in memory: nothing to copy)
  1. `npm install partysocket partyserver` then `npm install -D wrangler`
  2. `package.json` scripts: `"party:dev": "wrangler dev"`, `"party:deploy": "wrangler deploy"`
  3. `.gitignore`: `.wrangler/`
  4. `.env`: no `VITE_PARTY_HOST=localhost…` (unset for local dev — `roomClient.ts` uses the page's own address, on the game's port, so a phone on the Wi-Fi reaches the PC's server; `wrangler dev` listens on every address via `dev.ip`)
  4b. (0.13.0) `vite.config.ts`: `roomsPort()` in `plugins` (the page reads `wrangler.json`'s `dev.port`); a wrangler file with no `dev.port` → add one
  5. `tsconfig.app.json`: add `"party"` to `"include"` (so `npm run build` type-checks the server)
  6. (0.10.0) an older `party/worker.ts` that keeps nothing → copy the template's storage parts (constructor + `saveRoom`, async `onStart` with `room.restore`, `keep()`, `onAlarm()`); a game whose `party/` starts timers of its own → add `onRestore`
  7. (0.10.0) **Choose `keepMatchDays` for this game** — asked after every fresh install, and while `content/rooms.json` doesn't say: live ~7, async ~30, any number (settle it at /define)
- Run: `npm run party:dev` + `npm run dev` (phone: `npx vite --host`, open the Network link).
- **Going live is Muzzy's call (public):** once per machine `npx wrangler login` (Muzzy's Cloudflare account), then `npm run party:deploy` → `<name>.joebrogno.workers.dev`, then build the game with `VITE_PARTY_HOST=<name>.joebrogno.workers.dev` (GitHub Actions: `env:` on the build step). A front-end release does NOT update the server — deploy it again (before the site) whenever `party/` or `src/rooms/server/` changes.

## Decisions
- **2026-10-12 — PartyServer on Muzzy's own Cloudflare is the only host.** PartyKit's hosted platform (`*.partykit.dev`, `partykit deploy`) shut down on 23 Oct 2026 (deploys off 16 Oct). Glyphtender had already moved (its D46, 2026-09-30: PartyKit's shared zone was full) and proved the setup; Roll Better followed. The kit never imported PartyKit, so only the front door changed: `party/worker.ts` + `wrangler.json` instead of `partykit.json`. Free (Workers free plan, SQLite Durable Objects), local dev = live (`wrangler dev`), and the client didn't change (PartySocket's default `/parties/main/<code>`).
- **The server base lives in the kit (`src/rooms/server/`), and `party/server.ts` imports it** — one copy target, and the game's own `tsc` checks it. Roll Better already imports `../src/...` from `party/`. The server files may only import each other + `protocol.ts` + `roomCodes.ts` (a test enforces it: no React, no Dev Kit, no browser storage, no `import.meta.env`), which also keeps the server bundle small.
- **No host import in the kit.** `RoomServer` takes the few bits it uses (`id`, `getConnection`, `send`, `close`) as tiny interfaces; PartyServer's connections fit them (and PartyKit's did, which is why moving hosts was one small file). Tests use fakes, so every seat/host/rejoin rule is tested without a live server — and it was also smoke-tested against a real local server (14/14, incl. reconnect, second tab, leave, wrong code, a LAN address; Glyphtender's `e2e:online` runs two browsers against `wrangler dev`).
- **Game state on the server, views sent automatically.** The game returns new state; the base sends each player `viewFor(state, seat)`. Per-player secrecy is the default, not an extra step (Roll Better sent everything to everyone; Glyphtender must not).
- **`persistentId` is never sent to players** (Roll Better's `RoomPlayer` included it). It owns the seat, so anyone who saw it could take that seat and see that hand. Players get a stable `seat.id` and a `you` field instead.
- **Rejoin always gives the seat back — even from a bot** (Roll Better refused a player whose seat had gone to a bot). A player still connected takes it back by making a move. Simpler rule, and friends who drop out aren't locked out.
- **"Join" is sent on every socket open** (first and every reconnect); the server decides join vs rejoin by `persistentId`. No separate `connected` / `rejoin` handshake. `create: true` only on the first join: a new code already in use → `code_taken`; joining an empty code → `no_room` (Roll Better guessed "not found" on the phone).
- **`closed` vs `error`:** `closed` = you're out, stop reconnecting (useRoom closes the socket); `error` = that request didn't happen, you're still in.
- **Late closes are ignored.** A reconnecting tab can open its new socket before the old one's close arrives (same tab id); the seat keeps the newest connection, matched by object and then by id + `getConnection`. Don't turn on PartyServer's `hibernate` option (it would recreate connection objects and wipe in-memory rooms).
- **Room codes: 4-letter consonant–vowel** (Glyphtender's original wished for word-based codes). Two short words would be friendlier still but need a curated word list and are slower to type on a phone; CVCV reads like a word, is quick to say, and the letters that get misheard are gone. If a game wants real words later, `makeRoomCode`/`isRoomCode` are the only places to change (server and client share them).
- **An action that changes nothing answers only its sender.** If `onAction` returns the very same state object (e.g. "send me my view again"), only the sender gets their view — otherwise one player could make the server message everyone on demand.
- **One connection = one seat, and a flood limit** (`maxMessagesPerSecond`, 10): never trust a raw WebSocket to behave like `useRoom`.
- **Lobby drop = seat gone** (as Roll Better): no "ghost" seats blocking Start; the player rejoins at the end when back.
- **One timers table** with `room:` names for the module's own timers (bot takes over, empty room) and anything else for the game's — so game-over can stop the game's timers without touching the room's.
- **Idle = a warning, then a bot mid-turn, and a tap gives it back (0.4.0, Glyphtender F52).** Before, an idle player only lost their seat after `missedTurnsBeforeBot` (2) turns the game played for them — and only if the game had a turn timer, so with the timer off a friend who wandered off froze the table. Now the room owns it: the game only says whose move it waits for (`onTheClock`; it knows its own turns), the room runs one idle clock per such seat (`room:idle-warn:` / `room:idle-takeover:` timers), warns that player alone, then hands the seat to the bot exactly like a drop-out — so the game's existing bot path plays it. Activity is a tiny `active` message (throttled to one per 5 s by `useRoom`, flood-limited by the server like any message). Only an idle / timed-out seat comes back on a tap (that player is still connected); Leave and kick close the connection, so they can't. The turn timer now hands over the same way (`timedOut`) instead of the game playing one turn for them — one rule for "you weren't there". `Seat.missedTurns` and `missedTurnsBeforeBot` are gone.
- **2026-10-20 — a match waits until it ends (F100).** The match is kept in the room's own SQLite Durable Object (the free plan's kind; Glyphtender's Words list already uses one) — not KV (~1,000 writes a day on the free plan). One key, saved after each change and only when what's kept changed (free plan: 100,000 rows written a day), one alarm for the earliest timer. The kit stays host-free: RoomServer hands JSON text to `PartyRoom.saveRoom` and takes it back with `restore`, so every rule is tested with a fake. How long a match waits is the game's call, not the kit's (Muzzy: "async Scrabble-with-friends → 30, a live game I forget during chores → 7") → `keepMatchDays`, asked at install. Only a match being *played* is kept: a lobby is cheap to make again, and a finished game has nothing to come back to.
- **Dev default server address = the page's own host, port 1999** (Roll Better's `localhost:1999` didn't work from a phone on the Wi-Fi).
- **2026-10-26 — the port is the game's, written once in `wrangler.json` (F155, 0.13.0).** A fixed 1999 meant two games (or a game and the starter) couldn't run online locally at once, and tests had to point the page elsewhere with `VITE_PARTY_HOST`. wrangler dev only reads its own file, so that file is the one place; a Vite plugin bakes its `dev.port` into the page (like the version module's `APP_VERSION`) — nothing to keep in sync by hand, and a changed port restarts the dev server. Glyphtender had already done the same by hand (`session.ts` imports `wrangler.json`, port 1997); this makes it the kit's way. Not `.env`: wrangler dev doesn't read it, so it would be a second copy. Default stays 1999, so no game changes until it opts in.

## Known limits (0.1.1)
- ~~Rooms live in memory~~ — since 0.10.0 a match being played is kept in storage (above). Still in memory only: the lobby (a restart empties it; players make it again) and a game whose state isn't plain JSON.
- A *duplicated* browser tab copies sessionStorage, so both tabs share a tab id; the server keeps whichever joined last.
- No spectators and no joining a game in progress (Roll Better's seat picker for mid-game joiners stays in Roll Better until a second game needs it).
- The Cloudflare Workers free plan has daily limits (100k requests; Durable Object time and messages are counted too) — fine for turn-based games. An empty in-memory room is evicted after ~1–2 min — since 0.10.0 that no longer ends a match (it's loaded back from storage on the next join or alarm); `keepEmptyRoomMs` is still only an upper bound for a room that isn't kept.
- **Room-code squatting (security review, v0.11.0).** There are only ~6,400 room codes, and since 0.10.0 a match is kept for days. What's done: a match nobody has moved in ends after `keepUnplayedMatchHours` (24) with nobody connected, so a script that starts matches and walks away frees every code within a day. What's left: a script that keeps reconnecting (or makes a real move) in each room can still hold codes — it has to keep running to do it, and a new room that hits a held code gets `code_taken` and picks another. **No per-address limit on making rooms**, on purpose: the worker's front door (`party/worker.ts` fetch) keeps no state between requests (each Cloudflare copy has its own memory, so an in-memory counter is easily dodged), and it can't tell a new room from a join — that's decided inside each room. A real limit needs one more Durable Object (a counter) or Cloudflare's rate-limit binding, and either one changes every game's `wrangler.json` (a new binding + migration) — not worth it until squatting is seen for real. If it is: add a `RoomLimits` Durable Object counted by address (IPv6 by /64, like the saves cloud) that the worker asks before forwarding a `create: true` join.

## Develop
`npm install`, then `npm test` (room codes, identity, protocol checks, seats/host/rejoin rules, the idle clock (warn, takeover, tap back, turn timer), timers, checks, RoomServer with a fake host and a tiny game, live connections (late close) incl. private views, server-import guard, useRoom with a fake socket incl. StrictMode, installer incl. "a fresh install type-checks") and `npm run typecheck`.
