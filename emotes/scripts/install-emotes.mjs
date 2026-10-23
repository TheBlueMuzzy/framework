// INSTALL / UPDATE THE EMOTES MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-emotes.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   - copies kit/ → <game>/src/emotes/ (not the tests: they run here, in the framework)
//   - kit/ui/ (the bubbles, the picker, the mute menu — built from UI kit parts) only goes in when the game has the UI kit
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/emotes/
//   - gives the game, ONCE (after that it's the game's, never overwritten): content/emotes.json (phrases, limits, timings)
//   - adds the starter phrases' words to content/text/en.json "emotes" — only ids that have no words yet (a game's own
//     words are never touched)
//   - with the saves module: the emote save's golden copy tests/saves/<game>_emotes-v1.json, once
//   - prints the wiring steps still missing (only those)
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const emotesDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/emotes'
const UI_FOLDER = 'ui/'
const CONTENT = 'content/emotes.json'
const TEXT = 'content/text/en.json'
const isTest = (path) => /\.test\./.test(path)
const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

/** The game's name (package.json "name", else its folder) — the save key's start ("goops:emotes"). */
export function gameName(gameDir) {
  try {
    const name = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return basename(resolve(gameDir)).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}
export const saveKey = (gameDir) => `${gameName(gameDir)}:emotes`
export const goldenFile = (gameDir) => `tests/saves/${saveKey(gameDir).replace(/[^A-Za-z0-9._-]/g, '_')}-v1.json`

// npm run check:framework (the Dev Kit's runner) runs this module's promise checks (kit/conformance.mjs)
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too)'
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// What a game's code says, minus comments (a how-to comment is not wiring)
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

/** Where a top-level key's value starts in JSON text (the index of its first character), or -1. Strings are stepped
 *  over, so a "emotes" inside another object or a string never counts. */
function topLevelValueAt(text, key) {
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      let j = i + 1
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1
      if (depth === 1 && text.slice(i + 1, j) === key) {
        const colon = text.slice(j + 1).match(/^\s*:\s*/)
        if (colon) return j + 1 + colon[0].length
      }
      i = j
    } else if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') depth--
  }
  return -1
}

/** The starter words the text file doesn't have yet → { text, added } (text = the new file, or null when nothing to
 *  add). The file is never re-written as a whole: the new lines are put in where they go, so the game's own layout,
 *  one-line objects and \u escapes stay exactly as they were. Checked by reading the result back. */
export function wordsToAdd(current) {
  const starter = JSON.parse(readFileSync(join(emotesDir, 'templates', 'content', 'words.json'), 'utf8')).emotes
  if (!current.trim()) return { text: JSON.stringify({ emotes: starter }, null, 2) + '\n', added: Object.keys(starter) }
  let file
  try { file = JSON.parse(current) } catch { return { text: null, added: [], broken: true } }
  if (!file || typeof file !== 'object' || Array.isArray(file)) return { text: null, added: [], broken: true }
  // An "emotes" that's there but isn't an object of words (a string, null, a list…) is the game's: never replaced
  const has = Object.prototype.hasOwnProperty.call(file, 'emotes')
  if (has && !(file.emotes && typeof file.emotes === 'object' && !Array.isArray(file.emotes))) return { text: null, added: [], notObject: true }
  const mine = has ? file.emotes : null
  const added = Object.keys(starter).filter((id) => typeof mine?.[id] !== 'string')
  if (!added.length) return { text: null, added }
  const indent = current.match(/\n([ \t]+)"/)?.[1] ?? '  '
  const line = (id, depth) => `${indent.repeat(depth)}${JSON.stringify(id)}: ${JSON.stringify(starter[id])}`
  const lines = added.map((id) => line(id, 2)).join(',\n')
  let text
  if (!mine) {
    // A new "emotes" part, last in the file
    const end = current.lastIndexOf('}')
    const before = current.slice(0, end).replace(/\s*$/, '')
    const comma = before.endsWith('{') ? '' : ','
    text = `${before}${comma}\n${indent}"emotes": {\n${lines}\n${indent}}\n}${current.slice(end + 1)}`
  } else {
    // Into the game's own "emotes" part, right after its {
    const at = topLevelValueAt(current, 'emotes')
    if (at < 0 || current[at] !== '{') return { text: null, added, cantPlace: true }
    const empty = /^\{\s*\}/.test(current.slice(at))
    text = empty
      ? `${current.slice(0, at)}{\n${lines}\n${indent}}${current.slice(at).replace(/^\{\s*\}/, '')}`
      : `${current.slice(0, at + 1)}\n${lines},${current.slice(at + 1)}`
  }
  // Read it back: exactly the old file plus the new words, or nothing is written
  const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v)
  const expected = { ...file, emotes: { ...(mine ?? {}), ...Object.fromEntries(added.map((id) => [id, starter[id]])) } }
  try {
    if (JSON.stringify(canon(JSON.parse(text))) !== JSON.stringify(canon(expected))) return { text: null, added, cantPlace: true }
  } catch { return { text: null, added, cantPlace: true } }
  return { text, added }
}

// The wiring, as { done, step } — so only the missing steps are printed (like the crashes installer's)
export function wiringSteps(gameDir) {
  const text = (file) => readText(join(gameDir, file))
  const code = listFiles(join(gameDir, 'src')).filter((f) => !f.startsWith('emotes/') && /\.(ts|tsx|js|jsx|mjs)$/.test(f)).map((f) => withoutComments(text(`src/${f}`)))
  const inCode = (pattern) => code.some((c) => pattern.test(c))
  const hasUi = existsSync(join(gameDir, 'src/ui/kit/VERSION'))
  const hasSaves = existsSync(join(gameDir, 'src/saves/VERSION'))
  const online = existsSync(join(gameDir, 'party/server.ts'))
  const settingsRows = (() => { try { return JSON.parse(text('content/ui/settings.json')).tabs.flatMap((t) => t.rows ?? []) } catch { return [] } })()
  const steps = [
    {
      done: inCode(/\bcreateEmotes\s*\(/),
      step: `Make the module once (e.g. src/game/emotes.ts):   import emotesJson from '../../content/emotes.json'   import text from '../../content/text/en.json'
       import { createEmotes } from '../emotes'
       export const emotes = createEmotes({ settings: emotesJson, words: text.emotes, mine: [<this device's seat ids>]${hasSaves ? ', save: emoteSave' : ''} })
       A new match → emotes.setMatch(id); who plays on this device → emotes.setMine(seats).`,
    },
  ]
  if (hasSaves) steps.push({
    done: inCode(/createSave\s*\(\s*\{\s*\.\.\.EMOTE_SAVE/),
    step: `Kept with the saves module:   import { createSave } from '../saves'   import { EMOTE_SAVE } from '../emotes'
       export const emoteSave = createSave({ ...EMOTE_SAVE, key: '${saveKey(gameDir)}', version: 1 })
       and list emoteSave in tests/saves/saves.test.ts SAVES (its golden copy ${goldenFile(gameDir)} is already there)`,
  })
  if (hasUi) steps.push(
    {
      done: inCode(/<EmoteBubbles\b/),
      step: `The bubbles, once, over the table:   import { EmoteBubbles } from '../emotes/ui/EmoteLayer'
       <EmoteBubbles emotes={emotes} targetFor={(seat) => \`[data-emote-seat="\${seat}"]\`} nameFor={(seat) => name(seat)} avoid="<your HUD's selector>, [data-emote-seat]" />`,
    },
    {
      done: inCode(/<EmoteMenu\b/) && inCode(/\bemoteSeatProps\s*\(/),
      step: `Tappable seats: wrap each seat's chip / portrait in a button with {...emoteSeatProps(seat, seat === me)} that opens
       <EmoteMenu emotes={emotes} seat={tapped} mine={tapped === me} anchor={\`[data-emote-seat="\${tapped}"]\`} name={…} onClose={…} />
       (your seat → the phrase picker; an opponent's → Mute emotes). Close it when Pause opens. A muted seat's chip: badge={<MutedMark />}.`,
    },
  )
  steps.push(
    {
      done: settingsRows.some((r) => r?.id === 'hideEmotes' && r.on !== false) || inCode(/\bEMOTE_SETTINGS_ROWS\b|\bemoteSettingsRows\s*\(/),
      step: 'Settings: paste EMOTE_SETTINGS_ROWS (src/emotes/settingsRow.ts — "Hide everyone\'s emotes", off) into a tab\'s "rows" in content/ui/settings.json',
    },
    {
      done: inCode(/\bapplyEmoteSetting\s*\(/) || inCode(/\bsetHideAll\s*\(/),
      step: 'The switch reaches the module: applyEmoteSetting(emotes, loadSettings(settingsJson)) at start-up, and applyEmoteSetting(emotes, values) in <Settings onChange>',
    },
  )
  if (online) steps.push(
    {
      done: /super\s*\([^)]*\{[^)]*\bemotes\b/.test(withoutComments(text('party/server.ts'))),
      step: "Online, the room relays them (Rooms 0.12.0+): party/server.ts   import emotes from '../content/emotes.json'   super(party, rules, settings, { emotes })",
    },
    {
      done: inCode(/\bonEmote\s*:/) && inCode(/\bsendEmote\s*\(/),
      step: 'Online, the screens: useRoom(code, me, { onEmote: (m) => emotes.receive(m) }) and createEmotes({ …, send: (seat, id) => online.sendEmote(id) }) while online',
    },
  )
  return steps
}

function kitVersion() {
  const version = readFileSync(join(emotesDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: emotesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit scripts', { cwd: emotesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

/** The golden save's text for this game (a muted seat in a room match, the switch on). */
export function goldenText(gameDir) {
  const key = saveKey(gameDir)
  const data = { hideAll: true, match: 'BAKU', seats: ['seat-2'] }
  return JSON.stringify({ about: `The emotes module's save (${key}), version 1: the Hide emotes switch on, seat-2 muted in room BAKU. Written by the emotes installer.`, stored: { save: key, version: 1, savedAt: '2026-10-23T00:00:00.000Z', data }, expect: data }, null, 2) + '\n'
}

export function installEmotes(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // A src/emotes/ with files but no VERSION isn't ours (the game's own code): never touch it.
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed or removed. Rename that folder, then run the installer again.`
    log(`Emotes module: ${refused}`)
    return { refused, changed: [], removed: [], starter: [] }
  }
  const hasUiKit = existsSync(join(game, 'src/ui/kit/VERSION'))
  const hasSaves = existsSync(join(game, 'src/saves/VERSION'))
  const ships = new Map(listFiles(join(emotesDir, 'kit'))
    .filter((f) => !isTest(f) && f !== 'VERSION')
    .filter((f) => hasUiKit || !f.startsWith(UI_FOLDER))
    .map((f) => [f, join(emotesDir, 'kit', f)]))
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = [...ships.keys()].filter((f) => !present.includes(f) || !readFileSync(ships.get(f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !ships.has(f))
  const starter = [CONTENT, ...(hasSaves ? [goldenFile(game)] : [])].filter((f) => !existsSync(join(game, f)))
  const words = wordsToAdd(readText(join(game, TEXT)))
  const { version, commit } = kitVersion()
  log(`Emotes module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (!hasUiKit) log(`  skipped ${UI_FOLDER} (the bubbles and the picker — the game has no UI kit; draw them yourself from onEmote)`)
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  if (words.broken) log(`  ⚠ ${TEXT} isn't valid JSON — add the phrases' words yourself ("emotes": { "hello": "Hello!", … })`)
  else if (words.notObject) log(`  ⚠ ${TEXT} "emotes" isn't a list of words (it should be { "hello": "Hello!", … }) — left as it is; fix it, then run the installer again`)
  else if (words.cantPlace) log(`  ⚠ couldn't add the words to ${TEXT} without changing anything else — add them yourself under "emotes": ${words.added.join(', ')} (templates/content/words.json has them)`)
  else if (words.added.length) log(`  words   ${TEXT} "emotes": ${words.added.join(', ')} (only ids that had none)`)
  if (dryRun) return { changed, removed, starter, words: words.text ? words.added : [] }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(ships.get(f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  if (removed.some((f) => f.startsWith(UI_FOLDER)) && !listFiles(join(target, 'ui')).length) rmSync(join(target, 'ui'), { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    if (f === CONTENT) copyFileSync(join(emotesDir, 'templates', 'content', 'emotes.json'), join(game, f))
    else writeFileSync(join(game, f), goldenText(game))
  }
  if (words.text) {
    mkdirSync(dirname(join(game, TEXT)), { recursive: true })
    writeFileSync(join(game, TEXT), words.text)
  }
  const missing = wiringSteps(game).filter((w) => !w.done)
  if (missing.length) {
    log('  Still to wire:')
    missing.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  } else log('  Wired.')
  { const step = checkFrameworkStep(game); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter, words: words.text ? words.added : [] }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  const unknown = process.argv.slice(3).filter((a) => a !== '--dry-run')
  if (!gameDir || gameDir.startsWith('-') || unknown.length) {
    if (unknown.length) console.log(`Unknown: ${unknown.join(' ')}`)
    console.log('Usage: node scripts/install-emotes.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  const result = installEmotes(gameDir, { dryRun: process.argv.includes('--dry-run') })
  if (result.refused) process.exit(1)
}
