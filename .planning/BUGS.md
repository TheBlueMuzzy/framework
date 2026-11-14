# Game Framework — Bugs
Open: 2 (P0 0 · P1 0 · P2 1 · P3 1)
## Open
### B001 · P2 · open · found 2026-11-11 in F219 · v0.44.0.29 · PC
A release can carry the creative's half-written notes: release.mjs adds every changed .planning/* and *.md file to the release commit, then /deliver pushes it
Steps: 1. In a game, leave an unsaved edit in any .md file (e.g. a GDD paragraph from Obsidian) 2. /deliver → release.mjs → push · Expected: only the release's own plan updates (ROADMAP / STATE / patch notes) go in the release commit · Actual: every changed .md and .planning file goes in (release.mjs:101 comment says plan updates "ride along" on purpose; :106 lets them through, :335 adds them) · How often: every time there are unsaved notes. Found by the F219 — Deliver pipeline review; the BMUZ engine's Deliver refuses to publish while unrelated unsaved changes exist, so only today's /deliver is affected.
### B002 · P3 · open · found 2026-11-14 in F235 · v0.44.0.36 · GitHub (Linux)
Dev Kit e2e flake: kit/e2e.test.mjs > openTab > "on a phone: a tab on a later page of the tab row, then one back on the first page" timed out (60 s) on GitHub run 43625506084 (commit 10d79f6, plan files only)
Steps: GitHub Checks on dev/bmuz-1-0 · Expected: green on unchanged code · Actual: one timeout; the same code passed before (7b3ce17) and after (470ed57). Not reproduced; find why before raising any timeout.

## Fixed (newest first)
