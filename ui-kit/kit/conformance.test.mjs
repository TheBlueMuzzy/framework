// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import defaultSettings from './blocks/settings.default.json'
import { COMFORT_CHECK, SETTINGS_CHECK, SIZES, check, checkComfortForTest, checkSettingsForTest, checkUiArgs, missingComfortRows, creditProblems, fileFeedsInfo, fileReadsRow, groupProblems, listAssets, liveRows, OLD_MODULE_ROWS, readOrientation, readRowManifest, settingsProblems, sizesFor, stripComments, whereText } from './conformance.mjs'

describe('UI kit checks', () => {
  it('checks the seven sizes the sprint asked for', () => {
    expect(SIZES.map((s) => `${s.width}×${s.height}`)).toEqual(['390×844', '360×780', '844×390', '768×343', '1100×800', '1440×900', '1920×1080'])
  })
  it('a portrait-only game is never checked on a phone on its side; desktops stay (F104)', () => {
    const names = (o) => { const { sizes, skipped } = sizesFor(o); return [sizes.map((s) => `${s.width}×${s.height}`), skipped.map((s) => `${s.width}×${s.height}`)] }
    expect(names('portrait')).toEqual([['390×844', '360×780', '1100×800', '1440×900', '1920×1080'], ['844×390', '768×343']])
    expect(names('landscape')).toEqual([['844×390', '768×343', '1100×800', '1440×900', '1920×1080'], ['390×844', '360×780']])
    expect(names('any')[1]).toEqual([])
    expect(names(undefined)[0]).toHaveLength(7)
  })
  it('style.json "orientation": missing → any; a value the kit doesn\'t know → any + a plain problem (F104)', () => {
    expect(readOrientation({ preset: 'neon' })).toEqual({ orientation: 'any', problem: null })
    expect(readOrientation(null)).toEqual({ orientation: 'any', problem: null })
    expect(readOrientation({ orientation: 'portrait' })).toEqual({ orientation: 'portrait', problem: null })
    expect(readOrientation({ orientation: 'sideways' })).toEqual({ orientation: 'any', problem: expect.stringMatching(/"sideways" isn't one of "any", "portrait", "landscape" — checking every size/) })
  })
  it('"every size" means every size CHECKED (5 for a portrait game)', () => {
    const where = ['phone 390×844 · in play', 'small phone 360×780 · in play', 'laptop 1100×800 · in play', 'desktop 1440×900 · in play', 'HD 1920×1080 · in play']
    expect(whereText(where, 10, 5)).toBe('in play, every size')
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
    expect(creditProblems([], [
      { paths: ['public/boom.ogg'], source: 'Freesound', light: '🟡', licence: 'CC-BY-NC-4.0', credit: 'Boom by X' },
      { paths: ['public/hum.ogg'], source: 'Some pack', light: '🟢', licence: 'free for non-commercial use' },
      { paths: ['public/ok.ogg'], source: 'Kenney', light: '🟢', licence: 'CC0-1.0' },
    ]).red).toEqual([ // 0.22.0: a non-commercial licence is 🔴 whatever light it was given
      'Freesound (public/boom.ogg) — "CC-BY-NC-4.0" is non-commercial: no tips, ads or store sales with it',
      'Some pack (public/hum.ogg) — "free for non-commercial use" is non-commercial: no tips, ads or store sales with it',
    ])
    expect(found.unlisted).toEqual(['public/favicon.svg'])
    expect(found.red).toEqual(['Some site (public/x.mp3)'])
    expect(found.noCredit).toEqual(['Google Fonts (src/ui/kit/fonts/nunito.woff2)'])
  })
  it('non-commercial (0.22.1 review): CC BY-NC codes and "… only" wordings are 🔴; commercial-allowed wordings and a credit line saying "NC" are not', async () => {
    const { isNonCommercialLicence } = await import('./conformance.mjs')
    for (const red of ['CC-BY-NC-4.0', 'CC BY-NC-SA 4.0', 'CC BY-NC-ND 3.0', 'cc-by-nc', 'Non-commercial use only', 'Free for non-commercial projects', 'Personal use only'])
      expect([red, isNonCommercialLicence(red)]).toEqual([red, true])
    for (const fine of ['Free for commercial and non-commercial use', 'CC0-1.0', 'CC-BY-4.0', 'CC BY-SA 4.0', 'SIL OFL 1.1', 'Commercial use allowed, non-commercial too', ''])
      expect([fine, isNonCommercialLicence(fine)]).toEqual([fine, false])
    expect(creditProblems([], [{ paths: ['public/a.ogg'], source: 'Field sounds', light: '🟡', licence: 'CC-BY-4.0', credit: 'Recorded in Asheville, NC by Sam' }]).red).toEqual([])
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
  it('the crash-reports switch counts as read once the game passes it to the crashes module (F89 proof)', () => {
    const schema = tab([{ id: 'crashReports', type: 'toggle', label: 'Send crash reports', default: true }])
    expect(settingsProblems(schema, []).dead.map((r) => r.id)).toEqual(['crashReports'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: '// applyCrashSetting(values) later' }]).dead.map((r) => r.id)).toEqual(['crashReports'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: 'applyCrashSetting(loadSettings(schema))' }]).dead).toEqual([])
  })
  it('the Hide emotes switch counts as read once the game passes it to the emotes module (F107)', () => {
    const schema = tab([{ id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes', default: false }])
    expect(settingsProblems(schema, []).dead.map((r) => r.id)).toEqual(['hideEmotes'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: '// applyEmoteSetting(emotes, values) later' }]).dead.map((r) => r.id)).toEqual(['hideEmotes'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: 'applyEmoteSetting(emotes, loadSettings(schema))' }]).dead).toEqual([])
  })
  it('the Bot chatter selector counts as read once the game passes it to the AI\'s banter (F22, ai 0.5.0)', () => {
    const schema = tab([{ id: 'botChatter', type: 'selector', label: 'Bot chatter', options: ['Off', 'Some', 'Lots'], default: 'Some' }])
    expect(settingsProblems(schema, []).dead.map((r) => r.id)).toEqual(['botChatter'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: '// applyBanterSetting(banter, values) later' }]).dead.map((r) => r.id)).toEqual(['botChatter'])
    expect(settingsProblems(schema, [{ path: 'src/main.tsx', text: 'applyBanterSetting(banter, loadSettings(schema))' }]).dead).toEqual([])
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
    // 0.24.0: the version prop fills the version row too — only on Settings, only for "version"
    expect(fileFeedsInfo('<Settings schema={s} onChange={(v) => apply(v)} version={versionLabel} />', 'version')).toBe(true)
    expect(fileFeedsInfo('<MainMenu version={versionLabel} />', 'version')).toBe(false)
    expect(fileFeedsInfo('<Settings version={versionLabel} />', 'build')).toBe(false)
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

describe('module Settings rows register themselves: settings-rows.json (0.30.0, F110)', () => {
  const made = []
  const tab = (rows) => ({ tabs: [{ id: 'game', label: 'Game', rows }] })
  /** A game folder with these files (src/…/VERSION, settings-rows.json…) → the Settings check's one result. */
  const runIn = (files, schema, code) => {
    const root = mkdtempSync(join(tmpdir(), 'kit-rows-'))
    made.push(root)
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(root, path, '..'), { recursive: true })
      writeFileSync(join(root, path), text)
    }
    const results = []
    checkSettingsForTest({
      root, json: () => schema, gameCode: () => code.map((text, i) => ({ path: `src/game/f${i}.ts`, text })),
      pass: (name, detail) => results.push({ name, ok: true, detail }),
      fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    })
    return results[0]
  }
  const cleanUp = () => { while (made.length) rmSync(made.pop(), { recursive: true, force: true }) }
  const dice = JSON.stringify({ rows: [{ id: 'diceSkin', readBy: ['\\bapplyDiceSetting\\s*\\('], hint: 'pass it on: applyDiceSetting(values) in the Settings onChange' }] })
  const diceRow = tab([{ id: 'diceSkin', type: 'selector', label: 'Dice skin', options: ['Wood', 'Glass'] }])
  const real = (module) => readFileSync(new URL(`../../${module}/kit/settings-rows.json`, import.meta.url), 'utf8')

  it('a made-up module with a row passes with its manifest — no UI kit change', () => {
    try {
      const r = runIn({ 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': dice }, diceRow, ['applyDiceSetting(loadSettings(settingsJson))'])
      expect(r).toEqual({ name: SETTINGS_CHECK, ok: true, detail: '1 rows on: 0 read by the game, 1 handled by the kit / audio module' })
      // a module whose copy sits in src/<name>/kit/ (like the AI's) is found too
      expect(runIn({ 'src/dice/kit/VERSION': '0.1.0\n', 'src/dice/kit/settings-rows.json': dice }, diceRow, ['applyDiceSetting(values)']).ok).toBe(true)
    } finally { cleanUp() }
  })
  it('the module\'s own code (where applyDiceSetting is defined) never counts — the Dev Kit doesn\'t know a new module\'s folder', () => {
    try {
      const files = { 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': dice }
      const root = mkdtempSync(join(tmpdir(), 'kit-rows-'))
      made.push(root)
      for (const [path, text] of Object.entries(files)) { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), text) }
      const results = []
      checkSettingsForTest({
        root, json: () => diceRow,
        gameCode: () => [{ path: 'src/dice/settingsRow.ts', text: 'export function applyDiceSetting(values) { setSkin(values.diceSkin) }' }],
        pass: (name, detail) => results.push({ name, ok: true, detail }),
        fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
      })
      expect(results[0].ok).toBe(false)
      expect(results[0].problems[0]).toMatch(/it's the dice module's row/)
    } finally { cleanUp() }
  })
  it('a module\'s row shown but never passed on still fails — naming the module and its own hint', () => {
    try {
      const r = runIn({ 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': dice }, diceRow, ['// applyDiceSetting(values) later', 'const skin = "Wood"'])
      expect(r.ok).toBe(false)
      expect(r.problems).toEqual(['Game → Dice skin ("diceSkin", a selector): nothing in the game reads it — it\'s the dice module\'s row: pass it on: applyDiceSetting(values) in the Settings onChange'])
    } finally { cleanUp() }
  })
  it('the real crashes, emotes and ai manifests, where their installers put them, count their wiring', () => {
    try {
      const files = {
        'src/crashes/VERSION': '0.2.0\n', 'src/crashes/settings-rows.json': real('crashes'),
        'src/emotes/VERSION': '0.4.0\n', 'src/emotes/settings-rows.json': real('emotes'),
        'src/ai/kit/VERSION': '0.8.0\n', 'src/ai/kit/settings-rows.json': real('ai'),
      }
      const rows = tab([
        { id: 'crashReports', type: 'toggle', label: 'Send crash reports' },
        { id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes' },
        { id: 'botChatter', type: 'selector', label: 'Bot chatter', options: ['Off', 'Some', 'Lots'] },
      ])
      const wired = ['applyCrashSetting(values)\napplyEmoteSetting(emotes, values)\napplyBanterSetting(banter, values)']
      expect(runIn(files, rows, wired)).toMatchObject({ ok: true, detail: '3 rows on: 0 read by the game, 3 handled by the kit / audio module' })
      const r = runIn(files, rows, ['applyCrashSetting(values)'])
      expect(r.problems).toHaveLength(2)
      expect(r.problems[0]).toMatch(/"hideEmotes".*it's the emotes module's row: pass it to the emotes module: applyEmoteSetting/)
      expect(r.problems[1]).toMatch(/"botChatter".*it's the ai module's row: pass it to the bots' voice: applyBanterSetting/)
    } finally { cleanUp() }
  })
  it('an older module copy without a manifest passes through the one-release fallback (as before 0.30.0)', () => {
    try {
      const old = { 'src/emotes/VERSION': '0.3.0 (framework 8c204d6)\n', 'src/crashes/VERSION': '0.1.0\n', 'src/ai/kit/VERSION': '0.7.0\n' }
      const rows = tab([
        { id: 'crashReports', type: 'toggle', label: 'Send crash reports' },
        { id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes' },
        { id: 'botChatter', type: 'selector', label: 'Bot chatter', options: ['Off', 'Some', 'Lots'] },
      ])
      expect(runIn(old, rows, ['setOn(true); emotes.setHideAll(false); banter.setChatter("Lots")'])).toMatchObject({ ok: true, detail: '3 rows on: 0 read by the game, 3 handled by the kit / audio module' })
      // still red when an old copy's row isn't passed on — and the line names the module
      const r = runIn(old, rows, ['setOn(true); banter.setChatter("Lots")'])
      expect(r.problems).toEqual([`Game → Hide everyone's emotes ("hideEmotes", a toggle): nothing in the game reads it — it's the emotes module's row: ${JSON.parse(real('emotes')).rows[0].hint}`])
      // the fallback's hints are the manifests' own, word for word
      for (const module of ['crashes', 'emotes', 'ai']) expect(OLD_MODULE_ROWS[module].map((row) => row.hint)).toEqual(JSON.parse(real(module)).rows.map((row) => row.hint))
    } finally { cleanUp() }
  })
  it('the fallback is only for an installed copy: no module folder → its row is just a row the game must read', () => {
    try {
      const r = runIn({}, tab([{ id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes' }]), ['applyEmoteSetting(emotes, values)'])
      expect(r.ok).toBe(false)
      expect(r.problems[0]).toMatch(/nothing in the game reads it — read values\.hideEmotes/)
    } finally { cleanUp() }
  })
  it('a broken manifest fails in plain English naming the module — bad JSON, a bad pattern, no rows — and never crashes', () => {
    try {
      const broken = runIn({ 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': '{ "rows": [ { "id": "diceSkin", ' }, diceRow, ['applyDiceSetting(values)'])
      expect(broken.ok).toBe(false)
      expect(broken.problems.at(-1)).toMatch(/^src\/dice\/settings-rows\.json isn't valid JSON \(.+\), so the dice module's Settings rows can't be checked — reinstall the module \(node ~\/\.claude\/config\/bmuz\/scripts\/install-module\.mjs dice \.\)/)
      expect(broken.fix).toMatch(/settings-rows\.json .* is broken — reinstall that module/)
      const badRe = JSON.stringify({ rows: [{ id: 'diceSkin', readBy: ['applyDiceSetting(', '\\bsetSkin\\s*\\('] }] })
      const r = runIn({ 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': badRe }, diceRow, ['dice.setSkin(values.x)'])
      expect(r.problems).toEqual([expect.stringMatching(/^src\/dice\/settings-rows\.json "diceSkin": the pattern "applyDiceSetting\(" isn't one the check can use \(.+\) — reinstall the module/)])
      // (the good pattern beside it still counted the row as read, so only the broken pattern is listed)
      expect(runIn({ 'src/dice/VERSION': '0.1.0\n', 'src/dice/settings-rows.json': '[]' }, diceRow, []).problems)
        .toContain('src/dice/settings-rows.json has no "rows" list, so the dice module\'s Settings rows can\'t be checked — reinstall the module (node ~/.claude/config/bmuz/scripts/install-module.mjs dice .) — the game\'s copy isn\'t meant to be edited')
      const odd = readRowManifest(JSON.stringify({ rows: [null, { id: 'x' }, { id: 'y', readBy: [42, 'a'.repeat(301)] }] }), { module: 'dice' })
      expect(odd.problems).toHaveLength(4)
      expect(odd.rows.map((row) => row.id)).toEqual(['x', 'y'])
    } finally { cleanUp() }
  })
  it('a pattern that could run for minutes on a game\'s code (a repeated group with a repeat inside, like (a+)+) is refused, not run', () => {
    const slow = ['(a+)+$', '(\\w+\\s?)*x', '((ab)*)+', '(?:x|y+){2,}', '(a+){3}']
    for (const source of slow) {
      const m = readRowManifest(JSON.stringify({ rows: [{ id: 'diceSkin', readBy: [source] }] }), { module: 'dice' })
      expect(m.rows[0].readBy, source).toEqual([])
      expect(m.problems, source).toEqual([expect.stringMatching(/"diceSkin": the pattern .* could take minutes to check \(a repeated group with a repeat inside\), so it isn't run — reinstall the module/)])
    }
    // the real shapes stay fine: one group of names, a repeat after a plain group, escaped brackets, a class with + inside
    for (const source of ['\\b(applyCrashSetting|setOn)\\s*\\(', '(ab)+', '\\(a+\\)+', '[a+]+', '(a+)?b', '(?:x+)y']) {
      expect(readRowManifest(JSON.stringify({ rows: [{ id: 'd', readBy: [source] }] }), { module: 'dice' }).problems, source).toEqual([])
    }
  })
  it('an older module copy\'s failure line names that module\'s own call, not a generic "read values.…"', () => {
    try {
      const r = runIn({ 'src/emotes/VERSION': '0.3.0\n' }, tab([{ id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes' }]), [])
      expect(r.problems[0]).toMatch(/it's the emotes module's row: pass it to the emotes module: applyEmoteSetting\(emotes, /)
    } finally { cleanUp() }
  })
  it('only module copies count: a manifest without a VERSION beside it, or under node_modules, is never read', () => {
    try {
      const files = { 'src/dice/settings-rows.json': dice, 'src/node_modules/dice/VERSION': '1\n', 'src/node_modules/dice/settings-rows.json': dice }
      expect(runIn(files, diceRow, ['applyDiceSetting(values)']).ok).toBe(false)
    } finally { cleanUp() }
  })
})
