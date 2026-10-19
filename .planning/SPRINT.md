# Sprint 09 — Glyphtender passes the framework's checks, and the planner says so in plain words
Started 2026-10-19 · Milestone v0.9 · Features: F63, F66
Glyphtender work goes on its own branch `dev/framework-checks` (its live site only changes at its own /deliver). Framework code → `dev/conformance`; the planner → `~/.claude/config/bmuz/templates/ppp/build-ppp.mjs`. Goops (F62) waits until the other session finishes F59/F60 on `dev/m1-core-shift` (Muzzy 2026-10-19: Glyphtender first, one game this sprint).

## F63 🔧 Glyphtender passes the pack
Done when: Glyphtender runs the newest UI kit + Dev Kit, `check:framework` is part of its check:full, and every gap it finds is either fixed or a line on Glyphtender's ROADMAP.
- [ ] 🤖 1. Spike — UI kit 0.10.4 → 0.19.0 and Dev Kit 0.16.1 → 0.20.0 on a throwaway copy: what breaks, how big → Notes — glyphtender/src/ui/kit, src/devkit
- [ ] 🤖 2. Install both with install-module on `dev/framework-checks`, fix what breaks, check:fast green — glyphtender/src/ui/kit, src/devkit, package.json
- [ ] 🤖 3. Run check:framework → every red becomes a line on Glyphtender's ROADMAP (or a bug) — glyphtender/.planning/ROADMAP.md
- [ ] 🤖 4. Fix the small gaps (each under ~15 min); the rest stay on its roadmap — glyphtender/src
- [ ] 🤖 5. check:full green incl. check:framework; record Last full check in its STATE — glyphtender/.planning/STATE.md
- [ ] 🙋 6. Play one game of Glyphtender on your phone — nothing looks or plays differently
Check: Glyphtender's check:full all green with check:framework in it; its VERSION files match the framework's newest.
Ask Muzzy: —

## F66 🔧 Framework row on the planner — in plain words (carried from sprint 08)
Done when: the planner's Framework row tells Muzzy, in plain words, whether anything needs doing and who does it — no version numbers, commands or test names on the page; healthy = one green line.
Muzzy, 2026-10-19: "I don't know what I'm looking at … it doesn't look like I can make any decisions based on what is present."
- [x] 🤖 1. `check-framework.mjs` writes `e2e-shots/framework.json` (per module pass/fail, date, commit) — Dev Kit 0.20.0 on dev/conformance (512c41f)
- [ ] 🤖 2. Rewrite the row: healthy → one line "✅ Framework pieces up to date and working (checked today)"; otherwise one plain sentence per problem + who fixes it and how ("A newer Dev Kit is out — Claude updates it in the next /develop"); the technical detail goes behind a "details" fold — templates/ppp/build-ppp.mjs
- [ ] 🤖 3. Plain-words lines for every check the pack can fail (a list in build-ppp, each written for a non-engineer) — templates/ppp/build-ppp.mjs
- [ ] 🤖 4. Prove it on the Glyphtender planner before and after F63 (red → green), shots at 390 + 1440 — glyphtender/.planning
- [ ] 🙋 5. Muzzy reads the row — can you tell what (if anything) needs doing?
Check: a non-engineer can say from the row alone whether anything needs doing; no command, file or version number shows unless "details" is opened.
Ask Muzzy: —

Notes:
