# Glyphtender catch-up rehearsal — report (2026-11-06, F195)

Throwaway copy: `C:\Users\Muzzy\Documents\dev\.scratch\glyphtender-catchup` (a local clone, never pushed — 13 commits on top).
Real repo: `games/glyphtender` on `dev/v0-19-maintenance` @ 5659b8c — **not touched** (its git status is the same before and after, its release .map files included).
Framework: `dev/v0-38-shared` @ 5b01a82.

## Summary
- **Total time: 10:07 → 11:27 = 80 min**, and 56 of those were check:full runs (two full runs, 22.5 + 21.2 min, plus re-runs).
- The actual update work (every module, the Saves step, the sprint 60 swaps) took **~23 min**.
- **Hand fixes: 2 small ones, 0 code fixes** (put back a release map a check build had overwritten · copied today's `scripts/ports.mjs`).
- **Framework got wrong: 5 things.** All were small, none broke the game, and each was sent to main as it was found.
- **Final check:full: green.** The first run was 38/40. `online-ai` and `trails` failed under load, then passed alone, and `online-ai` passed again with both other online checks running beside it.
- **Compared with 2026-10-29** (the same game, on framework v0.33):
  | | 2026-10-29 | 2026-11-06 |
  |---|---|---|
  | Total time | about a day of work, ~2.5 hrs of it checks | 80 min (56 of it checks) |
  | Hand fixes | 9, plus 4 "TEMP" unblocks | 2, none of them in code |
  | Framework problems | 23 | 5, all small |
  | Modules behind | 6, by many versions (ui-kit 0.20 → 0.38) | 6, by 1–3 versions each |
  | Modules new to the game | 4 (lint, version, saves, crashes) | 0 |
  - The game had done its own catch-up sprints since then (F92–F104), so this rehearsal tested the **routine update** path. The last one tested the big jump.
  - Every module now ships an UPGRADES.md, and install-module printed the right hand steps each time.

## Steps
| Step | Minutes | Result | Hand fixes |
|---|---|---|---|
| Clone + `npm ci` | 1 | OK (11 s) | 0 |
| 7. check:full before any change | 22.5 | **ALL PASS 40/40**, no flakes | 0 |
| devkit 0.28.2 (d00f05e → 5b01a82) | 1 | Version stamp only. The 2 files it calls "changed" differ only in line endings | 0 |
| ui-kit 0.39.0 → 0.42.0 | 1.5 | tsc clean · UI rules pass (the same 8 old warnings) · its lint and code checks pass | 0 |
| version 0.1.3 → 0.2.0 | 0.5 | Installed. It printed one false "still to wire" step (Framework got wrong #2). Its hand step is done in task 10 | 0 |
| rooms 0.14.0 → 0.15.0 | 3 | party tests 66/66 · server run locally (`wrangler dev --port 6650 --persist-to .wrangler/state-rehearsal`) → `/health` answered `{"ok":true}`, then stopped. Nothing deployed | 0 |
| ai 0.8.3 → 0.9.0 | 2 | Banter files removed, `ai:tune` script added · AI tests 82/82 · tsc clean | 0 |
| crashes 0.2.2 → 0.3.0 | 2 | Builds now keep their maps in `node_modules/.cache/crashes-maps/` → after a build, git status stays clean | 1 (put back a release map) |
| saves 0.7.0 → 0.9.0 | 1.5 | 13 files removed (the slimmed parts — Glyphtender used none) · golden saves 23/23 | 0 |
| audio, lint, table | 1.5 | Already current (stamps only) · lint: 0 finds | 0 |
| `scripts/ports.mjs` → today's template | 2 | Took F177's knock lookup (`answeringPorts`, `holders`) · `heldPorts` unchanged | 1 (nothing prints this step) |
| 9. Saves 0.9.0 hand step | 1 | Nothing to hand in (no save keeps moves). Copied the starter's pass-through shape · 23/23 | 0 |
| 10. Sprint 60 parts | 6 | liveSetting · the kit's full screen · startUpdates — proof below | 0 |
| 11. check:full | 21.2 + 3.8 + 6.2 | 38/40, then the 2 failures passed alone · online ×3 together PASS | 0 |

## Hand fixes
1. **Put back a release map that a check build had overwritten.**
   - Old check builds (crashes 0.2.2) write maps into the released version's folder.
   - The baseline run changed the tracked file `releases/0.14.1.0/maps/assets/aiCheck.worker-DsyTDS4V.js.map` and added 4 loose ones.
   - **The real repo has exactly this state today.**
   - UPGRADES only says to delete the untracked maps. The changed tracked one also has to be put back from git.
2. **Copied `~/.claude/config/bmuz/templates/ports.mjs` over `scripts/ports.mjs`.**
   - The game's copy was older than F177 (it reads netstat only).
   - No installer and no check says so: check-all only checks that the file exists.

## Framework got wrong
1. **saves/UPGRADES.md 0.9.0 said "e.g. Glyphtender's run" keeps moves.**
   - It doesn't: Glyphtender has no `createRun`, so a game in progress isn't kept on the device.
   - Its 6 golden saves are new-game, online-options, tutorial and wordsToSend, and none hold moves. (The F93 run proof was only ever on a scratch copy.)
   - The sprint brief carried the same mistake.
   - **Already fixed by main during the run.** The line now says Glyphtender's and Goops' saves hold none.
2. **The version installer prints a false "Still to wire: `<Settings version={versionLabel}>`".**
   - Where: `version/scripts/install-version.mjs:49`, the `gameCode` filter.
   - It skips a hand-written list of module folders, but not `src/crashes/` or `src/lint/`. So it read the words "`<Settings onChange>`" inside `src/crashes/conformance.mjs` as a Settings with no version.
   - Glyphtender already passes the version (`shownVersion(versionLabel)`).
   - Fix: build the skip list from every module's folders (`moduleFolders`) instead of a list kept by hand. Add a test with a crashes copy in the game.
3. **The crashes installer always prints "Try it" and all 4 "Going live" steps.**
   - Where: `crashes/scripts/install-crashes.mjs` ~109–128.
   - It prints them even when `content/crashes.json` `client.url` is already the live https server, as it is in Glyphtender.
   - It also says local port 1995, while the game's `crashes/wrangler.json` uses 1996.
   - Fix: mark going live as done when client.url is an https address, and read the port from `crashes/wrangler.json`.
4. **ui-kit 0.42.0 `startFullscreen()` with no `load` loses the "on for phones" default.**
   - Where: `ui-kit/kit/blocks/fullscreen.ts`.
   - When `load` is left out, it reads the raw settings slot with no row defaults.
   - So a phone that never opened Settings gets `fullscreen` undefined → full screen never starts on the first tap.
   - The header comment says leaving `load` out is fine.
   - Glyphtender's copy passes `{ load: () => loadSettings(settings) }`, so it's safe.
   - Fix: `startFullscreen` takes the schema (or `load` becomes required), plus a test: "phone, nothing saved, first tap goes full screen".
5. **crashes/UPGRADES.md 0.3.0 says only "delete untracked releases/\*/maps".** It should add: "and put back any tracked map a check build changed (`git status releases`, then `git restore`)" — see Hand fix 1.

Also seen (cosmetic, already noted on 2026-10-29):
- The Dev Kit installer lists `ColorTab.tsx` and `uiKit.ts` as "changed" when only their line endings differ.
- `npm ci` warns that `workerd`'s install script wasn't approved. `wrangler dev` still worked.
- Dev Kit 0.28.2's AI tab still has its banter editor (`src/devkit/ai/aiLogic.ts` banterOf, `AiTab.tsx`), and rooms still ships `server/emotes.ts`. F186 archived banter and emotes from the AI kit and the UI kit, but left these. Harmless (devkit-ai e2e PASS); a candidate for the next slimming.

## Saves replay: how it was wired
- **What Glyphtender saves:** `newGameSave`, `onlineOptionsSave`, `tutorialSave`, `wordQueueSave`.
  - All 4 are settings-like. None keeps a move list.
  - No game is kept on the device: online matches live on the room server (rooms module storage), and pass-and-play isn't saved.
- **So the BREAKING step needs nothing from Glyphtender today.** All 23 golden-save tests passed straight after saves 0.9.0, with no replay handed in.
- **Done anyway, so a future run save is covered** — `tests/saves/saves.test.ts` now has the starter's shape:
  - RUNS' example line shows `replay: (data) => replay(rules, data.record)`.
  - `RUNS.map(({ run, sample, replay }) => ({ save: run.save, sample, replay }))`
  - `for (const { save, sample, replay } of everySave)` → `checkGoldenSave(save, copy, replay)`
  - The header line about replays.
- **Result:** golden saves 23/23 · tsc and lint clean.

## Sprint 60 parts (task 10) — what changed and the proof
- **Live setting:**
  - `src/ui/gameSettings.ts`: `export const gameSettings = liveSetting(settings, fromSettings)`. The zustand `useGameSettings` and its `setState` in `settingsChanged` are gone.
  - `GameScreen` uses `useLiveSetting(gameSettings).trayFlipped`.
  - `localBot` uses `gameSettings.get().aiSpeed`.
  - Its test now sends changes the way the kit's Settings does (`tellSettingsChanged`).
- **Full screen:**
  - `src/ui/fullscreen.ts` and its test are deleted. The main menu button now uses the kit's `canFullscreen`, `isInstalled`, `setFullscreen` and `useFullscreen`.
  - `<Settings>` no longer passes `hide={hiddenFullscreenRows()}` or `key={resaved}`, and `settingsChanged` no longer calls `fullscreenSetting`. The kit does all three now.
  - `main.tsx`: `startFullscreen({ load: () => loadSettings(settings) })` — the `load` matters (Framework got wrong #4).
  - `content/saves.json` `storageAllowed` is now `[]`. The one file allowed to touch storage directly is gone.
  - The portrait lock still works: the kit reads style.json `"orientation": "portrait"`.
- **Updates:** `registerSW({ immediate: true })` → `startUpdates(registerSW)` (vite-plugin-pwa is already ^1.3.0).
- **Proof:**
  - `e2e:fullscreen` PASS (all phone and computer checks).
  - A scratch probe counted the browser's full-screen asks per Settings flip: **2 before the swap (ui-kit 0.42 + the game's own code), 1 after.**
  - `e2e/sw-update.mjs` PASS: a returning player gets the new build on the first visit.
  - No `releases/*.99` folder is left behind any more.
  - Unit tests and tsc clean.
- **Not done (optional):** the kit's `UprightCard` (Glyphtender chose "do nothing for browsers", F97), and `checkUpdateArrives` in sw-update.mjs (it would add the "first visit never reloads" check).

## Things to watch
- **online-ai stalled once under full load** ("the game didn't move for 180 s, stuck at step 13").
  - It then passed alone (184 s) and again beside online and online4 (183 s).
  - The baseline run didn't hit it.
  - Probably load timing, like B032. It could also be rooms 0.15.0's new message order meeting an AI turn. If it happens again in the real sprint, keep the server log.
- **trails:** `page.goto` timed out under load (the Goops rehearsal ran at the same time). It passed alone.

## For Glyphtender's real sprint — the ordered task list
Expected size: ~1 session, low risk. Every step below has been done once on the copy.

1. 🤖 Clean the stray crash maps first (Muzzy's OK — they're the dirty files in the repo today):
   - `git status releases`
   - delete the untracked `releases/0.14.1.0/maps/*` files a check left
   - `git restore` the changed `aiCheck.worker-DsyTDS4V.js.map`
2. 🤖 Dev Kit first: `install-module.mjs devkit .` (stamp only).
3. 🤖 `ui-kit`, `version`, `rooms`, `ai`, `crashes`, `saves` with install-module, one commit each.
   - Then `audio`, `lint`, `table` (stamps only).
   - Ignore version's "Settings version" step and crashes' "going live" steps: both are already done.
4. 🤖 `scripts/ports.mjs` ← `~/.claude/config/bmuz/templates/ports.mjs`.
5. 🤖 `tests/saves/saves.test.ts`: the replay pass-through (3 lines + 2 comments) → golden saves 23/23.
6. 🤖 The sprint 60 swaps as above:
   - gameSettings → liveSetting (+ GameScreen, localBot, its test)
   - delete src/ui/fullscreen.ts + test, use the kit's
   - drop `hide`, `key` and `fullscreenSetting` from Settings
   - `storageAllowed: []`
   - `startUpdates(registerSW)`
7. 🤖 STATE.md: drop the /deliver step "NODE_ENV=production VITE_PARTY_HOST=… npm run build + commit maps" and the "/save before any local build" warning. release.mjs does this now (crashes 0.3.0).
8. 🤖 Optional, cleanup: nothing reads `content/ai/banter.json` by its file name any more (banter was archived) — delete it, or leave it.
9. 🤖 check:full green (re-run any single load flake alone).
10. 🙋 **Muzzy: redeploy the room server** — rooms 0.15.0 is a server change, and a front-end release does NOT update it.
    - `npx wrangler login` (once on this machine)
    - then `npm run party:deploy`
    - → wss://glyphtender.joebrogno.workers.dev
    - Do it in the same /deliver as the front end (rooms UPGRADES: "Deploy the server with the client").
    - Proven here only on a local server (`/health`, plus the 3 online e2e through wrangler dev). The live deploy is Muzzy's step.
11. 🙋 Muzzy: a quick phone check —
    - the first tap goes full screen
    - Settings → Full screen off stays off
    - Tray position flips the game at once
