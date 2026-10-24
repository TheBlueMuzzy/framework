// INSTALL / UPDATE THE AI MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-ai.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does: copies kit/ → <game>/src/ai/kit/ (not the tests: they run here, in the framework), plus the PC command
// scripts/ai-arena.mjs → src/ai/kit/ai-arena.mjs (npm run ai:arena), writes a VERSION file (module version + framework
// commit), and removes files the module no longer ships — only ever inside src/ai/kit/. Gives the game, ONCE (after
// that it's the game's, never overwritten): content/ai/arena.json — how the arena plays (games, table sizes, seed…) —
// and content/ai/banter.json — when the bots talk (chance per moment, cooldown, presets, delay; F22).
// Then prints the steps still missing. The game writes its plug (goals, readings, imagine…) against
// src/ai/kit/types.ts, and its arena file (src/ai/arenaGame.ts) against src/ai/kit/arena.ts, in src/ai/.
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// npm run check:framework (the Dev Kit's runner, src/devkit/check-framework.mjs) runs this module's own promise checks
// (kit/conformance.mjs) — asked for here while the game's package.json doesn't have the script yet
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too, and says what to wire where)'
}

const aiDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/ai/kit'
const COMMAND = 'ai-arena.mjs' // scripts/ai-arena.mjs → src/ai/kit/ai-arena.mjs
const STARTERS = { 'content/ai/arena.json': 'templates/content/ai/arena.json', 'content/ai/banter.json': 'templates/content/ai/banter.json' }
const ARENA_FILE = 'src/ai/arenaGame.ts'
const isTest = (path) => /\.test\./.test(path)

/** The ids of the game's personalities with chattiness > 0 (content/ai/*.json files with a "personalities" list). */
export function chattyPersonalities(gameDir) {
  const dir = join(gameDir, 'content/ai')
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => {
    try {
      const list = JSON.parse(readFileSync(join(dir, f), 'utf8')).personalities
      return Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string' && p.chattiness > 0).map((p) => p.id) : []
    } catch { return [] }
  })
}

/** Does the game's own code (src/ outside the kit, party/) match? */
function codeCalls(gameDir, re) {
  const files = ['src', 'party'].flatMap((d) => listFiles(join(gameDir, d)).map((f) => join(d, f).replaceAll('\\', '/')))
    .filter((f) => /\.(m?[jt]sx?)$/.test(f) && !isTest(f) && !f.startsWith(`${KIT_TARGET}/`))
  return files.some((f) => re.test(readFileSync(join(gameDir, f), 'utf8')))
}

/** The game's name (package.json "name", else its folder) — the save key's start ("goops:banter"). */
export function gameName(gameDir) {
  try {
    const name = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return basename(resolve(gameDir)).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}
export const saveKey = (gameDir) => `${gameName(gameDir)}:banter`
export const goldenFile = (gameDir) => `tests/saves/${saveKey(gameDir).replace(/[^A-Za-z0-9._-]/g, '_')}-v1.json`
const hasSaves = (gameDir) => existsSync(join(gameDir, 'src/saves/VERSION'))

/** The golden save's text for this game ("Bot chatter" set to Lots). */
export function goldenText(gameDir) {
  const key = saveKey(gameDir)
  const data = { chatter: 'lots' }
  return JSON.stringify({ about: `The AI module's banter save (${key}), version 1: "Bot chatter" set to Lots. Written by the AI installer.`, stored: { save: key, version: 1, savedAt: '2026-10-23T00:00:00.000Z', data }, expect: data }, null, 2) + '\n'
}

// "Bot chatter" in Settings (Off · Some · Lots), kept by the saves module — the steps still missing
function chatterSteps(gameDir) {
  let rows = []
  try { rows = JSON.parse(readFileSync(join(gameDir, 'content/ui/settings.json'), 'utf8')).tabs.flatMap((t) => t.rows ?? []) } catch { /* no Settings file */ }
  const steps = [
    {
      done: rows.some((r) => r?.id === 'botChatter' && r.on !== false) || codeCalls(gameDir, /\bBANTER_SETTINGS_ROWS\b/),
      step: 'Settings: paste BANTER_SETTINGS_ROWS (src/ai/kit/settingsRow.ts — "Bot chatter": Off · Some · Lots, default Some) into a tab\'s "rows" in content/ui/settings.json (under the Emotes heading)',
    },
    {
      done: codeCalls(gameDir, /\b(applyBanterSetting|setChatter)\s*\(/),
      step: 'The setting reaches the bots: applyBanterSetting(banter, loadSettings(settingsJson)) when botBanter is made, and applyBanterSetting(banter, values) in <Settings onChange> (live)',
    },
  ]
  if (hasSaves(gameDir)) steps.push({
    done: codeCalls(gameDir, /createSave\s*\(\s*\{\s*\.\.\.BANTER_SAVE/),
    step: `Kept with the saves module:   import { createSave } from '../saves'   import { BANTER_SAVE } from '../ai/kit/save'
       export const banterSave = createSave({ ...BANTER_SAVE, key: '${saveKey(gameDir)}', version: 1 })   then botBanter({ …, save: banterSave })
       and list banterSave in tests/saves/saves.test.ts SAVES (its golden copy ${goldenFile(gameDir)} is already there)`,
  })
  return steps.map((s) => ({ ...s, banter: true }))
}

// The wiring, as { done, step } — so only the missing steps are printed (like the crashes installer's)
export function wiringSteps(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json: the step shows */ }
  return [
    {
      // (a game's own older arena script — Glyphtender's scripts/ai-arena.mjs — doesn't count: it isn't the framework's)
      done: /src[\\/]ai[\\/]kit[\\/]ai-arena\.mjs/.test(scripts['ai:arena'] ?? ''),
      step: `package.json "scripts": "ai:arena": "node src/ai/kit/ai-arena.mjs"   (AI-vs-AI games + the Personality Check report on the PC; needs vite, which every web game has)${scripts['ai:arena'] ? `\n       — it says "${scripts['ai:arena']}" now (the game's own arena): switch once src/ai/arenaGame.ts gives the same numbers` : ''}`,
    },
    {
      // Banter (F22): only asked for once a personality talks (chattiness > 0)
      done: !chattyPersonalities(gameDir).length || codeCalls(gameDir, /\bbotBanter\s*(<[^>()]*>)?\s*\(/),
      step: `the bots talk (${chattyPersonalities(gameDir).join(', ')} ${chattyPersonalities(gameDir).length === 1 ? 'has' : 'have'} chattiness > 0): their lines in content/text/en.json "banter": { "<personality>": { "<moment>": "…" } } (the Dev Kit's AI tab edits them),
       the moments in the plug (moments(event, seat) → the names in content/ai/banter.json "chance"; a rival's good move as { moment: 'rivalBigMove', by: seat } so a person's always gets an answer), then
       const banter = botBanter({ moments: plug.moments, bots, settings: readBanterSettings(banterJson), lines: () => text.banter, say: (seat, id) => emotes.say(seatIdOf(seat), id).ok, muted: (seat) => emotes.isMuted(seatIdOf(seat)), seed })
       and banter.hear(events) after every change — online in party/server.ts with say: room.emote (the AI README's "Banter"; needs the emotes module)`,
      banter: true,
    },
    // Bot chatter (0.5.0, Muzzy 2026-10-23: "this is usually a menu setting") — once a personality talks
    ...(chattyPersonalities(gameDir).length ? chatterSteps(gameDir) : []),
    {
      done: existsSync(join(gameDir, ARENA_FILE)),
      step: `${ARENA_FILE}: the game's half of the arena — export default async function arenaGame(files) returning { plug, personalities, skills, targets }
       (plug = its rules, setup(seats, seed, kind) with its board choice, bot, meters, winners — src/ai/kit/arena.ts ArenaGameFile; the AI README's "Arena")`,
    },
    {
      // "Suggest sliders" in the Dev Kit (0.7.0, F26): once the game's Dev Kit worker plays the check, until it tunes too
      done: !codeCalls(gameDir, /\bserveCheck\s*(<[^>()]*>)?\s*\(/) || (codeCalls(gameDir, /\bsuggestInWorker\s*\(/) && codeCalls(gameDir, /\btunePersonality\s*\(/)),
      optional: true,
      step: `The Dev Kit's "Suggest sliders" (Dev Kit 0.26.0): in the check's worker give serveCheck a second function —
       serveCheck(self, runCheck, (job, onProgress) => tunePersonality(plug, { personalities: job.personalities, skills: job.skills, targets, mainSkill }, job.personality, { settings: arenaJson, onProgress }))
       (tunePersonality from src/ai/kit/tune.ts) — and in the AI tab's plug: suggest: (options) => suggestInWorker(startWorker, options)   (the AI README's "Suggest sliders")`,
    },
    {
      // "What wins?" (0.6.0, F25): once the arena file is there, until its plug names situations
      done: !existsSync(join(gameDir, ARENA_FILE)) || /\bsituations\s*[:(]/.test(readFileSync(join(gameDir, ARENA_FILE), 'utf8')),
      optional: true,
      step: `"What wins?": name the game's situations in the arena plug, situations: (state, seat) => ({ 'score lead': …, 'letters in hand': … }) (numbers only)
       — the report, npm run ai:arena and the Dev Kit's Run check then say which predict the win (read after turns 3, 5 and at the end: content/ai/arena.json "whatWinsMoments"; the AI README's "What wins?")`,
    },
  ]
}

export const TUNE_SCRIPT = 'node src/ai/kit/ai-arena.mjs --tune'

/** npm run ai:tune (0.7.0, F26) — added to package.json by the installer itself, once the game runs the framework's
 *  ai:arena (the tuner plays the same arena file). A game's own different "ai:tune" is left alone. Only when missing. */
export function addTuneScript(gameDir, { dryRun = false, log = console.log } = {}) {
  const path = join(gameDir, 'package.json')
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  let pkg
  try { pkg = JSON.parse(text) } catch { return false }
  if (!/src[\\/]ai[\\/]kit[\\/]ai-arena\.mjs/.test(pkg.scripts?.['ai:arena'] ?? '') || pkg.scripts['ai:tune'] !== undefined) return false
  pkg.scripts = { ...pkg.scripts, 'ai:tune': TUNE_SCRIPT }
  const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '  '
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  if (!dryRun) writeFileSync(path, JSON.stringify(pkg, null, indent).replaceAll('\n', eol) + eol)
  log(`  added   package.json "ai:tune": "${TUNE_SCRIPT}"   (npm run ai:tune -- --personality <id>: suggested sliders, never written)`)
  return true
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// Worked out once per run: it starts two git processes, which take 0.2–2 s each on a busy Windows PC (F128, as saves
// 0.6.2 did in F125: the install tests call installAi many times, and under check:fast those git runs were most of the test's time).
// The kit's commit can't change while one install runs, so asking again only costs time.
let kitVersionOnce = null
function kitVersion() {
  kitVersionOnce ??= readKitVersion()
  return kitVersionOnce
}

function readKitVersion() {
  const version = readFileSync(join(aiDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: aiDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit', { cwd: aiDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

export function installAi(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // what the module ships: path in src/ai/kit/ → path here
  const ships = new Map(listFiles(join(aiDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION').map((f) => [f, join(aiDir, 'kit', f)]))
  ships.set(COMMAND, join(aiDir, 'scripts', COMMAND))
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = [...ships.keys()].filter((f) => !present.includes(f) || !readFileSync(ships.get(f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !ships.has(f))
  // (the banter save's golden copy, once — only when the game has the saves module and a personality talks)
  const golden = hasSaves(game) && chattyPersonalities(game).length ? [goldenFile(game)] : []
  const starter = [...Object.keys(STARTERS), ...golden].filter((f) => !existsSync(join(game, f)))
  const { version, commit } = kitVersion()
  log(`AI module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  if (dryRun) {
    addTuneScript(game, { dryRun, log })
    return { changed, removed, starter }
  }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(ships.get(f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    if (STARTERS[f]) copyFileSync(join(aiDir, STARTERS[f]), join(game, f))
    else writeFileSync(join(game, f), goldenText(game))
  }
  addTuneScript(game, { log })
  const missing = wiringSteps(game).filter((w) => !w.done && !w.optional)
  if (missing.length) {
    log(`  Still to wire${missing.every((w) => !w.banter) ? ' (only for the arena — npm run ai:arena)' : ''}:`)
    missing.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  }
  wiringSteps(game).filter((w) => !w.done && w.optional).forEach((w) => log(`  Optional: ${w.step}`))
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  if (!gameDir) {
    console.log('Usage: node scripts/install-ai.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  installAi(gameDir, { dryRun: process.argv.includes('--dry-run') })
}
