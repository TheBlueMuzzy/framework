# Sprint 23 — A game says "portrait only" once
Started 2026-10-20 · Milestone v0.10 · Features: F104
From sprint 22's retro (change: "a game says 'portrait only' once and every check honours it") and the F103 proof, where check:framework's UI part checked Goops sideways though Muzzy said 3 times "the game is not expected to function in horizontal/landscape mode. ever." Sizes live in ui-kit/kit/conformance.mjs SIZES (7, two of them a phone on its side: 844×390, 768×343), ui-kit/scripts/shoot.mjs, and the size list in the develop skill's helper briefs. Muzzy 2026-10-20: "approved" (the pick).

## F104 🔧 Portrait only, said once
Done when: a game's content/ui/style.json can say `"orientation": "portrait"`; check:framework (UI kit part), the kit's screenshot script and the Dev Kit's phone checks then skip the phone-on-its-side sizes and say "skipped — portrait only" (desktop sizes stay: a portrait game still runs in a desktop window); a game that doesn't say it is checked at all 7 sizes as before; helper briefs name it; breathing room in briefs is measured to the visible art, not the CSS box (retro).
- [x] 🤖 1. `orientation` in style.json ("any" default · "portrait" · "landscape"), read once, and SIZES filtered by it (phone-on-its-side sizes out for portrait, upright phones out for landscape), reported as skipped — ui-kit/kit/conformance.mjs
- [x] 🤖 2. The screenshot script honours it — ui-kit/scripts/shoot.mjs
- [x] 🤖 3. Dev Kit checks with their own phone sizes honour it (the pill check already upright-only; any other size loop) — devkit/kit/check-framework.mjs
- [x] 🤖 4. Skills: the develop skill's size list and game-ui say "minus the sizes the game's orientation rules out", and breathing room is measured to the visible frame/art, not the CSS box (sprint 22 retro) — ~/.claude/skills/develop/SKILL.md
- [ ] 🤖 5. Docs + versions: style.json template / catalog line, README, UI kit + Dev Kit VERSION bumps, Goops hand-over note gets `"orientation": "portrait"` — ui-kit/README.md
- [ ] 🤖 6. Proof: scratch Goops with "portrait" → check:framework's UI part runs 5 sizes and lists the 2 sideways as skipped; scratch Glyphtender (no orientation) → all 7 — ui-kit/kit/conformance.test.mjs
Check: ui-kit + devkit tests + tsc + lint green; scratch Goops: check:framework names "portrait only" and runs no 844×390 / 768×343; scratch Glyphtender: 7 sizes as before; a bad value ("sideways") → a plain warning and all sizes.
Ask Muzzy: —

Notes:
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
- Technical calls (Claude): a portrait game still gets the desktop sizes (Goops runs in a desktop browser window, its layout centred) — only "a phone on its side" sizes go; the setting sits in content/ui/style.json (the kit already reads it, Muzzy can edit it in Obsidian) rather than a new file.
- Task 2: not needed — ui-kit/scripts/shoot.mjs shoots the UI kit's own gallery (its own Vite on 5180), never a game; no game has a copy. Task 3: the pill check was the only Dev Kit check with phone sizes — upright by default, sideways when style.json says "landscape" (read directly: a game can have the Dev Kit without the UI kit); the other browser checks (Dev Kit + version) use one 1280×800 desktop page.
