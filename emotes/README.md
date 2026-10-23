# Emotes

A tiny, safe way to talk across the table: a player taps their own seat, picks one of a few preset phrases ("Well
played!"), and it shows in a speech bubble by their seat on every screen. No typing, so nothing nasty can be said and
nothing needs moderating. People, bots, local and online all go through the same `sendEmote` and the same bubble — a
bot's banter (F22) is a bot pressing an emote, so muting a bot mutes its chatter. Each opponent can be muted (they're
not told), a spam limit holds on the device AND on the room's server, and a Settings switch hides everyone's emotes.

- Design: `../.planning/design/emotes.md` (research: Hearthstone, MTG Arena, Clash Royale, Marvel Snap, LoR, BGA, Rocket League).
- Framework sprint 26: F107 = layer 1. Layer 2: a sound per phrase, desktop keys 1–7, the server not sending a muted
  sender's emotes, reply phrases. Layer 3: animated / unlockable emotes. Never: free text chat.
- Kit **0.1.0**. No packages. Pure TypeScript core; the UI parts come from the UI kit (0.28.0+); online from Rooms (0.12.0+).

## What a game gets
| File (in `src/emotes/`) | Does |
|---|---|
| `emotes.ts` | **The module.** `createEmotes({ settings, words, banter, mine, save, match, send })` → `sendEmote(seat, id)` (`{ ok }` or `cooling` / `unknown` / `offline`) · `say(seat, id)` (a bot: the same path and bucket) · `onEmote(fn)` (only emotes this player should see) · `receive(message)` (online: what the room relayed) · `mute(seat, on)` / `isMuted` / `muted()` · `setHideAll(on)` / `hideAll()` · `readyIn(seat)` (ms until the next send) · `text(id)` / `allTexts()` / `bubbleMs(id)` · `setMatch(id)` (a new match: mutes start clean) · `setMine(seats)` · `onChange(fn)`. A muted seat's emotes are dropped before `onEmote` — the bubble never starts. Hide-all drops everyone's but this device's own. Ids travel, never words. |
| `bucket.ts` | The spam limit: up to `burst` in a row, one back every `refillSeconds`, never two closer than `minGapMs` — one per seat. Over it a send is refused (nothing queued). |
| `config.ts` | `content/emotes.json`. A bad value → one warning + the default. |
| `save.ts` | `EMOTE_SAVE` — the saves-module options for the switch + this match's mutes: `createSave({ ...EMOTE_SAVE, key: '<game>:emotes', version: 1 })`. |
| `settingsRow.ts` | `EMOTE_SETTINGS_ROWS`: "Hide everyone's emotes" (off), for the UI kit's Settings; `applyEmoteSetting(emotes, values)` passes it on; `emoteSettingsRows(config)` starts it at `mutedByDefault`. |
| `ui/EmoteLayer.tsx` | `<EmoteBubbles>` (one bubble per seat, pointing at it, replaced in place, said once to screen readers) · `<EmoteMenu>` (your seat → the phrase picker with its cooldown ring; an opponent's → Mute / Unmute) · `useEmoteState` (muted seats, for `<MutedMark />` on a chip) · `emoteSeatProps(seat, mine)`. **Only installed when the game has the UI kit.** |
| `conformance.mjs` | Its check:framework part (below). |

Given once (then the game's own): `content/emotes.json`. Added if missing: the starter words in `content/text/en.json`
`"emotes"`. With the saves module: the save's golden copy `tests/saves/<game>_emotes-v1.json`.

### content/emotes.json
```json
{ "phrases": ["hello", "wellPlayed", "thanks", "wow", "oops", "thinking", "goodGame"],
  "limits":  { "burst": 3, "refillSeconds": 4, "minGapMs": 800 },
  "server":  { "burst": 3, "refillSeconds": 4, "perMatch": 200 },
  "bubble":  { "showMs": 2500, "readMsPerWord": 250 },
  "picker":  { "closeAfterSend": true },
  "mutedByDefault": false }
```
Muzzy's defaults (F107 "Ask Muzzy"): no taunt (a game can add one — an id here + its words), emotes shown with the
switch to hide them, 3 in a row then one every 4 s. The words: `content/text/en.json` → `"emotes": { "hello": "Hello!", … }`;
a bot's lines (F22): `"banter": { "<personality>": { "<moment>": "…" } }`, said as `banter.<personality>.<moment>`.

## Install / update
```
node ~/.claude/config/bmuz/scripts/install-module.mjs emotes <game-folder>
```
It prints only the wiring still missing: `createEmotes` · the save (with the saves module) · `<EmoteBubbles>` and the
tappable seats with `<EmoteMenu>` (with the UI kit) · the Settings switch + `applyEmoteSetting` · online: `{ emotes }`
in `party/server.ts`, `onEmote` + `sendEmote` on the screens.

A typical wiring (React, online-capable):
```tsx
const emotes = useMemo(() => createEmotes({ settings: emotesJson, words: text.emotes, save: emoteSave, mine: [me],
  match: roomCode ?? '', send: online ? (seat, id) => room.sendEmote(id) : undefined }), [me, roomCode])
useRoom(code, who, { onEmote: (m) => emotes.receive(m) })
<EmoteBubbles emotes={emotes} targetFor={(s) => `[data-emote-seat="${s}"]`} nameFor={nameOf} avoid=".hud, [data-emote-seat]" />
<button {...emoteSeatProps(seat, seat === me)} onClick={() => setTapped(seat)}><PlayerChip … badge={isMuted(seat) ? <MutedMark /> : undefined} /></button>
{tapped && <EmoteMenu emotes={emotes} seat={tapped} mine={tapped === me} anchor={`[data-emote-seat="${tapped}"]`} name={nameOf(tapped)} onClose={() => setTapped(null)} />}
```
Clocks: the bubble's timer is on the looks clock (it fades even while paused); Pause closes the picker (the game's
job); bots speak on the rules clock (F22).

## What a game must provide (MODULE-CONTRACTS.md "Emotes") — check:framework checks each
- every phrase has words (each id in `content/emotes.json` has `emotes.<id>` in `content/text/en.json`);
- no phrase is hard-coded (a phrase's English words in the game's `src/` fail, named);
- the limits are sane (`burst` ≥ 1, `refillSeconds` > 0, the server never looser than the device);
- the picker is reachable (live play, every size: tapping the seat marked `data-emote-mine` opens the EmotePicker);
- the server relays through the kit (an online game's `party/server.ts` passes `{ emotes }`, never handles `emote` itself);
- the Settings switch is read (`hideEmotes` in Settings, and `applyEmoteSetting` / `setHideAll` in the game's code);
- the bubble keeps the kit's bars (after two sent phrases, at every size: the UI kit's checks pass, the bubble stays
  inside the window with room round its words and never changes size).

## Online (Rooms 0.12.0+)
Browser → `{ type: 'emote', id }`; server → every seat `{ type: 'emote', seat, id }`. The server owns the sender's seat
(the connection's own, never one in the message), checks the id against the phrases, keeps its own count per player
(`server.burst` / `refillSeconds` / `perMatch`), drops the rest quietly and never stores one. Mute is each device's
business in layer 1. Server bots: `room.emote(seatId, id)` — the same gate.

## Develop
`npm install` · `npm test` · `npm run typecheck` · `npm run lint` (the framework root's ESLint). The UI glue's tests
draw the framework's own UI kit (`ui/kit/index.ts` and `saves/index.ts` pass the paths on; never installed).
