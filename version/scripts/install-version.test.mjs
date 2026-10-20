// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { installVersion, wiringSteps } from './install-version.mjs'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })
function game(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'install-version-'))
  dirs.push(root)
  for (const [path, text] of Object.entries({ 'package.json': '{ "name": "g", "scripts": { "check:framework": "x" } }', ...files })) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
const quiet = () => {}

describe('installVersion', () => {
  it('copies the kit (no tests) with a VERSION, and gives a game with no version.json a starter one', () => {
    const root = game()
    const { changed, starter, missing } = installVersion(root, { log: quiet })
    expect(changed).toEqual(expect.arrayContaining(['index.ts', 'env.d.ts', 'vitePlugin.mjs', 'vitePlugin.d.mts', 'versionFile.mjs', 'e2e.mjs', 'conformance.mjs']))
    expect(changed.some((f) => f.includes('.test.'))).toBe(false)
    expect(readFileSync(join(root, 'src/version/VERSION'), 'utf8')).toMatch(/^0\.\d+\.\d+ \(framework /)
    expect(starter).toEqual(['version.json'])
    expect(JSON.parse(readFileSync(join(root, 'version.json'), 'utf8'))).toMatchObject({ version: '0.1.0', build: 0 })
    expect(missing.length).toBeGreaterThan(0)
  })

  it('never overwrites the game\'s version.json; a second run changes nothing; dry run writes nothing', () => {
    const root = game({ 'version.json': '{ "version": "0.11.0", "build": 4 }' })
    expect(installVersion(root, { dryRun: true, log: quiet }).changed.length).toBeGreaterThan(0)
    expect(existsSync(join(root, 'src/version'))).toBe(false)
    installVersion(root, { log: quiet })
    expect(readFileSync(join(root, 'version.json'), 'utf8')).toBe('{ "version": "0.11.0", "build": 4 }')
    const again = installVersion(root, { log: quiet })
    expect([again.changed, again.removed, again.starter]).toEqual([[], [], []])
  })

  it('removes files the module no longer ships, only inside src/version/; refuses a src/version/ that is the game\'s own', () => {
    const root = game()
    installVersion(root, { log: quiet })
    writeFileSync(join(root, 'src/version/old.ts'), 'x')
    expect(installVersion(root, { log: quiet }).removed).toEqual(['old.ts'])
    expect(existsSync(join(root, 'src/version/old.ts'))).toBe(false)
    const own = game({ 'src/version/mine.ts': 'export const v = 1' })
    expect(installVersion(own, { log: quiet }).refused).toMatch(/game's own files/)
    expect(readFileSync(join(own, 'src/version/mine.ts'), 'utf8')).toBe('export const v = 1')
  })
})

describe('wiringSteps', () => {
  const kits = { 'src/ui/kit/VERSION': '0.24.0', 'src/devkit/VERSION': '0.20.5' }
  it('a fresh game: every step to do, in plain words', () => {
    const steps = wiringSteps(game(kits)).filter((w) => !w.done).map((w) => w.step)
    expect(steps.join('\n')).toMatch(/versionPlugin\(\)/)
    expect(steps.join('\n')).toMatch(/<MainMenu version=\{versionLabel\}/)
    expect(steps.join('\n')).toMatch(/<Settings version=\{versionLabel\}/)
    expect(steps.join('\n')).toMatch(/version: versionLabel/)
    expect(steps.join('\n')).toMatch(/await checkVersion\(page\)/)
  })

  it('a wired game: nothing left to do; a game reading version.json itself is named', () => {
    const wired = {
      ...kits,
      'vite.config.ts': "import { versionPlugin } from './src/version/vitePlugin.mjs'\nexport default { plugins: [versionPlugin()] }",
      'src/ui/menus.tsx': "import { versionLabel } from '../version'\nconst a = <MainMenu title=\"G\" version={versionLabel} />\nconst b = <Settings version={versionLabel} />",
      'src/devkit-game/gAdapter.ts': "import { versionLabel } from '../version'\nexport const g = { version: versionLabel }",
      'e2e/start.mjs': "import { checkVersion } from '../src/version/e2e.mjs'\nawait checkVersion(page)",
    }
    expect(wiringSteps(game(wired)).filter((w) => !w.done)).toEqual([])
    const own = wiringSteps(game({ ...wired, 'src/ui/About.tsx': "import file from '../../version.json'\nexport const v = file.version" })).filter((w) => !w.done)
    expect(own.map((w) => w.step)).toEqual([expect.stringContaining('src/ui/About.tsx')])
  })
})
