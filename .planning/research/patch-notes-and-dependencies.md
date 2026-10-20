# Patch notes + dependency/licence checks — research map (2026-10-19, for F84 + F85)

Researched before designing (`/sprint` step 7). Helper web research; several sources are blogs/news (marked), not official docs.

## Patch notes players read
- **Shape:** a 1–3 sentence "highlights" first (what's new for *me*), then **New · Changed · Balance (old → new numbers) · Fixed · Known issues** (with a status: "fix coming", "workaround: …"). Player's side ("Fixed a crash when loading a save"), never "various fixes", never commit-speak. Post every update, even tiny ones; a friendly first-person voice and a one-line "why" build trust. (Bugnet guides, 2025–26 — a vendor: https://bugnet.io/blog/how-to-write-patch-notes-players-actually-read)
- **Platforms:** itch.io devlogs → followers' feed + a once-a-day email digest (no instant push; patchy delivery reported — https://itch.io/t/148037), rich-text editor (Markdown not confirmed → paste formatted text). Steam: "Patch Notes" event (linked to a build, download window + news hub) vs "Major Update" (800×450 cover, can show in Library "What's New") — https://partner.steamgames.com/doc/marketing/event_tools/type_patchnotes · Google Play "What's new" **500 characters** (over = upload fails) · App Store **4,000 characters**, plain text.
- **Conventions:** Keep a Changelog — "changelogs are for humans", newest first, dated, grouped; never paste git logs (https://keepachangelog.com/en/1.1.0/). Commit-generated notes (release-please, changesets) suit libraries, read badly to players.
- **Good pattern:** commit log → grouped draft → a human edits it into player bullets → ONE source file per release → everything else generated from it (CHANGELOG.md, itch text, Steam BBCode, the store short form cut to its limit with a check, an in-game popup).
- **In-game "What's new":** good if polite — once, on the first launch after the version changes; highlights only (3–5 lines) + a "full notes" link; one tap to close; never on a first install or mid-game; skip for patch-only builds.
- **Library changelogs (the framework):** for the games that use it — a **Breaking** section first with "what you must change" upgrade steps, deprecations with a removal version, semver.

## Dependency + licence checks
- **npm audit:** most warnings are dev tools that never ship. The useful one: `npm audit --omit=dev --audit-level=high`. `npm outdated` monthly. (blog, 2025)
- **Supply chain 2025–26:** the Shai-Hulud worm (Sept 2025, 500+ packages; a second wave Nov 2025, 800+) stole maintainers' tokens and pushed poisoned versions that ran at install (CISA alert 2025-09-23 — https://www.anvilogic.com/threat-reports/cisa-shai-hulud-npm-worm). Responses: npm 11.10 (Feb 2026) `min-release-age` (days, off by default); Dependabot cooldown (3-day default since Jul 2026); npm 12 (Jul 2026, news coverage) stops running dependencies' install scripts by default (`npm approve-scripts`).
- **Cheap protections:** commit the lockfile + `npm ci`; `min-release-age=7` in `.npmrc`; no install scripts (npm 12 or `ignore-scripts`); 2FA on GitHub/npm. Dependabot/Renovate only with a cooldown + grouped monthly PRs; GitHub's free security alerts are worth turning on.
- **Code licences (what's bundled into the game):** MIT/BSD/ISC/Apache-2.0 = keep the copyright + licence text (minified bundles strip it → generate a THIRD-PARTY-NOTICES file, link it from Credits; Apache also passes on a NOTICE). MPL-2.0 = per file, fine unmodified. LGPL = awkward in a bundle → avoid. **GPL/AGPL = would force the whole game open → banned for a closed game.** No licence = all rights reserved → don't use. Scan production deps only.
- **Asset licences (no code scanner sees them):** SIL OFL fonts fine to embed (include the licence); CC0 free; CC-BY credit required; CC-BY-SA changes shared alike; **CC-BY-NC = no commercial use — risky even with tips/ads, blocks Steam.**
- **SBOM:** not worth it for a solo indie (`npm sbom` exists if a store asks).
- **When:** every release → production audit (high), licence allow-list, notices regenerated (automatic) · monthly → `npm outdated` + alerts · before 1.0 / a store → review assets, Credits screen, store privacy/age forms.

## What actually bites a solo web-game dev
1. A poisoned package version installed on day one → release-age delay + no install scripts.
2. An asset licence mistake (CC-BY-NC, uncredited) → blocks a store launch or brings a takedown.
3. Patch notes nobody reads or trusts → duplicate bug reports, "dev never says what changed"; store uploads failing on the 500-character limit.

## This machine (2026-10-19)
npm 11.6.2 — older than 11.10, so `min-release-age` isn't understood yet; npm 12's script blocking needs testing first (esbuild, Playwright and others run install steps).
