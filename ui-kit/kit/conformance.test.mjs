// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import defaultSettings from './blocks/settings.default.json'
import { COMFORT_CHECK, SETTINGS_CHECK, SIZES, check, checkComfortForTest, checkSettingsForTest, checkUiArgs, missingComfortRows, creditProblems, fileFeedsInfo, fileReadsRow, groupProblems, listAssets, liveRows, settingsProblems, stripComments, whereText } from './conformance.mjs'

describe('UI kit checks', () => {
  it('checks the seven sizes the sprint asked for', () => {
    expect(SIZES.map((s) => `${s.width}×${s.height}`)).toEqual(['390×844', '360×780', '844×390', '768×343', '1100×800', '1440×900', '1920×1080'])
  })
  it('groups problems by kind, each with every screen it showed on (wider counts as clipped)', () => {
    const grouped = groupProblems({
      'phone · first screen': ['small: 30×30 px — "Close"', 'overlap: "Score" × "Cracks"'],
      'desktop · first screen': ['small: 30×30 px — "Close"', 'wider: the page is wider than the screen (400 > 390)'],
    })
    expect([...grouped.small]).toEqual([['30×30 px — "Close"', ['phone · first screen', 'desktop · first screen']]])
    expect([...grouped.overlap.keys()]).toEqual(['"Score" × "Cracks"'])
    expect([...grouped.clipped.keys()]).toEqual(['the page is wider than the screen (400 > 390)'])
  })
  it('says where a problem showed in few words when it showed everywhere in one phase', () => {
    const inPlay = SIZES.map((s) => `${s.name} ${s.width}×${s.height} · in play`)
    expect(whereText(inPlay, 14)).toBe('in play, every size')
    expect(whereText([...inPlay, ...inPlay.map((w) => w.replace('in play', 'first screen'))], 14)).toBe('every screen, every size')
    expect(whereText(inPlay.slice(0, 2), 14)).toBe(`${inPlay[0]}; ${inPlay[1]}`)
  })
  it('reads the game\'s check:ui folders up to the next command', () => {
    expect(checkUiArgs('node src/ui/kit/check-ui.mjs src/ui src/game --css src && node scripts/other.mjs')).toEqual(['src/ui', 'src/game', '--css', 'src'])
    expect(checkUiArgs('node src/ui/kit/check-ui.mjs src/ui; echo done')).toEqual(['src/ui'])
    expect(checkUiArgs('')).toEqual(['src/ui', '--css', 'src'])
  })
  it('--static: runs check-ui only, and asks for a check:ui script when the game has none', async () => {
    const results = []
    const t = {
      root: join(tmpdir(), 'no-such-game'), rel: 'src/ui/kit', staticOnly: true, scripts: () => ({}),
      json: () => null, gameCode: () => [],
      run: (cmd, args) => ({ code: 0, out: `${cmd} ${args.join(' ')}` }),
      pass: (name, detail) => results.push({ name, ok: true, detail }),
      fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
      skip: (name, why) => results.push({ name, skipped: true, why }),
    }
    await check(t)
    expect(results.map((r) => [r.name, r.ok ?? 'skip'])).toEqual([
      ['every asset is credited', true],
      ['every Settings row that\'s switched on is read by the game', true],
      [COMFORT_CHECK, false], // no settings file at all → no reduce motion
      ['the game\'s UI code keeps the kit\'s rules (check-ui)', true],
      ['check-ui runs in check:fast', false],
      ['the game at every size', 'skip'],
    ])
    expect(results[3].detail).toBe('node src/ui/kit/check-ui.mjs src/ui --css src')
  })
})

describe('credits', () => {
  const dir = (name) => ({ name, isDirectory: () => true })
  const file = (name) => ({ name, isDirectory: () => false })
  const tree = {
    public: [dir('art'), file('favicon.svg'), file('robots.txt')],
    'public/art': [file('hero.png')],
    src: [dir('ui'), dir('devkit')],
    'src/ui': [dir('kit')],
    'src/ui/kit': [dir('fonts'), file('Button.tsx')],
    'src/ui/kit/fonts': [file('nunito.woff2')],
    'src/devkit': [file('dev-only.png')],
  }
  const readdir = (rel) => { if (!tree[rel]) throw new Error('no such folder'); return tree[rel] }
  it('lists the art, sound and fonts the game ships — not dev-only folders or code', () => {
    expect(listAssets('/game', readdir).sort()).toEqual(['public/art/hero.png', 'public/favicon.svg', 'src/ui/kit/fonts/nunito.woff2'])
  })
  it('finds unlisted files (a folder ending in / covers everything in it), 🔴 entries and 🟡 without a credit line', () => {
    const assets = ['public/art/hero.png', 'public/favicon.svg', 'src/ui/kit/fonts/nunito.woff2']
    const entries = [
      { paths: ['public/art/'], source: 'Muzzy', light: '🟢' },
      { paths: ['src/ui/kit/fonts/nunito.woff2'], source: 'Google Fonts', light: '🟡', credit: '' },
      { paths: ['public/x.mp3'], source: 'Some site', light: '🔴' },
    ]
    const found = creditProblems(assets, entries)
    expect(found.unlisted).toEqual(['public/favicon.svg'])
    expect(found.red).toEqual(['Some site (public/x.mp3)'])
    expect(found.noCredit).toEqual(['Google Fonts (src/ui/kit/fonts/nunito.woff2)'])
  })
  it('all listed, credited and shown → three passes', async () => {
    const results = []
    const root = mkdtempSync(join(tmpdir(), 'credits-'))
    mkdirSync(join(root, 'public')); writeFileSync(join(root, 'public', 'a.png'), '')
    const t = {
      root, json: () => [{ paths: ['public/a.png'], source: 'Kenney', light: '🟡', credit: 'Kenney.nl' }],
      gameCode: () => [{ path: 'src/ui/menus.tsx', text: "import credits from '../../content/credits.json'" }],
      pass: (name) => results.push([name, true]), fail: (name) => results.push([name, false]),
    }
    const { checkCreditsForTest } = await import('./conformance.mjs')
    await checkCreditsForTest(t)
    expect(results).toEqual([['every asset is credited', true], ['nothing 🔴 ships', true], ['every 🟡 credit is shown', true]])
    rmSync(root, { recursive: true, force: true })
  })
})

describe('Settings rows: every row that\'s switched on is read by the game', () => {
  const tab = (rows) => ({ tabs: [{ id: 'gameplay', label: 'Gameplay', rows }] })
  const run = (schema, code) => {
    const results = []
    checkSettingsForTest({
      json: () => schema, gameCode: () => code,
      pass: (name, detail) => results.push({ name, ok: true, detail }),
      fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    })
    return results
  }
  it('a row nothing reads → red, naming the row and where to wire it', () => {
    const [r] = run(tab([{ id: 'aiSpeed', type: 'selector', label: 'AI speed' }, { id: 'resetTips', type: 'button', label: 'Reset tips' }]),
      [{ path: 'src/ui/menus.tsx', text: 'export const x = 1' }])
    expect(r.name).toBe(SETTINGS_CHECK)
    expect(r.ok).toBe(false)
    expect(r.problems).toEqual([
      'Gameplay → AI speed ("aiSpeed", a selector): nothing in the game reads it — read values.aiSpeed in the Settings onChange (and loadSettings(…) at start-up)',
      'Gameplay → Reset tips ("resetTips", a button): nothing in the game reads it — handle it in the Settings onAction: if (id === \'resetTips\') …',
    ])
    expect(r.fix).toMatch(/"on": false/)
  })
  it('a row the game reads → green', () => {
    const [r] = run(tab([{ id: 'aiSpeed', type: 'selector', label: 'AI speed' }, { id: 'resetTips', type: 'button', label: 'Reset tips' }]), [
      { path: 'src/ui/gameSettings.ts', text: 'export const speed = (values) => values.aiSpeed' },
      { path: 'src/ui/menus.tsx', text: "const onAction = (id) => { if (id === 'resetTips') reset() }" },
    ])
    expect(r).toEqual({ name: SETTINGS_CHECK, ok: true, detail: '2 rows on: 2 read by the game, 0 handled by the kit / audio module' })
  })
  it('counts real reads only — not comments, words from a .json file, or a longer name that starts the same', () => {
    expect(fileReadsRow('// values.tips is read in tips.ts', 'tips')).toBe(false)
    expect(fileReadsRow("import text from '../../content/text/en.json'\nconst w = text.tutorial.tips", 'tips')).toBe(false)
    expect(fileReadsRow('const on = values.tipsShown', 'tips')).toBe(false)
    expect(fileReadsRow('const all = [...tips]', 'tips')).toBe(false)
    expect(fileReadsRow("const url = 'https://x.com' // values.tips", 'tips')).toBe(false)
    expect(fileReadsRow('const on = values?.tips !== false', 'tips')).toBe(true)
    expect(fileReadsRow('const on = loadSettings(s).tips', 'tips')).toBe(true)
    expect(fileReadsRow("const on = values['tips']", 'tips')).toBe(true)
    expect(fileReadsRow("switch (id) { case 'credits': open() }", 'credits')).toBe(true)
    expect(fileReadsRow('<Settings info={{ version: v }} />', 'version')).toBe(true)
    expect(fileReadsRow('const { aiSpeed } = values', 'aiSpeed')).toBe(true)
  })
  it('comments go, but strings and regexes that look like comments stay code', () => {
    const glob = "const sfx = import.meta.glob('./sfx/*.mp3')\nconst on = values.tips\nconst x = 1 /* note */"
    expect(stripComments(glob)).toBe("const sfx = import.meta.glob('./sfx/*.mp3')\nconst on = values.tips\nconst x = 1 ")
    expect(fileReadsRow(glob, 'tips')).toBe(true) // the glob's /* used to hide every line down to the next */
    expect(fileReadsRow("const a = `./sfx/*.mp3`\nconst on = values.tips // */", 'tips')).toBe(true)
    expect(fileReadsRow('const a = `${n > 1 ? `x/*` : "y"}`\nconst on = values.tips\n/* */', 'tips')).toBe(true)
    expect(fileReadsRow("const re = /['\"]/g\nconst on = values.tips", 'tips')).toBe(true)
    expect(fileReadsRow("const re = /\\/*x/\nconst on = values.tips", 'tips')).toBe(true)
    expect(fileReadsRow("<p>Don't</p>\nconst on = values.tips", 'tips')).toBe(true) // an apostrophe ends at the line's end
    expect(fileReadsRow('const half = a / 2 // values.tips', 'tips')).toBe(false)
    expect(fileReadsRow('/* values.tips\n*/ const x = 1', 'tips')).toBe(false)
  })
  it('a common-word id used for other things is NOT a read (a dead row stays red)', () => {
    const elsewhere = [
      "const s = assets.sound\nplay(s, { theme: 'dark' })",
      "const style = { theme: 'dark', hints: 3 }\nif (mode === 'difficulty') x()",
      "const label = words['language']\nconst { sound } = assets\nconst list = ['sound', 'theme']",
      "import text from '../../content/text/en.json'\nconst w = text.tutorial.hints",
    ].map((text, i) => ({ path: `src/game/f${i}.ts`, text }))
    for (const id of ['sound', 'theme', 'hints', 'difficulty', 'language']) {
      expect(elsewhere.some((f) => fileReadsRow(f.text, id)), id).toBe(false)
    }
    const found = settingsProblems(tab(['sound', 'theme', 'hints', 'difficulty', 'language'].map((id) => ({ id, type: 'toggle', label: id }))), elsewhere)
    expect(found.dead.map((r) => r.id)).toEqual(['sound', 'theme', 'hints', 'difficulty', 'language'])
  })
  it('each way games really read a setting → green', () => {
    const reads = [
      ['const on = values.theme', 'theme'],
      ['const on = values?.theme', 'theme'],
      ["const on = settings['theme']", 'theme'],
      ['const on = gameSettings.current.theme', 'theme'],
      ['const on = myPrefs.theme', 'theme'],
      ['const speed = useGameSettings.getState().aiSpeed', 'aiSpeed'],
      ['const { theme, hints: h = 2 } = values', 'hints'],
      ['const { theme } = loadedSettings', 'theme'],
      ['const apply = ({ theme }: SettingsValues) => theme', 'theme'],
      ["if (id === 'sound') x()", 'sound'],
      ["if ('sound' === id) x()", 'sound'],
      ["if (rowId == 'sound') x()", 'sound'],
      ["if (changed !== 'fullscreen') return", 'fullscreen'],
      ["switch (id) { case 'credits': open() }", 'credits'],
      ['<Settings info={{ language }} />', 'language'],
      ["<Settings info={{ language: 'English' }} />", 'language'],
      ["const on = useSetting('hints')", 'hints'],
      ["const on = getSetting('hints')", 'hints'],
      ["const on = setting('hints')", 'hints'],
    ]
    for (const [text, id] of reads) expect(fileReadsRow(text, id), text).toBe(true)
  })
  it('skips rows the kit handles: headings, text size, reduce motion, links, info with its own text, Audio once wired', () => {
    const schema = { tabs: [
      { id: 'gameplay', label: 'Gameplay', rows: [
        { id: 'secPlay', type: 'heading', label: 'Play' },
        { id: 'textSize', type: 'selector', label: 'Text size' },
        { id: 'reduceMotion', type: 'toggle', label: 'Reduce motion' },
        { id: 'help', type: 'link', label: 'Help', url: 'https://muzzy.games/help' },
        { id: 'fullscreenTip', type: 'info', label: 'Full screen', default: 'Share → Add to Home Screen' },
      ] },
      { id: 'audio', label: 'Audio', rows: [{ id: 'masterVolume', type: 'slider', label: 'Master volume' }, { id: 'mono', type: 'toggle', label: 'Mono' }] },
    ] }
    const wired = [{ path: 'src/game/sound.ts', text: 'applyAudioSettings(audio, values)' }]
    expect(run(schema, wired)[0]).toMatchObject({ ok: true, detail: '6 rows on: 0 read by the game, 6 handled by the kit / audio module' })
    // the Audio rows count as handled only once the game hands the values to the audio module
    expect(settingsProblems(schema, []).dead.map((r) => r.id)).toEqual(['masterVolume', 'mono'])
  })
  it('the version row needs its text from the game, and a placeholder link fails', () => {
    const found = settingsProblems(tab([
      { id: 'version', type: 'info', label: 'Version', default: '0.1.0' },
      { id: 'feedback', type: 'link', label: 'Send feedback', url: 'https://example.com/feedback' },
    ]), [{ path: 'src/engine/save.ts', text: 'const v = save.version; if (id === \'version\') migrate()' }])
    expect(found.dead.map((r) => r.id)).toEqual(['version']) // "version" elsewhere doesn't count — only info={{ version }}
    expect(found.placeholder.map((r) => r.id)).toEqual(['feedback'])
    expect(fileFeedsInfo('<Settings schema={s} info={{ version: `v${file.version}` }} />', 'version')).toBe(true)
    expect(fileFeedsInfo('const info = { build, version }', 'version')).toBe(true)
    expect(fileFeedsInfo('<Settings info={{ build: b }} />', 'version')).toBe(false)
  })
  it('skips rows that are switched off ("on": false)', () => {
    const schema = tab([{ id: 'difficulty', type: 'selector', label: 'Difficulty', on: false }, { id: 'tips', type: 'toggle', label: 'Tips' }])
    expect(liveRows(schema).map((r) => r.id)).toEqual(['tips'])
    expect(run(schema, [{ path: 'src/a.ts', text: 'values.tips' }])[0].ok).toBe(true)
  })
  it('no content/ui/settings.json → nothing to check', () => {
    expect(run(null, [])[0]).toEqual({ name: SETTINGS_CHECK, ok: true, detail: 'no content/ui/settings.json' })
  })
})

describe('comfort rows (0.21.0): reduce motion always, master volume with the audio module', () => {
  const schema = (ids, off = []) => ({ tabs: [{ id: 'a', label: 'Accessibility', rows: ids.map((id) => ({ id, type: 'toggle', label: id, ...(off.includes(id) ? { on: false } : {}) })) }] })
  const run = (s, installed = []) => {
    const results = []
    checkComfortForTest({
      json: () => s, has: (id) => installed.includes(id),
      pass: (name, detail) => results.push({ name, ok: true, detail }),
      fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    })
    return results[0]
  }
  it('a Settings without reduce motion (or with it switched off) fails, saying the row to add', () => {
    const r = run(schema(['tips']))
    expect(r).toMatchObject({ name: COMFORT_CHECK, ok: false })
    expect(r.problems).toEqual(['"reduceMotion" isn\'t switched on in content/ui/settings.json — players that motion makes ill can\'t calm it down'])
    expect(r.fix).toContain('"id": "reduceMotion"')
    expect(missingComfortRows(schema(['reduceMotion'], ['reduceMotion']))).toEqual(['reduceMotion'])
    expect(run(null).problems[0]).toContain('(the file is missing)')
  })
  it('master volume is needed only when the audio module is installed', () => {
    expect(run(schema(['reduceMotion']))).toMatchObject({ ok: true, detail: 'reduce motion (no audio module, so no volume needed)' })
    expect(run(schema(['reduceMotion']), ['audio']).problems).toEqual(['"masterVolume" isn\'t switched on in content/ui/settings.json — players can\'t turn the whole game down in one go'])
    expect(run(schema(['reduceMotion', 'masterVolume']), ['audio'])).toMatchObject({ ok: true, detail: 'reduce motion + master volume' })
  })
  it('the kit\'s own default Settings has both', () => {
    expect(missingComfortRows(defaultSettings, { audio: true })).toEqual([])
  })
})
