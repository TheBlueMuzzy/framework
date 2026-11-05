# Sprint 58 — One recipe for modules, and bloat checked both ways
Started 2026-11-05 · Milestone v0.37 · Features: F188, F187

## F188 ❓ Module recipe
Done when: one short page says what counts as a module (brick · plumbing · quality gate), how a part comes out of a game, how a module goes into a game, and what proves it — built from the approved audit — including what happens to the extraction queue; Muzzy says it matches how he pictures it.
- [x] 🤖 1. Write the recipe and publish it as a page (decides keep / simplify / archive for the extraction queue) — .planning/design/module-recipe.md (page: https://claude.ai/artifact/PVnzrSrjBddLtYp65SbcCD)
- [ ] 🙋 2. Read it: does it match how you picture it? — .planning/design/module-recipe.md
Check: every step names its tool or check (install-module, the module's conformance pack, starter-check, the firing log…); nothing in it contradicts PROJECT-FILES, MODULE-CONTRACTS or the framework README (or those get fixed); the two-game rule and the freeze from the audit are in it.
Notes (F188, Claude 2026-11-05): extraction queue KEPT — it is the one safe way to swap a game's own code for a brick (checks + automatic undo); used once only because games were paused. What changes is when: only when a second game needs the part (recipe §3). PROJECT-FILES "Extraction queue" + the framework README now point to the recipe.

## F187 🔧 Bloat test both ways
Done when: the bloat test in BMUZ-PLAN asks every addition what it replaces; git's own commit step refuses a commit that ADDS a new hook rule file or a new framework module folder without a "Replaces: …" line (or "Replaces: nothing — <why>"); the monthly /checkup proposes removals from the firing log (rules that never fired, rules that mostly cry wolf) — and everyday commits are untouched.
- [ ] 🤖 1. Bloat test both ways in BMUZ-PLAN: an addition names what it replaces or why nothing; removals happen for a reason (consolidating, efficiency) — ~/.claude/config/bmuz/BMUZ-PLAN.md
- [ ] 🤖 2. Commit rule: a commit adding a new rule file under hooks/rules/ or a new top-level framework module folder needs "Replaces: …" in its message — tests red first — ~/.claude/config/bmuz/hooks/rules/guard-git/_hook.mjs
- [ ] 🤖 3. /checkup removal pass: from the firing log, rules that never fired in 60 days and rules whose firings were mostly undone the next step → proposed cuts in the checkup report (proposals only) — ~/.claude/config/bmuz/checkup.sh
- [ ] 🤖 4. Whole hook + script suites green; HOOKS.md regenerated; pushed — ~/.claude/config/bmuz/hooks/test-hooks.mjs
Check: the new commit rule refuses a test commit that adds a rule file with no "Replaces:" and lets the same commit through with one; an everyday commit (no new rule / module) passes untouched; the checkup pass run on today's firing log lists its proposals; whole suites green.

## Notes
- Open bugs: none open in the framework (BUGS.md has no open P0/P1).
- Claude's call: Claude writes the recipe (F188) — it is built from the audit Muzzy approved, and Muzzy only checks it matches how he pictures it. One fresh helper builds F187 (all in ~/.claude) and saves its proof numbers to a file as well as its report (sprint 57 retro).
- Claude's call: the "Replaces:" rule only looks at commits that ADD a rule file or a module folder — never everyday commits — so it can't become the next false alarm.
