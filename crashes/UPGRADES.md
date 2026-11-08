# Crashes — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.3.1: no hand step. A release build (`CRASHES_MAPS=release`) now refuses — the build fails, nothing moved — when releases/<version>/maps/ already holds a file, instead of silently replacing the maps of what players run. Meaning to rebuild a released version's maps? Delete that folder first (or bump the build). Check builds are unchanged (F209).
- 0.3.0: only the RELEASE build files crash maps under releases/<version>/maps/ (`CRASHES_MAPS=release` — release.mjs sets it and builds with the deploy workflow's env right after the release commit, then commits the maps); checks and e2e builds put theirs in node_modules/.cache/crashes-maps/, so they leave nothing to clean up. A game that rebuilt its maps by hand at /deliver (Glyphtender STATE: "NODE_ENV=production VITE_PARTY_HOST=… npm run build") drops that step. Delete any untracked releases/*/maps folders left by old check builds (git clean -n releases first), and put back any RELEASED map an old check build overwrote (`git status releases` shows it as changed — Glyphtender: releases/0.14.1.0/maps/assets/aiCheck.worker-*.js.map): `git restore releases/` (F195 rehearsal).

Older versions had no hand steps: the installer prints whatever wiring is still missing.
