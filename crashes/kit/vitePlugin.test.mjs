// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { readAppVersion } from '../../version/kit/versionFile.mjs'
import { CHECK_MAPS_FOLDER, crashesMaps, findMaps, readGameVersion } from './vitePlugin.mjs'

const dirs = []
const gameAt = (version, build) => {
  const dir = mkdtempSync(join(tmpdir(), 'crashes-maps-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'version.json'), JSON.stringify({ version, build }))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html><head><title>t</title></head><body><script type="module" src="/src/main.js"></script></body></html>')
  mkdirSync(join(dir, 'src'))
  writeFileSync(join(dir, 'src', 'main.js'), 'export function placePiece(board) { return board.cells.x }\nplacePiece(window.board)\n')
  mkdirSync(join(dir, 'public'))
  writeFileSync(join(dir, 'public', 'stray.js.map'), '{}') // a map someone left in public/: caught too
  return dir
}
afterEach(() => {
  delete process.env.VERSION_BUILD
  delete process.env.CRASHES_MAPS
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true })
})

describe('crashesMaps', () => {
  it('a release build: hidden maps, every .map moved to releases/<version>/maps/, none left in dist, no sourceMappingURL', async () => {
    const root = gameAt('0.3.1', 12)
    process.env.CRASHES_MAPS = 'release'
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] })
    const dist = join(root, 'dist')
    expect(findMaps(dist)).toEqual([])
    const maps = join(root, 'releases', '0.3.1.12', 'maps')
    const moved = findMaps(maps)
    expect(moved).toContain('stray.js.map')
    const scriptMap = moved.find((f) => /^assets\/.+\.js\.map$/.test(f))
    expect(scriptMap).toBeTruthy()
    const script = readFileSync(join(dist, scriptMap.replace(/\.map$/, '')), 'utf8')
    expect(script).not.toContain('sourceMappingURL')
    expect(JSON.parse(readFileSync(join(maps, scriptMap), 'utf8')).sources.join()).toContain('main.js')
  }, 60_000)

  it('a map another plugin writes after the build (vite-plugin-pwa: sw.js.map, workbox-*.js.map) is moved too', async () => {
    // (found by the scratch-Goops proof: the PWA plugin, enforce post, writes its service worker + maps in its own
    // sequential closeBundle — after crashesMaps had already swept dist/, so two maps shipped)
    const root = gameAt('0.1.0', 1)
    process.env.CRASHES_MAPS = 'release'
    const pwaLike = {
      name: 'pwa-like', enforce: 'post', apply: 'build',
      closeBundle: {
        sequential: true,
        async handler() {
          // eslint-disable-next-line no-restricted-syntax -- the delay IS the case: a plugin that writes its maps late
          await new Promise((done) => setTimeout(done, 50))
          writeFileSync(join(root, 'dist', 'sw.js'), 'self.x=1\n//# sourceMappingURL=sw.js.map\n')
          writeFileSync(join(root, 'dist', 'sw.js.map'), '{}')
        },
      },
    }
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps(), pwaLike] })
    expect(findMaps(join(root, 'dist'))).toEqual([])
    expect(findMaps(join(root, 'releases', '0.1.0.1', 'maps'))).toContain('sw.js.map')
  }, 60_000)

  it('the version is the same text the version module gives (and the game puts in reports), VERSION_BUILD included', () => {
    const root = gameAt('0.10.2', 7)
    expect(readGameVersion(root)).toBe(readAppVersion(root))
    process.env.VERSION_BUILD = '9'
    expect(readGameVersion(root)).toBe(readAppVersion(root))
    expect(readGameVersion(root)).toBe('0.10.2.9')
  })

  it('no version.json → a plain reason; a version passed in is used as it is', async () => {
    const root = mkdtempSync(join(tmpdir(), 'crashes-maps-'))
    dirs.push(root)
    expect(() => readGameVersion(root)).toThrow(/version\.json is missing/)
    const game = gameAt('0.1.0', 0)
    await build({ root: game, configFile: false, logLevel: 'silent', plugins: [crashesMaps({ version: '9.9.9.9', release: true })] })
    expect(existsSync(join(game, 'releases', '9.9.9.9', 'maps'))).toBe(true)
  }, 60_000)

  it('0.3.0: an ordinary build (a check, an e2e) keeps its maps out of dist AND out of releases/ — only the release build files them', async () => {
    // (Glyphtender v0.12–v0.14: check builds left 15+ untracked maps in releases/<version>/maps, and a local build's maps
    // don't fit the live code — the release build with the deploy's settings is the only one that counts)
    const root = gameAt('0.2.0', 3)
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] })
    expect(findMaps(join(root, 'dist'))).toEqual([])
    expect(existsSync(join(root, 'releases'))).toBe(false)
    expect(findMaps(join(root, CHECK_MAPS_FOLDER, '0.2.0.3', 'maps'))).toContain('stray.js.map')
  }, 60_000)

  it('0.3.1 (F209): a second release build of the same version is refused, plainly, and moves nothing', async () => {
    // (F195 rehearsal: the second build silently replaced the committed maps of what players run)
    const root = gameAt('0.4.0', 2)
    process.env.CRASHES_MAPS = 'release'
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] })
    const maps = join(root, 'releases', '0.4.0.2', 'maps')
    const first = findMaps(maps).sort()
    const before = Object.fromEntries(first.map((f) => [f, readFileSync(join(maps, f), 'utf8')]))
    writeFileSync(join(root, 'src', 'main.js'), 'export const changed = window.x + 1\nconsole.log(changed)\n')
    await expect(build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] }))
      .rejects.toThrow(/this version's maps are already filed in .*0\.4\.0\.2.*Nothing was moved\. Bump the build or delete the folder/s)
    expect(findMaps(maps).sort()).toEqual(first)
    for (const f of first) expect(readFileSync(join(maps, f), 'utf8')).toBe(before[f])
    expect(findMaps(join(root, 'dist')).length).toBeGreaterThan(0) // left where they were, not half-moved
  }, 60_000)

  it('0.3.1: a release build into an empty or missing maps folder is fine; check builds still replace their cache freely', async () => {
    const root = gameAt('0.5.0', 0)
    mkdirSync(join(root, 'releases', '0.5.0.0', 'maps'), { recursive: true }) // empty folder: nothing to protect
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps({ release: true })] })
    expect(findMaps(join(root, 'releases', '0.5.0.0', 'maps'))).toContain('stray.js.map')
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] })
    await build({ root, configFile: false, logLevel: 'silent', plugins: [crashesMaps()] }) // twice: no refusal
    expect(findMaps(join(root, CHECK_MAPS_FOLDER, '0.5.0.0', 'maps'))).toContain('stray.js.map')
  }, 60_000)
})
