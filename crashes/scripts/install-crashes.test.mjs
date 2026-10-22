// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { gameName, installCrashes, wiringSteps } from './install-crashes.mjs'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

function game(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'crashes-install-'))
  dirs.push(root)
  const all = { 'package.json': JSON.stringify({ name: 'goops', scripts: {} }), ...files }
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
const quiet = () => {}

describe('install-crashes', () => {
  it('copies the kit (no tests) + the PC command, gives the starters once, names the server after the game', () => {
    const root = game({ 'src/ui/kit/VERSION': '0.26.0\n' })
    const result = installCrashes(root, { log: quiet })
    expect(existsSync(join(root, 'src/crashes/capture.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/crashes/crash-report.mjs'))).toBe(true)
    expect(existsSync(join(root, 'src/crashes/conformance.mjs'))).toBe(true)
    expect(existsSync(join(root, 'src/crashes/ui/CrashScreen.tsx'))).toBe(true)
    expect(result.changed.some((f) => /\.test\./.test(f))).toBe(false)
    expect(readFileSync(join(root, 'src/crashes/VERSION'), 'utf8')).toMatch(/^0\.\d+\.\d+ \(framework /)
    expect(JSON.parse(readFileSync(join(root, 'crashes/wrangler.json'), 'utf8')).name).toBe('goops-crashes')
    expect(readFileSync(join(root, 'crashes/worker.ts'), 'utf8')).toMatch(/Template version: \d+/)
    expect(JSON.parse(readFileSync(join(root, 'content/crashes.json'), 'utf8')).client.url).toBe('')
  })

  it('never overwrites the game\'s starters, and a second run changes nothing', () => {
    const root = game()
    installCrashes(root, { log: quiet })
    writeFileSync(join(root, 'content/crashes.json'), '{ "client": { "url": "https://mine.example" } }')
    const again = installCrashes(root, { log: quiet })
    expect(again.changed).toEqual([])
    expect(again.starter).toEqual([])
    expect(readFileSync(join(root, 'content/crashes.json'), 'utf8')).toMatch(/mine\.example/)
  })

  it('no UI kit → no ui/ folder; the UI kit added later → ui/ comes in; files the module dropped go (only inside src/crashes/)', () => {
    const root = game()
    installCrashes(root, { log: quiet })
    expect(existsSync(join(root, 'src/crashes/ui'))).toBe(false)
    writeFileSync(join(root, 'src/crashes/old-file.ts'), 'export {}\n')
    writeFileSync(join(root, 'src/elsewhere.ts'), 'export {}\n')
    mkdirSync(join(root, 'src/ui/kit'), { recursive: true })
    writeFileSync(join(root, 'src/ui/kit/VERSION'), '0.26.0\n')
    const result = installCrashes(root, { log: quiet })
    expect(result.removed).toEqual(['old-file.ts'])
    expect(existsSync(join(root, 'src/crashes/ui/CrashScreen.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/elsewhere.ts'))).toBe(true)
  })

  it('a src/crashes/ of the game\'s own (no VERSION) is never touched', () => {
    const root = game({ 'src/crashes/mine.ts': 'export const mine = 1\n' })
    const result = installCrashes(root, { log: quiet })
    expect(result.refused).toMatch(/game's own files/)
    expect(readFileSync(join(root, 'src/crashes/mine.ts'), 'utf8')).toBe('export const mine = 1\n')
    expect(existsSync(join(root, 'content/crashes.json'))).toBe(false)
  })

  it('--dry-run changes nothing', () => {
    const root = game()
    const result = installCrashes(root, { dryRun: true, log: quiet })
    expect(result.changed.length).toBeGreaterThan(0)
    expect(existsSync(join(root, 'src/crashes'))).toBe(false)
    expect(existsSync(join(root, 'crashes/wrangler.json'))).toBe(false)
  })

  it('prints only the wiring still missing; a fully wired game has only the always-shown try + go-live steps', () => {
    const root = game()
    installCrashes(root, { log: quiet })
    expect(wiringSteps(root).filter((w) => !w.done).length).toBe(9) // every step but React's (no createRoot yet)
    writeFileSync(join(root, 'package.json'), JSON.stringify({
      name: 'goops',
      devDependencies: { wrangler: '^4', 'source-map': '^0.7.6' },
      scripts: { crashes: 'node src/crashes/crash-report.mjs', 'crashes:dev': 'wrangler dev -c crashes/wrangler.json', 'crashes:deploy': 'wrangler deploy -c crashes/wrangler.json' },
    }))
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n.wrangler/\n')
    writeFileSync(join(root, 'vite.config.ts'), "import { crashesMaps } from './src/crashes/vitePlugin.mjs'\nexport default { plugins: [crashesMaps()] }\n")
    writeFileSync(join(root, 'src/main.tsx'), 'startCrashes({ config, version })\napplyCrashSetting(values)\nconst rows = CRASH_SETTINGS_ROWS\ncreateRoot(el, crashRootOptions())\n')
    const left = wiringSteps(root).filter((w) => !w.done).map((w) => w.step)
    expect(left).toHaveLength(2)
    expect(left[0]).toMatch(/^Try it/)
    expect(left[1]).toMatch(/Going live \(Muzzy's call/)
    expect(left[1]).toContain('goops-crashes.joebrogno.workers.dev')
  })

  it('a wiring line in a comment doesn\'t count', () => {
    const root = game({ 'src/main.tsx': '// startCrashes({ config, version }) later\n' })
    expect(wiringSteps(root).find((w) => /At start-up/.test(w.step)).done).toBe(false)
  })

  it('the server name comes from package.json, else the folder', () => {
    expect(gameName(game())).toBe('goops')
    const root = game({ 'package.json': '{}' })
    expect(gameName(root)).toMatch(/^crashes-install-/)
  })
})
