# Sprint 64 — Checks any game can reuse
Started 2026-11-07 · Milestone v0.40 · Features: F196, F202, F203 (in this order; F196 ∥ F202 first)

## F196 🔧 Test helpers
Done when: a game's e2e opens the Dev Kit and any of its tabs with one helper that waits for the panel (never a fixed wait), and a before/after screenshot check is a BMUZ template — record the "before" set, compare a later run pixel by pixel, a page that shows what changed — with the turn-based starter using both and its check:full green.
- [ ] 🤖 1. Dev Kit e2e helpers `openDevKit(page)` / `openTab(page, name)` from Glyphtender's (waits for the panel; the tab strip's pages), shipped with the Dev Kit so a game's e2e imports them — tests — devkit/kit/DevKit.tsx
- [ ] 🤖 2. The starter's Dev Kit e2e uses them instead of its own key presses and waits — starters/turn-based/e2e/devkit-live.mjs
- [ ] 🤖 3. Before/after screenshot template from Glyphtender's (screens + sizes listed by the game; record, compare, a changes page; the size list follows the game's orientation) — ~/.claude/config/bmuz/templates/check-all.mjs
- [ ] 🤖 4. The starter records its before set (committed) and check:full compares it; a deliberate one-pixel change goes red, then back — starters/turn-based/scripts/check-all.mjs
Check: devkit tests + the starter's check:full green with the new helper and shots check; the shots check red on a changed screen, green after re-recording; Glyphtender's own copies untouched.

## F202 🔧 Swap rehearsal mode
Done when: `node ~/.claude/config/bmuz/scripts/extract.mjs swap <id> --rehearse` run inside a throwaway copy of a game (any folder name) installs the released module, re-points the imports, deletes the old files and runs the entry's checks — exactly as a real swap — but never writes to the framework's queue or the real game, and says so; F198's Goops rehearsal re-run with it comes out green.
- [x] 🤖 5. Tests red first: --rehearse in a copy with another folder name works; the real queue file is byte-for-byte unchanged after it; without --rehearse a copy is still refused — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [x] 🤖 6. extract.mjs swap --rehearse (finds the entry by the copy's git history / origin, prints "REHEARSAL — nothing recorded") + the module recipe and PROJECT-FILES say when to use it — ~/.claude/config/bmuz/scripts/extract.mjs
- [ ] 🤖 7. Proof: a fresh Goops copy, `swap X01 --rehearse`, its checks green; the real Goops and the queue untouched — .planning/design/module-recipe.md
Check: test-scripts green with the new tests; the Goops copy swap green; extractions.md and the real Goops' git status unchanged.

## F203 🔧 Stale template warning
Done when: every BMUZ template a game copies carries a `template: <name> <version>` line, a game's copy that's behind (or has none) is named at session start with the one-line fix, like a module that's behind — and each game's current copies are reported (Glyphtender's ports.mjs was behind).
- [ ] 🤖 8. A version line in each copied template (check-all.mjs, ports.mjs, checks.yml, slow-tests.mjs, the F196 shots template) + a changelog line per template — ~/.claude/config/bmuz/templates/ports.mjs
- [ ] 🤖 9. A script lists a game's template copies against the templates (behind · no version line · fine), tests red first — ~/.claude/config/bmuz/scripts/lib.mjs
- [ ] 🤖 10. Session start names the stale ones (one line each, with the copy command), quiet when all are current — ~/.claude/config/bmuz/session-start.sh
- [ ] 🤖 11. Run it on Glyphtender, Goops and the starter (read-only) and list what's behind in Notes; the starter's copies brought current — starters/turn-based/scripts/ports.mjs
Check: hook + script tests green; session start in the framework names nothing; a scratch game with an old ports.mjs gets the line; the real games read-only.

## Notes
- Auto mode (Muzzy 2026-11-07: "/sprint auto mode"): Claude plans and builds; taste calls → Ask Muzzy lines.
- Claude's call: F196's helper ships inside the Dev Kit (games import it from their Dev Kit copy, one version to keep current); the shots check is a BMUZ template like check-all.mjs, because it's a test script a game copies and fills with its screens.
- Claude's call: one helper on framework + starter files (F196) ∥ one on ~/.claude scripts (F202), then F203 (it touches the templates F196 adds). This session has already written to ~/.claude this week (develop skill, MODULE-CONTRACTS, the check-all template) — auto mode allows it; every ~/.claude edit is pushed to ~/.claude-config right after (config-sync.sh push).
- What stays the same for Muzzy: no game changes; the starter plays as before. What he'll see: at session start, a line when a game's test scripts are behind.
- Open bugs: no BUGS.md open P0/P1.
