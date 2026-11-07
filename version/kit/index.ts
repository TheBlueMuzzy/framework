// THE VERSION MODULE — import from 'src/version'. README: framework/version/README.md
// One source: version.json → versionPlugin() in vite.config (vitePlugin.mjs) bakes it in → these two names. Every
// place a player or a test looks shows versionLabel, so every game shows its version the same way:
//   <MainMenu version={versionLabel} …>      the main-menu footer (UI kit)
//   <Settings version={versionLabel} …>      the bottom of every Settings tab (UI kit 0.24.0)
//   version: versionLabel                    the Dev Kit adapter (snapshots + bug files)
// Without the plugin (a plain test run, a page built some other way) it says "dev" — never a made-up number.

/** "X.Y.Z.B" — version.json's version + build (or VERSION_BUILD), or "dev" when the build didn't bake one in. */
export const appVersion: string = import.meta.env.APP_VERSION ?? 'dev'

// Held still for screenshots (0.3.0, F204): the before/after screenshot check (e2e/shots.mjs) adds ?freeze-version to
// every page, and then every place shows FROZEN_LABEL — otherwise each /save's new build number turned the menu and
// Settings pictures red (Glyphtender's freeze.ts did this by hand). Dev server only; a release build always shows the real
// one. The real version stays in appVersion and the page's <meta name="app-version"> (what checkVersion reads).
export const FREEZE_VERSION_PARAM = 'freeze-version'
export const FROZEN_LABEL = 'v0.0.0.0'
const frozen = import.meta.env.DEV === true && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has(FREEZE_VERSION_PARAM)

/** What every place shows: "vX.Y.Z.B" (or "dev"; FROZEN_LABEL while a screenshot check holds the page still). */
export const versionLabel: string = frozen ? FROZEN_LABEL : appVersion === 'dev' ? 'dev' : `v${appVersion}`

// The offline cache's updates (F193): a returning player gets a new release on this visit, a first visit never reloads.
// The game hands in its own registerSW — this module never imports 'virtual:pwa-register'. updates.ts says how.
export { startUpdates, type RegisterSWOptions, type ServiceWorkerLike, type StartedUpdates, type UpdateOptions } from './updates'
