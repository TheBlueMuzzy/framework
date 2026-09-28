# Game UI catalog

Every known, common game screen. **Built** = ready in the kit: import it from `src/ui/kit` and pass words, data and callbacks. **Recipe** = not built yet: build it from the listed parts the first time a game needs it, then add it to the kit as Built (and bump `kit/VERSION`).
See any Built screen live: `npm run dev` in `ui-kit/`, then `http://localhost:5180/?screen=<id>&preset=<style>`.

## Parts (`?screen=parts`)
- **Layout:** `Screen` (slots `topLeft` `top` `topRight` `bottomLeft` `bottom` `bottomRight` + centre · `dialog` = dims what's under it) · `Panel` · `Stack` (column) · `Row` · `Grid`. Gaps by name: `xs s m l xl`.
- **Controls:** `Button` (primary / secondary / ghost / danger, + `icon`, `loading`) · `Toggle` · `Slider` · `Selector` (◀ option ▶) · `Stepper` · `Tabs` · `TextInput` · `RoomCodeInput` · `ListRow` · `Card` · `Badge` · `Avatar` · `ProgressBar` · `ScrollArea` · `Text`.
- **Glue:** `ScreenStack` (`overlay` = over a game with its own UI) + `screens.push/pop/replace` · `kitScreens` · `applyStyle` · `applyAccessibility` + `loadSettings` · `fill('Round {n}', { n: 2 })`.

## Built

| Screen | Export | Link | What it's for |
|---|---|---|---|
| **Front end** | | | |
| Main menu | `MainMenu` | `?screen=menu` | Title + a big button per function you pass (first = primary) |
| Mode select | `ModeSelect` | `?screen=modes` | A card per mode, then Start |
| How to play | `HowToPlay` | `?screen=howto` | Pages to flip, with page dots |
| Credits | `Credits` | `?screen=credits` | People, then every asset from `content/credits.json` |
| Settings | `Settings` | `?screen=settings` | Tabs + rows from `content/ui/settings.json` — never hand-built |
| **In game** | | | |
| Pause | `Pause` | `?screen=pause` | Resume / settings / how to play / quit (asks first) |
| HUD frame | `Hud` | `?screen=hud` | Safe slots: vitals top-left, status top-centre, currency + pause top-right, actions bottom, banner centre |
| HUD pieces | `Bar` `Pips` `Counter` `Score` `TimerRing` `TurnBanner` `PlayerSeats` `Rank` `ConnectionDot` | `?screen=hud` | Health/xp/timer bars, +N counter, score + combo, timer ring, turn banner, seats with active player, place, connection |
| **Flow** | | | |
| Loading | `Loading` | `?screen=loading` | Bar (with `progress`) or spinner, plus a tip |
| Countdown | `Countdown` | `?screen=countdown` | 3-2-1-Go!, then `onDone` |
| Round intro | `RoundIntro` | `?screen=round` | "Round 2 of 5" |
| Results | `Results` (+ `rankPlayers`) | `?screen=results` | Scores best first, ties share a place, "You" badge |
| Victory | `Victory` | `?screen=victory` | Big win title, message, stats |
| Game over | `GameOver` | `?screen=gameover` | Try again or quit |
| Post-game | `PostGame` | `?screen=postgame` | Rematch / back to lobby / quit |
| Transitions | (built in) | any | Panels play the style's entrance when a screen opens; dialogs fade their dim |
| **Online** | | | |
| Lobby: join | `Lobby` (no `roomCode`) | `?screen=lobby` | Create a room or join by code |
| Lobby: room | `Lobby` (with `roomCode`) | `?screen=room` | Code, players, host badge, ready, Start |
| Reconnecting | `Reconnecting` | `?screen=reconnecting` · `?screen=failed` | Spinner dialog; `failed` → try again / quit |
| **Dialogs & feedback** | | | |
| Modal | `Modal` | (inside Confirm) | Any dialog: title, body, action buttons |
| Confirm | `Confirm` / `askConfirm()` | `?screen=confirm` | "Are you sure?" — destructive yes in danger colour |
| Reward popup | `RewardPopup` | `?screen=rewards` | A tile per reward, then Collect |
| Toasts | `toast()` + `ToastStack` | `?screen=feedback` | Short messages, top centre, max 3 |
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
