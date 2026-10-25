// INSTALL / UPDATE THE ROOMS MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-rooms.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   1. copies kit/ → <game>/src/rooms/  (browser side: protocol, room codes, identity, useRoom —
//      and src/rooms/server/, the server base the game's party/server.ts builds on)
//      Not the tests: they run here, in the framework. Adds a VERSION file (module version + framework commit).
//      Files the module no longer ships are removed — only ever inside src/rooms/.
//   2. creates the game's own starting files — only if missing, never overwrites:
//      party/server.ts + party/rules.ts (an example game to replace), party/worker.ts (Cloudflare's front door,
//      PartyServer), content/rooms.json (the knobs), wrangler.json (the server's name, room storage, local port)
//   3. prints the wiring the game still needs (packages, npm scripts, VITE_PARTY_HOST…) — only the missing bits
// On an update it first lists which files changed, were added or were removed.
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// npm run check:framework (the Dev Kit's runner, src/devkit/check-framework.mjs) runs this module's own promise checks
// (kit/conformance.mjs) — asked for here while the game's package.json doesn't have the script yet
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too, and says what to wire where)'
}

const roomsDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/rooms'
export const PARTY_PORT = 1999

const isTest = (path) => /\.test\./.test(path)
const readText = (path) => readFileSync(path, 'utf8')
const writeText = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
const copyFile = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to) }
const sameFile = (a, b) => readFileSync(a).equals(readFileSync(b)) // byte for byte

// Every file under a folder, as paths relative to it with forward slashes ("server/seats.ts").
// Links to other folders are skipped, so an update can never reach outside the kit.
function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// Only ever delete a file that really sits inside the target folder
function removeInside(target, file, log) {
  const path = join(target, file)
  if (realpathSync(path).startsWith(realpathSync(target) + sep)) rmSync(path)
  else log(`  ! skipped ${file}: it points outside ${target}`)
}

// "0.1.0" + "a1b2c3d" — the module's version and the framework commit it's copied from
// Worked out once per run: it starts two git processes, which take 0.2–2 s each on a busy Windows PC (F128, as saves
// 0.6.2 did in F125: the install tests call installRooms many times, and under check:fast those git runs were most of the test's time).
// The kit's commit can't change while one install runs, so asking again only costs time.
let kitVersionOnce = null
function kitVersion() {
  kitVersionOnce ??= readKitVersion()
  return kitVersionOnce
}

function readKitVersion() {
  const version = readText(join(roomsDir, 'kit', 'VERSION')).trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: roomsDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const edited = execSync('git status --porcelain kit templates', { cwd: roomsDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (edited) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

// The game's name for Cloudflare (wrangler.json "name" → <name>.joebrogno.workers.dev)
function gameName(gameDir) {
  try {
    const name = JSON.parse(readText(join(gameDir, 'package.json'))).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return gameDir.split(/[\\/]/).filter(Boolean).at(-1).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

// PartyServer on Muzzy's own Cloudflare (Glyphtender's proven setup): one room = one Durable Object of class "Main"
// (SQLite-backed: the free plan's kind) → /parties/main/<code>, PartySocket's default address.
export function wranglerConfig(gameDir) {
  return {
    name: gameName(gameDir),
    main: 'party/worker.ts',
    compatibility_date: '2026-09-01',
    durable_objects: { bindings: [{ name: 'Main', class_name: 'Main' }] },
    migrations: [{ tag: 'v1', new_sqlite_classes: ['Main'] }],
    observability: { enabled: true },
    dev: { port: PARTY_PORT, ip: '0.0.0.0' },
  }
}

const WRANGLER_FILES = ['wrangler.json', 'wrangler.jsonc', 'wrangler.toml']

// Files the game gets once, then owns: [where in the game, where in templates/ (or a maker)]
function starterFiles(gameDir) {
  const hasServer = existsSync(join(gameDir, 'party', 'server.ts'))
  const hasWrangler = WRANGLER_FILES.some((file) => existsSync(join(gameDir, file)))
  return [
    // The example rules only come with a new server — a game that already has party/server.ts keeps its own
    { to: 'party/server.ts', from: 'party/server.ts', why: 'the online server (builds on src/rooms/server)' },
    { to: 'party/rules.ts', from: 'party/rules.ts', why: 'an EXAMPLE game ("Count to 10") — replace with the real rules', skip: hasServer },
    { to: 'party/worker.ts', from: 'party/worker.ts', why: "Cloudflare's front door (PartyServer): hands each room to party/server.ts" },
    { to: 'content/rooms.json', from: 'content/rooms.json', why: 'room knobs: seats, idle players, timings' },
    { to: 'wrangler.json', make: () => JSON.stringify(wranglerConfig(gameDir), null, 2) + '\n', why: 'server name, room storage, local port 1999', skip: hasWrangler },
  ].filter((file) => !file.skip)
}

// How long an unfinished match is kept: the game's content/rooms.json "keepMatchDays", or null when it doesn't say
export function keepMatchDaysOf(gameDir) {
  try {
    const value = JSON.parse(readText(join(gameDir, 'content', 'rooms.json'))).keepMatchDays
    return typeof value === 'number' ? value : null
  } catch { return null }
}

// The wiring a game needs, as { done, step } — so only the missing steps are printed.
// `justMade` = the starter files this install just created (a rooms.json fresh from the template still needs its
// keepMatchDays chosen for this game).
export function wiringSteps(gameDir, { justMade = [] } = {}) {
  const text = (file) => (existsSync(join(gameDir, file)) ? readText(join(gameDir, file)) : '')
  let pkg = {}
  try { pkg = JSON.parse(text('package.json') || '{}') } catch { /* unreadable: every package step shows */ }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const scripts = pkg.scripts ?? {}
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local']
  const localHostInEnv = envFiles.find((file) => /^\s*VITE_PARTY_HOST\s*=\s*(localhost|127\.0\.0\.1)/m.test(text(file)))
  const name = gameName(gameDir)
  const onPartyKit = existsSync(join(gameDir, 'partykit.json')) || Boolean(deps.partykit)
  const keepMatchDays = keepMatchDaysOf(gameDir)
  const worker = text('party/worker.ts')
  // The game's own server files: does it run timers of its own (a turn clock), and start them again after a restart?
  const partyCode = existsSync(join(gameDir, 'party'))
    ? readdirSync(join(gameDir, 'party')).filter((f) => /\.ts$/.test(f) && !isTest(f)).map((f) => text(`party/${f}`)).join('\n')
    : ''

  return [
    {
      // PartyKit's hosted platform shut down on 23 Oct 2026 — every game runs on PartyServer + wrangler now
      done: !onPartyKit,
      step: `Move off PartyKit (its hosted platform shut down on 23 Oct 2026): delete partykit.json, run   npm uninstall partykit
       — party/worker.ts + wrangler.json (made above) take over. Rooms live in memory, so there's no room data to copy.`,
    },
    {
      done: Boolean(pkg.dependencies?.partysocket) && Boolean(pkg.dependencies?.partyserver) && Boolean(deps.wrangler),
      step: 'Packages: npm install partysocket partyserver   then   npm install -D wrangler',
    },
    {
      done: /^wrangler dev\b/.test(scripts['party:dev'] ?? '') && /^wrangler deploy\b/.test(scripts['party:deploy'] ?? ''),
      step: 'package.json "scripts": "party:dev": "wrangler dev", "party:deploy": "wrangler deploy"',
    },
    {
      done: /(^|\n)\s*\/?\.wrangler\/?\s*(\n|$)/.test(text('.gitignore')),
      step: '.gitignore: add the line   .wrangler/   (wrangler\'s local dev state)',
    },
    {
      done: !localHostInEnv,
      step: `${localHostInEnv}: remove VITE_PARTY_HOST=localhost… — for local dev leave it unset, so a phone on the Wi-Fi reaches the PC's server (src/rooms/roomClient.ts picks the page's own address, port ${PARTY_PORT})`,
    },
    {
      // F82: live-check.mjs pings /health after a deploy — the template has it, older workers don't
      done: !existsSync(join(gameDir, 'party', 'worker.ts')) || /healthResponse\(/.test(text('party/worker.ts')),
      step: `party/worker.ts: answer /health so live-check can tell the server is up —
       import { healthResponse } from '../src/rooms/server/health'   then first in fetch():   const health = healthResponse(request); if (health) return health`,
    },
    {
      // F100 (0.10.0): a match being played is kept in the room's storage — the template does it, older workers don't
      done: !worker || (/saveRoom:/.test(worker) && /\.restore\(/.test(worker) && /onAlarm\(/.test(worker)),
      step: `party/worker.ts: keep a match in the room's storage, so a server restart loses nothing and players can come back days later —
       copy the storage parts of framework/rooms/templates/party/worker.ts: RoomStorage + the constructor, saveRoom in onStart
       (async: load the saved match with room.restore), keep(), onAlarm(). wrangler.json's Main must be a SQLite class (new_sqlite_classes).`,
    },
    {
      // F100: the room starts its own timers again after a restart; the game's own (a turn clock) need rules.onRestore
      done: !/timers\.start\(/.test(partyCode) || /onRestore/.test(partyCode),
      step: `party/: the game starts timers of its own (room.timers.start) — add onRestore(state, room, timersEndAt) to its rules, so after a
       server restart its clocks go on for the time that was left (README "Kept until it ends").`,
    },
    {
      // F100 (Muzzy 2026-10-20): how long a match waits depends on the game's style — the designer picks it, not the default
      done: keepMatchDays !== null && !justMade.includes('content/rooms.json'),
      step: `Choose how long an unfinished match is kept for THIS game: content/rooms.json "keepMatchDays" (now ${keepMatchDays ?? 7}) — days after
       its last move before it ends ("That match has ended"). A live game ~7 · an async game played over days (Scrabble-with-friends) ~30 · any number.
       A game-style decision (settle it at /define); change it any time in content/rooms.json (Dev Kit or Obsidian).`,
    },
    {
      done: /["/]party["/]/.test(text('tsconfig.app.json')) || !existsSync(join(gameDir, 'tsconfig.app.json')),
      step: 'tsconfig.app.json: add "party" to "include" (so npm run build type-checks the server too)',
    },
  ].concat([
    // Always shown: how to run it, and the live-build setting (can't be checked from here)
    {
      done: false,
      step: `Try it: npm run party:dev (server, port ${PARTY_PORT}) + npm run dev. Phone on the same Wi-Fi: npx vite --host, open the Network link.`,
    },
    {
      done: false,
      step: `Going live (Muzzy's call — public): once per machine   npx wrangler login   (Muzzy's Cloudflare), then
       npm run party:deploy → wss://${name}.joebrogno.workers.dev,
       then build the game with VITE_PARTY_HOST=${name}.joebrogno.workers.dev (GitHub Actions: env on the build step).
       A front-end release does NOT update the server — deploy the server again whenever party/ or src/rooms/server/ changes.`,
    },
  ])
}

export function installRooms(gameDir, { dryRun = false, log = console.log } = {}) {
  if (!existsSync(gameDir)) throw new Error(`No folder at ${gameDir}`)
  const { version, commit } = kitVersion()

  // 1. What changes in src/rooms/
  const source = join(roomsDir, 'kit')
  const target = join(gameDir, KIT_TARGET)
  const sourceFiles = listFiles(source).filter((f) => !isTest(f) && f !== 'VERSION')
  const oldFiles = listFiles(target).filter((f) => f !== 'VERSION')
  const plan = {
    sourceFiles,
    handMade: oldFiles.length > 0 && !existsSync(join(target, 'VERSION')),
    added: sourceFiles.filter((f) => !oldFiles.includes(f)),
    removed: oldFiles.filter((f) => !sourceFiles.includes(f)),
    changed: sourceFiles.filter((f) => oldFiles.includes(f) && !sameFile(join(source, f), join(target, f))),
    isUpdate: oldFiles.length > 0,
  }

  if (plan.isUpdate) {
    const versionFile = join(target, 'VERSION')
    const oldVersion = existsSync(versionFile) ? readText(versionFile).trim().split('\n').join(' ') : 'none (hand-made)'
    log(`Updating rooms in ${gameDir}: ${oldVersion} → ${version} (commit ${commit})`)
    if (plan.handMade) {
      log(`  ! ${KIT_TARGET}/ already has files that didn't come from the framework (no VERSION file).
    They are replaced by the module's — anything marked "removed" below is deleted.`)
    }
    if (!plan.added.length && !plan.changed.length && !plan.removed.length) log(`  ${KIT_TARGET}/: already up to date`)
    for (const f of plan.changed) log(`  changed  ${KIT_TARGET}/${f}`)
    for (const f of plan.added) log(`  added    ${KIT_TARGET}/${f}`)
    for (const f of plan.removed) log(`  removed  ${KIT_TARGET}/${f}`)
    if (plan.changed.length && !plan.handMade) {
      log('  (Changed files are replaced. If the game edited any of them, move that edit into the framework first.)')
    }
  } else {
    log(`Installing rooms ${version} (commit ${commit}) into ${gameDir}`)
    log(`  ${KIT_TARGET}/: ${sourceFiles.length} files`)
  }

  // 2. The game's own starting files: made once, then they're the game's
  const starters = starterFiles(gameDir).map((file) => ({ ...file, exists: existsSync(join(gameDir, file.to)) }))
  for (const file of starters) {
    log(file.exists ? `  keep     ${file.to} (the game's own)` : `  create   ${file.to} — ${file.why}`)
  }

  const result = { plan, starters, isUpdate: plan.isUpdate }
  if (dryRun) {
    log('\nDry run: nothing was changed. After installing, the game would still need:')
    printSteps(gameDir, log)
    return result
  }

  // Copy
  for (const f of plan.removed) removeInside(target, f, log)
  for (const f of sourceFiles) copyFile(join(source, f), join(target, f))
  writeText(join(target, 'VERSION'), `${version}\ncommit ${commit}\n`)
  for (const file of starters) {
    if (file.exists) continue
    if (file.make) writeText(join(gameDir, file.to), file.make())
    else copyFile(join(roomsDir, 'templates', file.from), join(gameDir, file.to))
  }

  log('\nDone. Next steps:')
  printSteps(gameDir, log, starters.filter((file) => !file.exists).map((file) => file.to))
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return result
}

// Next steps, in plain English — only what the game doesn't have yet
function printSteps(gameDir, log, justMade = []) {
  const todo = wiringSteps(gameDir, { justMade }).filter((w) => !w.done)
  todo.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  log('  How a game uses it: framework/rooms/README.md ("Use it in a game").')
}

// Run from the command line
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const [gameDir] = args.filter((a) => !a.startsWith('--'))
  if (!gameDir) {
    console.log('Usage: node scripts/install-rooms.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  try {
    installRooms(gameDir, { dryRun: args.includes('--dry-run') })
  } catch (error) {
    console.log(`✗ ${error.message}`)
    process.exit(1)
  }
}
