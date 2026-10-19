# Sprint 14 — check:framework catches what a player would notice
Started 2026-10-19 · Milestone v0.10 · Features: F88
check:framework already catches overlap, cut-off text and small tap targets. This sprint adds the four look-and-comfort bars that CLAUDE.md leaves to Claude's memory (contrast, breathing room, fixed-size cards, comfort settings). Built on `dev/conformance` (worktree `.claude/worktrees/agent-a24e65cae835fd08b`) — check:framework only exists there; no game is changed.

## F88 🔧 Quality bars in check:framework
Done when: check:framework flags faint text, anything touching its card's edge, a card that grows mid-sequence, and a Settings without reduce motion (or without volume when the audio module is in) — on the kit's own gallery it's clean, and each game's gaps are listed for its own session.
- [ ] 🤖 1. Contrast: text below 4.5:1 (3:1 for large text) against what's behind it is flagged — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 2. Breathing room: text, an icon, avatar or badge touching its card's / panel's inside edge is flagged — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. Fixed-size cards: a kit card that changes size after it first appears is flagged — ui-kit/kit/controls/Card.tsx
- [ ] 🤖 4. Settings: reduceMotion switched on is required, plus masterVolume when the audio module is installed — ui-kit/kit/conformance.mjs
- [ ] 🤖 5. Run it on the kit's gallery (fix the kit's own misses) + Glyphtender and Goops read-only (list their gaps) — ui-kit/scripts/shoot.mjs
- [ ] 🤖 6. Tests, README "What a game must provide", UI kit version bump — ui-kit/kit/uiProblems.test.mjs, ui-kit/README.md
Check: a test screen with faint text, a badge touching the edge and a card that grows is flagged once for each; a clean screen passes; a Settings without reduceMotion is flagged; the kit gallery passes at every size.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19 (sprint 14 plan): /develop = yes to F88 alone. F86 → a Saves module, versioning one of its features, its own sprint ("saves would be the module, versioning is a feature of that module") — ROADMAP updated. **After this sprint: /deliver the framework** — merge dev/conformance (40+ commits) into main (Muzzy: "yes. deliver/merge it!").
- Found while planning: plan-lint's ready rule went quiet when a roadmap line had any note after `needs:` ("· gap rank 1") → F82–F84 were never flagged. Fixed in ~/.claude plan-lint (+2 tests); Goops F33/F49/F53 noted in Ideas for its session.
