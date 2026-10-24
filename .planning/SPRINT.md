# Sprint 34 — A clean screenshot run
Started 2026-10-24 · Milestone v0.17 A clean screenshot run · Features: F127, F126, F128
Muzzy 2026-10-24: /develop after the /sprint plan, then "auto" — taken as my pick, option A; running unattended.
What changes: the gallery's few problem screens get fixed; the page check gets stricter (games may see new "covers part of" lines). What stays the same: every screen that already passes, every game until it reinstalls.

## F127 🔧 uiProblems sees a chip covering text
Done when: a solid chip, badge or panel crossing part of another card's text is reported as `overlap: "X" covers part of "Y"`, with F124's on-purpose exemptions (wholly over / wholly on, own card, top layer, moving, inert); what it finds on today's code is listed BEFORE the rule changes, so F126 plans for it.
- [ ] 🤖 1. Run a draft of the rule on today's gallery (every shoot size) and list what it finds — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Extend the covered-piece rule to text targets — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. Tests: chip over a card's text flagged; a label on its own chip, a dialog over text, a badge in its card not — ui-kit/kit/uiProblems.test.mjs
Check: ui-kit tests; the list from task 1 is in Notes.

## F126 🐞 The shoot's 16 left-over finds → 0
Done when: `npm run shoot` reports 0 problems with F124 + F127 on, at every shoot size in all 5 styles; screens that already passed look the same.
- [ ] 🤖 1. Parts page HUD demo at 200% text ("Round 2" over "Health"): a plain Screen's phone fallback puts the middle on its own row — ui-kit/kit/blocks/blocks.css
- [ ] 🤖 2. Talk screen on a phone on its side: the talking bubble no longer covers the Colours picker — ui-kit/gallery/Talk.tsx
- [ ] 🤖 3. Pinned, Pixel, 360×780: the 1 px `edge:` lines get their room — ui-kit/gallery/Screens.tsx
- [ ] 🤖 4. Full shoot 0 problems; before/after shots of the changed screens, README / CATALOG note, UI kit 0.33.2 — ui-kit/kit/VERSION
Check: shoot 0 problems; I look at the parts 200% text shot, the talk 667×375 shot and a desktop shot myself.

## F128 🔧 Every installer asks git once per run
Done when: each of the 9 other installers (ai, audio, crashes, devkit, emotes, rooms, table, ui-kit, version) asks git for the kit's commit once per run, like saves 0.6.2; check:fast passes 3 runs in a row.
- [ ] 🤖 1. Measure one installer's test under check:fast load (git calls per install) — ai/scripts/install-ai.test.mjs
- [ ] 🤖 2. The once-per-run cache in each installer, patch version each — ai/scripts/install-ai.mjs
- [ ] 🤖 3. Three check:fast runs green in a row, times noted — package.json
Check: every module's tests; 3 check:fast runs green.

Notes:
- Order: F127 before F126 (its new finds become F126's fixes); F128 any time (different files) — 2 helpers in parallel.
- Each installer gets its own small cache, not a shared helper: modules stay self-contained (Claude's call).
- UI kit 0.33.2 (fixes + a stricter check); 0.34.0 stays reserved for dropping OLD_MODULE_ROWS.
