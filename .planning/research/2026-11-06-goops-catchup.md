# Goops framework catch-up — rehearsal report (2026-11-06, F194 — Goops catch-up rehearsal)

Throwaway copy: `C:\Users\Muzzy\Documents\dev\.scratch\goops-catchup` (local clone, its `origin` removed — nothing can be pushed).
Real repo: `games/goops` on `dev/m6-1-0` @ a334977 — **untouched** (git status + HEAD the same before and after).
Framework: `dev/v0-38-shared` @ 791ebba (sprint 61) — installs came from this working copy.

## Summary
- **Total time: ~1 h 50 min** (10:07 → 11:57), of which **~72 min is the two check:full runs** (35.7 min each). Hands-on work ≈ 45 min.
- **Hand fixes: 8** (things no installer or UPGRADES line told me to do) — listed below.
- **Framework got wrong: 9** — 3 real bugs (one of them a LOOK CHANGE players would see) + 6 missing or wrong lines in the docs. All sent to the main session as they turned up. None needed a framework edit to get past.
- **check:full before: ALL PASS 38/38. After: ALL PASS 38/38 (35.8 min), sw-update included.** check:framework (browser too): PASS 41, 3 warnings, 0 red.
- **A returning player keeps their rank:** proved twice — a unit test on the real beta save, and the sw-update e2e, where the real beta build writes the save and the new build reads it (rank 7 kept).

## Steps
| # | Step | Minutes | Result | Hand fixes |
|---|---|---|---|---|
| 1 | Clone + `npm ci` (9 s) | 1 | OK | 0 |
| 1 | Baseline check:full (untouched copy) | 36 | ALL PASS 38/38 · check:framework --static: PASS 16, 1 warning (4 sounds too quiet — Goops' own, unchanged) | 0 |
| 2 | Dev Kit 0.27.1 → 0.28.2 (installer 42 s) | 2 | check:fast green | 0 |
| 2 | UI kit 0.37.3 → 0.42.0 (installer 36 s) | 4 | check:fast green; **e2e credits FAILED 5/5 sizes** → fixed | 1 |
| 2 | Version 0.1.1 → 0.2.0 (14 s) | 1 | green; installer asked for a MainMenu wiring Goops doesn't need | 0 |
| 2 | Audio 0.5.0 (already current, 25 s) | 1 | only the stamp's framework commit changed | 0 |
| 3 | Saves 0.9.0 — new (28 s) + wiring | 9 | progress + first day on createSave; golden v1–v5 + first-day v1; 9 e2e areas green | 4 |
| 3 | Crashes 0.3.0 — new (31 s) + 7 wiring steps | 4 | check:framework crashes 4/4 (not live) | 0 |
| 3 | Lint 0.4.0 — new (21 s) | 1 | 38 finds, all warnings (35 "a setting in code", 3 "player words in code") | 0 |
| 4 | liveSetting ×3 (gooStyle, wallKick, readoutSetting) | 3 | green | 2 |
| 4 | Kit's UprightCard + useWrongWayUp for Goops' own card | 2 | e2e portrait PASS; screenshot identical to today's | 1 |
| 4 | startUpdates(registerSW, { worker: 'goops-sw.js' }) | 2 | e2e sw-update PASS | 0 |
| 5 | Crash server local + cost | 10 | see *Crash server cost* | 0 |
| 6 | check:framework (all modules) | 1 | **red** on a framework bug → fixed | (counted in step 4) |
| 6 | Final check:full | 36 | **ALL PASS 38/38** (35.8 min, sw-update PASS) | — |
| 6 | check:framework with browser checks | 2 | PASS 41 kept · 3 warnings (4 quiet sounds; lint still warnings; words with ~40% longer fake language — the baseline ran only --static, so unknown whether that one is new) | — |

## Hand fixes
1. **Credits list, back to the old scroll floor (TEMP)** — `src/ui/app.css` (last rule). Why: UI kit 0.38.0's new "two rows" floor counts the Credits block's *groups* as rows (framework bug A), so the whole card scrolled and the list ran into the card's bottom edge. One scoped CSS line (`.kit-panel > .kit-scroll[aria-label="Credits"]`). Remove once the kit is fixed. Costs one more check:ui warning ("restyles a kit part": 7 → 8).
2. **Golden saves into the module's format** — `tests/saves/goops-progress-v1…v5.json` + `-v4-focus4.json`. Why: Goops already had golden saves under the module's file names, but as the bare save; the module wants `{ about, stored, expect }` (framework doc gap F). Wrapped each one, added `expect` (XP, quota, name, careers).
3. **Goops' own save tests read the new format** — `tests/progress.test.ts` (golden helper + 3 "what was written" checks now read the record `{ save, version, data }`). Why: what's stored changed shape (doc gap E).
4. **14 e2e reads unwrapped** — `e2e/day, ending, first-day, payslip, rank-lock, rank-select, shift-smoke, sw-update, upgrades, your-name.mjs`. Why: they read `localStorage['goops-progress']` straight (and check `.v === 5`); now they read `record.data` with `v: record.version` (doc gap E). Old-format seeds still work untouched (oldSave adopts them).
5. **A save with nonsense XP is still "broken"** — `src/progress/save.ts` `oldSave`. Why: the module fills a wrong-type field with its default *before* the game's `clean` sees it, so `{ v: 1, totalXp: "lots" }` loaded as rank 0 with the rank unlocked instead of a fresh start (doc gap G). The check moved into oldSave.
6. **Tests' "as if Settings changed" hooks** — `src/game/ShiftStage.tsx` dev hook. Why: the kit's liveSetting has no setter; 6 e2e calls use `window.__goops.gooStyle.setFromSetting('Particle')` and hud-shots uses `setReadout(…)`. Both now tell the change the way the Settings screen does (`tellSettingsChanged`) — e2e scripts unchanged (doc gap H).
7. **The card's words** — `src/ui/App.tsx`: `words={{ upright: text.upright.title, uprightMessage: text.upright.message }}`. Why: UPGRADES says Goops' text keys are `upright` / `uprightMessage`; Goops' en.json has `title` / `message` (doc gap I). `text.upright.label` is now unused.
8. **Live setting mappers read `values.<row>`** — `src/game/gooStyle.ts`, `src/game/wallKick.ts`. Why: with UPGRADES' own one-liner `(v) => v.gooStyle …` the UI kit's check "every Settings row is read by the game" goes red (framework bug B).

Plain wiring the installers asked for (not counted): saves (createSave ×2, SAVES list, `setSavesConfig`, `storageAllowed` for the Dev Kit's frame-rate switch `src/game/fpsMeter.ts`) · crashes (2 packages, 3 scripts, .gitignore, `crashesMaps()`, `startCrashes`, the Privacy → Send crash reports rows on Settings → About, `applyCrashSetting` ×2, `crashRootOptions()`) · Goops' own `src/ui/Upright.tsx` deleted, `src/ui/portrait.ts` keeps only the screen lock (the kit locks only inside its own full screen, which Goops doesn't use).

## Framework got wrong
**Status (main, 2026-11-06): all 9 FIXED on dev/v0-38-shared during the run** — A: 9800344 (real-browser test, screenshot checked) · B: 478e954 · C: 615ab4a · crashes maps line: d7b9c1e · saves record shape + nonsense values in oldSave: 4c8992e · old golden files: README 4c8992e + installer warning b4fd373 · UI kit live-setting setter + card words: d32424c. So in Goops' real sprint the TEMP Credits CSS (hand fix 1) and the `values` rename aren't needed.

**Bugs**
- **A. UI kit 0.38.0: the Credits screen scrolls as a whole card, its list touching the card's bottom edge** (LOOK CHANGE players see) — `ui-kit/kit/controls/ScrollArea.tsx` `measureContents` → `--kit-scroll-rows`. The kit's own `Credits` (`kit/blocks/frontend.tsx`) puts one Stack of *groups* in its ScrollArea (people, then every asset); "two rows" = people + the whole asset list ≈ 1,022 px, so the list can't shrink. Any game whose Credits has people lines (Glyphtender too). Fix: descend into a Stack whose children are Stacks (rows = the lines), or cap the floor (e.g. never more than half the card); add a kit e2e of Credits with 20 assets at 390×844.
- **B. UI kit 0.42.0: its own check fails its own recommended swap** — the ui conformance "every Settings row that's switched on is read by the game" only sees `values.<id>`; `liveSetting(settings, (v) => v.gooStyle …)` (the UPGRADES/README line) → "Goo style: nothing in the game reads it". Fix: accept a liveSetting mapper's reads whatever its parameter is called (or write the one-liner with `values`). Note check:full doesn't run check:framework, so nothing but the conformance pack catches this.
- **C. Version installer asks for wiring the game already has** — `version/scripts/install-version.mjs:73` prints "Still to wire: `<MainMenu version={versionLabel}>`" for Goops, whose main menu is its own (Console.tsx); check:framework's version row already accepts that ("the game's own spots: main-menu in src/ui/Console.tsx" ✓). Fix: the installer uses the same rule as the conformance check.

**Docs**
- **D. Crashes installer step 4 is out of date** — `crashes/scripts/install-crashes.mjs` says "every build makes hidden source maps and moves them to releases/<version>/maps/ — commit that folder"; since 0.3.0 only the release build does. Fix: copy the README's 0.3.0 wording.
- **E. Saves: nothing says the stored shape changes** — after the switch `goops-progress` holds `{ save, version, savedAt, data }`, not the game's object. Any e2e or tool reading the key directly breaks (Goops: 14 reads in 10 scripts). Fix: a README "Hooking it up" line + a saves e2e helper `readSave(page, key)` that returns the data.
- **F. Saves installer: a game's own golden files in the old shape** — the starter test's glob picks up any `<key>-vN.json`; Goops had 6 bare ones, read as `{ stored: undefined }`. Fix: the installer warns ("tests/saves/goops-progress-v1.json isn't { about, stored, expect } — wrap it") or the README says so.
- **G. Saves: `clean` sees data after the defaults are filled in** — a wrong-type field is already its default, so `clean` can't call the save broken. Fix: say it in the `clean` / `oldSave` docs ("validate an old save's types in oldSave; return null to call it damaged").
- **H. UI kit UPGRADES 0.42.0: liveSetting has no setter** — a game's tests or dev hooks that called the hand-made `setFromSetting` need `tellSettingsChanged({ ...loadSettings(json), row: value })`. Fix: one more clause on the 0.42.0 line.
- **I. UI kit UPGRADES 0.42.0: "the game's text keys are upright, uprightMessage…"** — not true for Goops (en.json `upright.title` / `upright.message` / `upright.label`). Fix: "map yours: `words={{ upright: text.upright.title, uprightMessage: text.upright.message }}`".

**Also seen (not the framework's fault)**
- `npm ci` / `npm install` warn "install-scripts not covered by allowScripts" for esbuild and workerd (this PC's newer npm). Both still worked — wrangler dev ran.
- 4 of Goops' sounds are 3–7 dB too quiet (audio check warning) — before and after, unchanged.

## Crash server cost
Run: the copy's own `crashes/worker.ts` under `wrangler dev` on 6520 (`--persist-to` a folder in the copy, deleted after), plus a measuring copy on 6521 that reads Cloudflare's own row counters (`cursor.rowsRead / rowsWritten`) per request. The game (vite on 6510, `client.url` + `sendInDev` set for the run, then put back) broke 3 ways in a real browser → 3 reports sent on page close → all stored → `npm run crashes` read them back with file, version, device. **Nothing deployed, no login.**

| Per report | Measured | Free plan limit (Cloudflare) |
|---|---|---|
| CPU | **0.13–0.18 ms** (Node, the server's same rules + SQLite, 2,000–3,000 reports; small and full-size 2.5 KB reports) | 10 ms per request |
| Rows written — a kept report (first 20 a day of a kind) | **4** | 100,000 a day |
| Rows written — counted only (past 20 a day of a kind) | **2** | |
| Rows written — dropped (one address past 30 an hour) | **0** (nothing read either) | |
| Rows read | 0–2 | 5,000,000 a day |
| Storage | ~8 KB per ~20 kept reports (SQLite pages) | 5 GB |
| Requests | 1 | 100,000 a day (shared with online play), 1,000 a minute |

- At the game's own cap (15,000 stored a day): ≤ 60,000 rows written — under the 100,000 a day.
- CPU is ~1/60 of the limit. (Inside workerd the clock stands still while code runs, so CPU can't be timed there; Node runs the same code — this matches the README's ~0.15 ms.)
- Past a daily free limit, that kind of operation fails until 00:00 UTC — the crash server would stop storing; the game never notices (it doesn't wait for an answer).
- Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits) · [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

## Saves: how a returning player's rank survives
- Today's live beta stores `goops-progress` as the bare object `{ v: 5, totalXp, scrapsSpent, owned, equipped, badge, quotaMet, xpHeld, name, careers }`.
- The new `progressSave` (createSave, **version 5**, same key) has `oldSave`: a bare object with a whole-number `v` (and XP/scraps that are counts) → `{ version: v, data }`; the module then runs the same 4 upgrade steps Goops had (v1→v2 … v4→v5, unchanged), fills anything missing, and the first save writes it as a record with 2 backups.
- **The test:** `tests/progress.test.ts` "golden version-5 save loads as it was" — the beta-format save (46,250 XP, meter held full) loads → rank 9, locked, name "Muzzy"; saved again → a record `{ save: 'goops-progress', version: 5, data }`; loaded again → still rank 9. Plus `tests/saves/saves.test.ts` (the module's checks): every golden v1–v5 loads with its `expect` values, round trip, damaged copies fall back to the backup, full/blocked storage keeps the game running.
- **And for real:** e2e `sw-update` — the real beta build at /GOOPS/alpha/ plays to rank 7 and writes its save; the new build takes over → "the same rank (7) — the save came along", on a fast and a slow network.
- Also moved: the first day's checkpoint (`goops-first-day`, version 1, golden `goops-first-day-v1.json`). Left on the browser directly, listed in content/saves.json `storageAllowed`: the Dev Kit's frame-rate switch.

## For Goops' real sprint — ordered task list
Do it on Goops' work branch, after F194's framework fixes (A, B, C at least) are in — then hand fixes 1 and 8 aren't needed.
1. Dev Kit → 0.28.2 (`install-module.mjs devkit`), check:fast. ~2 min.
2. UI kit → 0.42.0, then e2e credits + a look at Settings → About → Credits on a phone (LOOK CHANGE). ~5 min.
3. Version → 0.2.0 (ignore the MainMenu line if C isn't fixed). ~1 min.
4. Audio: nothing (0.5.0). Optional: `npm run audio:check -- --fix` for the 4 quiet sounds + a listen (Muzzy's ears).
5. Saves → 0.9.0: copy `src/progress/save.ts`, `src/game/lessons/firstDay.ts`, `tests/saves/*`, `tests/progress.test.ts`, `content/saves.json`, the `setSavesConfig` lines and the 10 e2e edits from the rehearsal copy (commit bce2fc4). Run unit tests + e2e day, shift-smoke, rank-select, your-name, payslip, sw-update. ~10 min. **Risk: a player's rank** — the golden saves + sw-update are the proof; don't skip them.
6. Crashes → 0.3.0 + wiring (commit 354417b: packages, scripts, .gitignore, vite.config, main.tsx, App.tsx, the Settings → About rows). Not live. ~5 min. Going live is Muzzy's call (token, `crashes:deploy`, client.url, a privacy line) — ~30 min with him.
7. Lint → 0.4.0. 38 finds as warnings; clearing them (most are particle-goo constants: `// tuning-ok` or content/) is its own task, later.
8. liveSetting ×3 (commits 00f2c41 + 41fcfdc), the UprightCard (ef18e8b), startUpdates (4bd21d7). ~5 min.
9. check:framework (all) + check:full (~36 min) + Muzzy looks at Credits and the "turn your phone" card on a real phone.
- Total ≈ 1 h 15 min of work + 2 full checks. Muzzy's part: one look at Credits, optional sound listen, the crash server go-live.
