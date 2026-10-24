# Sprint 33 — The kit holds up on a phone
Started 2026-10-24 · Milestone v0.16 The kit holds up on a phone · Features: F124, F123, F125
Muzzy 2026-10-24: /sprint pick a ("1. A. 2. yes" — the yes also covered the MODULE-CONTRACTS version-spot line, landed).
What changes: in the kit's HUD, corner pieces keep their width on small phones and the middle gives way; the page check reports a solid chip covering a bar; the saves test stops timing out under load. What stays the same: every game until it reinstalls the UI kit, and how every kit part looks where it already fit.

## F124 🔧 uiProblems sees a covered bar
Done when: a solid (non-see-through) chip, badge or panel sitting on a bar / meter / progress bar / art (no text, not a control) is reported as `overlap:`, while the kit's on-purpose layering (a dialog over the HUD, a badge inside its own card, text over its own bar) is not; the gallery shoot finds the known Cozy coins-over-Health case before F123 fixes it.
- [ ] 🤖 1. Detect a solid element covering a bar, meter or art — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 2. Tests: chip over bar flagged; dialog over HUD, badge in its card, label on its own bar not — ui-kit/kit/uiProblems.test.mjs
- [ ] 🤖 3. Shoot the gallery at 390x844 + 360x780 + 667x375: the Cozy coins / Health case is found, nothing new and false — ui-kit/scripts/shoot.mjs
Check: ui-kit tests; shoot names the Cozy coins chip over the Health bar (and nothing it shouldn't).

## F123 🐞 HUD corner slots keep their content's width
Done when: no HUD corner slot shrinks below its content and slides under its neighbour at any size the kit supports (390x844, 360x780, 844x390, 667x375, 768x343, ~1100 wide, 1440x900, 1920x1080) in all 5 styles; the middle slot gives way (wraps / shrinks) instead; kit parts that already fit look the same.
- [ ] 🤖 1. Corner slots keep their min-content width; the middle takes what's left — ui-kit/kit/kit.css
- [ ] 🤖 2. The gallery HUD sample at every size above, 5 styles: no overlap, Roll clear of "40%" on 667x375 — ui-kit/scripts/shoot.mjs
- [ ] 🤖 3. Before/after shots of the unchanged screens (byte-identical where nothing overlapped), README / CATALOG note, UI kit 0.33.1 (a fix — 0.34.0 is when OLD_MODULE_ROWS goes) — ui-kit/kit/VERSION
Check: shoot 0 problems at every size with F124's new rule on; screenshots of the Cozy upright phone and the 667x375 HUD looked at by me.

## F125 🔧 The saves install test that times out under load
Done when: the cause of the 5.1 s run under check:fast is found and fixed (not a longer limit), and check:fast passes 3 runs in a row.
- [x] 🤖 1. Measure each step of the slow test under load (what it waits on: copies, re-reads, a spawned process) — saves/scripts/install-saves.test.mjs
- [x] 🤖 2. Fix the cause in the installer or the test — saves/scripts/install-saves.mjs
- [x] 🤖 3. Prove it: the test's time under check:fast load, then 3 green check:fast runs — saves/scripts/install-saves.test.mjs
Check: saves tests; 3 check:fast runs green; the test's time under load noted here.
Checked: 2026-10-24 (Claude) — cause measured by the helper: each installSaves started 2 git processes (55–63 ms idle, 170–620 ms under check:fast), 3 installs = up to ~3.2 s of the 5.1 s; fix 4891109 asks git once per run (saves 0.6.2). The test under check:fast load: 65 / 270 / 102 ms (was 5113); 3 check:fast runs in a row ✓ all 20 (saves 6–7 s, was 17). Review: diff read whole by Claude — a CLI run never spans two commits, no bugs. No visual change.

Notes:
- Order: F124 before F123 (the check must see the bug first, so the fix is proven by it); F125 any time (different files).
- UI kit bumps to 0.33.1, not 0.34.0: 0.34.0 is promised as the release that drops OLD_MODULE_ROWS, which waits for Glyphtender's reinstall (ROADMAP Ideas).
