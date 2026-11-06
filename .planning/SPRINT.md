# Sprint 61 — Both games' updates rehearsed on throwaway copies
Started 2026-11-06 · Milestone v0.38 · Features: F194, F195

## F194 🔧 Goops catch-up rehearsal
Done when: a throwaway copy of Goops (`~/Documents/dev/.scratch/goops-catchup`) runs on today's framework — every module current, plus Saves, Crashes, Lint and the sprint 60 parts — with its check:full green; a report says how long each step took, every hand fix, and what the framework got wrong (fixed in the framework first). The real Goops is untouched.
- [ ] 🤖 1. Copy Goops, check:full green before any change, timed — .planning/research/2026-11-06-goops-catchup.md
- [ ] 🤖 2. Every module Goops has to current with install-module.mjs (Dev Kit first), each timed, hand fixes noted — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 3. Take Saves (progress onto createSave + an upgrade step + a golden save of today's format, so no rank is lost), Crashes ("Send crash reports" on by default — Muzzy 2026-11-06), Lint — .planning/research/2026-11-06-goops-catchup.md
- [ ] 🤖 4. Swap in the shared parts: liveSetting for gooStyle / wallKick / readoutSetting, the kit's upright card, startUpdates — .planning/research/2026-11-06-goops-catchup.md
- [ ] 🤖 5. Crash server run locally (wrangler dev) against the copy; CPU + writes per report measured against Cloudflare's free plan — nothing deployed — .planning/research/2026-11-06-goops-catchup.md
- [ ] 🤖 6. check:full green on the copy; the report — .planning/research/2026-11-06-goops-catchup.md
Check: the copy's check:full green with its e2e sw-update; an old-format Goops progress save loads with its rank; the real Goops' git status unchanged.

## F195 🔧 Glyphtender catch-up rehearsal
Done when: a throwaway copy of Glyphtender (`~/Documents/dev/.scratch/glyphtender-catchup`) runs on today's framework — every module current (rooms 0.15.0 included), the Saves replay hand step, the sprint 60 parts — with its check:full green; a report like Goops'. The real Glyphtender is untouched.
- [ ] 🤖 7. Copy Glyphtender, check:full green before any change, timed — .planning/research/2026-11-06-glyphtender-catchup.md
- [ ] 🤖 8. Every module to current (rooms 0.15.0's server too, run locally), each timed, hand fixes noted — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 9. The Saves 0.9.0 hand step: its run save's replay wired; its real golden saves still pass — .planning/research/2026-11-06-glyphtender-catchup.md
- [ ] 🤖 10. Swap in the shared parts: liveSetting for gameSettings.ts, the kit's full screen for src/ui/fullscreen.ts, startUpdates — .planning/research/2026-11-06-glyphtender-catchup.md
- [ ] 🤖 11. check:full green on the copy; the report — .planning/research/2026-11-06-glyphtender-catchup.md
- [x] 🤖 13. Rehearsal find: saves UPGRADES 0.9.0 named Glyphtender as holding moves — it holds none (5b01a82) — saves/UPGRADES.md
- [x] 🤖 14. Rehearsal find: version's installer read crashes/lint copies as game code → a false "Still to wire" step; copies now found by their VERSION file, test red first (91b8f1b) — version/scripts/install-version.mjs
- [x] 🤖 15. Rehearsal find: crashes' installer always printed "Going live" and port 1995 — now done once client.url is https, port read from the game's crashes/wrangler.json; test red first — crashes/scripts/install-crashes.mjs
Check: the copy's check:full green; its golden saves replay; the real Glyphtender's git status unchanged.

## Wrap-up
- [ ] 🤖 12. Framework fixes from both reports, framework check:fast green, both games' real update sprints outlined from the reports — scripts/check-modules.mjs

## Notes
- Open bugs: no open P0/P1 in BUGS.md.
- Claude's call: two helpers side by side, one per game; a framework fix either one needs goes on dev/v0-38-shared one at a time (the helper says so to main first).
- Claude's call: the crash server only runs locally here; Goops' real deploy (Muzzy's yes, 2026-11-06) is Goops' own sprint.
- Real games: both read-only. Glyphtender has uncommitted release .map files — never touched.
