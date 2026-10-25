# Sprint 35 — The kit speaks up when something's off
Started 2026-10-24 · Milestone v0.18 The kit speaks up · Features: F129, F130
Muzzy 2026-10-24: "A go" (sprint option A).
What changes: the screenshot run stops when a file changes mid-run; a bubble that can't stay clear of what it avoids says so in the dev console. What stays the same: every screen, every layout, every game until it reinstalls; players never see the warning.

## F129 🔧 The shoot stops on a file change mid-run
Done when: an edit to a gallery or kit file while `npm run shoot` runs ends the run with a plain-English line naming the file ("… changed during the run — the shots mix two versions of the code; run it again"), and a non-zero exit; a run with no edits is unchanged.
- [x] 🤖 1. Watch the Vite server's files during the run; a change stops it with the file's name — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Test: a file touched mid-run ends it red with the file named; an untouched run passes (the watch is in codeChanges.mjs) — ui-kit/scripts/codeChanges.test.mjs
- [x] 🤖 3. README line + UI kit 0.33.3 — ui-kit/kit/VERSION
Check: ui-kit tests; a real shoot run with a file touched part-way stops; a full shoot with no edits still 0 problems.

## F130 🔧 A bubble that can't stay clear says so
Done when: a TalkingBubble, teach callout or emote bubble whose `avoid` can't be met on any side prints one dev-console warning naming what it covers (once until it's clear again, not every frame); nothing prints in a production build; placement is unchanged.
- [ ] 🤖 1. Run the warning on today's gallery at every shoot size and list what it already finds — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. The shared placement warns once when no side is clear — ui-kit/kit/blocks/teach.tsx
- [ ] 🤖 3. Tests: no clear side → one warning naming the covered piece; clear again → quiet; a later block → warns again; production → none — ui-kit/kit/blocks/teach.test.tsx
- [ ] 🤖 4. README / CATALOG `avoid` note — ui-kit/CATALOG.md
Check: ui-kit tests; task 1's list is in Notes; shoot still 0 problems.

Notes:
- F131 (a module's Settings row registers itself) was dropped from option A before planning: reading the code showed it's already built — F110, UI kit 0.30.0: each module ships settings-rows.json and the Settings check reads every installed one, so a new module needs no kit change. The Ideas line was written before F110 and is now marked done. Only the old-copy fallback (OLD_MODULE_ROWS) is left, and it waits on Glyphtender reinstalling (0.34.0).
- No open P0/P1 bugs in this repo.
- Both features are small and touch different files → built by Claude in this chat, no helpers (F130 task 1 runs before task 2, per the sprint rule for a new check).
