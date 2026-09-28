# Sprint 03 — The game-ui skill works on its own, proven on Roll Better's settings
Started 2026-09-28 · Milestone v0.1 · Features: F06, F07 (in this order)
Branch: dev/v0-1-ui-kit (framework) · Roll Better work goes on its own branch `dev/v1-6-drag-to-unlock`

## F06 🧱 The game-ui skill
Done when: when any game needs UI, the `game-ui` skill kicks in by itself, gets the kit (from `dev/framework`, or clones it), gets a style picked (5-style sheet), installs/updates the kit in the game, builds from the catalog, checks the rules and screenshots — with no hand-steering; BMUZ steps call it by name.
- [ ] 🤖 1. `~/.claude/skills/game-ui/SKILL.md` — the passive rules (design §5); finds the kit in `dev/framework/ui-kit` or clones TheBlueMuzzy/framework
- [ ] 🤖 2. `ui-kit/CATALOG.md` — every known screen: Built (block + gallery link) or Recipe (parts + sketch); the niche list
- [ ] 🤖 3. Install/update tool `ui-kit/scripts/install-kit.mjs <game>` — copies `kit/` → `<game>/src/ui/kit/` with a VERSION stamp; creates `content/ui/style.json` + `content/ui/settings.json`; merges font credits into `content/credits.json`; on update shows what changes
- [ ] 🤖 4. Rule checker ships inside the kit (`kit/check-ui.mjs`) so it checks a game's own UI code too
- [ ] 🤖 5. Style-pick sheet: `scripts/pick-sheet.mjs` → one image of a screen in all 5 styles side by side
- [ ] 🤖 6. Wiring: /develop (any UI task → game-ui), /define build plan (pick the style), /bmuz specialists, PROJECT-FILES layout (`content/ui/`), checkup `sources.json`; sync to claude-config
Check: a dry run of the skill on a scratch copy of a game goes start to finish; tests + build + check-ui pass.

## F07 ❓ Try it: Roll Better settings
Done when: Roll Better's Settings is rebuilt with the kit (same rows, same behaviour), in the style Muzzy picked, and Muzzy judges it better (or says what's off).
- [ ] 🤖 7. Run the skill on Roll Better (branch `dev/v1-6-drag-to-unlock`): show the 5-style sheet → 🙋 Muzzy picks the style → install kit → rebuild `src/components/Settings.tsx` from the Settings block with Roll Better's rows (audio volume, performance, tips, confirmation, quit/leave, privacy link)
- [ ] 🤖 8. Before/after report: lines removed (Settings.tsx + its App.css share), phone + desktop screenshots, what was awkward → fixes into kit/skill (version bump)
- [ ] 🙋 9. Try the new settings in Roll Better on phone + desktop — better? (tuning)
Check: Roll Better `npm test` + `npm run build` pass; e2e solo still passes; Muzzy's look.

Ask Muzzy: (answered) try-out = Roll Better settings.
Notes:
