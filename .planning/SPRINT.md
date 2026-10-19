# Sprint 09 — Glyphtender passes the framework's checks, and the planner says so in plain words
Started 2026-10-19 · Milestone v0.9 · Features: F63, F66
Glyphtender work goes on its own branch `dev/framework-checks` (its live site only changes at its own /deliver). Framework code → `dev/conformance`; the planner → `~/.claude/config/bmuz/templates/ppp/build-ppp.mjs`. Goops (F62) waits until the other session finishes F59/F60 on `dev/m1-core-shift` (Muzzy 2026-10-19: Glyphtender first, one game this sprint).

## F63 🔧 Glyphtender passes the pack
Done when: Glyphtender runs the newest UI kit + Dev Kit, `check:framework` is part of its check:full, and every gap it finds is either fixed or a line on Glyphtender's ROADMAP.
- [x] 🤖 1. Spike — UI kit 0.10.4 → 0.19.0 and Dev Kit 0.16.1 → 0.20.0 on a throwaway copy: what breaks, how big → Notes — glyphtender/src/ui/kit, src/devkit
- [x] 🤖 2. Install both with install-module on `dev/framework-checks`, fix what breaks, check:fast green — glyphtender/src/ui/kit, src/devkit, package.json
- [x] 🤖 3. Run check:framework → every red becomes a line on Glyphtender's ROADMAP (or a bug) — glyphtender/.planning/ROADMAP.md
- [x] 🤖 4. Fix the small gaps (each under ~15 min); the rest stay on its roadmap — glyphtender/src
- [ ] 🤖 5. check:full green incl. check:framework; record Last full check in its STATE — glyphtender/.planning/STATE.md
- [ ] 🙋 6. Play one game of Glyphtender on your phone — nothing looks or plays differently
Check: Glyphtender's check:full all green with check:framework in it; its VERSION files match the framework's newest.
Ask Muzzy: —

## F66 🔧 Framework row on the planner — in plain words (carried from sprint 08)
Done when: the planner's Framework row tells Muzzy, in plain words, whether anything needs doing and who does it — no version numbers, commands or test names on the page; healthy = one green line.
Muzzy, 2026-10-19: "I don't know what I'm looking at … it doesn't look like I can make any decisions based on what is present."
- [x] 🤖 1. `check-framework.mjs` writes `e2e-shots/framework.json` (per module pass/fail, date, commit) — Dev Kit 0.20.0 on dev/conformance (512c41f)
- [x] 🤖 2. Rewrite the row: healthy → one line "✅ Framework pieces up to date and working (checked today)"; otherwise one plain sentence per problem + who fixes it and how ("A newer Dev Kit is out — Claude updates it in the next /develop"); the technical detail goes behind a "details" fold — templates/ppp/build-ppp.mjs
- [x] 🤖 3. Plain-words lines for every check the pack can fail (a list in build-ppp, each written for a non-engineer) — templates/ppp/build-ppp.mjs
- [ ] 🤖 4. Prove it on the Glyphtender planner before and after F63 (red → green), shots at 390 + 1440 — glyphtender/.planning
- [ ] 🙋 5. Muzzy reads the row — can you tell what (if anything) needs doing?
Check: a non-engineer can say from the row alone whether anything needs doing; no command, file or version number shows unless "details" is opened.
Ask Muzzy: —

Notes:
- F66 tasks 2–3 (2026-10-19, helper): the sentences live in `templates/ppp/framework-words.mjs` (piece names, `CHECK_WORDS` for every check the pack can fail, `frameworkStatus()`), and build-ppp draws them. Healthy = "✅ Framework pieces are up to date and working (checked today)." Otherwise there's one card per problem: 🔧 Claude fixes it, 🙋 needs you (only "nothing 🔴 ships" asks for Muzzy, because he picks the replacement art). The technical detail sits behind "Technical details (for Claude)". 11 new test cases; test-scripts 60/60. Shots: `C:\Users\Muzzy\ppp-proof\*-v2.png` (Goops copy: "5 things to sort — 1 needs you"). Decision: a quick-check-only run is NOT shown as healthy; Claude runs the full check. Note: build-ppp compares against `~/Documents/dev/framework` (main), so it shows the newest pieces only after dev/conformance merges at /deliver.
- F63 spike (2026-10-19, helper, on a throwaway copy `C:\Users\Muzzy\spike\glyphtender-f63`): all 6 pieces update cleanly (UI kit 0.10.4 → 0.19.0 with zero breaks, Dev Kit 0.16.1 → 0.20.0, Audio 0.3.1, Table 0.8.0, AI 0.2.1, Rooms 0.7.0). Small fixes: one inline style (v0.11.0 shipped with it because Glyphtender's check:fast never ran check:ui), bots onto the rules clock (AI 0.2), the adapter's `conformance.startPlay`. Framework bugs found: the Dev Kit touches `document` on import (breaks a game's Node tests) and its installer doesn't add `check:framework` / `devkit.local.json`. Both are fixed framework-first in Dev Kit 0.20.1. The only red: ◐ half pause, because Glyphtender's turns move on when animations finish (~8 places, 3–5 h).
- **Muzzy 2026-10-19 (half pause): later, on Glyphtender's roadmap.** → check:framework gets a "known gaps" list (a game names a check it hasn't met yet + why + its roadmap ID). The checks stay green, and the planner says "1 thing still to build".
- F63 tasks 2–4 (2026-10-19, helper + Claude): Dev Kit **0.20.1** on dev/conformance (`ca88922` import without a page + the installer adds `check:framework` / `devkit.local.json`; `b3626bf` known gaps: `content/devkit.json` → `knownGaps: [{check, why, roadmap}]`, framework.json gets `knownGaps` + `gapsToRemove`). Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, the spike's small fixes, check:ui in check:fast, check:framework in check:full (alone, port 5298), half pause → Glyphtender **F89** (Later). check:framework: "PASS — 23 checks kept, 1 known gap". Planner: a known gap shows as 📌 "Planned for later (F89 on the roadmap): …" and still counts as all good (hint "all good · 1 planned for later"); 13/13 ppp tests.
- F63 review (low, 2026-10-19): no real bugs in the Dev Kit 0.20.1 commits or Glyphtender game code. Limit by design: a known gap covers its whole check, so a NEW reason for the same check failing still reads as "known gap" (its problem lines still print). Glyphtender F89 removes the gap. Reviewed through: framework b3626bf · Glyphtender e8032bb.
