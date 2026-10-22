// @vitest-environment node
// The checks run against a real little game folder, through the Dev Kit's real tester (check-framework.mjs makeTester).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { makeTester } from '../../devkit/kit/check-framework.mjs'
import { CHECKS, check } from './conformance.mjs'
import template from '../templates/content/crashes.json'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

const WIRED = {
  'content/crashes.json': JSON.stringify(template),
  'content/ui/settings.json': JSON.stringify({ tabs: [{ id: 'about', label: 'About', rows: [{ id: 'crashReports', type: 'toggle', label: 'Send crash reports', default: true }] }] }),
  'vite.config.ts': "import { crashesMaps } from './src/crashes/vitePlugin.mjs'\nexport default { plugins: [crashesMaps()] }\n",
  'src/main.tsx': [
    "import crashesJson from '../content/crashes.json'",
    "import { startCrashes, readCrashesConfig, applyCrashSetting } from './crashes'",
    "import { crashRootOptions } from './crashes/ui/crashRoot'",
    'startCrashes({ config: readCrashesConfig(crashesJson), version: versionLabel })',
    'applyCrashSetting(loadSettings(schema))',
    "createRoot(document.getElementById('root'), crashRootOptions()).render(<App />)",
  ].join('\n'),
  // the module's own copy calls everything too — it must never count as the game's wiring
  'src/crashes/VERSION': '0.1.0\n',
}

function game(files) {
  const root = mkdtempSync(join(tmpdir(), 'crashes-conf-'))
  dirs.push(root)
  for (const [path, text] of Object.entries(files)) {
    if (text === null) continue
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
async function run(files) {
  const results = []
  const t = makeTester({ root: game(files), module: { rel: 'src/crashes', version: '0.1.0' }, modules: [{ id: 'crashes' }], shared: {}, staticOnly: true, results })
  await check(t)
  return Object.fromEntries(results.map((r) => [r.name, r]))
}

describe('Crashes checks', () => {
  it('a wired game passes every check; an empty server address is a skip (not live yet), never a failure', async () => {
    const r = await run(WIRED)
    for (const name of [CHECKS.started, CHECKS.switch, CHECKS.react, CHECKS.maps]) expect(r[name].ok, `${name}: ${r[name].problems}`).toBe(true)
    expect(r[CHECKS.server].skipped).toBe(true)
    expect(r[CHECKS.server].detail).toMatch(/not live yet/)
  })

  it('nothing wired → each check fails and says what to write where', async () => {
    const r = await run({ 'vite.config.ts': 'export default { plugins: [] } // crashesMaps() later\n', 'src/main.tsx': "createRoot(el).render(<App />) // startCrashes() later\n" })
    expect(r[CHECKS.started].ok).toBe(false)
    expect(r[CHECKS.started].problems.join(' ')).toMatch(/content\/crashes\.json is missing/)
    expect(r[CHECKS.switch].ok).toBe(false)
    expect(r[CHECKS.react].ok).toBe(false)
    expect(r[CHECKS.react].fix).toMatch(/crashRootOptions/)
    expect(r[CHECKS.maps].ok).toBe(false)
    expect(r[CHECKS.maps].problems.join(' ')).toMatch(/doesn't use crashesMaps/)
  })

  it('the module\'s own copy calling everything doesn\'t count as the game\'s wiring', async () => {
    const r = await run({ ...WIRED, 'src/main.tsx': "createRoot(el).render(<App />)\n", 'src/crashes/capture.ts': 'startCrashes(x); setOn(true); applyCrashSetting(v); crashRootOptions()\n' })
    expect(r[CHECKS.started].ok).toBe(false)
  })

  it('a .map in dist/ or public/ fails, naming it — even with crashesMaps() in the config', async () => {
    const r = await run({ ...WIRED, 'dist/assets/index-Bx12.js.map': '{}', 'public/old.js.map': '{}' })
    expect(r[CHECKS.maps].ok).toBe(false)
    expect(r[CHECKS.maps].problems[0]).toMatch(/dist\/assets\/index-Bx12\.js\.map/)
    expect(r[CHECKS.maps].problems[0]).toMatch(/public\/old\.js\.map/)
    expect(r[CHECKS.maps].fix).toMatch(/^Delete the \.map files/) // crashesMaps() is already there: don't tell them to add it
  })

  it('a switch that\'s turned off in settings.json, or never applied, fails', async () => {
    const off = JSON.stringify({ tabs: [{ id: 'about', rows: [{ id: 'crashReports', type: 'toggle', on: false }] }] })
    expect((await run({ ...WIRED, 'content/ui/settings.json': off }))[CHECKS.switch].ok).toBe(false)
    const notApplied = { ...WIRED, 'src/main.tsx': WIRED['src/main.tsx'].replace('applyCrashSetting(loadSettings(schema))', '') }
    const r = await run(notApplied)
    expect(r[CHECKS.switch].ok).toBe(false)
    expect(r[CHECKS.switch].problems.join(' ')).toMatch(/would do nothing/)
  })

  it('CRASH_SETTINGS_ROWS in the code counts as the switch; a game without createRoot skips the React check', async () => {
    const r = await run({ ...WIRED, 'content/ui/settings.json': null, 'src/main.tsx': WIRED['src/main.tsx'].replace(/createRoot.*$/m, '') + '\nconst rows = [...CRASH_SETTINGS_ROWS]\n' })
    expect(r[CHECKS.switch].ok).toBe(true)
    expect(r[CHECKS.react].skipped).toBe(true)
  })

  it('a server address over plain http (not this PC / the Wi-Fi) fails; https passes', async () => {
    const withUrl = (url) => ({ ...WIRED, 'content/crashes.json': JSON.stringify({ ...template, client: { ...template.client, url } }) })
    expect((await run(withUrl('http://goops-crashes.example.workers.dev')))[CHECKS.server].ok).toBe(false)
    expect((await run(withUrl('http://192.168.1.20:1995')))[CHECKS.server].ok).toBe(true)
    expect((await run(withUrl('https://goops-crashes.example.workers.dev')))[CHECKS.server].ok).toBe(true)
  })
})
