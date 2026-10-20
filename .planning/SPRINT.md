# Sprint 22 — Every game shows its version + Goops' kit fixes
Started 2026-10-20 · Milestone v0.10 · Features: F102, F103 (in this order)
From the Goops session's notes (its STATE + archive/sprints/sprint-11.md Notes): Muzzy 2026-10-20 "version number visibility is important in all games… should be a built in process, possibly a 'version' framework module that gets added to every game" — Goops built its own copy (vite.config.ts define + `<meta name="app-version">` plugin, src/version.ts, e2e/start.mjs checkVersion, deploy.js reads the meta) and wrote what a module needs; plus three kit nits it logged for this session. Today the three games show three formats (Goops v0.0.0.0 · Glyphtender `v0.10.3`, no build · Roll Better its own overlay; Glyphtender's Dev Kit adapter has no "v"). F62 (Goops passes the pack) stays with the Goops session (it's heading to /deliver alpha). Nothing deployed; real games get these when their own sessions install them.

## F102 🧱 Version module
Done when: a game installs `version/` and, from its version.json alone (the file /save bumps), shows `vX.Y.Z.B` in the same places — main-menu footer, the bottom of Settings, the Dev Kit's snapshots and bug files — and its page carries `<meta name="app-version">`; an e2e helper refuses to test a stale build or a cached service worker; check:framework checks the wiring; one format kit-wide.
- [x] 🤖 1. The module: a Vite plugin (reads version.json, build override by env for update tests, defines the version, injects the meta tag) + `versionLabel()` "vX.Y.Z.B" — version/ (new module folder beside saves/)
- [x] 🤖 2. The e2e helper: `expectedVersion()` + `checkVersion(page)` (the page's meta = version.json, else a plain "stale build or cached service worker?") — version/ (new module folder beside saves/)
- [ ] 🤖 3. UI kit Settings: a version line at the bottom of every tab (`version` prop), so a game needs no About tab — ui-kit/kit/blocks/Settings.tsx
- [ ] 🤖 4. Dev Kit: the adapter's `version` documented and shown in the same "vX.Y.Z.B" form — devkit/README.md
- [ ] 🤖 5. conformance.mjs for check:framework (plugin in vite.config, label on the menu + Settings, an e2e calls checkVersion) + installer + install-module's module list + MODULE-CONTRACTS line + README — version/ (new module folder beside saves/), ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 6. Proof: scratch Glyphtender installs it — menu + Settings show v0.10.3.B, a bug file carries it, a stale build is refused by checkVersion; screenshots at every size — version/README.md
Check: version tests + tsc + lint green; scratch Glyphtender shows the same vX.Y.Z.B on the menu footer, Settings (every tab) and a Dev Kit bug file; its meta tag matches version.json; checkVersion passes on a fresh build and fails with the plain message on a stale one; check:framework's version checks pass there and fail on a game without the wiring; screenshots 390×844, 360×780, 844×390, ~768×343, ~1100 wide, 1440×900, 1920×1080 looked at.
Ask Muzzy: —

## F103 🔧 Kit fixes from Goops
Done when: a confirm button inside Settings works even when a game forgets `...kitScreens`; the Bar row can share space "at most" its share and the dock panel can have tight side padding as kit options (Goops' two app.css overrides and their check:ui warnings can go); the Dev Kit's check warns when the closed-panel PAUSED pill sits on the game's HUD, naming `pauseBadgeSpot`.
- [ ] 🤖 7. ScreenStack always knows the kit's own screens (confirm …) — a game's own screens still win; a pushed screen with no entry warns instead of drawing an empty layer — ui-kit/kit/ScreenStack.tsx
- [ ] 🤖 8. Bar row "at most its share" + dock panel tight side padding as kit options (style names, no px in parts) — ui-kit/kit/blocks/blocks.css
- [ ] 🤖 9. Dev Kit check: the closed-panel PAUSED pill vs the game's HUD at phone sizes → a warning that names content/devkit.json `pauseBadgeSpot` — devkit/kit/devkit.css
- [ ] 🤖 10. Proof in a scratch Goops (PORTRAIT ONLY — never 844×390 for Goops): its two overrides removed, the new options used, the 2 check:ui warnings gone, Replay lessons confirm works without `...kitScreens`; shots 390×844, 360×780, 1440×900 — ui-kit/README.md
- [ ] 🤖 11. A hand-over note for the Goops session (what to update, what to delete from app.css, the version module to swap its own copy for) — ui-kit/README.md
Check: ui-kit + devkit tests + tsc + lint green; scratch Goops: Settings → Replay lessons → confirm runs with the game's screens WITHOUT kitScreens; bars + dock fit 360×780 with no app.css overrides and no check:ui warnings; the pill check warns on Goops' current spot and passes after a spot change; shots looked at.
Ask Muzzy: —

Notes:
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
- Technical calls (Claude): one format everywhere = "vX.Y.Z.B" with the v (Goops' choice; the Dev Kit README's "0.1.0.12" example changes); the version sits at the bottom of every Settings tab, not an About tab (Goops: "there is NO Settings footer slot"); the module is shaped like saves/ and audio/ (kit/ + conformance.mjs + scripts/install-version.mjs); stores later map X.Y.Z → versionName and the build count → versionCode (noted for the store run-through, not built).
