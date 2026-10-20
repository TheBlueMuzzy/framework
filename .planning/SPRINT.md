# Sprint 16 — every release says what changed and ships nothing risky
Started 2026-10-19 · Milestone v0.10 · Features: F84, F85
Researched first (`.planning/research/patch-notes-and-dependencies.md`). Patch notes: one notes file per release, drafted from the commits, edited by Muzzy, everything else made from it. Dependencies: a security check on what players get, no GPL-family code in a closed game, a notices file for the licences that ask for one, a 7-day wait on brand-new package versions (the 2025 npm worm). Work in `~/.claude` (BMUZ scripts, skills) + the UI kit on `dev/v0-10`; no game is changed.

## F84 🔧 Patch notes players can read
Done when: `/deliver` drafts the release's notes from its commits, Muzzy edits them, and release.mjs refuses while they're missing, still a draft, without highlights or full of dev talk — then writes CHANGELOG.md and prints itch-ready text.
- [ ] 🤖 1. One notes file per release, `.planning/archive/releases/vX.Y.Z.md`: Highlights · New · Changed · Balance (old → new) · Fixed · Known issues for games; Breaking + upgrade steps · New · Fixed for a library; neutral voice ("Fixed the crash when…"); PROJECT-FILES format line — ~/.claude/config/bmuz/PROJECT-FILES.md
- [ ] 🤖 2. release.mjs `--draft-notes` writes the draft from the commits since the last tag (grouped, marked DRAFT); the release refuses while the file is missing, still DRAFT, has no highlights, or has dev talk in a game's notes (F-numbers, bug ids, file names, "Dev Kit") — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 3. On release: CHANGELOG.md updated (newest first, dated) and the itch-ready text printed (+ saved beside the notes) — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 4. /deliver §4 + §7 use the notes file; tests — ~/.claude/skills/deliver/SKILL.md, ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: a release with no notes, a DRAFT, no highlights, or "Fixed B012 in src/x.ts" in a game's notes is refused, naming each; a good notes file → CHANGELOG.md gets the version on top and the itch text prints.
Ask Muzzy: —

## F85 🔧 Dependency + licence check
Done when: every release checks the packages players get (high-severity security issues and GPL / AGPL / LGPL / no-licence packages refused in plain words), writes a notices file the Credits screen links to, CC-BY-NC assets count as 🔴, every project waits 7 days before taking a brand-new package version, and /checkup reports outdated packages, security and licences per game monthly.
- [ ] 🤖 5. deps-check: `npm audit --omit=dev --audit-level=high` + the licence of every shipped package (allow MIT, ISC, BSD, Apache-2.0, 0BSD, MPL-2.0; refuse GPL / AGPL / LGPL / none); release.mjs runs it as a gate — ~/.claude/config/bmuz/scripts/deps-check.mjs, ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 6. THIRD-PARTY-NOTICES written at each release (each shipped package's licence text) into the game's public folder; the UI kit's Credits links to it when present; CC-BY-NC / "non-commercial" in credits.json counts as 🔴 — ~/.claude/config/bmuz/scripts/deps-check.mjs, ui-kit/kit/blocks/frontend.tsx, ui-kit/kit/conformance.mjs
- [ ] 🤖 7. npm 11.10+ on this PC (laptop: HUB machine to-do) + `min-release-age=7` in each project's `.npmrc` (the installer templates add it) — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 8. /checkup §8 monthly: outdated packages, production security check and licence summary per game, plain words — ~/.claude/config/bmuz/checkup.sh, ~/.claude/skills/checkup/SKILL.md
Check: a scratch game with a GPL package, a high-severity advisory or a CC-BY-NC sound is refused at release; a clean one passes and its THIRD-PARTY-NOTICES lists every shipped package; the Credits screen shows the link; checkup prints §8 for each game.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19: "yes. voice: neutral" — patch notes say "Fixed the crash when…", not "We fixed…".
- Later (→ Ideas): Steam BBCode + store short forms with their length limits (Play 500, App Store 4,000) · in-game "What's new" (once after an update, highlights only) · npm 12 (blocks install scripts — test esbuild / Playwright first) · Dependabot with a cooldown, grouped monthly.
