# The Emotes module — design (framework sprint 26, F107 = layer 1; F22 Banter speaks through it)

Research first (2026-10-22, web research by a helper: game wikis, guides, forums. Where a source is a player's
report rather than the studio's, it says so). From Muzzy's 2026-10-05 idea ("players send preset phrases, MTG Arena /
Hearthstone style; the AI module plugs in its triggers + frequency") and his 2026-10-23 call "Emotes first".

## The idea
- **A tiny, safe way to talk across the table.** A player taps their own seat, picks one of a few preset phrases
  ("Well played!"), and it shows in a speech bubble by their seat on every screen. No typing, so nothing nasty can
  be said, and nothing needs moderating.
- **One bubble for everybody.** People, bots, local and online all go through the same `sendEmote` and the same
  bubble. A bot's banter (F22) is just a bot pressing an emote, so muting a bot mutes its chatter.
- **Never a nuisance.** Each opponent can be muted (and they're not told), a spam limit holds on the device AND on
  the server, and a Settings switch hides everyone's emotes for players who want quiet.

## What the field does
| Game | Phrases | Picker | Mute | Spam limit |
|---|---|---|---|---|
| Hearthstone | 6 per hero: Greetings · Well played · Thanks · Wow · Oops · Threaten (voiced) | right-click / tap your own hero portrait → a ring of 6 around it | "Squelch": right-click the opponent's portrait; per match; the opponent isn't told; involuntary (scripted) lines still play | an early patch: "cannot be used more often than once every few seconds" |
| MTG Arena | classic 8: Hello · Nice · Thanks · Thinking… · Your go · Oops · Sorry · Good game (+ cosmetic stickers) | click your own avatar → an emote list | click the opponent's avatar → Mute (two clicks, silent, undo the same way); an Options setting to turn emotes off (reported by players, not checked) | none documented; "Sorry" only allowed after the opponent's "Oops" |
| Clash Royale | 4 slots in battle, cosmetic animated emotes | an emote button by the arena → a small tray | Supercell first refused a mute ("evoking strong emotions is at the heart of it"), then shipped one in Sep 2016 and made it a full mute in Nov 2016 | none documented |
| Marvel Snap | short reactions per avatar | tap your own avatar (top left) | per opponent (tap their portrait, players report); the devs refuse a global auto-mute: emotes are "the only way for players to communicate" | none documented |
| Legends of Runeterra | a small set chosen in the Loadout before a match | in match | per match; players complain they must mute "every single match"; a 2021 patch fixed muting AI opponents | none documented |
| Board Game Arena | 10 preset messages ("Hey, are you still there?") beside free chat | a star-with-a-face icon under the chat box | no built-in mute; players use browser extensions | — |
| Rocket League (quick chat, the best-known limit) | 4 groups of preset lines | d-pad, two presses | per player | "Chat disabled for 3 seconds" after a burst (players report 3–4 s) |

What that adds up to:
- **Size: 4–10 phrases, 6–8 is the sweet spot.** Few enough to know by heart and fit one small panel on a phone.
- **Categories every set covers:** greet (Hello) · praise (Well played / Nice) · thanks · react (Wow / Oops) ·
  pace (Thinking… / Your go) · goodbye (Good game). Some add a playful taunt (Hearthstone's Threaten); it's also what
  gets muted most.
- **The picker lives on your own portrait**, the mute on the opponent's portrait. Same place on phone and desktop;
  desktop adds right-click, phones tap.
- **The bubble sits beside the speaker's portrait and points at it**, a couple of seconds, one at a time per seat.
- **Mute is per opponent, silent, for this match.** A permanent "mute everyone" is the most-requested missing
  feature (Hearthstone auto-squelch thread, Snap, LoR) — studios that refuse it want interaction; players want it.
- **Spam: a short cooldown, shown on the button**, rather than an error. Where the limit is documented it's seconds.
- **Ids, not text, travel.** BGA's preset messages show in each player's own language — the message is an id.
- **AI opponents use the same emotes** (Hearthstone's practice and adventure bosses greet and react; LoR mutes them
  the same way as people).
- **Left out on purpose: free text chat.** Moderation, kids (Ticket to Ride's online chat needs age 13+), abuse and
  report systems cost more than a small game can carry. Preset phrases give the warmth without the risk.

## What a game gets (layer 1)
### The phrases — `content/emotes.json` (Dev Kit + Obsidian edit it)
```json
{ "v": 1,
  "phrases": ["hello", "wellPlayed", "thanks", "wow", "oops", "thinking", "goodGame"],
  "limits":  { "burst": 3, "refillSeconds": 4, "minGapMs": 800 },
  "server":  { "burst": 3, "refillSeconds": 4, "perMatch": 200 },
  "bubble":  { "showMs": 2500, "readMsPerWord": 250 },
  "picker":  { "closeAfterSend": true },
  "mutedByDefault": false }
```
- **phrases** = ids in picker order. The words live in `content/text/en.json` → `"emotes": { "hello": "Hello!", … }`,
  so a translation is just another text file and each player reads them in their own language.
- **limits** = a bucket: up to `burst` in a row, one comes back every `refillSeconds`, never two closer than
  `minGapMs`. Past it the buttons dim with a filling ring until one is back — nothing is queued, nothing pops up.
- **server** = the same bucket kept by the room (it never trusts the browser's count) + a hard `perMatch` cap.
- **bubble** = how long it shows: `showMs`, or longer for a long phrase (`readMsPerWord` × words), whichever is longer.
  The pop-in / fade use the UI kit's motion tokens (`motion-fast`), not new timings.
- **mutedByDefault** = the Settings switch's starting value for new players (see "Ask Muzzy").
- A bot's banter lines (F22) are extra phrase ids under `banter.<personality>.<moment>` in the same text file — the
  bubble doesn't care where the words came from.

### The module — `emotes/kit/` (pure TypeScript, no React, no network — like `table/` and `ai/`)
```ts
const emotes = createEmotes({ settings: emotesJson, seats, words: text.emotes, mutes: emoteSave })
emotes.sendEmote(seat, 'wellPlayed')   // { ok: true } | { ok: false, reason: 'cooling' | 'unknown' }
emotes.say(seat, 'banter.bully.won')   // a bot seat: the same path, the same bucket (F22 calls this)
emotes.onEmote(({ seat, id, at }) => …) // only emotes from seats this player hasn't muted
emotes.receive(message)                // online: what the room relayed
emotes.mute(seat, true) · emotes.isMuted(seat) · emotes.setHideAll(true)
emotes.readyIn(seat)                   // ms until the next send is allowed (the picker's ring)
```
- **A muted seat's emotes are dropped before `onEmote`** — the bubble never even starts. The muted player isn't
  told and can keep pressing (Hearthstone, Arena).
- **Local hot-seat games** with several people on one device: each person's seat has its own bucket.
- **Kept with the saves module** (`createSave` key `<game>:emotes`): `hideAll` (the Settings switch) and the mutes
  of the match being played (`{ match, seats }` — a reload or Rejoin keeps them; a new match starts clean, like
  Hearthstone and LoR). A golden save + the saves test like every save.
- **Clocks:** the bubble's timer is on the looks clock (it fades even when the game is paused); bots only speak on the
  rules clock (F22), so both pauses stop new banter. Opening Pause closes the picker.

### The UI kit — `ui-kit/kit/blocks/`
- **`SpeechBubble`** — one per seat, by the seat's `PlayerChip` / portrait, its pointer aimed at it. **Built on the
  Callout's maths (`placeCallout`) and look** — same intention (words pointing at a thing) → same shape; a bubble is a
  Callout with no button that fades by itself. It flips to stay inside the game picture and clear of the HUD.
  **Fixed size from the start:** wide enough for the longest phrase in the current language (measured once), so a
  short "Wow!" and a long line never resize it; padding on every side. A new emote from the same seat replaces the
  text in place (no stacking, no queue). The five styles come from `content/ui/style.json` like every part.
  Reduce motion: no pop or scale, it just appears and fades out quickly.
- **`EmotePicker`** — tap (or click, or Enter on) your own portrait → a small panel of the phrases (a grid of
  44 px buttons, 2 × 4 on a phone, one row on a wide screen), anchored to the portrait like a popover; Escape or a tap
  outside closes it; it closes after a send. A dimmed button shows the cooldown ring.
- **Mute** — tap an opponent's portrait → a small menu "Mute emotes / Unmute", using the kit's popover recipe. A
  muted seat shows a small crossed-bubble badge on its chip, so the player can see why it's quiet.
- **Settings row** `EMOTE_SETTINGS_ROWS` (saves-module style): a toggle `hideEmotes` "Hide everyone's emotes"
  (detail: "Opponents' phrases and bot chatter won't show."). Pasted into a tab's rows; read by the game.
- **Screen readers:** each shown emote is spoken once through one polite live region ("Ada: Well played!") —
  at most one announcement per second, the rest skipped; the picker buttons are real buttons with the phrase as their
  name; the bubble itself is hidden from readers so nothing is read twice. Colour is never the only sign of a mute.

### Online — the rooms kit (`rooms/kit/`)
- **One new message each way** in `protocol.ts`: browser → server `{ type: 'emote', id }`; server → everyone
  `{ type: 'emote', seat, id }`.
- **The server never trusts the browser:** the seat is the one the connection owns (never a seat in the message);
  `id` must be one of the phrase ids (`mustBeOneOf`, read from content at deploy) or a banter id the game allows;
  the server keeps its own bucket per seat + the `perMatch` cap. Over the limit or unknown → dropped quietly (logged
  once, no error sent back — nothing to probe).
- **Bots on the server** (F22) call `room.emote(seatId, id)` — the same check, the same broadcast.
- **Nothing is written to storage** — an emote is gone once shown; it never costs a saved row. Each one is a
  WebSocket message, so the server caps keep a spammer's cost tiny (the per-request cost to check in task 4).
- **Mute is the receiver's business** in layer 1: every seat gets the message, each device drops muted senders.
  (Telling the server "don't send me Ada's" is layer 2.)

### check:framework promises (`emotes/kit/conformance.mjs`)
| Check | Fails when |
|---|---|
| every phrase has words | an id in `content/emotes.json` has no `emotes.<id>` in `content/text/en.json` |
| no phrase is hard-coded | a phrase's English text appears in the game's `src/` (outside the text file) |
| the limits are sane | `burst` < 1, `refillSeconds` ≤ 0, or a server limit looser than the device's |
| the picker is reachable | in live play (Dev Kit adapter `startPlay`), no `EmotePicker` button opens from the player's own seat |
| the server relays through the kit | an online game's `party/server.ts` handles `emote` itself instead of the kit's handler |
| the Settings switch is read | `hideEmotes` is on in `content/ui/settings.json` but the game never passes it on (the UI kit's row check) |
| the bubble keeps the kit's bars | during a sent emote: the UI kit's edge, fixed-size, contrast and overlap checks at every screen size |

## What this sprint builds (layer 1, F107)
1. This research + design.
2. The module: `content/emotes.json`, `createEmotes` (`sendEmote`, `say`, `onEmote`, `receive`, mute, the bucket),
   the saved mutes + hide-all through the saves module.
3. `SpeechBubble` + `EmotePicker` + the mute menu + the Settings row, in all 5 styles, reduce motion, live region.
4. The rooms `emote` message, checked and rate-limited on the server, relayed to every seat.
5. Installer, check:framework part, README, MODULE-CONTRACTS section.
6. Proof on a scratch Glyphtender copy: local game + two-tab online game, mute, spam held back, a bot's emote,
   screenshots at every size.

## Later
- **Layer 2:** a sound per phrase (audio module, ducked under game sounds) · desktop shortcut keys (1–7) · the
  server stops sending a muted sender's emotes · "Reply" phrases that only make sense after another one (Arena's
  Sorry-after-Oops) · emotes off during certain phases (a game's choice) · a player picking which phrases go in their
  picker from a bigger set (LoR's loadout).
- **Layer 3:** animated / unlockable emotes (stickers, per-character voiced lines, Hearthstone-style) · remembering a
  muted *person* across matches (needs a lasting player id — a privacy question first) · emote counts in analytics.
- **Never:** free text chat, typed custom phrases, voice chat. If a game ever needs them it's a new design (moderation,
  age rules, reporting), not this module.

## Ask Muzzy (taste, not technical)
- **The starter phrases.** Proposed 7: Hello! · Well played! · Thanks! · Wow! · Oops! · Thinking… · Good game!
  Add a cheeky one (Hearthstone's "Threaten" — fun, and the most-muted) or keep it all friendly?
- **Emotes shown by default?** On (Snap / Clash: talking is part of the game) with a Settings switch to hide — or
  hidden by default for a calmer table. Proposed: shown.
- **How chatty can a player be?** Proposed 3 in a row, then one every 4 s. A tuning knob in content either way.

## Decisions
- **Ids travel, words stay in the text file** — each player reads their own language (BGA). (Claude)
- **One bubble path for people and bots** — muting a bot silences its banter for free. (Muzzy's 2026-10-05 note)
- **The bubble reuses the Callout** — same intention, same motion. (Claude, from the design-language rule)
- **Over the limit = dropped, shown as a cooldown ring** — no queue (a queue just delays the spam), no error toast. (Claude)
- **The server keeps its own count and owns the seat** — like every room message. (Claude)
- **Mutes last for the match, not forever** — remembering a person across matches needs a lasting id. (Claude)

## Sources
Hearthstone emotes + squelch: https://hearthstone.wiki.gg/wiki/Emote · etiquette: https://hearthstone.wiki.gg/wiki/Hearthstone_etiquette ·
auto-squelch request: https://us.forums.blizzard.com/en/hearthstone/t/bliz-please-code-an-auto-squelch-setting/162846 ·
MTG Arena emotes: https://draftsim.com/mtg-arena-emotes/ · muting: https://mtgrocks.com/how-to-mute-your-opponent-in-mtg-arena/ ·
Steam thread (turn emotes off in options, a player's report): https://steamcommunity.com/app/2141910/discussions/0/3806153359226277522 ·
Clash Royale mute history: https://toucharcade.com/2016/06/14/supercell-doubles-down-on-never-muting-emotes-in-clash-royale ,
https://toucharcade.com/2016/09/19/clash-royale-update-adds-emote-mutenew-tournaments-cards-and-more/ ,
https://toucharcade.com/2016/11/01/clash-royale-update-is-live-brings-rebalancing-along-with-improvements ·
Marvel Snap global mute: https://snap.fan/news/burning-questions-0215/ · picker: https://attackofthefanboy.com/guides/how-do-you-use-emotes-in-marvel-snap/ ·
Legends of Runeterra emotes FAQ: https://support-legendsofruneterra.riotgames.com/hc/articles/360036067313 ·
Board Game Arena preset messages: https://forum.boardgamearena.com/viewtopic.php?p=171752 · no built-in block: https://it.boardgamearena.com/bug?id=46842 ·
Ticket to Ride online chat 13+: https://plugindigital.itch.io/ticket-to-ride ·
Rocket League quick-chat throttle (player reports): https://knowyourmeme.com/memes/chat-disabled-for-3-seconds ·
Accessibility: https://gameaccessibilityguidelines.com/?p=3102 · Xbox XAG 120 (communication): https://learn.microsoft.com/gaming/accessibility/xbox-accessibility-guidelines/120 ·
aria-live for web games: https://abratabia.com/game-accessibility/web-game-aria.php
