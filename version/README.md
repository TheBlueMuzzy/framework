# Version module

Every game shows its version the same way, from one file. Muzzy, 2026-10-20: "version number visibility is important in
all games… should be a built in process". Built from Goops' own copy (its sprint 11), now one module for every game.

Module **0.2.0** (0.2.0, F193: `startUpdates(registerSW)` — the offline cache's update starter with Goops' fix, a returning player gets a new release on this visit and a first visit never reloads; `checkUpdateArrives` for a game's e2e/sw-update.mjs) (0.1.3, F159: the installer reads its version through the framework’s shared `scripts/kitVersion.mjs` (git asked once per run, in one place); the version line it writes is unchanged) (0.1.2, F128: the installer asks git for the kit’s commit once per run, not on every install). Web (Vite) games.

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

7. **A game with an offline cache** (vite-plugin-pwa 1.3.0+) — its update line in `src/main.tsx` is the starter:
   ```ts
   import { registerSW } from 'virtual:pwa-register'
   import { startUpdates } from './version'
   startUpdates(registerSW)                              // worker file sw.js (vite-plugin-pwa's default)
   startUpdates(registerSW, { worker: 'goops-sw.js' })   // a worker named in vite.config.ts VitePWA "filename"
   ```
   The game hands in its own `registerSW`, so the module never imports `virtual:pwa-register` (a game without an
   offline cache imports the module the same as ever, and skips this step).

`npm run check:framework` checks the first six (and, in the browser, that the page's meta tag equals `version.json`).

## The parts
| File (in the game: `src/version/`) | What |
|---|---|
| `index.ts` | `appVersion` ("X.Y.Z.B") and `versionLabel` ("vX.Y.Z.B") — "dev" when the build had no plugin (a plain test run), never a made-up number; on the dev server with `?freeze-version` in the address `versionLabel` is `FROZEN_LABEL` ("v0.0.0.0") — see "Screenshots" below; re-exports `startUpdates` |
| `updates.ts` | `startUpdates(registerSW, { worker? })` — `registerSW({ immediate: true, onNeedReload })` + the browser's controllerchange; the page reloads (once) only if it already ran under the game's own worker. So: a returning player swaps to a new release on this visit (even when the new worker took over before registerSW was listening), a first visit never reloads — not even one coming from another worker address (Goops v1's /GOOPS/sw.js). Returns `{ returning, ourWorker, update }` |
| `vitePlugin.mjs` | `versionPlugin({ root? })` — `define` `import.meta.env.APP_VERSION`, the meta tag, and a dev-server restart when `version.json` changes (so `/save` never leaves the page on the old number) |
| `e2e.mjs` | `expectedVersion(gameDir?)` · `checkVersion(page, want?)` · `builtVersion(distDir?)` (for a deploy script: the version in `dist/index.html`) · `versionInHtml(html)` · `nextVersion(label, build = 9999)` · `checkUpdateArrives(page, { url, next, publish, worker? })` — a game's e2e/sw-update.mjs: first visit = ONE page load under the game's worker, then `publish()` the next build, open again → the page shows `next` on this visit and settles (no loop); returns `{ ok, checks: [{ name, ok, detail }], … }` for the game to print |
| `versionFile.mjs` | reads `version.json` (shared by the plugin and the e2e helper, so the build and the tests never disagree) |
| `env.d.ts` | types `import.meta.env.APP_VERSION` for the game's TypeScript — nothing to add to the game's own types |
| `conformance.mjs` | the module's checks for `check:framework` |

**Screenshots (0.3.0):** every `/save` raises the build number, and the menu and Settings show it — so a before/after
screenshot check went red on those screens after every save. With `?freeze-version` in the page's address (dev server
only) every place that shows `versionLabel` says `v0.0.0.0` instead. The BMUZ screenshot template (`e2e/shots.mjs`,
template 2+) adds it to every page by itself; nothing to change in the game's screens. `appVersion` and the
`<meta name="app-version">` tag keep the real version, so `checkVersion` still catches a stale page.

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
