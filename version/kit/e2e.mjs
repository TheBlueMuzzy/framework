// THE VERSION MODULE'S E2E HELPER — plain Node, for the game's Playwright scripts (e2e/*.mjs):
//   import { checkVersion } from '../src/version/e2e.mjs'
//   await page.goto(url)
//   await checkVersion(page)       // the page is the build version.json says, or the test stops right here
// Why: a test that runs against an old build (a dev server started before /save bumped the build, a stale dist/, a
// service worker's cached copy) fails later in strange ways. This stops it at the door, by name.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { labelOf, readAppVersion, versionInHtml } from './versionFile.mjs'

export { versionInHtml } from './versionFile.mjs'
export const META_SELECTOR = 'meta[name="app-version"]'

/** What the page should say: "vX.Y.Z.B" from the game folder's version.json (+ VERSION_BUILD, as in the build). */
export const expectedVersion = (gameDir = process.cwd(), env = process.env) => labelOf(readAppVersion(gameDir, env))

/** The plain message for a page that isn't the build version.json says. */
export const staleMessage = (shown, want) => shown
  ? `the page is version ${shown}, but version.json says ${want} — a stale build or a cached service worker? (restart the dev server / rebuild, or clear the site's data)`
  : `the page has no <meta name="app-version"> — the build wasn't made with versionPlugin() (vite.config.ts), or this isn't the game's page (version.json says ${want})`

/**
 * The page's <meta name="app-version"> must equal version.json. Returns the version it shows; throws the plain
 * message otherwise. want = what it should say (default: expectedVersion() from the folder the test runs in).
 */
export async function checkVersion(page, want = expectedVersion()) {
  const meta = page.locator(META_SELECTOR)
  const shown = (await meta.count()) ? await meta.first().getAttribute('content', { timeout: 10_000 }) : null
  if (shown !== want) throw new Error(staleMessage(shown, want))
  return shown
}

/** For a deploy script: the version a build in dist/ carries ("vX.Y.Z.B"), or null. */
export function builtVersion(distDir = 'dist') {
  try { return versionInHtml(readFileSync(join(resolve(distDir), 'index.html'), 'utf8')) } catch { return null }
}

// ---- "A new version arrives" (F193) — the check behind each game's e2e/sw-update.mjs ----
//   import { checkUpdateArrives, expectedVersion, nextVersion } from '../src/version/e2e.mjs'
//   const next = nextVersion(expectedVersion())                 // "v0.11.0.9999"
//   const result = await checkUpdateArrives(page, { url, worker: 'sw.js', next,
//     publish: () => buildAndServe({ VERSION_BUILD: '9999' }) }) // the game's own: build the next release where url serves it
//   for (const c of result.checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
// It opens url (a first visit: ONE page load, then the game's worker runs it), publishes the next build underneath,
// opens url again (a returning player) and waits for the page to show `next` — then that it settles (one swap, no
// loop). The page must be in a fresh browser context, served like the real site (a release build).

/** The same version with another build number: "v0.11.0.4" → "v0.11.0.9999" (a "next release" for an update test). */
export const nextVersion = (label, build = 9999) => {
  const dot = label.lastIndexOf('.')
  return dot < 0 ? `${label}.${build}` : `${label.slice(0, dot)}.${build}` // ("dev" has no build part: add one)
}

/** What the page's version tag says right now (null while it's between pages or has none). */
export const shownVersion = (page) => page.locator(META_SELECTOR).first().getAttribute('content', { timeout: 2_000 }).catch(() => null)

/** The worker running the page now (its full address), or null. */
const controllerOf = (page) => page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL ?? null).catch(() => null)

/**
 * A first visit never reloads; a returning player gets a new build on THIS visit, once. Returns
 * { ok, checks: [{ name, ok, detail }], first, shown, firstVisitLoads, updateLoads } — the game prints the checks.
 * url = the game's address · next = the version the published build shows · publish = puts that build where url
 * serves it · worker = the worker's file name (vite.config.ts VitePWA "filename", default sw.js) ·
 * timeout = ms to wait for the worker / the new version · settle = ms a reload (or a loop) would show within.
 */
export async function checkUpdateArrives(page, { url, next, publish, worker = 'sw.js', timeout = 20_000, settle = 3_000, step = 250 }) {
  const checks = []
  const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail })
  const loads = []
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) loads.push(frame.url()) })
  const waitFor = async (read, done) => {
    let value = await read()
    for (let waited = 0; !done(value) && waited < timeout; waited += step) { await page.waitForTimeout(step); value = await read() }
    return value
  }

  // A first visit: the game's worker takes the page over, and the page never reloads for it
  await page.goto(url)
  const controller = await waitFor(() => controllerOf(page), (c) => c?.endsWith(`/${worker}`))
  await page.waitForTimeout(settle)
  const first = await shownVersion(page)
  const firstVisitLoads = loads.length
  check(`first visit: the game's worker (${worker}) runs the page`, controller?.endsWith(`/${worker}`), controller ?? 'no worker')
  check('first visit: ONE page load — never reloads', firstVisitLoads === 1, loads.join(' → '))

  // A new release underneath; the player opens the link again
  await publish()
  const before = loads.length
  await page.goto(url)
  const shown = await waitFor(() => shownVersion(page), (v) => v === next)
  await page.waitForTimeout(settle)
  const updateLoads = loads.length - before
  const settled = await shownVersion(page)
  check(`returning player gets the new build on THIS visit (${first} → ${next})`, shown === next, `shows ${shown}`)
  check('returning player: settles — one swap at most, no loop', updateLoads <= 2 && settled === next, loads.slice(before).join(' → '))

  return { ok: checks.every((c) => c.ok), checks, first, shown, firstVisitLoads, updateLoads }
}
