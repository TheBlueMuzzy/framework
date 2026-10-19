# Sprint 14 — check:framework catches what a player would notice
Started 2026-10-19 · Milestone v0.10 · Features: F88
check:framework already catches overlap, cut-off text and small tap targets. This sprint adds the four look-and-comfort bars that CLAUDE.md leaves to Claude's memory (contrast, breathing room, fixed-size cards, comfort settings). Built on `dev/conformance` (worktree `.claude/worktrees/agent-a24e65cae835fd08b`) — check:framework only exists there; no game is changed.

## F88 🔧 Quality bars in check:framework
Done when: check:framework flags faint text, anything touching its card's edge, a card that grows mid-sequence, and a Settings without reduce motion (or without volume when the audio module is in) — on the kit's own gallery it's clean, and each game's gaps are listed for its own session.
- [x] 🤖 1. Contrast: text below 4.5:1 (3:1 for large text) against what's behind it is flagged — ui-kit/kit/uiProblems.mjs
- [x] 🤖 2. Breathing room: text, an icon, avatar or badge touching its card's / panel's inside edge is flagged — ui-kit/kit/uiProblems.mjs
- [x] 🤖 3. Fixed-size cards: a kit card that changes size after it first appears is flagged — ui-kit/kit/controls/Card.tsx
- [x] 🤖 4. Settings: reduceMotion switched on is required, plus masterVolume when the audio module is installed — ui-kit/kit/conformance.mjs
- [x] 🤖 5. Run it on the kit's gallery (fix the kit's own misses) + Glyphtender and Goops read-only (list their gaps) — ui-kit/scripts/shoot.mjs
- [x] 🤖 6. Tests, README "What a game must provide", UI kit version bump — ui-kit/kit/uiProblems.test.mjs, ui-kit/README.md
Check: a test screen with faint text, a badge touching the edge and a card that grows is flagged once for each; a clean screen passes; a Settings without reduceMotion is flagged; the kit gallery passes at every size.
Checked: ui-kit tests 375/375 (faint text flagged once with its ratio; a badge touching its card + words with no padding flagged once each; a card that fills in after settling flagged once — settling, shrinking, a resize, a widened column and a late picture aren't; growth read once per check; no reduceMotion → fails, volume only with audio) · typecheck, check-ui, lint exit 0 · gallery `npm run shoot` 269 shots: 0 problems from the new checks (56 older ones remain — Ideas) · Claude looked at parts in Cartoon (phone) + Clean (desktop): white/black initials read, chips padded · Glyphtender (scratch copy): all 13 UI-kit checks pass · Goops (scratch copy): new checks pass, 5 older gaps (Ideas).
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19 (sprint 14 plan): /develop = yes to F88 alone. F86 → a Saves module, versioning one of its features, its own sprint ("saves would be the module, versioning is a feature of that module") — ROADMAP updated. **After this sprint: /deliver the framework** — merge dev/conformance (40+ commits) into main (Muzzy: "yes. deliver/merge it!").
- Found while planning: plan-lint's ready rule went quiet when a roadmap line had any note after `needs:` ("· gap rank 1") → F82–F84 were never flagged. Fixed in ~/.claude plan-lint (+2 tests); Goops F33/F49/F53 noted in Ideas for its session.
- F88 (helper; Claude re-ran the kit's checks, looked at shots, fixed the review): checks in ui-kit/kit/uiProblems.mjs ("faint:", "edge:", "grows:"), new kit/fixedSize.ts (useFixedSize on Card + PlayerChip, dev builds only), comfort-rows check in conformance.mjs (also runs with --static). Kit's own misses fixed: avatar initials pick white/black by the player's colour; PlayerChip's score has a fixed slot (`scoreDigits`, default 2 — a game with 3-digit scores passes 3); xs chips + badges and icon buttons at 200% text got room. UI kit 0.21.0. Decisions: can't-judge (text over pictures/gradients, outlined/glowing text) is skipped, not flagged; Panel isn't watched (menus open centred, then grow down on purpose); `data-ui-bleed` lets a picture run edge to edge.
- Sprint 14 review (helper; Claude fixed 3 of 4 + tests): ① every Card was watched, so a card whose column widened or whose picture loaded late was flagged → growth now counts only when something inside the card changed (Claude's first fix, watching the column's width, would have broken chips in shrink-to-fit rows — replaced) and pictures are waited for · ② avatar initials' colour rule needs Safari 18 / Firefox 128 → older browsers keep on-primary (@supports) · ③ growth seen on the first screen was blamed again on the next → read once · ④ a game with no Settings file fails the comfort check → kept on purpose (the bar is that every game has reduce motion).


Retro:
- went well: "happy to move forward. all is good so far."
- went wrong: nothing named (Muzzy: "all is good so far")
- change: none asked for — keep going straight to /deliver of the framework as planned
