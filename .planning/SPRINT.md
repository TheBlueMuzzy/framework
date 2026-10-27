# Sprint 45 — Ready to translate
Started 2026-10-27 · Milestone v0.27 Ready to translate · Features: F91
Muzzy 2026-10-27 (/sprint): picked "Ready to translate" for v0.27; plan OK'd as written.
What changes: a game's lint flags player words typed into code (games that keep their words in content/text/en.json); a dev-only "long fake language" mode makes every word accented and ~40% longer, and the framework check plays the game in it so words that won't fit once translated are named. What stays the same: normal play and English, every game until it installs the update. Not in this sprint: a Language setting or real translations (the localize skill, when a game is translated).

## F91 🔧 Translation readiness
Done when: the lint module flags player words written into game code (JSX text, title / label / aria-label / placeholder / alt props, a game's own words objects) in a game with content/text/en.json, with `// text-ok: <why>` for real exceptions and a test red on bad code; a fake-language mode (accented, ~40% longer, `{slots}` kept, kit word defaults included) can be switched on in dev; check:framework runs the UI kit's cut-off check in it; the starter takes both with every check green.
- [ ] 🤖 1. Research first (how studios check translation readiness: pseudo-localisation, no-literal-string lint rules, how much longer other languages run, what must survive: {slots}, plurals), then measure a draft rule over the starter, Roll Better, Goops and Glyphtender (read-only); list the finds in Notes — lint/kit/rules.mjs
- [ ] 🤖 2. Rule: player words in game code (bmuz/no-player-text, on only where content/text/en.json exists), `// text-ok: <why>`, RuleTester test red on bad code; the installer adds it — lint/kit/rules.mjs
- [ ] 🤖 3. Fake-language mode: one transform (accents, ~40% longer, brackets, {slots} kept) applied to en.json where it's imported and to the kit's word defaults, switched on in dev only; tests — ui-kit/kit/blocks/words.ts
- [ ] 🤖 4. check:framework plays the game in the fake language and runs the cut-off check there (measure first: list what it finds in the starter and the gallery before fixing anything) — ui-kit/kit/conformance.mjs
- [ ] 🤖 5. The starter takes both (install-module); fix or mark what they find; its check:fast + check:full green — starters/turn-based/vite.config.ts
- [ ] 🤖 6. READMEs + VERSIONs; the externalize-text and localize skills point at the rule and the mode; finds in other games go to Ideas as hand-offs — lint/README.md
Check: the rule's test red on bad code, then green; the transform's tests; the fake-language cut-off check finds a planted too-long word, then passes on the fixed starter; the starter's `npm run check:full` green; root check:fast green; the task-1 find list accounted for.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- What we start from (2026-10-27, read-only map): no central t(); each game file imports content/text/en.json and reads fields (`text.mainMenu.play`); kit blocks take a `words` prop with English defaults (ui-kit/kit/blocks/words.ts: fill, noOrphan); emotes / banter get their en.json objects; the Dev Kit Text tab edits en.json. Only narrow hard-coded-words checks exist (emotes and AI banter conformance). The starter's own code has ~0 literal player words; its English lives in en.json (27 reads) and in kit / module word defaults (CrashScreen, EmoteLayer, ~80 kit defaults). The cut-off check is uiProblems' `clipped:` kind, run by the UI kit's conformance and the gallery shoot.
