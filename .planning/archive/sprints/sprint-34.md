# Sprint 34 — A clean screenshot run
Started 2026-10-24 · Milestone v0.17 A clean screenshot run · Features: F127, F126, F128
Muzzy 2026-10-24: /develop after the /sprint plan, then "auto" — taken as my pick, option A; running unattended.
What changes: the gallery's few problem screens get fixed; the page check gets stricter (games may see new "covers part of" lines). What stays the same: every screen that already passes, every game until it reinstalls.

## F127 🔧 uiProblems sees a chip covering text
Done when: a solid chip, badge or panel crossing part of another card's text is reported as `overlap: "X" covers part of "Y"`, with F124's on-purpose exemptions (wholly over / wholly on, own card, top layer, moving, inert); what it finds on today's code is listed BEFORE the rule changes, so F126 plans for it.
- [x] 🤖 1. Run a draft of the rule on today's gallery (every shoot size) and list what it finds — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Extend the covered-piece rule to text targets — ui-kit/kit/uiProblems.mjs
- [x] 🤖 3. Tests: chip over a card's text flagged; a label on its own chip, a dialog over text, a badge in its card not — ui-kit/kit/uiProblems.test.mjs
Check: ui-kit tests; the list from task 1 is in Notes.
Checked: 2026-10-24 (Claude) — ui-kit 638/638 tests; 17 overlap tests, each exemption removed one at a time made a test fail except "the piece holds the text" (a shortcut: the on-screen walk already treats the label as its chip's — kept, noted). Task 1 list: today's code 0 new finds (same 16 as before); on the pre-F123 HUD layout it finds the known case — Coins over the Score chip at 667×375 in clean / cozy / cartoon / neon, and in Pixel Coins over "135" + ❤ over "Round 1" — no false ones. Review: diff read whole by Claude, no bugs.

## F126 🐞 The shoot's 16 left-over finds → 0
Done when: `npm run shoot` reports 0 problems with F124 + F127 on, at every shoot size in all 5 styles; screens that already passed look the same.
- [x] 🤖 1. Parts page HUD demo at 200% text ("Round 2" over "Health"): a plain Screen's phone fallback puts the middle on its own row — ui-kit/kit/blocks/blocks.css
- [x] 🤖 2. Talk screen on a phone on its side: the talking bubble no longer covers the Colours picker — ui-kit/gallery/Talk.tsx
- [x] 🤖 3. Pinned, Pixel, 360×780: the 1 px `edge:` lines get their room — ui-kit/gallery/Screens.tsx
- [x] 🤖 4. Full shoot 0 problems; before/after shots of the changed screens, README / CATALOG note, UI kit 0.33.2 — ui-kit/kit/VERSION
- [x] 🤖 5. A kit control inside an ArtLayer keeps its 44 px tap floor (Goops' report mid-sprint: art.css wiped kit.css's .kit-target floor; RANK SELECT was 29 px) — 1c9ee9d — ui-kit/kit/art.css
Check: shoot 0 problems; I look at the parts 200% text shot, the talk 667×375 shot and a desktop shot myself.
Checked: 2026-10-24 (Claude) — final shoot (after merging art.css + F128): 475 shots, 0 problems (was 16). Looked at myself: parts phone 200% text (Round 2 on its own row, clear of Health), talk Cozy 667×375 (one picker per top corner, bubble clear below), parts Pixel desktop (unchanged apart from the demo). Before/after: 392 of 475 identical; the rest are the measured animation noise or the expected demo / talk shots. Calls: the pinned 1 px `edge:` lines were the check's mistake (a pinned chip's border read unscaled — 4 px drawn at 1.75 px), fixed in uiProblems; the parts demo is now built with Hud instead of changing plain Screens (a fallback would move menus that fit — CATALOG says to use Hud for a game screen); the talk pickers were a gallery-page cause. check:fast ✓ all 20. UI kit 0.33.2.

## F128 🔧 Every installer asks git once per run
Done when: each of the 9 other installers (ai, audio, crashes, devkit, emotes, rooms, table, ui-kit, version) asks git for the kit's commit once per run, like saves 0.6.2; check:fast passes 3 runs in a row.
- [x] 🤖 1. Measure one installer's test under check:fast load (git calls per install) — ai/scripts/install-ai.test.mjs
- [x] 🤖 2. The once-per-run cache in each installer, patch version each — ai/scripts/install-ai.mjs
- [x] 🤖 3. Three check:fast runs green in a row, times noted — package.json
Check: every module's tests; 3 check:fast runs green.
Checked: 2026-10-24 (Claude) — merged 90665e1 + d389ef0; all 10 installers use the same once-per-run cache (grep). Under check:fast load the ai install test went 18.3 s → 1–2 s (30 git processes were 17.7 s of it), rooms 10.8 → ~3, audio 8.9 → 0.9, crashes 8.4 → 0.9, emotes 8.1 → 0.8, devkit 7.7 → 4.4, version 6.3 → 1.0, ui-kit 5.4 → 2.7, table 1.8 → 0.6; no installer test over 1.3 s. 3 check:fast runs green in a row (after a devkit test fix: its Vite tests now retry deleting their folder while Windows lets go — ENOTEMPTY once in 3). Every module's npm test green. Review: diff read whole by Claude, no bugs. Versions: ai 0.8.1 · audio 0.4.1 · crashes 0.2.1 · devkit 0.27.2 · emotes 0.4.1 · rooms 0.12.1 · table 0.8.1 · ui-kit 0.33.2 · version 0.1.2; saves README now says 0.6.2. No visual change.

Notes:
- Helpers couldn't Write into ~/Documents/dev/.scratch from a worktree (both used the session scratchpad) — same as sprint 33.
- Mid-sprint (Goops, 2026-10-24): a Button in an ArtLayer measured 29 px — art.css's `> * { min-block-size: 0 }` came after kit.css's .kit-target floor. Fixed for the art layer only (PullHandle / SnapControl set their own hit areas on purpose); a real-browser test (artTarget.test.mjs) fails on the old rule. README line + 0.33.2 land with F126's version bump.
- Order: F127 before F126 (its new finds become F126's fixes); F128 any time (different files) — 2 helpers in parallel.
- Each installer gets its own small cache, not a shared helper: modules stay self-contained (Claude's call).
- UI kit 0.33.2 (fixes + a stricter check); 0.34.0 stays reserved for dropping OLD_MODULE_ROWS.

Retro:
- went well: the first task ran the new rule on today's code, so nothing surprised us at the end (shoot 16 → 0); Goops' mid-sprint ArtLayer bug became a task with a real-browser test that fails on the old rule
- went wrong: a helper's shoot ran while files changed and Vite reloaded some screens mid-run; the devkit Vite tests failed once in 3 on Windows deleting their folder
- change: (Muzzy 2026-10-24) keep doing it — new checks run on today's code first (already a /sprint skill line); a shoot that sees a file change mid-run should stop (ROADMAP Ideas)
