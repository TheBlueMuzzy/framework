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
- [x] 🤖 2. The starter takes the new AI module (install-module) and drops its workaround — starters/turn-based
- [x] 🤖 3. AI module VERSION + README note; ai tests + the starter's checks green — ai/kit/VERSION
Check: ai `npm test` + typecheck green; the type test fails on the old type; the starter's check:fast green.

## F155 🐞 Rooms local port
Done when: a game says which port its local room server uses (one place, read by both the room server's dev settings and the game page), the rooms module's client reads it instead of a fixed 1999, and the starter + another game can run online locally at the same time.
- [x] 🤖 1. Measure first: where 1999 is written today (rooms client, installer, templates, the starter, Glyphtender read-only) and what a game's dev server already knows — rooms/kit/roomClient.ts
- [ ] 🤖 2. The client reads the game's own port (default 1999 for games that set nothing — nothing changes for them); the installer writes it where the game's wrangler dev reads it too — rooms/scripts/install-rooms.mjs
- [ ] 🤖 3. The starter takes the new rooms module on its own port; its online e2e green; two local servers side by side proven — starters/turn-based
- [ ] 🤖 4. Rooms VERSION + README note (how a game picks its port) — rooms/kit/VERSION
Check: rooms `npm test` green; the starter's check:full green; the starter's room server and a second one on another port both answer at once.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Unattended (Muzzy 2026-10-26: "go with your picks"): one helper per feature. F153 touches ui-kit only; F154 ai + the starter's src/ai; F155 rooms + the starter's online parts — F154 and F155 both reinstall into the starter, so they merge one after the other.
- F154 — AI moments type fix (done, AI 0.8.2): `GamePlug.moments` is still a method, typed `ReturnType<MomentMap<Event>>`. When it was a plain `moments?: MomentMap<Event>` property, the starter's `makeBrain(plug)` broke: the brain takes `GamePlug<…, Event = unknown>`, and only a method is loose enough for a plug with its own Event to fit. ai/kit/plugMoments.test.ts guards both: red on the old type (2 tsc errors, kept in .scratch/framework-f154/red-old-type.txt — a hook won't commit a red typecheck), and it fails again if moments ever turns into a property. Installing into the starter needs `BMUZ_FRAMEWORK=<worktree>` from a worktree, or install-module reads the main checkout. The installer also added `ai:tune` to the starter's package.json, which it does by design when `ai:arena` is there. Checks: ai test 162/162 · starter check:fast + check:full ALL PASS (10) · root check:fast 22/22.
- F155 — Rooms local port, task 1 measured (2026-10-26, before any change). Where the local room port is written today:
  - rooms/kit/roomClient.ts: `LOCAL_PARTY_PORT = 1999`; `partyHost()` = VITE_PARTY_HOST, else `${location.hostname}:1999` (hostname = the page's own, so a phone reaches the PC)
  - rooms/scripts/install-rooms.mjs: `PARTY_PORT = 1999` → the wrangler.json it makes (`dev: { port: 1999, ip: '0.0.0.0' }`, only when the game has no wrangler file) + 3 printed steps say "port 1999"
  - rooms/templates/party/server.ts + worker.ts: header comments "(port 1999)"; rooms/README.md: 3 places (install, `.env` step, a Decision)
  - rooms/scripts/install-rooms.test.mjs: expects `dev.port 1999`; uses `VITE_PARTY_HOST=localhost:1999` as the bad .env example
  - saves (cloud 1998, board 1996) and crashes (1995) name 1999 in comments as "the rooms server's" — their own ports, untouched
  - the starter: wrangler.json `dev.port 1999` (installer-made), src/rooms/roomClient.ts (kit copy), party/server.ts + worker.ts comments, README "port 1999"; e2e/online.mjs starts its own `unstable_dev` on 6499 (arg) and sets `VITE_PARTY_HOST=127.0.0.1:6499` so the page finds it; check-all passes `e2e-shots 6403 6499`
  - Glyphtender (read only, rooms 0.7.0): wrangler.json `dev.port` **1997** — already NOT 1999. It never uses the kit's `partyHost()`: its own src/ui/online/session.ts imports wrangler.json and reads `dev.port`, with `VITE_PARTY_PORT` overriding the port for its e2e servers (1984–1995). So the kit's 1999 is dead code there; nothing in this feature changes Glyphtender until it opts in (it could then drop session.ts's own copy).
  - Goops: no wrangler.json, no src/rooms — not on the rooms module.
  - What a game's dev setup already knows: wrangler dev reads `dev.port` from wrangler.json; Vite reads vite.config.ts (+ modules' plugins: version, crashes, devkit) — nothing hands wrangler's port to the page. Glyphtender's own answer (read wrangler.json at build time) proves the one-place idea.
  - Design picked: wrangler.json `dev.port` stays the ONE place. A tiny rooms Vite plugin (`src/rooms/vitePlugin.mjs`, `roomsPort()`) reads it and bakes it into the page (`import.meta.env.PARTY_PORT`, like the version plugin's APP_VERSION); `partyHost()` uses it, else 1999. A game without the plugin, or without a dev.port, keeps 1999. The installer prints the vite.config line while it's missing, and gives an existing plain wrangler.json a `dev.port` (1999) when it has none (wrangler's own default would be 8787 — then page and server disagree), changing nothing else in the file.
- F154 — AI moments type fix merged 2026-10-26 7:25 PM (Claude): types.ts + the starter's plug/table read whole — no bugs; root check:fast 22/22 on the merge. Its find fixed in ~/.claude: scripts/lib.mjs FRAMEWORK = the framework copy the script runs inside (a helper's worktree) before the usual folder, so install-module into a worktree's starter takes that worktree's modules (test-scripts framework-around 2/2; all 340 script tests green).
