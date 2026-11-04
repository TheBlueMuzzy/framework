# Audit 2026-11 — framework (F183 — Framework inventory + verdicts)

Measured 2026-11-04, 01:00–01:40, on framework commit `1be6e77` (branch dev/v0-37-audit), first-hand from the files and
git — not from the docs. **Every verdict below is PROPOSED — Muzzy approves.** Nothing was changed or committed;
the only thing written outside this file is the scratch test game in `dev/.scratch/framework-ipe-test/`.

Words used here:
- **Brick** = a module (a folder a game copies in, e.g. `ui-kit/`).
- **Copy** = the module's files as they sit inside a game (`src/ui/kit/` etc.), with a `VERSION` stamp.
- **In the bundle** = the code that actually ends up in the game a player downloads (or in the room server),
  after the build throws away everything the game never calls ("tree-shaking").
- **Inner-platform effect** = a framework so big and flexible that making a game in it is harder than just
  writing the game.

---

## 1. Summary

- **The framework is ~46k lines of code + ~29k lines of tests** (11 bricks + scripts). The "~116k" figure also counts
  the turn-based starter, and **94% of the starter (39.7k of 42.3k code lines) is copies of the 11 bricks** — the same
  code stored twice in git. Its own game code is only 2.6k lines.
- **Only two real games use it today: Glyphtender (10 bricks) and Goops (4 bricks).** Roll Better has 2 bricks from
  early October (UI kit 0.2.2 vs today's 0.39.0). Escape Pod Scramble, Windchime and DoomDial use none.
- **By the founding rule ("one game proves it, a second makes it general"), only 4 bricks pass: UI kit, Dev Kit,
  Audio, Version** (both games). Table, Rooms, AI, Saves, Crashes and Lint have one game. **Emotes has none** —
  only the starter uses it (Glyphtender lists AI emotes as a low-priority "could").
- **Saves was built from a research list, not a game.** Glyphtender calls only the core (create a save, storage,
  the golden-save checks). Leaderboards, link-code cloud copies, seed + move replays and the any-platform storage
  (~3.8k lines with tests) are used by no game.
- **Churn is very high:** UI kit had 114 version bumps in 37 days (~3 a day), Dev Kit 57. Glyphtender jumped UI kit
  0.20.1 → 0.38.0 in one go. 60% of all 1,580 framework commits (951) touch `.planning/` files.
- **Inner-platform test: it passed — fast.** Turning the tic-tac-toe starter into Nim (take 1–3 sticks) took
  **~7.5 minutes, 15 files, +168 / −252 lines, ~10 framework ideas to know**, and all 10 checks went green on the
  second full run. The checks caught 2 real mistakes (a number typed into code; unreadable text on the table). A plain
  React + Vite Nim vs the computer would be ~5 files, ~250 lines, ~20 minutes — but with no online play, saves,
  Dev Kit or checks.
- **The README is badly out of date:** it lists 7 of the 11 bricks, its version numbers are 1–29 minor versions old,
  and it says the UI kit has 5 styles (it has 7).
- **Biggest safe cut: stop committing the starter's brick copies** (−39.7k lines, nothing lost — `starter-check.mjs`
  already re-installs fresh copies before every check). Then: archive Emotes, slim Saves, archive the extraction queue.

---

## 2. Bricks (modules)

Lines = tracked files only (`git ls-files`), counted with `wc -l`. "Source" = `.ts .tsx .mjs .js .css .html` outside
test files (kit + scripts + templates + Vite plugin). "Tests" = `*.test.*`, `tests/`, `e2e/`. Lockfiles, docs, JSON and
binaries are not in these numbers. "In bundle" = share of the copy's source lines that end up in Glyphtender's (G) or
Goops' (O) build — an upper bound (see §8); build-time tools like `conformance.mjs` never go in a bundle by design.

| Brick | Source / tests | Proven by (first real game) | Used by today (game @ copy · framework is at) | In bundle | Verdict (PROPOSED) | Reason |
|---|---|---|---|---|---|---|
| `ui-kit` | 11,613 / 7,400 | Built first (5 styles, F01–F02), then fitted to Roll Better (v0.2), grown in Glyphtender + Goops | Glyphtender @0.39.0 · Goops @0.37.3 · Roll Better @0.2.2 · framework 0.39.0 | G 78% · O 76% | **keep + slim** | 2 games use most of it; trim the parts no game uses (below) |
| `devkit` | 13,902 / 6,375 | Built first (F08), fitted to Roll Better, grown in Glyphtender | Glyphtender @0.28.2 · Goops @0.27.1 · Roll Better @0.2.0 · framework 0.28.2 | G 86% · O 66% | **keep + slim** | Both games use it every day; Goops carries ~3.8k lines of tabs it never loads |
| `rooms` | 3,342 / 3,019 | Harvested from Roll Better, proven in Glyphtender | Glyphtender @0.14.0 · framework 0.15.0 | G 91% | **freeze** | One game. Roll Better has its own older online code, not this brick |
| `table` | 685 / 504 | Glyphtender v0.6 (ROADMAP v0.4) | Glyphtender @0.8.2 · framework 0.8.2 | G 79% | **freeze** | One game; small and well used there |
| `ai` | 3,224 / 2,165 | Glyphtender beta v0.7 (ROADMAP v0.5) | Glyphtender @0.8.3 · framework 0.8.3 | G 42% (brain, beliefs, pace, check, report, arena in sims) | **freeze; banter → archive with Emotes** | One game. Banter (280 lines) + its save/settings rows are used only by the starter |
| `audio` | 3,741 / 2,246 | Glyphtender v0.6 (ROADMAP v0.6) | Glyphtender @0.5.0 · Goops @0.5.0 · framework 0.5.0 | G 74% · O 74% | **keep** | 2 games, both current |
| `saves` | 4,518 / 3,476 | Research list ("layers 1–7", ROADMAP v0.10) — not from a game | Glyphtender @0.7.0 · framework 0.7.0 | G 47% | **slim + freeze** | Glyphtender uses createSave, storage and the golden-save checks. Leaderboards, link-code cloud, replay, any-platform storage: no game |
| `crashes` | 2,179 / 1,938 | Research gap list (F89), first live in Glyphtender 2026-11-01 | Glyphtender @0.2.2 · framework 0.3.0 | G 41% in the page (the rest runs in its own crash worker) | **freeze** | One game, live 3 days; round 2 + 3 (F105, F106) already parked |
| `emotes` | 1,151 / 677 | Built ahead of need (F107) | **No real game** (starter only, @0.4.1) · framework 0.4.2 | — | **archive** | Glyphtender's AI emotes (its F44) is a low-priority "could"; rebuild from that game if it ever comes |
| `version` | 505 / 393 | Built from a request (F102), all games | Glyphtender @0.1.3 · Goops @0.1.1 · framework 0.1.3 | (mostly build-time) | **keep** | 2 games, tiny |
| `lint` | 541 / 461 | Built from rules (F90, F91, F157) | Glyphtender @0.4.0 · framework 0.4.0 (Goops: no) | (build-time) | **keep** | Small, and it is how CLAUDE.md's rules are enforced — it caught a real slip in the §5 test |

### Parts inside the big bricks that no real game uses

Checked two ways: which names each game's own code imports (`usage.mjs`), and which files survive the build
(`shake.mjs`). Lines are source + tests.

- **UI kit**
  - Emote parts — `SpeechBubble`, `EmotePicker`, `MuteMenu`, `MutedMark` (`blocks/emotes.tsx` 290 + 383 test lines):
    used only by the Emotes brick → go with it.
  - `WhatsNew` dialog (`blocks/whatsNew.ts` 86 + test): no game.
  - Styles: games use Cozy (Glyphtender), Neon (Goops), Cartoon (Roll Better), Clean (starter). **Pixel, Dark console,
    Fantasy: no game.** Tiny files (~45 lines each), but every style multiplies the screenshot checks.
  - The gallery (1,416 lines) is the kit's own test page for screenshots — not dead weight, it is a quality gate.
- **Dev Kit** (Glyphtender turns on every tab; Goops turns on Sound + its own two)
  - Used only by Glyphtender: AI tab (1,792 / 747), Text tab (558 / 712), Review list (383 / 276), Select (815 / 262,
    needs `content/devkit/select.json`, only Glyphtender has one), Moments (576 / 266).
  - Goops carries the AI, Review and Text tab code (~3.8k lines) and none of it reaches its build.
  - Can't verify from files: which built-in tabs Muzzy actually opens (Colour, Fonts, Snapshots, Bugs, Screens).
    Glyphtender has `content/snapshots/` and bug-capture commits, so at least Snapshots and Bugs get real use.
- **Saves** (none of these are in Glyphtender's build or imported by any real game)
  - Leaderboards: `board.ts`, `boardRoutes.ts`, `ui/BoardPanel.tsx` — 746 / 500.
  - Link-code cloud copy: `cloud.ts`, `ui/SaveCodePanel.tsx`, `ui/panelWords.ts` — 404 / 170; plus `cloudRoutes.ts` and
    `saveCode.ts` (484 / 444), which do land in Glyphtender's server bundle but only because the brick's front door
    re-exports them — Glyphtender never calls them. **Check before cutting.**
  - Seed + move replay: `replay.ts` — 196 / 243.
  - Any-platform async storage: `platform.ts` — 270 / 302. Save health: `health.ts` — 161 / 118.
  - Run resume (`run.ts`, `ui/useContinue.ts`, 258 / 197): starter only.
- **AI**: `tune.ts` (383) — the arena's tuning mode; `banter.ts` (280) — starter only.

---

## 3. Plumbing

| Piece | Size (source / tests) | Used by today | Verdict (PROPOSED) | Reason |
|---|---|---|---|---|
| 11 per-brick installers (`*/scripts/install-*.mjs`) | 2,338 / 1,467 | Every brick install into Glyphtender, Goops, the starter | **keep, freeze** | They work. Later: most of them do the same steps — one shared installer + a short list per brick could replace ~2k lines |
| `install-module.mjs` (in `~/.claude/config/bmuz/scripts`, + shared `lib.mjs` 525) | 163 | Glyphtender (~76 upgrade commits), Goops (~35) | **keep** | The one door for installs + hand steps |
| `extract.mjs` + extraction queue + its guard-edits rule | 327 | Used once: X01 queued and withdrawn the same day | **archive** | Built for a flow that hasn't happened; the rule "a part becomes a brick when a 2nd game needs it" covers it by hand |
| `VERSION` stamps (12 copies per fully-wired game) | tiny | All | **keep, one format** | Two formats today: `0.8.3 (framework fca9134)` vs bare `0.28.2` (Dev Kit, Rooms, UI kit) |
| `UPGRADES.md` hand-step notes (11 files) | 93 lines total | install-module shows them | **keep** | Small, useful |
| "Framework updates available" at session start (`session-start.sh` lines 90–105) | ~15 | Every game session | **keep, tone down during the freeze** | Today it would nag: Glyphtender Rooms 0.14 → 0.15, Crashes 0.2.2 → 0.3.0; Goops UI 0.37.3 → 0.39, Dev Kit 0.27.1 → 0.28.2; Roll Better very far behind |
| `framework/scripts/` (`check-modules`, `starter-check`, `kitVersion`, `checkLock`, `busyPc`) | 344 / 315 | `npm run check:fast` | **keep** | `busyPc` (re-runs checks that timed out on a busy PC) is a workaround worth watching |
| 13 separate `package.json` + lockfiles (one per brick + root + starter) | 27,185 lockfile lines | Each brick installs its own packages | **later: one npm workspace** | Not code, but 12 installs and 12 sets of package updates; lower value, more risk |
| `CHANGELOG.md` (569) + `version.json` (247) + per-brick README version notes | docs | Releases | **keep, de-duplicate** | Each change is written up in 3 places (see §6) |

---

## 4. Quality gates

| Gate | Size (source / tests) | What it guards | Verdict (PROPOSED) | Reason |
|---|---|---|---|---|
| Per-brick `conformance.mjs` (11, copied into games) | ~2,130 / ~1,300 | "Is this brick wired right in this game?" (check:framework, code part) | **keep** | Cheap, runs in seconds |
| Dev Kit `check-framework.mjs` (live promises) | 455 / 263 | Live tuning, pauses, the UI at 7 sizes, contrast, breathing room | **keep** | Caught the unreadable text in §5 |
| UI kit `uiProblems.mjs` + `check-ui.mjs` + kit `conformance.mjs` | 1,462 / 1,119 | The kit's layout rules in a game | **keep** | Same |
| UI kit `shoot.mjs` + gallery (+ `screenshots-pseudo/` 145 MB and `screenshots-webkit/` 51 MB on disk, not in git) | 356 + 1,416 / — | Screenshots of every part in every style | **slim** | Shoot only the styles a game uses on routine runs; all 7 before a kit release |
| Audio `loudness.mjs` + `audio-check.mjs` | 811 / 550 | Sound levels, missing files | **keep** | Both audio games use it |
| `lint` brick | (in §2) | Numbers + timers in code, state in frames, words in code | **keep** | Caught 2 hard-coded numbers in §5 |
| `starters/turn-based` | own code 2,603 (1,980 non-test); module copies 39,670; lockfile 4,896; sounds | Every brick change is played in a real little game before a game takes it | **keep the test game, stop committing its brick copies** | `starter-check.mjs` already copies it and installs today's bricks fresh, so the committed copies are only stale extras (11 of 12 stamps are behind, e.g. lint "0.3.0 (… + uncommitted changes)") |
| `npm run check:fast` (framework root) | 81 | Every brick's tests + typecheck + lint + the starter, side by side | **keep** | |
| GitHub `checks.yml` + its action | 144 + 77 (yml) | The same per brick on every push | **keep** | Last 8 runs: 6 green, 2 cancelled by a newer push, 0 red |

Tests are 63% the size of the source (29k vs 46k) — healthy for a library, but every slimmed part also removes its tests.

---

## 5. Inner-platform test (tic-tac-toe starter → Nim)

Scratch copy: `C:\Users\Muzzy\Documents\dev\.scratch\framework-ipe-test\` (left in place for cleanup.sh). The game:
a pile of 15 sticks, take 1, 2 or 3, whoever takes the last stick wins, vs the computer and online.

| Step | Result |
|---|---|
| Copy the starter (no node_modules / .wrangler / e2e-shots / dist) | 2 s |
| `npm install` | 8 s (warm npm cache; 283 MB of packages; `workerd`'s install script was held back by npm's install-scripts guard, didn't matter) |
| Starter's `check:fast` before any change | green, 8 s |
| Write Nim (clock time) | **01:29:28 → 01:36:52 = ~7.5 min**, including 2 full check runs |
| Files touched | **15**: rules + rules test, AI plug + bot tests, board, 2 screens, match, server rules, words (en.json), tuning (board.json), 4 e2e scripts |
| Lines | **+168 / −252** (Nim is simpler than tic-tac-toe) |
| `check:fast` after | green first time (5/5) |
| `check:full` after | 1st run 8/10 — **framework + screens failed: "14 sticks left" was dark text on the dark felt (2.1:1, needs 4.5:1)**. Fix: the kit's `HudText` (light words with a halo) instead of `Text`. 2nd run **10/10 green** (1.5 min). Screenshot checked by eye: pile, count and 1/2/3 buttons read fine |
| Lint while writing | refused `START_STICKS = 15` and `MAX_TAKE = 3` typed into code → the pile size moved to `content/tuning/board.json` (now a Dev Kit slider); the 1–3 rule kept with `// tuning-ok:` |
| Build size | 467 KB main JS + 69 KB CSS + 193 KB Dev Kit chunk, for a 15-stick game |

**What I had to know first (~10 framework ideas):** the Table's rules contract (setup · legalActions · check · apply →
state + events with `seen` · isOver · toAct · viewFor) · `selfTest` + `replay` · the AI plug (goals tied to traits,
readings, imagine, candidates, key, describe, banter moment names) · the room server's `GameRules` + `mustBe…` checks ·
the tuning file format (`_help` / `_labels` / `_ranges` / `_sections`) · the lint escape comment · the kit parts
(`Button`, `Row`, `Stack`, `HudText`, `fill`) · the HUD contrast rule · the e2e scripts' `data-` hooks · the rules
clock vs looks clock.

**What got in the way / what the checks did NOT catch:**
- The 4 e2e scripts all read the tic-tac-toe board through `data-cell` / `data-mark` — a new game must rewrite them
  (6 of the 15 files were tests).
- Tic-tac-toe is still in it after all checks are green: sound names `mark.x` / `mark.o` / `game.draw`, a "draws"
  count in the progress save, `ticTacToeAdapter`, comments, the README. Nothing flags leftovers.
- **The golden-save test still passes with a saved tic-tac-toe move (`{ cell: 4 }`)** — it checks the save's shape,
  not that its moves still fit the rules. A real game changing its moves would find out only when Continue throws.

**Plain React + Vite, honest estimate for the same Nim vs one computer player:** ~5 files, ~200–300 lines, ~15–25 min,
~190 KB JS. But no online rooms, no rejoin / bot takeover, no saves, no Dev Kit, no accessibility or screenshot checks.
Adding online play with rejoin by hand is days, not minutes.

**Verdict:** for a turn-based board game, **this is not an inner platform yet** — the starter made a different game
faster than plain React would, with more included, and the checks found real problems. The costs are elsewhere:
- the ~40k lines a new game carries in (only ~half reaches its build),
- a new Claude session must learn ~10 ideas from ~2,500 lines of brick READMEs before the first edit
  (I already had the framework in context, so 7.5 min is a best case),
- it only fits games shaped like the starter. Goops (real-time, no turns) uses just 4 bricks.

---

## 6. Docs drift found

1. **Framework `README.md` lists 7 bricks; there are 11** — `ai/`, `saves/`, `crashes/`, `emotes/` are missing.
   Last edited 2026-10-27.
2. **README version numbers are stale:** UI kit "kit 0.10.0" (is 0.39.0) · Dev Kit 0.13.0 (0.28.2) · Rooms 0.6.0
   (0.15.0) · Table 0.1.0 (0.8.2) · Audio 0.1.0 (0.5.0) · Version 0.1.0 (0.1.3) · Lint 0.2.0 (0.4.0).
3. **"5 styles (Clean, Cozy, Cartoon, Pixel, Neon)"** in the README and ROADMAP v0.1; the kit has 7 (+ Dark console,
   Fantasy) and the `game-ui` skill says seven. Several UI kit README notes also say "all 5 styles".
4. The README's UI kit row is a ~1,500-character changelog squeezed into a table cell; the UI kit README is mostly
   per-version notes too; `CHANGELOG.md` has them again. **The same history in 3 places.**
5. README status words ("building", "released (v0.1)") are from early October; there is no "used by" column, so the
   README can't tell anyone which bricks are proven.
6. Two `VERSION` formats (with / without the framework commit).
7. The starter's brick copies are behind the framework in 11 of 12 stamps — by design (starter-check installs fresh
   ones), but undocumented: a game copied from the starter by hand gets old bricks.
8. Gently, on this audit's brief: **Goops is not parked** — it finished its Sprint 33 at 01:25 tonight (597 commits
   since 2026-10-20; beta live since 2026-10-29). It is paused only by today's audit freeze. It is the framework's
   second real user, which is what lets UI kit, Dev Kit, Audio and Version pass the founding rule.

---

## 7. Proposed cuts, in order of value (all PROPOSED)

| # | Cut | Why | Roughly removes |
|---|---|---|---|
| 1 | **Stop committing the starter's brick copies**; the starter keeps only its own game (2.6k lines) + a `npm run install-modules` step; a new game copies it and installs today's bricks | 94% of the starter is duplicate code; starter-check already installs fresh copies every run | **~39.7k lines from git** (+ keeps ~40k lines out of every new game until it asks for a brick) |
| 2 | **Archive Emotes** (to a git tag / `archive/` branch) + the kit's emote parts + AI banter + the starter's wiring | No real game; built ahead of need; rebuild from Glyphtender's F44 if it ever comes | ~1.8k (brick) + ~0.7k (kit parts) + ~0.3k (banter) ≈ **2.8k lines** + a 2.3k-line lockfile |
| 3 | **Slim Saves to what Glyphtender calls**: archive leaderboards, link-code cloud, replay, any-platform storage, save health (keep create, storage, old-save upgrades, golden checks, run resume) | Built from a research list; no game calls them. Check `cloudRoutes` / `saveCode` against Glyphtender first | **~3.8k lines** |
| 4 | **Archive the extraction queue** (`extract.mjs`, its guard rule, the PROJECT-FILES section) | Used once, withdrawn the same day | ~0.4k lines + a rule to remember |
| 5 | **Install only the Dev Kit tabs a game turns on** (AI / Text / Review / Select / Moments as opt-in folders) | Goops carries ~3.8k lines it never loads; every future game would too | ~3.8k lines per game that doesn't need them (no framework lines removed) |
| 6 | **Screenshot only the styles in use** on routine runs (Cozy, Neon, Cartoon, Clean); all 7 before a kit release. Drop `WhatsNew` (no game) | Fewer, faster checks | ~0.2k lines; check time |
| 7 | **Freeze** Rooms, Table, AI, Crashes, Saves (after #3): bug fixes only, no new features until a 2nd game needs them | Founding rule: one game proves, a second makes general | 0 lines, stops growth |
| 8 | **Fix the README** (11 bricks, "used by" + "proven by" columns, no version history in the table) | It's the front door and it's wrong | docs only |
| 9 | Later, lower value: one npm workspace instead of 13 lockfiles; one shared installer | Less install noise | ~27k lockfile lines, ~2k installer lines |

Together #1–#4 remove **~46k tracked lines (~28% of everything in git)** with no game losing anything it uses.

**What NOT to cut, and why:**
- **UI kit, Dev Kit, Audio, Version** — two real games use them daily; they are the proven core.
- **Table, Rooms, AI core, Crashes** — only Glyphtender, but that game uses most of each (79–91% of Rooms and Table
  reach its build) and Crashes is live. Freeze, don't cut: cutting would mean Glyphtender owns the code again.
- **Lint, the conformance checks, check-framework, uiProblems** — in the Nim test they caught both real mistakes.
  They are what make a fast game also a correct one.
- **The starter itself** — it's the proof that a new game starts fast (§5). Cut its copies, keep the game.
- **CI** — green, cheap, and catches a broken brick before a game installs it.

---

## 8. How I measured (to redo it)

Helper scripts are kept beside this report in `tools/`:
`classify.mjs` (lines by folder + kind), `usage.mjs` (what a game's own code imports from each copy), `shake.mjs`
(esbuild tree-shake of a game → share of each copy in the bundle), `deadweight.mjs` / `names.mjs` (word-match of
exported names — rough, used only for the UI kit name list).

```bash
# 1. Lines per folder, split by kind (framework root)
cd ~/Documents/dev/framework
git ls-files -z | xargs -0 wc -l | grep -v ' total$' > lines.txt
node classify.mjs lines.txt 2          # columns: files · src · tests · docs · json · lock · stamp · other

# 2. Which brick copies each game has, and their versions
cd ~/Documents/dev/games
for g in */; do find "$g" \( -name node_modules -o -name .claude -o -name .git -o -name dist \) -prune -o -name VERSION -type f -print; done

# 3. What a game's own code imports from each copy (exact import lines, copies themselves excluded)
node usage.mjs ~/Documents/dev/games/glyphtender src/ui/kit=ui-kit src/devkit=devkit src/saves=saves   # …one per copy

# 4. What reaches the build (esbuild from the game's own node_modules; npm packages left out; DEV true/false)
cd ~/Documents/dev/games/glyphtender
LIST=1 node shake.mjs . true src/main.tsx party/worker.ts src/ai/think.worker.ts src/devkit-game/aiCheck.worker.ts -- src/saves src/ui/kit

# 5. Churn
git log --oneline -- ui-kit/kit/VERSION | wc -l      # version bumps per brick
git log --oneline -- .planning | wc -l               # commits touching plan files

# 6. Inner-platform test
cp starters/turn-based (without node_modules, .wrangler, e2e-shots, dist) → ~/Documents/dev/.scratch/framework-ipe-test
npm install; npm run check:fast; (edit); npm run check:full; git diff --stat
```

**Limits — where I couldn't be sure:**
- "In bundle" is an upper bound: a brick's front door (`index.ts`) re-exports everything, and a file with top-level
  code stays in even when nothing calls it (that's why Saves' `cloudRoutes` shows up in Glyphtender's server build).
  Files only used by Node scripts (sims, arena runs) were not bundled, so AI's 42% is a floor for its real use.
- The UI kit "no game uses it" list is a name match against the games' code — a common word could hide a real use
  or make a dead part look used. The emote parts, `WhatsNew` and the 3 unused styles were double-checked by hand.
- Which Dev Kit tabs Muzzy actually opens can't be read from files.
- The Nim test was done by a Claude session that already had the framework in context — a fresh session would be
  slower (it must read the brick READMEs first).
- Roll Better, Escape Pod Scramble, Windchime and DoomDial were checked for copies only (found none beyond Roll
  Better's two old ones); their own code wasn't read.

---

## 9. Claude's review of this report (main session, 2026-11-04)
Checked first-hand: Goops' last commits (Sprint 33 archived 01:16 tonight) · the starter's 326 committed module files · `starter-check.mjs` refreshes every module from the framework before each check (lines 9–12) · Glyphtender has no `src/emotes/` and no screen calls banter. All match the report.
- **Cut #1 (starter copies): agree, and it fixes a hidden trap** — a game copied from the starter by hand today gets bricks up to 29 versions old.
- **Cut #4 (extraction queue): wait.** Deciding how a part comes OUT of a game is exactly what F188 — Module recipe is for; archiving the tool before the recipe pre-empts it. Proposed: F188 decides keep / simplify / archive.
- **Goops:** Muzzy's "parked" means paused for this audit — it was active until tonight, and it counts as the second real user, as the report says.
- **The golden-save gap** (a save whose moves no longer fit the rules still passes) is a real bug in a quality gate — logged for after the freeze, not fixed now.
