# Sprint 17 — releases and live games get watched for you
Started 2026-10-20 · Milestone v0.10 · Features: F82, F83
Release safety first, then the save layers (Muzzy 2026-10-20: "I want you to do all of them"). Queue: 17 F82 + F83 · 18 F93 + F95 (players get back where they were) · 19 F96 + F94 (saves travel: link code + seed/move log) · 20 F97 + F98 + F99 (saves everywhere: stores/Steam, checked leaderboards, Unity). Work in `~/.claude` (BMUZ scripts, hooks, skills) + the rooms kit on `dev/v0-10`; no game is changed.

## F82 🔧 Is the live game up?
Done when: session start checks STATE's Live URL in at most 3 seconds and says "the live site is DOWN" only when it is (silent when up, when there's no Live URL, or when offline); live-check.mjs also checks the room server's `/health`; the rooms kit answers `/health`.
- [ ] 🤖 1. Rooms kit server answers `GET /health` with `ok` + the kit version (no room needed), test — rooms/kit/server/roomServer.ts
- [ ] 🤖 2. live-check.mjs pings the room server's health URL (STATE Key facts `Rooms:` URL, when there is one) and names it in plain words when it's down — ~/.claude/config/bmuz/scripts/live-check.mjs
- [ ] 🤖 3. Session start: a 3-second check of STATE's Live URL; one line "the live site is DOWN (<url>) — /deliver's rollback or live-check" only when it fails; no line when it's up, missing, or this machine is offline — ~/.claude/config/bmuz/hooks/producer-notes.mjs
- [ ] 🤖 4. Tests: a site that's up, down (500), slow (> 3 s → never holds the session), no Live URL, offline — ~/.claude/config/bmuz/hooks/test-hooks.mjs, ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: a fake down site prints the DOWN line at session start, an up one prints nothing, a 10-second one gives up after 3 s; live-check with a down room server names it; the rooms kit test hits /health.
Ask Muzzy: —

## F83 🔧 Stage-release checks (alpha / beta / 1.0)
Done when: release.mjs refuses an alpha / beta / 1.0 release without `.planning/archive/release-checks/<stage>.md` filled in, listing every missing line at once; at beta and later, stand-in art left in credits.json is refused; at 1.0 the name/trademark check and press kit are asked for.
- [ ] 🤖 5. Checklist template: devices tried · a first-time player who played without help · store-page screenshots newer than the last stage · TDD §7 for the platform (privacy, age rating) · no stand-in art (beta+) · name/trademark check + press kit (1.0) — ~/.claude/config/bmuz/templates/release-check.md
- [ ] 🤖 6. release.mjs: a stage release refuses while the checklist is missing, unfilled, or has an unticked line, naming each; `--dry-run` writes the template for that stage — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 7. Beta and later: any credits.json entry marked stand-in (and stand-in files the check can find) refused, naming each — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 8. Tests + /deliver step + PROJECT-FILES format line — ~/.claude/config/bmuz/scripts/test-scripts.mjs, ~/.claude/skills/deliver/SKILL.md, ~/.claude/config/bmuz/PROJECT-FILES.md
- [ ] 🙋 9. Read the checklist template — anything a real alpha / beta check needs that's missing? — ~/.claude/config/bmuz/templates/release-check.md
Check: a scratch game's beta release with no checklist, a half-ticked one, or a stand-in sprite in credits.json is refused naming each line; a full one passes; an update release never asks for it.
Ask Muzzy: —

Notes:
- Plan-lint clean, no open P0/P1 bugs (2026-10-20).
- F82: the rooms kit has no health route today (checked 2026-10-20) → framework-first task 1.
