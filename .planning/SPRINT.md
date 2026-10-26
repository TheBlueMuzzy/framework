# Sprint 43 — Fix what the starter showed
Started 2026-10-26 · Milestone v0.25 What the starter showed · Features: F153, F154, F155
Muzzy 2026-10-26: "go with your picks" — this sprint, unattended with helpers.
What changes: the page check flags light in-game words with nothing dark behind them; the AI module's moments type matches its README; the rooms module's local port comes from the game. The starter takes all three and the framework's checks prove it. What stays the same: every game until it updates, how everything looks.

## F153 🔧 Light-words contrast check
Done when: the UI kit's page check (uiProblems) flags HUD on-game words whose letters sit over a plain light background (too little contrast with the on-game colour, ignoring the words' own halo), the test for it fails on the old check, and the gallery's + the starter's shots have no such problem left (each real find fixed or accepted with a reason in Notes).
- [ ] 🤖 1. Measure first: run a draft of the check over today's gallery (every look, both phones) and the starter; list every find by screen + look in Notes before changing anything — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 2. The check: a new kind in uiProblems, with a test that fails on the old check (kit fonts only) — ui-kit/kit/uiProblems.test.mjs
- [ ] 🤖 3. Fix or accept each find (a demo HUD with nothing behind it gets the gallery's own game picture or table colour, never a kit colour change); `npm run shoot` + `npm run shoot:webkit` 0 problems; UI kit VERSION + README note — ui-kit/kit/VERSION
Check: the new test red on the old check, then green; both shoots 0 problems; the starter's `npm run check:full` green with the new kit.

## F154 🐞 AI moments type fix
Done when: `GamePlug.moments` accepts what botBanter's MomentMap and the AI README already allow (`{ moment, by }`), with a type test, and the starter uses it directly (its separate `moments` export gone).
- [x] 🤖 1. Widen the type to match MomentMap and the README; a type test that fails on the old type — ai/kit/types.ts
- [ ] 🤖 2. The starter takes the new AI module (install-module) and drops its workaround — starters/turn-based
- [ ] 🤖 3. AI module VERSION + README note; ai tests + the starter's checks green — ai/kit/VERSION
Check: ai `npm test` + typecheck green; the type test fails on the old type; the starter's check:fast green.

## F155 🐞 Rooms local port
Done when: a game says which port its local room server uses (one place, read by both the room server's dev settings and the game page), the rooms module's client reads it instead of a fixed 1999, and the starter + another game can run online locally at the same time.
- [ ] 🤖 1. Measure first: where 1999 is written today (rooms client, installer, templates, the starter, Glyphtender read-only) and what a game's dev server already knows — rooms/kit/roomClient.ts
- [ ] 🤖 2. The client reads the game's own port (default 1999 for games that set nothing — nothing changes for them); the installer writes it where the game's wrangler dev reads it too — rooms/scripts/install-rooms.mjs
- [ ] 🤖 3. The starter takes the new rooms module on its own port; its online e2e green; two local servers side by side proven — starters/turn-based
- [ ] 🤖 4. Rooms VERSION + README note (how a game picks its port) — rooms/kit/VERSION
Check: rooms `npm test` green; the starter's check:full green; the starter's room server and a second one on another port both answer at once.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Unattended (Muzzy 2026-10-26: "go with your picks"): one helper per feature. F153 touches ui-kit only; F154 ai + the starter's src/ai; F155 rooms + the starter's online parts — F154 and F155 both reinstall into the starter, so they merge one after the other.
