# Sprint 31 — Make the new story pieces solid
Started 2026-10-24 · Milestone v0.14 Story pieces made solid · Features: F115, F116, F117
Muzzy 2026-10-24: /develop after the /sprint options (no pick given → Claude's pick a, as offered). Auto mode: one helper per feature group, commit per task, save per feature, waits for his OK; nothing released.
What changes: Goops (after it reinstalls) gets a reveal that replays by itself and a bubble screen readers and keyboards can follow; the planner trims its own log. What stays the same: how both pieces look and move.

## F115 ✨ StatList replays its reveal when its rows change
Goops' session 2026-10-24: a Modal that swaps its stats keeps the same StatList mounted, so the reveal doesn't replay (Goops passes key={payIndex}). Done when: new rows (by content) restart the reveal and a fresh onRevealed; the same rows re-rendered don't; Victory / GameOver too; tests.
- [x] 🤖 1. Restart the reveal when the rows change (by labels + values), fresh onRevealed guard — ui-kit/kit/blocks/flow.tsx
- [x] 🤖 2. Tests: swap rows → replays + onRevealed again; same rows re-rendered → no replay; reduce motion — ui-kit/kit/blocks/flow.test.tsx
- [ ] 🤖 3. Gallery payslip "Next payday" swaps rows without a key; README line — ui-kit/gallery/Report.tsx
Check: ui-kit tests + root check:fast; the gallery payslip swapped twice in a real browser, reveal replays each time.

## F116 ✨ Talking bubble for every player
Sprint 29 review minors: the LiveAnnouncer is created with its text (some screen readers skip it), focus isn't moved to a remounted bubble, the same line twice doesn't restart, bad talk.json values draw broken outlines. Done when: one lasting announcer region (mounted once, text changes) reads every new bubble line and every emote; a new bubble with onConfirm takes keyboard focus (without stealing it from a text box); the same text said again restarts; out-of-range / missing feel values fall back to the defaults; tests.
- [ ] 🤖 1. A lasting shared announcer (mounted once per page, text changes) used by TalkingBubble and the emote bubbles — ui-kit/kit/blocks/emotes.tsx
- [ ] 🤖 2. Focus moves to a new confirmable bubble (unless the player is typing in a field); a line said twice restarts (a line counter, not the text) — ui-kit/kit/blocks/talkingBubble.tsx
- [ ] 🤖 3. Feel values clamped to safe ranges, missing / null → the default — ui-kit/kit/blocks/talkingBubble.tsx
- [ ] 🤖 4. Tests (announcer region stays, text changes per line; focus; repeat; clamping) + a real-browser accessibility-tree check — ui-kit/kit/blocks/talkingBubble.test.tsx
Check: ui-kit + emotes tests, root check:fast; the gallery talk page read through Playwright's accessibility snapshot shows each line once in the live region.

## F117 🔧 plan-lint trims the STATE Log itself
Moved the oldest Log line to archive/log.md by hand 6+ times in sprints 28–30. Done when: an edit that leaves STATE's Log over 10 entries makes the hook move the oldest ones to the top of archive/log.md (newest first, header kept, CRLF kept) and say so in one line instead of refusing; tests.
- [ ] 🤖 1. plan-lint moves the overflow to archive/log.md instead of flagging it — ~/.claude/config/bmuz/hooks/plan-lint.mjs
- [ ] 🤖 2. Tests: 11 → 10 + 1 archived on top; 13 → 3 archived in order; a missing archive file is created with its header; CRLF kept — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [ ] 🤖 3. HOOKS.md + PROJECT-FILES.md lines — ~/.claude/config/bmuz/HOOKS.md
Check: test-hooks plan-lint suite green; one real STATE edit past 10 trimmed by itself.

Notes:
