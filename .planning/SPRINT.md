# Sprint 62 — Can one tutorial system teach both games?
Started 2026-11-06 · Milestone v0.38 · Features: F197

## F197 ❓ Tutorial trial
Done when: on a throwaway copy of Glyphtender (`~/Documents/dev/.scratch/glyphtender-tutorial-trial`), its first 3 tutorial (rails) steps run from Goops-style lesson files through Goops' lesson runner, its e2e tutorial-rails passes unchanged, before/after shots on phone + desktop look the same to Claude — and a published page gives the verdict (one tutorial module, or each game keeps its own) with numbers: lines moved, lines left game-only, hand fixes, what studios do; Muzzy says whether it teaches the same and agrees with the verdict. The real Glyphtender and Goops are untouched.
- [x] 🤖 1. The trial and its page: how studios build tutorials (short research) + both systems side by side (Glyphtender src/tutorial vs Goops src/game/lessons + content/lessons/*.json); the copy takes Goops' runner, every Goops-only part noted; the first 3 rails steps rewritten as lesson files; e2e tutorial-rails unchanged and green; before/after shots (390x844, 1440x900), Claude looks; the verdict published as a page — .planning/research/tutorial-trial.md (page: https://claude.ai/artifact/5H3vkAU5fKjwhVSajLUZim)
- [ ] 🙋 2. Read the page and play the copy's first 3 steps: does it teach the same? Agree with the verdict? — .planning/research/tutorial-trial.md
Check: the copy's e2e tutorial-rails green without edits to the script (git diff of e2e/ empty); Claude compares the before/after shots first-hand at both sizes; the line counts in the page match a wc -l; both real games' git status + HEAD unchanged.
Ask Muzzy: (task 2) does the copy teach the same as today's Glyphtender?
Notes:
- Claude's call: one fresh helper does task 1 (lots of reading across two games); F196 — Test helpers waits for the next sprint.
- Claude's call: work branch `dev/tutorial-trial` — the trial only adds a research page here; no module is built until the verdict says so.
- Real Glyphtender has uncommitted release .map files (known, sprint 61) — read-only, never touched; the copy is made from its committed HEAD.
- Open bugs: no BUGS.md open P0/P1.
- Task 1 (helper, checked by Claude 2026-11-06): Goops' runner went into the copy byte-identical (diff checked); e2e/ untouched (git diff empty); tutorial-rails 470 ok before and after; runner/railsLesson/lesson file line counts re-counted; real Glyphtender 5659b8c + its 9 known .map lines, Goops a334977 clean, at start and end (re-checked); phone 'lines' before/after and desktop draft1 shots looked at by Claude — same. Verdict proposed: (c) each game keeps its own; Goops' runner is the proven brick for the next game.
- For Glyphtender's own update session: its check:devkit (the build it runs) writes .map files into releases/ — a check changing tracked files; same cause as the sprint 61 leftover.
- Muzzy 2026-11-06, task 2: Q1 "yes" (the copy teaches the same). Q2 "i'm not sure. I think the idea I had for a tutorial module was that it has the building blocks, and each game uses it differently." — Claude laid out what that means in practice; waiting on his pick.
- Format gap for a future brick: no field for button words (Next / Got it / Play); runner contract should say setup is where a step's state is decided.
