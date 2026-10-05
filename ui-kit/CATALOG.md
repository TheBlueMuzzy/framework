# Game UI catalog

Every known, common game screen. **Built** = ready in the kit: import it from `src/ui/kit` and pass words, data and callbacks. **Recipe** = not built yet: build it from the listed parts the first time a game needs it, then add it to the kit as Built (and bump `kit/VERSION`).
**Needs React 18 or newer** (tested on 18.3 and 19; `install-kit` warns if a game's React is older).
**Check the rules:** `node src/ui/kit/check-ui.mjs src/ui --css src` — fails on raw colours / px / fonts in UI code; `--css src` also warns (doesn't fail) about the game's CSS restyling kit parts (a selector naming a `.kit-…` class that sets more than CSS variables): the look belongs in the style file or a kit option.
See any Built screen live: `npm run dev` in `ui-kit/`, then `http://localhost:5180/?screen=<id>&preset=<style>`.

**Rule: non-buttons never look like buttons.** Only things you can press get a filled pill/box with an outline and a drop shadow. Instructions ("Hold to Roll", "Locked 1!") and small info ("Round 1") are `HudText`: plain words in the style's `on-game` colour with a soft `game-shade` halo, no plate. HUD chips (scores, player chips, counters) are flat plates with no shadow. Never use a `Badge`, `Panel` or `Button` just to show words.

## Parts (`?screen=parts`)
- **Layout:** `Screen` (slots `topLeft` `top` `topRight` `bottomLeft` `bottom` `bottomRight` + centre · `dialog` = dims what's under it) · `Panel` · `Stack` (column) · `Row` · `Grid`. Gaps by name: `xs s m l xl`.
- **Controls:** `Button` (primary / secondary / ghost / danger, + `icon` — square, ≥ 44px, glyph at title size, `loading`, `size` — px tall/wide to match a game piece, never below target-min, `compact` — less room each side of the label, so a row of big buttons fits one line on a narrow phone) · `Toggle` · `Slider` · `Selector` (◀ option ▶) · `Stepper` · `Tabs` · `Carousel` (one item at a time, moves on every `autoSeconds`; LOOPS — past the last the first slides in from the same side, only the two items move; tap / ◀ ▶ / ← → / swipe moves and holds it `pauseSeconds`; page dots; `index` + `onIndexChange` to mark the shown item elsewhere; reduce motion = no slide) · `TextInput` · `RoomCodeInput` · `ListRow` · `Card` · `Badge` · `Avatar` (+ `color`; initials in the body font, semibold) · `ProgressBar` · `ScrollArea` · `Text` (never leaves one word alone on a wrapped last line: CSS text-wrap pretty, plus `noOrphan(sentence)` for game-built sentences).
- **Glue:** `ScreenStack` (`overlay` = over a game with its own UI; only the TOP open screen shows — screens under it are hidden + inert until it closes; a screen opened over another always dims, so there's one dim over the game, 0.2.8–0.2.9) + `screens.push/pop/replace` · `kitScreens` · `applyStyle` · `applyAccessibility` + `loadSettings` · `fill('Round {n}', { n: 2 })` · `copyText(text, shownElement)` (clipboard, or selects the text where there's none) · `reduceMotion()` / `useCountUp(n)` (numbers that roll up, off with reduce motion).
- **Keyboard** (0.3.2): on the top open screen (or, with none open, inside the Panel the focus is in — the game's own keys are left alone) ↑ / ↓ jump from control to control in reading order — buttons, pickers, switches, sliders, boxes to type in — never words or anything hidden, inert or disabled; past the last it wraps to the first, and the control scrolls into view in a ScrollArea. ← / → work the focused control: `Selector` / `Stepper` step (also after a click on ◀ ▶), `Toggle` off / on, `Tabs` and `Carousel` move. A box you type in keeps all its arrows. No text caret ever shows outside a box you type in (caret-color, for Chrome's caret browsing — F7). Focus ring for keys and pads only (`:focus-visible`), never after a click or tap. Code: `kit/arrowKeys.ts`.
- **`kit-scope`:** wrap kit parts shown outside a Screen — e.g. pinned to a 3D point — in `<div className="kit-scope">`: they get the style's fonts, colours, text size and focus ring, but no layout, background or positioning (and taps are left as they were).
- **Pinned** (`?screen=pinned`) — kit parts stuck to a point in the game world (a chip beside a row on a 3D table). Kit parts are sized in rem, but a pinned piece must scale WITH the table. `PinnedBox` does the sizing and knows nothing about 3D; a tiny adapter in the game (the only file that imports three / R3F) puts it at the point and passes `pixelsPerUnit` (screen pixels one world unit takes up there). Props: `fit={[w, h]}` (world units: fit that box, tighter side wins) · `rem` (world units per rem: every piece with the same rem is the same size; `fit` still shrinks one that would spill) · `anchor` `right` (default: its right-middle on the point) / `center` / `left` · `name` (→ `data-pin`). Hidden until measured, wears `kit-scope`, never catches taps. Also exported: `pinScale()` (the maths). **Layers:** pinned pieces go above the game canvas but below the HUD and kit screens — e.g. drei `zIndexRange={[5, 0]}`, the game's HUD at z-index 10, `ScreenStack overlay` at `--kit-overlay-z` (default 100).
  ```tsx
  // src/components/Pinned.tsx — the game's R3F adapter (the kit never imports three)
  import { Html } from '@react-three/drei'
  import { useThree } from '@react-three/fiber'
  import { Vector3 } from 'three'
  import { PinnedBox, type PinnedBoxProps } from '../ui/kit'
  const a = new Vector3(), b = new Vector3()
  export function Pinned({ position, ...box }: Omit<PinnedBoxProps, 'pixelsPerUnit'> & { position: [number, number, number] }) {
    const camera = useThree((s) => s.camera), size = useThree((s) => s.size) // re-measures when the window resizes
    // screen pixels per world unit at this point: project it and a point one unit to its right
    a.set(...position).project(camera); b.set(position[0] + 1, position[1], position[2]).project(camera)
    const pixelsPerUnit = (Math.abs(b.x - a.x) * size.width) / 2
    return <Html position={position} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><PinnedBox pixelsPerUnit={pixelsPerUnit} {...box} /></Html>
  }
  // style pointerEvents none, NOT the pointerEvents prop — that prop only works in drei's transform mode; without it the label's invisible box eats taps on the 3D scene under it (Roll Better 2026-09-29)
  // use: <Pinned position={[-4, 0, -3.75]} fit={[2.95, 1.15]} rem={0.34} name="me"><PlayerChip size="xs" … /></Pinned>
  ```
- **Hand view** (`?screen=hand`, kit 0.3.0) — `HandView`: a player's hand drawn as a RACK (preset "rack"; a fan comes later) — one SVG, a row of places, or 2 rows if one doesn't fit (shrinks only if 2 rows still don't). It knows nothing about the game: it positions and animates, the game draws. The order of places comes from the table module's rack order (`table/kit/rack.ts`, `GAP` = an empty place). Props: `layout` (from `rackLayout({ room, tileWanted, places, tileMin, gap })`) · `boxWidth` (the places sit in its middle) · `places` (each: `key`, `piece` — the game's own data, leave out for an empty place, `attrs` — data attributes the game's input code finds with `closest()`, e.g. `{ 'data-tray-pos': 3 }`, `held` — lifts + `data-held`, `aimed` / `waiting` — faded / dimmed, `staged`) · `renderEmpty(spot)` (drawn under EVERY place; a free place shows only this) · `renderPiece(place, spot)` (`spot` = `{ index, x, y, tile }`) · `hidden` (passing the device: only empty looks, no attributes) · `stage` `out` / `gone` / `in` + `motion` `{ shrinkTime, growTime, stagger, overshoot, shrinkEasing?, growEasing? }` (seconds) — the staged pieces shrink away one after another, stay away, grow back in with an overshoot (Web Animations on `[data-refresh-slot]` groups, the svg says `data-refresh-stage`; reduce motion = none; the game runs the clock) · `look` `{ lift 0.08, headroom 0.1, waitingOpacity 0.55, aimedOpacity 0.8 }` (shares of a place) · `className` (added to `kit-hand`) · `label`. Also exported: `rackPlaceCentre(layout, boxWidth, index)`, `rackLeft`.
  ```tsx
  <HandView layout={layout} boxWidth={column} className="game-tray" label="Seeds" hidden={handoff} stage={refresh?.stage} motion={timings}
    places={order.map((id, i) => id === GAP ? { key: `empty-${i}`, attrs: { 'data-tray-pos': i } }
      : { key: id, piece: id, attrs: { 'data-hand': id, 'data-tray-pos': i }, held: id === selected, waiting: !myTurn, staged: refresh?.slots.includes(i) })}
    renderEmpty={({ x, y, tile }) => <polygon points={hexCorners(x, y, tile / 2)} className="slot" />}
    renderPiece={(place, { x, y, tile }) => <image href={artOf(place.piece)} x={x - tile / 2} y={y - tile / 2} width={tile} height={tile} />} />
  ```
- **Game box** (letterboxed games, with `ScreenStack overlay`): set `--kit-frame-w` / `--kit-frame-h` and overlay screens sit on the game picture (centred) instead of the whole window, so corner slots (version, HUD) never land in the black bars; the dim still covers the whole window. Unset = 100% (fills the window, as before). A 16:9 game: `:root { --kit-frame-w: min(100vw, calc(100dvh * 16 / 9)); --kit-frame-h: min(100dvh, calc(100vw * 9 / 16)); }`

## Built

| Screen | Export | Link | What it's for |
|---|---|---|---|
| **Front end** | | | |
| Main menu | `MainMenu` | `?screen=menu` | Title + big buttons. `items={[{ label: 'Play', onClick: play }, { label: 'Play online', onClick: online }]}` = your own order (first = primary, or mark `primary: true`). Phone on its side: title on the left, buttons on the right (6+ buttons: two columns, main one and `children` across both). Or the named `onContinue` / `onPlay` / `onSettings` / `onHowToPlay` / `onCredits` / `onQuit` (fixed order; ignored when `items` is given). `children` = extra buttons below |
| Mode select | `ModeSelect` | `?screen=modes` | A card per mode, then Start |
| How to play | `HowToPlay` | `?screen=howto` | Pages to flip, with page dots |
| Credits | `Credits` | `?screen=credits` | People, then every asset from `content/credits.json` |
| Settings | `Settings` | `?screen=settings` | Tabs + rows from `content/ui/settings.json` — never hand-built |
| **In game** | | | |
| Pause | `Pause` | `?screen=pause` | Resume / settings / how to play / quit (asks first) |
| HUD frame | `Hud` | `?screen=hud` | Safe slots: vitals top-left, status top-centre, currency + pause top-right, actions bottom, banner centre |
| HUD pieces | `Bar` (`width` s / m / l = short / medium / long; unset = fills its room) `Pips` `Counter` `Score` `TimerRing` `TurnBanner` `PlayerSeats` `Rank` `ConnectionDot` | `?screen=hud` | Health/xp/timer bars, +N counter, score + combo, timer ring, turn banner (`variant="plain"` = big HudText, no panel), seats with active player, place, connection |
| HUD text | `HudText` | `?screen=hud` · `?screen=chips` | Plain words on the game — instructions ("Hold to Roll"), info ("Round 1"). No plate; `on-game` colour + `game-shade` halo; read out politely; pops in when the text changes. `size` s / m (default) / l, `tone="accent"`, `detail` line, `pop` = quick grow-and-settle when the text changes (calls attention, e.g. "Round 2") |
| Player chip | `PlayerChip` | `?screen=chips` | One player's card beside their row/seat (the game places it; wrap in `kit-scope` outside a Screen): avatar inside the chip with breathing room on every side — nothing touches a card's edge (`color`; `active` ring drawn inside it), name, ★ score that counts up (and floats "+N"; `floatUps={false}` when the game flies its own points in), `detail`, `badge`, `active`, `dim` (fades), `size` xs/s/m (`xs` = ONE line: name, badge and detail side by side, smaller avatar — for rows close together, e.g. ~39px apart on a phone on its side). Goal chip: `icon` or `avatar={false}` |
| **Flow** | | | |
| Loading | `Loading` | `?screen=loading` | Bar (with `progress`) or spinner, plus a tip |
| Countdown | `Countdown` | `?screen=countdown` | 3-2-1-Go!, then `onDone` |
| Round intro | `RoundIntro` | `?screen=round` | "Round 2 of 5" |
| Results | `Results` (+ `rankPlayers`) | `?screen=results` · `?screen=endgame` · `?screen=endgamedim` | Scores best first, ties share a place, "You" badge, ★ on 1st, rows arrive one by one. Optional: `color` per player, `title` ("You win!"), `message`, `onRematch` / `onQuit` / `actions` — one end-of-game screen. `dim` = darkens the game behind it (still visible), like a dialog (`?screen=endgamedim`). Phone on its side: list beside the title |
| Victory | `Victory` | `?screen=victory` | Big win title, message, stats |
| Game over | `GameOver` | `?screen=gameover` | Try again or quit |
| Post-game | `PostGame` | `?screen=postgame` | Rematch / back to lobby / quit |
| Transitions | (built in) | any | Panels play the style's entrance when a screen opens; dialogs fade their dim |
| **Online** | | | |
| Lobby: join | `Lobby` (no `roomCode`) | `?screen=lobby` | Create a room or join by code; `onBack` → a Back button |
| Lobby: room | `Lobby` (with `roomCode`) | `?screen=room` · `?screen=roomauto` | Code + Copy (toast "Code copied!"; selects the code where there's no clipboard), players (`color` each), host badge, ready, Start. No `onReady` = the game readies players itself: no Ready button, Start only waits for enough players. `children` = extra rows under the players (e.g. the host's game options; they scroll with the list). A player's `detail` = a caption under the name (e.g. "🤖 First Class"); `bot: true` = no Ready badge (always ready) and, with `onRemove`, the host gets a ✕ Remove on it (0.3.1) |
| Reconnecting | `Reconnecting` | `?screen=reconnecting` · `?screen=failed` | Spinner dialog; `failed` → try again / quit |
| Seat picker | `SeatPicker` | `?screen=seats` · `?screen=joining` · `?screen=noseats` | Join a game in progress: pick a seat (e.g. a bot's) to take over |
| **Dialogs & feedback** | | | |
| Modal | `Modal` | (inside Confirm) | Any dialog: title, body, action buttons |
| Confirm | `Confirm` / `askConfirm()` | `?screen=confirm` | "Are you sure?" — destructive yes in danger colour |
| Reward popup | `RewardPopup` | `?screen=rewards` | A tile per reward, then Collect |
| Toasts | `toast()` + `ToastStack` | `?screen=feedback` · `?screen=feedback&toasts=bottom` | Short messages, max 3. `<ToastStack place="bottom" />` = where: `top` (default) / `center` / `bottom`, centred sideways; in a game box (`--kit-frame-w/-h`) they stay on the game picture. Keep one side clear with `--kit-toasts-start` / `--kit-toasts-end` (room at the picture's left / right edge), e.g. over the right half only: `:root { --kit-toasts-start: calc(var(--kit-frame-w, 100vw) / 2); }`. `toast(text, { dismissible: true })` → tap it (or its ✕ Close) to hide it early |
| Tooltip | `Tooltip` | `?screen=feedback` | ⓘ tap for a hint |
| Empty state | `EmptyState` | `?screen=feedback` | "Nothing here yet" + one action |
| Spinner | `Spinner` | `?screen=feedback` | Waiting |

## Recipes (build on first use, then move them up to Built)

| Recipe | Built from | Sketch |
|---|---|---|
| Difficulty select | Screen · Panel · Card ×3–4 in Stack · Button | `[Easy][Normal▪][Hard]  (Start)` |
| Level / stage select | Screen · Grid of Card (number, Badge ★/🔒) · Selector for world | `◀ World 2 ▶ / [1★★][2★ ][3🔒]` |
| World map | Screen · ScrollArea · Card nodes · Badge · Button | `(1)─(2)─(3🔒)  scroll →` |
| Save slots | Screen · Panel · ListRow ×3 (Avatar, name, time) · Button danger → askConfirm | `Slot 1 · Lv 4 · 2h [Load][🗑]` |
| Character / player select | Screen · Grid of Card+Avatar · Panel detail · Selector (colour) | `[😀][🤖▪][👾] / name · ◀ red ▶ / (Pick)` |
| Name entry | Screen dialog · Panel · TextInput · Button | `Your name [______] (OK)` |
| Language select | Settings row (selector `language`) or Screen · ListRow list | `English ✓ / Español / 日本語` |
| Privacy / consent | Screen dialog · Panel · Text · Toggle rows · Button | `We store… [Analytics ⏻] (Accept)(Choose)` |
| Dialogue + choices | Screen bottom slot · Panel · Avatar · Text · Stack of Button | `😀 Sam: "Roll again?" / (Yes)(No)` |
| Tutorial coach-mark | Screen dialog (dim) · Panel near target · Text · Button · Pips | `▼ Tap here to roll  (Next ●○○)` |
| Button prompts | Badge (key/button name) + Text in a Row, in a HUD slot | `[A] Jump  [B] Back` |
| Inventory + item detail | Screen · Grid of Card (icon, Badge count) · Panel detail · Button | `[🗡][🧪3][ ] │ Potion · heals 5 (Use)` |
| Quest log | Screen · Tabs (active/done) · ScrollArea · ListRow (ProgressBar) | `Find 3 keys ▓▓░ 2/3` |
| Stats sheet | Screen · Panel · ListRow (label → value) · ScrollArea | `Games 42 / Wins 17 / Best 212` |
| Leaderboard | Screen · Tabs (friends/global) · ScrollArea · ListRow (Rank, Avatar, score) · "You" Badge | `1st 😀 Ada 212 / … / 17th You 96` |
| Profile card | Panel · Avatar · Text · Badge row · stat ListRows | `😀 Muzzy · Lv 7 · [🏆][🎲]` |
| Achievements | Screen · Grid of Card (icon, ProgressBar, 🔒) · Badge count | `[🏆 Win 10 ▓▓░][🔒 ???]` |
| Friends + invite | Screen · ScrollArea · ListRow (Avatar, ConnectionDot, Button Invite) · TextInput search | `😀 Sam ● online (Invite)` |
| Quick chat | Row/Grid of Button (preset lines) in a HUD slot · toast to show | `(Nice!)(Oops)(GG)` |
| Shop + confirm purchase | Screen · Tabs · Grid of Card (price Badge) · Counter (currency) · askConfirm | `🪙120 / [🎲 Skin 50] → Buy for 50? (Yes)` |
| Daily reward | Screen dialog · Grid of Card (day, ✓/today/🔒) · RewardPopup | `[D1✓][D2✓][D3▪][D4🔒] (Claim)` |
| Rewards / XP tally | Screen · Panel · Bar (xp) · Counter (+N) · Button Continue | `XP ▓▓▓▓░ +120  Lv 5!` |
| Feature unlocked | Modal · big icon · Text · Button | `🔓 Online mode unlocked! (Try it)` |
| Context menu | Panel (popover) · Stack of Button ghost/danger | `⋮ → (Rename)(Move)(Delete)` |

## Niche — not covered unless a GDD asks
Battle pass · gacha · roulette · clans · skill trees · crafting · weapon wheels · minimap / compass · targeting · virtual joystick.
