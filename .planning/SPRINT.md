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
Checked: 2026-10-24 (Claude) — 4 tests in codeChanges.test.mjs (nothing changed · edit / new / deleted file named · its own screenshots ignored · the message). Real runs: touching gallery/Talk.tsx ~45 s in → "✗ stopped: Talk.tsx changed during the run …", exit 2; after naming files from ui-kit/ (the server root is gallery/), touching kit/kit.css → "✗ stopped: kit/kit.css changed …", exit 2. Final full shoot with no edits: 475 shots, 0 problems. Review: diff read whole by Claude, no bugs.

## F130 🔧 A bubble that can't stay clear says so
Done when: a TalkingBubble, teach callout or emote bubble whose `avoid` can't be met on any side prints one dev-console warning naming what it covers (once until it's clear again, not every frame); nothing prints in a production build; placement is unchanged.
- [x] 🤖 1. Run the warning on today's gallery at every shoot size and list what it already finds — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. The shared placement warns once when no side is clear — ui-kit/kit/blocks/teach.tsx
- [x] 🤖 3. Tests: no clear side → one warning naming the covered piece; clear again → quiet; a later block → warns again; production → none — ui-kit/kit/blocks/teach.test.tsx
- [x] 🤖 4. README / CATALOG `avoid` note — ui-kit/CATALOG.md
Check: ui-kit tests; task 1's list is in Notes; shoot still 0 problems.
Checked: 2026-10-24 (Claude) — 4 tests in teach.test.tsx (once, not every frame · quiet while clear, line not even made · again after a clear spell · nothing in production · the words). Real browser (gallery talk screen, 667×375, the avoided pickers stretched over the window): 0 warnings before → 1 when stuck → still 1 after more frames → 1 when cleared → 2 when stuck again; it reads "[ui-kit] the TalkingBubble at "THE VETERAN · speaker" can’t stay clear of "◀ Wave ▶" (its avoid) …" (first try named the bubble "Next" and ran words together — now part + target, words as shown, names made only when said). Task 1: full shoot with the warning counted → 0 finds on today's gallery; final shoot 475 shots, 0 problems. check:fast all 20 green (one earlier red: the rooms install test timed out while check:fast and a full shoot ran at once — the same test takes 16 ms under the shoot alone, no wait or git call in it; green on the re-run). Review: diff read whole by Claude, no bugs. UI kit 0.33.3.

Notes:
- F130 task 1: the shoot now counts the kit's own `[ui-kit]` dev warnings as problems (Claude's call — the gallery should have none); on today's code it found 0.
- F131 (a module's Settings row registers itself) was dropped from option A before planning: reading the code showed it's already built — F110, UI kit 0.30.0: each module ships settings-rows.json and the Settings check reads every installed one, so a new module needs no kit change. The Ideas line was written before F110 and is now marked done. Only the old-copy fallback (OLD_MODULE_ROWS) is left, and it waits on Glyphtender reinstalling (0.34.0).
- No open P0/P1 bugs in this repo.
- Both features are small and touch different files → built by Claude in this chat, no helpers (F130 task 1 runs before task 2, per the sprint rule for a new check).

Retro:
- went well: both features proven in real runs, not only tests (a file touched mid-shoot stopped it; a bubble forced stuck in the gallery warned once); the first try's poor warning names were caught by reading the real output
- went wrong: F131 was offered from an Ideas line that F110 had already built — found only when planning its tasks; the proof script's screenshot landed in the repo (ui-kit/stuck.png) and was committed by /save until the security review spotted it
- change: (Muzzy 2026-10-24) check old ideas against the code before offering them as features (→ /sprint skill line)
