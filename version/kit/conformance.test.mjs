// @vitest-environment node
// The checks run against a real little game folder, through the Dev Kit's real tester (check-framework.mjs makeTester).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { makeTester } from '../../devkit/kit/check-framework.mjs'
import { CHECKS, check, openingTags, propValue, versionProps } from './conformance.mjs'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

const WIRED = {
  'version.json': '{ "version": "0.11.0", "build": 4 }',
  'vite.config.ts': "import { versionPlugin } from './src/version/vitePlugin.mjs'\nexport default { plugins: [versionPlugin()] }\n",
  'src/ui/menus.tsx': [
    "import { versionLabel } from '../version'",
    'export const Menu = () => <MainMenu title="G" items={[{ label: \'Play\', onClick: () => go() }]} version={versionLabel} />',
    'export const Prefs = () => (',
    '  <Settings schema={settings}',
    '    onChange={(values) => apply(values)}',
    '    version={versionLabel} />',
    ')',
  ].join('\n'),
  'src/devkit-game/tabs.ts': "import { gAdapter } from './gAdapter'\nregisterDevKitGame(gAdapter)\n",
  'src/devkit-game/gAdapter.ts': "import { versionLabel } from '../version'\nexport const gAdapter = {\n  name: 'G',\n  version: versionLabel,\n}\n",
  'e2e/start.mjs': "import { checkVersion } from '../src/version/e2e.mjs'\nawait page.goto(url)\nawait checkVersion(page)\n",
}

function game(files) {
  const root = mkdtempSync(join(tmpdir(), 'version-conf-'))
  dirs.push(root)
  for (const [path, text] of Object.entries(files)) {
    if (text === null) continue
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
async function run(files, modules) {
  const root = game(files)
  const results = []
  const t = makeTester({ root, module: { rel: 'src/version', version: '0.1.0' }, modules: (modules ?? ['devkit', 'ui', 'version']).map((id) => ({ id })), shared: {}, staticOnly: true, results })
  await check(t)
  return Object.fromEntries(results.map((r) => [r.name, r]))
}

describe('Version checks', () => {
  it('a wired game passes every code check (the browser one is skipped with --static)', async () => {
    const r = await run(WIRED)
    for (const name of [CHECKS.plugin, CHECKS.shown, CHECKS.oneSource, CHECKS.devkit, CHECKS.e2e]) expect(r[name].ok, `${name}: ${r[name].problems}`).toBe(true)
    expect(r[CHECKS.plugin].detail).toContain('v0.11.0.4')
    expect(r[CHECKS.page].skipped).toBe(true)
  })

  it('a game without the wiring fails each one, saying what to wire where', async () => {
    const r = await run({
      'version.json': '{ "version": "0.11", "build": 4 }',
      'vite.config.ts': 'export default { plugins: [] } // versionPlugin() later\n',
      'src/ui/menus.tsx': "import version from '../../version.json'\nexport const Menu = () => <MainMenu title=\"G\" />\nexport const Prefs = () => <Settings info={{ version: `v${version.version}` }} version={`v${version.version}`} />\n",
      'src/devkit-game/tabs.ts': WIRED['src/devkit-game/tabs.ts'],
      'src/devkit-game/gAdapter.ts': "import versionFile from '../../version.json'\nexport const gAdapter = { name: 'G', version: `${versionFile.version}.${versionFile.build}` }\n",
      'e2e/start.mjs': '// checkVersion(page) one day\nawait page.goto(url)\n',
    })
    expect(r[CHECKS.plugin].problems).toEqual(["vite.config.ts doesn't use versionPlugin().", expect.stringMatching(/"version" should be three numbers/)])
    expect(r[CHECKS.shown].problems.join('\n')).toMatch(/src\/ui\/menus\.tsx:2 {2}<MainMenu> has no version prop/)
    expect(r[CHECKS.shown].problems.join('\n')).toMatch(/src\/ui\/menus\.tsx:3 {2}<Settings version=`v\$\{version\.version\}`> — not versionLabel/)
    expect(r[CHECKS.oneSource].problems.slice(1).map((l) => l.trim().split('  ')[0])).toEqual(['src/ui/menus.tsx:1', 'src/devkit-game/gAdapter.ts:1'])
    expect(r[CHECKS.devkit].ok).toBe(false)
    expect(r[CHECKS.devkit].problems[0]).toContain('version: `${versionFile.version}.${versionFile.build}` }')
    expect(r[CHECKS.devkit].fix).toContain('version: versionLabel')
    expect(r[CHECKS.e2e].ok).toBe(false) // a comment naming it doesn't count
  })

  it('no vite.config, no version.json: both said plainly', async () => {
    const r = await run({ ...WIRED, 'vite.config.ts': null, 'version.json': null })
    expect(r[CHECKS.plugin].problems[0]).toBe('The game has no vite.config.ts.')
    expect(r[CHECKS.plugin].problems[1]).toMatch(/version\.json is missing/)
  })

  it('no Dev Kit: its check is skipped; no UI kit: versionLabel shown anywhere in the game is enough', async () => {
    const r = await run({ ...WIRED, 'src/ui/menus.tsx': "import { versionLabel } from '../version'\nexport const Footer = () => <small>{versionLabel}</small>\n" }, ['version'])
    expect(r[CHECKS.devkit].skipped).toBe(true)
    expect(r[CHECKS.shown].ok).toBe(true)
    const none = await run({ ...WIRED, 'src/ui/menus.tsx': 'export const Footer = () => null\n' }, ['version'])
    expect(none[CHECKS.shown].ok).toBe(false)
  })
})

describe('reading tags', () => {
  it('finds an opening tag across lines, past => and braces, and reads its version prop', () => {
    const text = '<Settings schema={s} onChange={(v) => { a(v) }}\n  version={versionLabel} />\n<SettingsScreen version="x" />'
    expect(openingTags(text, 'Settings')).toHaveLength(1)
    expect(propValue(openingTags(text, 'Settings')[0], 'version')).toBe('versionLabel')
    expect(propValue('<MainMenu version="v1" />', 'version')).toBe('"v1"')
    expect(propValue('<MainMenu version={`v${file.version}`} />', 'version')).toBe('`v${file.version}`')
    expect(versionProps([{ path: 'a.tsx', text: '// <MainMenu version={x} />\n<MainMenu />' }], 'MainMenu')).toEqual([{ where: 'a.tsx:2', value: null }])
  })
})
