// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { readAppVersion } from '../../version/kit/versionFile.mjs'
import { crashesMaps, findMaps, readGameVersion } from './vitePlugin.mjs'

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
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true })
})

describe('crashesMaps', () => {
  it('a real build: hidden maps, every .map moved to releases/<version>/maps/, none left in dist, no sourceMappingURL', async () => {
    const root = gameAt('0.3.1', 12)
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
    await build({ root: game, configFile: false, logLevel: 'silent', plugins: [crashesMaps({ version: '9.9.9.9' })] })
    expect(existsSync(join(game, 'releases', '9.9.9.9', 'maps'))).toBe(true)
  }, 60_000)
})
