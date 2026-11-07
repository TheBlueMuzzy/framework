// THE CRASHES MODULE'S VITE PLUGIN — readable errors without ever shipping the game's source. One line in the game's
// vite.config.ts:
//   import { crashesMaps } from './src/crashes/vitePlugin.mjs'
//   plugins: [react(), versionPlugin(), crashesMaps(), …]
// What it does on `vite build`:
//   - turns on build.sourcemap: 'hidden' — the .map files are made, but the built code has no "//# sourceMappingURL"
//     line, so a player's browser never asks for them
//   - after the build is written, MOVES every .map out of the output folder (dist/) into releases/<version>/maps/,
//     keeping its path (dist/assets/index-Bx12.js.map → releases/0.3.1.12/maps/assets/index-Bx12.js.map). So no map is
//     ever uploaded to Pages or itch, and `npm run crashes` finds the right map for each report's version.
// The version is the game's version.json as "X.Y.Z.B" — the same text the game puts in each report (the version
// module's readAppVersion rule; a test checks the two agree). Commit releases/ with the release.
import { mkdirSync, readdirSync, readFileSync, renameSync, copyFileSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

export const MAPS_FOLDER = 'releases'
// 0.3.0: an ordinary build (check:fast, check:full, an e2e's own build) isn't what players run — its maps go here
// instead (node_modules: never committed, never uploaded), so checks leave nothing in releases/. Only the release
// build — CRASHES_MAPS=release, which release.mjs sets with the deploy's settings — files them under releases/.
export const CHECK_MAPS_FOLDER = 'node_modules/.cache/crashes-maps'

/** The game folder's version.json → "X.Y.Z.B" (VERSION_BUILD overrides the build number, as in the version module). */
export function readGameVersion(root, env = process.env) {
  const path = join(root, 'version.json')
  let file
  try { file = JSON.parse(readFileSync(path, 'utf8')) } catch {
    throw new Error(`crashesMaps: ${path} is missing or not JSON — it needs the game's version to know where the maps go (the version module makes it).`)
  }
  const build = env.VERSION_BUILD !== undefined && env.VERSION_BUILD !== '' ? Number(env.VERSION_BUILD) : file.build ?? 0
  if (typeof file.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(file.version) || !Number.isInteger(build) || build < 0) {
    throw new Error(`crashesMaps: ${path} should look like { "version": "0.1.0", "build": 0 }.`)
  }
  return `${file.version}.${build}`
}

/** Every .map file under a folder (paths relative to it, with / between folders). */
export function findMaps(folder, under = folder) {
  let entries = []
  try { entries = readdirSync(folder, { withFileTypes: true }) } catch { return [] }
  const found = []
  for (const entry of entries) {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) found.push(...findMaps(path, under))
    else if (entry.name.endsWith('.map')) found.push(relative(under, path).split('\\').join('/'))
  }
  return found
}

/** Every file under a folder, any kind (paths relative to it). */
function filesUnder(folder, under = folder) {
  let entries = []
  try { entries = readdirSync(folder, { withFileTypes: true }) } catch { return [] }
  return entries.flatMap(e => e.isDirectory() ? filesUnder(join(folder, e.name), under) : [relative(under, join(folder, e.name)).split('\\').join('/')])
}

/** Moves every .map in `outDir` to `mapsDir`, keeping its path. → the paths moved.
 *  0.3.1 (F209): `release` → refuses, BEFORE moving anything, when mapsDir already holds a file: those are the maps of
 *  what players run, and a second release build of the same version would silently replace them. */
export function moveMaps(outDir, mapsDir, { release = false } = {}) {
  if (release) {
    const there = filesUnder(mapsDir)
    if (there.length) {
      throw new Error(`crashesMaps: this version's maps are already filed in ${mapsDir} (${there.length} file(s), e.g. ${there[0]}) — a second release build of the same version would replace the maps of what players run. Nothing was moved. Bump the build or delete the folder if you mean it.`)
    }
  }
  const moved = []
  for (const file of findMaps(outDir)) {
    const from = join(outDir, file)
    const to = join(mapsDir, file)
    mkdirSync(dirname(to), { recursive: true })
    try {
      renameSync(from, to)
    } catch {
      copyFileSync(from, to) // (another drive: copy, then remove)
      rmSync(from)
    }
    moved.push(file)
  }
  return moved
}

/** @param {{ root?: string, version?: string, release?: boolean }} [options] root = the game folder (default: Vite's
 *  root); version = the version to file the maps under (default: version.json); release = this is the build players
 *  get (default: CRASHES_MAPS=release in the environment) → releases/, else the check cache */
export function crashesMaps(options = {}) {
  let outDir = null
  let mapsDir = null
  let release = false
  let log = console.log
  return {
    name: 'framework-crashes-maps',
    apply: 'build',
    config() {
      return { build: { sourcemap: 'hidden' } }
    },
    configResolved(config) {
      const root = resolve(options.root ?? config.root)
      outDir = resolve(config.root, config.build.outDir)
      release = options.release ?? process.env.CRASHES_MAPS === 'release'
      mapsDir = join(root, release ? MAPS_FOLDER : CHECK_MAPS_FOLDER, options.version ?? readGameVersion(root), 'maps')
      log = (message) => config.logger.info(message)
    },
    // closeBundle: after everything is written (public/ copied too), so a .map from anywhere is caught.
    // order 'post' + sequential: after every other plugin's closeBundle has FINISHED — vite-plugin-pwa writes sw.js.map
    // and workbox-*.js.map in its own closeBundle, after the build (the scratch-Goops proof caught two shipping).
    closeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        const moved = moveMaps(outDir, mapsDir, { release })
        if (moved.length) log(`crashes: ${moved.length} source map(s) moved out of the build → ${relative(process.cwd(), mapsDir) || mapsDir}`)
      },
    },
  }
}
