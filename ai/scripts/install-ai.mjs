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
import { dirname, join, relative, resolve } from 'node:path'
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
      done: !chattyPersonalities(gameDir).length || codeCalls(gameDir, /\bbotBanter\s*\(/),
      step: `the bots talk (${chattyPersonalities(gameDir).join(', ')} ${chattyPersonalities(gameDir).length === 1 ? 'has' : 'have'} chattiness > 0): their lines in content/text/en.json "banter": { "<personality>": { "<moment>": "…" } } (the Dev Kit's AI tab edits them),
       the moments in the plug (moments(event, seat) → the names in content/ai/banter.json "chance"), then
       const banter = botBanter({ moments: plug.moments, bots, settings: readBanterSettings(banterJson), lines: () => text.banter, say: (seat, id) => emotes.say(seatIdOf(seat), id).ok, seed })
       and banter.hear(events) after every change — online in party/server.ts with say: room.emote (the AI README's "Banter"; needs the emotes module)`,
      banter: true,
    },
    {
      done: existsSync(join(gameDir, ARENA_FILE)),
      step: `${ARENA_FILE}: the game's half of the arena — export default async function arenaGame(files) returning { plug, personalities, skills, targets }
       (plug = its rules, setup(seats, seed, kind) with its board choice, bot, meters, winners — src/ai/kit/arena.ts ArenaGameFile; the AI README's "Arena")`,
    },
  ]
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

function kitVersion() {
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
  const starter = Object.keys(STARTERS).filter((f) => !existsSync(join(game, f)))
  const { version, commit } = kitVersion()
  log(`AI module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  if (dryRun) return { changed, removed, starter }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(ships.get(f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    copyFileSync(join(aiDir, STARTERS[f]), join(game, f))
  }
  const missing = wiringSteps(game).filter((w) => !w.done)
  if (missing.length) {
    log(`  Still to wire${missing.every((w) => !w.banter) ? ' (only for the arena — npm run ai:arena)' : ''}:`)
    missing.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  }
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
