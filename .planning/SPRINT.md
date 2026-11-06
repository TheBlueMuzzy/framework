# Sprint 59 — Each game says what the other could use
Started 2026-11-05 · Milestone v0.37 · Features: F189

## F189 🎮 Games list module candidates
Done when: Glyphtender and Goops each have a list of their own parts checked against the module recipe §2 (structure · named by a player · would the other game use it), plus which frozen modules the other game could take; one combined page ranks what passes and says in one line why the rest stay in their game; Muzzy picks what the next milestone extracts. Read-only: nothing moved, nothing extracted.
- [ ] 🤖 1. Prove the cleanup still stands: framework check:fast, hook + script suites green, first-hand — scripts/check-modules.mjs
- [x] 🤖 2. Glyphtender's list: its own parts (not module copies) against recipe §2, and which frozen modules Goops could take — .planning/research/module-candidates/glyphtender.md
- [x] 🤖 3. Goops's list: its own parts (input, ladder, progress, goo, view…) against recipe §2, and which modules Glyphtender lacks that Goops proves — .planning/research/module-candidates/goops.md
- [x] 🤖 4. One combined page: candidates that pass the two-game rule, ranked; one line per part that stays; published — .planning/research/module-candidates/README.md (page: https://claude.ai/artifact/DdPjzuDHUEUB7j9cyC5wyv)
- [ ] 🙋 5. Read it: which candidates go into the next milestone's extraction? — .planning/research/module-candidates/README.md
Check: both games' `git status` identical before and after; every candidate names its files and the §2 test it passes; Claude opens each candidate's files first-hand before it goes on the page.

## Notes
- Open bugs: no open P0/P1. The golden-save gap (ROADMAP Bugs 2026-11-04) waits for the next milestone — it matters when games take Saves.
- Claude's call: two helpers in parallel (one per game), each saves its list to its file; Claude checks every candidate's files and writes the combined page.
- Claude's call (Muzzy 2026-11-05: "get this knocked out and get back to working on games"): no separate wait to re-measure the cleanup — the firing log keeps recording while games are worked on, and the monthly /checkup removal pass reads it. Task 1 re-runs the checks first-hand instead.
- F189 lists (Claude 2026-11-05): no new brick needed yet. Way in: Goops takes Saves + Crashes + Lint (unfreezes Saves + Crashes). Parts in existing bricks both games already wrote: live game settings (UI kit), phone screen (UI kit), update-on-first-visit fix (Version), Dev Kit tab opener + screenshot check (test helpers). Tutorial player = the one possible new brick, trial first. Claude opened every named file; both games' git status identical before and after.
- Glyphtender has 2 uncommitted release map files (releases/0.14.1.0/maps/) from an earlier session — left alone.
