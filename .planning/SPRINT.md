# Sprint 61 — Both games' updates rehearsed on throwaway copies
Started 2026-11-06 · Milestone v0.38 · Features: F194, F195

## F194 🔧 Goops catch-up rehearsal
Done when: a throwaway copy of Goops (`~/Documents/dev/.scratch/goops-catchup`) runs on today's framework — every module current, plus Saves, Crashes, Lint and the sprint 60 parts — with its check:full green; a report says how long each step took, every hand fix, and what the framework got wrong (fixed in the framework first). The real Goops is untouched.
- [x] 🤖 1. Copy Goops, check:full green before any change, timed — .planning/research/2026-11-06-goops-catchup.md
- [x] 🤖 2. Every module Goops has to current with install-module.mjs (Dev Kit first), each timed, hand fixes noted — ~/.claude/config/bmuz/scripts/install-module.mjs
- [x] 🤖 3. Take Saves (progress onto createSave + an upgrade step + a golden save of today's format, so no rank is lost), Crashes ("Send crash reports" on by default — Muzzy 2026-11-06), Lint — .planning/research/2026-11-06-goops-catchup.md
- [x] 🤖 4. Swap in the shared parts: liveSetting for gooStyle / wallKick / readoutSetting, the kit's upright card, startUpdates — .planning/research/2026-11-06-goops-catchup.md
- [x] 🤖 5. Crash server run locally (wrangler dev) against the copy; CPU + writes per report measured against Cloudflare's free plan — nothing deployed — .planning/research/2026-11-06-goops-catchup.md
- [x] 🤖 6. check:full green on the copy; the report — .planning/research/2026-11-06-goops-catchup.md
- [x] 🤖 14. Rehearsal finds fixed in the framework, each with a test red first: version's installer asked for <MainMenu version> on a game drawing its own menu (615ab4a); the UI kit's list floor took Credits' whole first group as one row, so the card scrolled as one (9800344, screenshot checked); the saves README now says how a game's own save moves onto the module — the record shape, old golden files, nonsense values in oldSave (4c8992e; the installer warning for old golden files is in task 12); the UI kit 0.42.0 notes now say a live setting has no setter (tests call tellSettingsChanged) and that a game maps its own card words; the crashes installer's maps line (d7b9c1e); the kit's "every Settings row is read" check missed a liveSetting mapper not named `values` (test red first) — ui-kit/kit/controls/ScrollArea.tsx
Check: the copy's check:full green with its e2e sw-update; an old-format Goops progress save loads with its rank; the real Goops' git status unchanged.

## F195 🔧 Glyphtender catch-up rehearsal
Done when: a throwaway copy of Glyphtender (`~/Documents/dev/.scratch/glyphtender-catchup`) runs on today's framework — every module current (rooms 0.15.0 included), the Saves replay hand step, the sprint 60 parts — with its check:full green; a report like Goops'. The real Glyphtender is untouched.
- [x] 🤖 7. Copy Glyphtender, check:full green before any change, timed — .planning/research/2026-11-06-glyphtender-catchup.md
- [x] 🤖 8. Every module to current (rooms 0.15.0's server too, run locally), each timed, hand fixes noted — ~/.claude/config/bmuz/scripts/install-module.mjs
- [x] 🤖 9. The Saves 0.9.0 hand step: its run save's replay wired; its real golden saves still pass — .planning/research/2026-11-06-glyphtender-catchup.md
- [x] 🤖 10. Swap in the shared parts: liveSetting for gameSettings.ts, the kit's full screen for src/ui/fullscreen.ts, startUpdates — .planning/research/2026-11-06-glyphtender-catchup.md
- [x] 🤖 11. check:full green on the copy; the report — .planning/research/2026-11-06-glyphtender-catchup.md
- [x] 🤖 13. Rehearsal finds fixed in the framework, each with a test red first where code: saves UPGRADES 0.9.0 named Glyphtender as holding moves — it holds none (5b01a82); version's installer read crashes/lint copies as game code (91b8f1b); crashes' installer always said "go live" and port 1995 (e293df1); full screen stayed off on a phone that never opened Settings (25f5f0e); the crashes installer still said every build files maps under releases/ — only the release build does since 0.3.0; the crashes 0.3.0 note now says to put back a released map an old check build overwrote — the cause of the real Glyphtender's leftover changed file (98e4808) — ui-kit/kit/blocks/fullscreen.ts
- [ ] 🤖 12. (wrap-up, both games) Framework fixes from both reports, framework check:fast green, both games' real update sprints outlined from the reports — scripts/check-modules.mjs
Check: the copy's check:full green; its golden saves replay; the real Glyphtender's git status unchanged.

## Notes
- Open bugs: no open P0/P1 in BUGS.md.
- Claude's call: two helpers side by side, one per game; a framework fix either one needs goes on dev/v0-38-shared one at a time (the helper says so to main first).
- Claude's call: the crash server only runs locally here; Goops' real deploy (Muzzy's yes, 2026-11-06) is Goops' own sprint.
- Real games: both read-only. Glyphtender has uncommitted release .map files — never touched.
