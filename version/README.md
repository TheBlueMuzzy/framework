# Version module

Every game shows its version the same way, from one file. Muzzy, 2026-10-20: "version number visibility is important in
all games… should be a built in process". Built from Goops' own copy (its sprint 11), now one module for every game.

Module **0.1.0**. Web (Vite) games.

## What it does
- **One source:** `version.json` — `{ "version": "X.Y.Z", "build": N }` (BMUZ versioning: `/save` bumps `build`,
  `/deliver` bumps `version`; `~/.claude/references/versioning.md`).
- **One format, everywhere:** `vX.Y.Z.B` — e.g. `v0.11.0.4`.
- **The same places in every game:** the main-menu footer, the bottom of every Settings tab, the Dev Kit's snapshots
  and bug files, and `<meta name="app-version" content="vX.Y.Z.B">` in the page (what tests and deploy scripts read).
- **Tests refuse a stale build:** `checkVersion(page)` stops an e2e script whose page isn't the build `version.json`
  says — a dev server started before `/save` bumped the build, an old `dist/`, or a service worker's cached copy —
  with "the page is version v0.11.0.3, but version.json says v0.11.0.4 — a stale build or a cached service worker?"

## Install
`node ~/.claude/config/bmuz/scripts/install-module.mjs version <game>` (the module's own tests first, then the
installer, then its checks in the game). The installer copies `kit/` → `src/version/`, gives a game with no
`version.json` a starter one, and prints only the wiring still missing.

## What a game must provide
1. **vite.config.ts** — the plugin (it reads `version.json`, bakes the version in, puts the meta tag in the page):
   ```ts
   import { versionPlugin } from './src/version/vitePlugin.mjs'
   plugins: [react(), versionPlugin(), …]
   ```
2. **The main menu** (UI kit): `<MainMenu version={versionLabel} …>` — the footer line. A main menu the game draws
   itself (Goops' console art): put `data-version-spot="main-menu"` on the element that shows `{versionLabel}` (the
   same file imports it from `../version`); check:framework accepts that instead of `<MainMenu>`. A game-drawn Settings
   screen: `data-version-spot="settings"`.
3. **Settings** (UI kit 0.24.0+): `<Settings version={versionLabel} …>` — one caption line under the pages, the same
   spot on every tab, so no About tab is needed (an info row with id `version` fills itself from it too).
4. **The Dev Kit adapter:** `version: versionLabel,` — stamped as given on snapshots and bug files.
5. **An e2e script** (the one every test starts from, if there is one):
   ```js
   import { checkVersion } from '../src/version/e2e.mjs'
   await page.goto(url)
   await checkVersion(page)
   ```
6. **Nothing else reads `version.json`** — `import { versionLabel } from '../version'` instead, so every place says the
   same thing (with the build number and the v).

`npm run check:framework` checks all six (and, in the browser, that the page's meta tag equals `version.json`).

## The parts
| File (in the game: `src/version/`) | What |
|---|---|
| `index.ts` | `appVersion` ("X.Y.Z.B") and `versionLabel` ("vX.Y.Z.B") — "dev" when the build had no plugin (a plain test run), never a made-up number |
| `vitePlugin.mjs` | `versionPlugin({ root? })` — `define` `import.meta.env.APP_VERSION`, the meta tag, and a dev-server restart when `version.json` changes (so `/save` never leaves the page on the old number) |
| `e2e.mjs` | `expectedVersion(gameDir?)` · `checkVersion(page, want?)` · `builtVersion(distDir?)` (for a deploy script: the version in `dist/index.html`) · `versionInHtml(html)` |
| `versionFile.mjs` | reads `version.json` (shared by the plugin and the e2e helper, so the build and the tests never disagree) |
| `env.d.ts` | types `import.meta.env.APP_VERSION` for the game's TypeScript — nothing to add to the game's own types |
| `conformance.mjs` | the module's checks for `check:framework` |

**Update tests:** `VERSION_BUILD=<n>` overrides the build number for one build or test run (the plugin and
`expectedVersion` both read it) — a "next release" without touching `version.json`.

**Stores, later:** X.Y.Z → `versionName`, the build count → `versionCode` (noted for the store run-through, not built).

## Proven (F102, 2026-10-20)
In a scratch Glyphtender (`.scratch/glyphtender-f102`, `e2e/f102-version.mjs`): v0.11.0.0 the same on the menu footer,
both Settings tabs and a Dev Kit bug file at 390×844, 360×780, 844×390, 768×343, 1100×800, 1440×900 and 1920×1080;
the meta tag = version.json; a version.json bump on a running dev server shows without a restart; a release build
passes checkVersion fresh and is refused in plain words once version.json moves on. check:framework: the six Version
checks pass wired, and five fail (the sixth, the browser one, skipped with --static) before the wiring.

## Develop
`npm install`, then `npm test` (version.json reading + plain errors, the plugin in a real Vite server, `versionLabel`,
the e2e helper on a stand-in page, the checks on real little game folders through the Dev Kit's tester, the
installer), `npm run typecheck`, `npm run lint`.
