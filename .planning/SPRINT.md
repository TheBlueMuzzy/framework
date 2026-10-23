# Sprint 28 — Games take the AI: a tappable seat row, and module Settings rows that plug themselves in
Started 2026-10-23 · Milestone v0.11 Games take the AI · Features: F109, F110
Muzzy 2026-10-23: "a go" to option a (a small "games take the AI" sprint: the tappable seat row + module Settings rows). Auto mode as in sprints 26–27: one helper per feature, commit per task, save per feature, each feature waits for his OK; nothing released. Helpers commit or send a one-line status at least every 45 min.
What changes: games can show every player's portrait as a tappable button for emotes/mute with one kit part; adding a module's Settings switch needs no UI kit change. What stays the same: every game until its own session installs the update; the Settings rows' look and words.

## F109 🔧 Tappable seat row
Done when: a game passes its seats to the UI kit's PlayerSeats and gets one tappable portrait per seat — tapping yours opens the emote picker, a rival's opens Mute — with the muted mark on a muted rival's chip, in all 5 styles and every size; the emotes module's `<EmoteSeats>` does the wiring in one line; the scratch Glyphtender drops its hand-built SeatEmotes.tsx for it.
- [x] 🤖 1. PlayerSeats: optional `onSeatTap(seat)` makes each seat a real button (keyboard + screen reader name "Ada — send an emote" / "Bo — mute"), optional per-seat `badge` and `seatProps`; unchanged when not passed — ui-kit/kit/blocks/hud.tsx
- [x] 🤖 2. `<EmoteSeats seats mine emotes nameFor>` in the emotes module: PlayerSeats + emoteSeatProps + the picker / Mute menu + MutedMark, one line in a game — emotes/kit/ui/EmoteLayer.tsx
- [x] 🤖 3. Gallery page (?screen=emotes) shows the seat row in all 5 styles; README, catalog, versions, installer wiring hint — ui-kit/kit/VERSION
- [ ] 🤖 4. Proof on a scratch Glyphtender copy: replace SeatEmotes.tsx with `<EmoteSeats>` — tap yours → picker → bubble, tap a rival → Mute → muted mark; screenshots at every size looked at — emotes/kit/emotes.test.ts
Check: ui-kit + emotes tests, typecheck, lint, check-ui green (root check:fast); the seat buttons reachable by keyboard and named for screen readers; shots at 390x844, 360x780, 844x390, 768x343, 1100, 1440x900, 1920x1080 looked at by me.

## F110 🔧 Module Settings rows register themselves
Done when: each module that adds a Settings row (crashes, emotes, ai) ships one small manifest naming its row ids and what in a game's code counts as "read"; the UI kit's Settings check reads every installed manifest instead of its own hard-coded lists (CRASH_ROWS / EMOTE_ROWS / BANTER_ROWS gone); older games with older module copies still pass; a new module with a row needs no UI kit change.
- [ ] 🤖 1. The manifest shape + each module's own (crashes, emotes, ai), installed with the module — ui-kit/kit/conformance.mjs
- [ ] 🤖 2. The Settings check reads the installed manifests (src/*/kit/…) and drops its hard-coded lists; older module copies without a manifest still pass (the old lists kept as a fallback for one release, said so) — ui-kit/kit/conformance.mjs
- [ ] 🤖 3. Tests: a made-up module with a row passes with its manifest and no UI kit change; a row shown but never read still fails; an old copy without a manifest passes; README + MODULE-CONTRACTS line — ui-kit/kit/conformance.test.mjs
- [ ] 🤖 4. Proof: check:framework on the scratch Glyphtender (crashes off, emotes + ai on) and on Goops' last checkout read-only (a fresh clone in .scratch) — the same results as before the change — ui-kit/kit/VERSION
Check: ui-kit + crashes + emotes + ai tests, typecheck, lint green (root check:fast); check:framework results identical before / after on two real games (scratch clones), read by me.

Notes:
