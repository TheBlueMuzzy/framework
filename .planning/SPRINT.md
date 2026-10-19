# Sprint 12 — every BMUZ step runs by itself or gets checked
Started 2026-10-19 · Milestone v0.9 · Features: F80
Muzzy's rule (2026-10-19): "'only runs when it remembers' is a bad thing. 'always runs because it triggers' is much more solid." Kinds: ① automatic (a script/hook does it) · ② judgement but checked (a trigger refuses to move on until it's on record, like F75) · ③ judgement only (rare, with a reason). All work is in `~/.claude/` (skills, config/bmuz) → laptop via /sync; games and framework modules are untouched.

## F80 🔧 Everything triggers
Done when: every step in /save and /deliver is ① or ② (none rely on Claude remembering), a pretend "I'm done for tonight" with unpushed work is refused until it's saved + pushed, every other remembered-only line from the audit is ① / ② / ③-with-a-reason, and test-hooks + test-scripts + test-skills are green.
- [ ] 🤖 1. Audit every BMUZ skill line by line (discover, define, sprint, develop, deliver, save, bug, ppp, play, sketch, checkup, bmuz, roadmap, gdd, tdd, sync + PROJECT-FILES.md + CLAUDE.md "always" lines): each step's kind ①/②/③, remembered-only ones with a proposed trigger (helper) — ~/.claude/config/bmuz/reviews/2026-10-19-triggers/AUDIT.md
- [ ] 🤖 2. /save: remaining remembered steps move into the script — runs tests/build itself, refuses when RESUME HERE wasn't rewritten, rebuilds the planner, runs config-sync status/push — ~/.claude/config/bmuz/scripts/save.mjs, ~/.claude/skills/save/SKILL.md
- [ ] 🤖 3. /deliver: release refuses without STATE/Log updated, a finished sprint unarchived, check:framework not run, or code after `Reviewed through` unreviewed; runs cleanup.sh itself — ~/.claude/config/bmuz/scripts/release.mjs, ~/.claude/skills/deliver/SKILL.md
- [ ] 🤖 4. Session-end guard: a session-end prompt ("done", "switching machines", "bed") with uncommitted/unpushed work → the Stop hook won't let the turn end until it's saved + pushed — ~/.claude/config/bmuz/hooks/session-moments.mjs, hooks/
- [ ] 🤖 5. Convert the rest of the audit's remembered-only lines → ① or ②, or ③ with a one-line reason — files named in AUDIT.md
- [ ] 🤖 6. Standing rule: test-skills fails on a new "always / every time" line without its kind; the look-back template flags remembered-only lines; PROJECT-FILES rule line — ~/.claude/config/bmuz/scripts/test-skills.mjs, templates/lookback.md, PROJECT-FILES.md
- [ ] 🤖 7. Tests for 2–6 + HOOKS.md rows — ~/.claude/config/bmuz/hooks/test-hooks.mjs, scripts/test-scripts.mjs, HOOKS.md
Check: AUDIT.md shows zero remembered-only lines in /save + /deliver; a fake session-end with unpushed work is refused; test-hooks, test-scripts, test-skills green.
Ask Muzzy: —

Notes:
