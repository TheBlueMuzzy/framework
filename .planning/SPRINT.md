# Sprint 65 — Checks that hold still
Started 2026-11-07 · Milestone v0.41 · Features: F204, F205 (in this order; F206 dropped — a duplicate of F190)

## F204 🔧 Version label holds still in screenshots
Done when: while a check holds the screen still (the screenshot check's freeze switch), the menu and Settings show one fixed version label, so raising a game's build number leaves the before/after screenshot check green — the real version is still what checkVersion and the crash reports see; the starter and the shots template use it.
- [x] 🤖 1. Prove it: a scratch copy of the starter with its build number raised turns the shots check red on menu + Settings — .scratch (proof only) · starters/turn-based/e2e/shots.mjs
- [x] 🤖 2. The version module shows a fixed label ("v0.0.0.0") while the page is held still; versionLabel stays the real one for checkVersion and crash reports — tests — version/kit/index.ts
- [x] 🤖 3. The starter's menu and Settings use it, and the shots template + the starter's copy hold it still — starters/turn-based/src/ui/MainMenuScreen.tsx
- [x] 🤖 4. README + upgrade note (how a game turns it on; Glyphtender's own freeze.ts can go) — version/README.md
Check: the scratch copy with a raised build number: shots check green; the version module's tests; the starter's check:full green.
Checked: 2026-11-07 — before the fix `VERSION_BUILD=99 node e2e/shots.mjs check` → 12/56 red (menu ×7, Settings ×5); after (version 0.3.0 + template 2, before set re-recorded, menu@1440x900 looked at: footer v0.0.0.0) → 56/56 same, 0 px. Version tests 5/5 (freeze on dev → v0.0.0.0, release build ignores it, no switch → real). Starter check:full 12/12 ALL PASS (1.9 min, incl. screenshots + framework). Review: Claude read the diff (label frozen only on DEV + the param; the meta tag + appVersion stay real; address() joins ? / & right) — fine; /code-review low empty in 8 s.

## F205 🐞 Starter's screen check follows the game's orientation
Done when: the starter's e2e/screens.mjs shoots only the sizes content/ui/style.json's orientation allows (portrait: no sideways phones, landscape: no upright phones, any: all 7), the same way the shots check chooses them.
- [x] 🤖 5. screens.mjs reads the orientation and picks its sizes like shots.mjs — starters/turn-based/e2e/screens.mjs
- [x] 🤖 6. Prove it on a scratch copy set to "portrait" (5 sizes, no sideways shots) and on the starter ("any", 7 sizes) — starters/turn-based/e2e/screens.mjs
- [x] 🤖 7. Every other copy that promises "the 7 sizes" (the starter's README, check-all's comment) says "the sizes the game plays at" — starters/turn-based/README.md
Check: the portrait scratch copy shoots 5 sizes; the starter's screens check is still green at 7.
Checked: 2026-11-07 — portrait (style.json for one run): 8 screens × 5 sizes, no sideways shots; the starter (any): 8 screens × 7 sizes OK; check:full 12/12 ALL PASS. Review: same read as F204.

## Notes
- Plan picked by Muzzy 2026-11-07 ("your pick").
- Read before planning: the version module bakes the real version in on the dev server too (version/kit/vitePlugin.mjs DEFINE_KEY), and the starter's own version.json hasn't changed since F151, so the starter never showed the break — a game whose /save raises its build does. Crash maps by script already landed (F174 — Crash maps by the release script), so that Idea isn't in this sprint.
- Open bugs: no BUGS.md open P0/P1.
- F206 — Golden saves replay their moves: **dropped, a duplicate of F190 — Save check replays the moves** (✅ v0.38, released in v0.40.0 on 2026-11-06), which closed the same 2026-11-04 Idea — but that Idea line was never marked "→ F190", and Claude's planning grep looked at the code words, not the ✅ features. The F206 helper reproduced it on today's code: two bad copies of `turn-based-starter_run-v1.json` (move 2 on the taken square 4; a Nim move `{ pile: 0, take: 2 }`) each fail "<file> loads with today's code", naming the move; the real golden saves pass (saves 136/136, starter check:fast green). Nothing built (helper commit eb0c092 only touched this file; not merged — its notes are here). Lesson → ~/.claude/skills/sprint/SKILL.md step 2.
- F204 task 3: no screen code changed — the starter's menu + Settings already pass versionLabel. The starter took version 0.3.0 (install-module), shots template → 2 (~/.claude/config/bmuz/templates/shots.mjs + TEMPLATES.md; the starter's copy too), before set re-recorded (menu + Settings now show v0.0.0.0 — looked at menu@1440x900), then `VERSION_BUILD=99 node e2e/shots.mjs check` → all 56 match, 0 pixels (was 12 red).
- F204 task 1 (proof, no copy needed — the version module reads VERSION_BUILD): `VERSION_BUILD=99 node e2e/shots.mjs check` in the starter → 12 of 56 red, all ~250 px: menu at all 7 sizes, Settings at 5 (upright-phone Settings shows the line off-screen). The starter's node_modules on this PC predated F196 (no pixelmatch) — `npm install` there first.
- Claude's call (F204, read version/kit/index.ts + conformance.mjs): hold `versionLabel` itself still under `?freeze-version` (dev server only) instead of a new `shownVersion` name — games change no screen code and check:framework's `version={versionLabel}` rule stays as is; `appVersion` and the meta tag keep the real number for checkVersion. Only a Dev Kit snapshot taken inside a screenshot run would say v0.0.0.0.
- F205: screens.mjs reads style.json orientation like shots.mjs (same size lists). Starter ("any"): SCREENS OK — 8 screens × 7 sizes; with style.json set to "portrait" for one run: 8 screens × 5 sizes, shots only at 390x844 · 360x780 · 1100x800 · 1440x900 · 1920x1080 (in ~/Documents/dev/.scratch/framework-f205), then put back. README (3 lines) + check-all's comment no longer promise "7 sizes".
- Muzzy 2026-11-07: typed /develop after "Approve F204 + F205?" — taken as yes for both.

Retro (Claude's draft 2026-11-07 — Muzzy's words win; he can change it any time):
- went well: both checks proven red-then-green on real runs (12 of 56 pictures red on a raised build → 0; 7 sizes → 5 for an upright game), and the starter's full check passed first time.
- went wrong: F206 re-planned work F190 had finished two days before — the Idea line was never marked, and the planning grep looked at code words, not finished features; a helper spent ~4 min finding out.
- change: when planning from Ideas, grep the ROADMAP's ✅ features for the Idea's words too (landed in the sprint skill).
