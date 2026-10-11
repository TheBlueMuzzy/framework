// INSTALL / UPDATE THE ROOMS MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-rooms.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   1. copies kit/ → <game>/src/rooms/  (browser side: protocol, room codes, identity, useRoom —
//      and src/rooms/server/, the server base the game's party/server.ts builds on)
//      Not the tests: they run here, in the framework. Adds a VERSION file (module version + framework commit).
//      Files the module no longer ships are removed — only ever inside src/rooms/.
//   2. creates the game's own starting files — only if missing, never overwrites:
//      party/server.ts + party/rules.ts (an example game to replace), content/rooms.json (the knobs),
//      partykit.json (the server's name + port)
//   3. prints the wiring the game still needs (packages, npm scripts, VITE_PARTY_HOST…) — only the missing bits
// On an update it first lists which files changed, were added or were removed.
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
function kitVersion() {
  const version = readText(join(roomsDir, 'kit', 'VERSION')).trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: roomsDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const edited = execSync('git status --porcelain kit templates', { cwd: roomsDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (edited) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

// The game's name for PartyKit (partykit.json "name" → <name>.<user>.partykit.dev)
function gameName(gameDir) {
  try {
    const name = JSON.parse(readText(join(gameDir, 'package.json'))).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return gameDir.split(/[\\/]/).filter(Boolean).at(-1).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

export function partykitConfig(gameDir) {
  return { name: gameName(gameDir), main: 'party/server.ts', compatibilityDate: '2024-12-01', port: PARTY_PORT }
}

// Files the game gets once, then owns: [where in the game, where in templates/ (or a maker)]
function starterFiles(gameDir) {
  const hasServer = existsSync(join(gameDir, 'party', 'server.ts'))
  // A game served by PartyServer + wrangler (Cloudflare) has no use for partykit.json (Glyphtender, F62: it kept coming back)
  const onWrangler = ['wrangler.json', 'wrangler.jsonc', 'wrangler.toml'].some((file) => existsSync(join(gameDir, file)))
  return [
    // The example rules only come with a new server — a game that already has party/server.ts keeps its own
    { to: 'party/server.ts', from: 'party/server.ts', why: 'the online server (builds on src/rooms/server)' },
    { to: 'party/rules.ts', from: 'party/rules.ts', why: 'an EXAMPLE game ("Count to 10") — replace with the real rules', skip: hasServer },
    { to: 'content/rooms.json', from: 'content/rooms.json', why: 'room knobs: seats, idle players, timings' },
    { to: 'partykit.json', make: () => JSON.stringify(partykitConfig(gameDir), null, 2) + '\n', why: 'server name + local port 1999', skip: onWrangler },
  ].filter((file) => !file.skip)
}

// The wiring a game needs, as { done, step } — so only the missing steps are printed
export function wiringSteps(gameDir) {
  const text = (file) => (existsSync(join(gameDir, file)) ? readText(join(gameDir, file)) : '')
  let pkg = {}
  try { pkg = JSON.parse(text('package.json') || '{}') } catch { /* unreadable: every package step shows */ }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const scripts = pkg.scripts ?? {}
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local']
  const localHostInEnv = envFiles.find((file) => /^\s*VITE_PARTY_HOST\s*=\s*(localhost|127\.0\.0\.1)/m.test(text(file)))
  const name = gameName(gameDir)

  return [
    {
      done: Boolean(pkg.dependencies?.partysocket) && Boolean(deps.partykit),
      step: 'Packages: npm install partysocket   then   npm install -D partykit',
    },
    {
      done: scripts['party:dev'] === 'partykit dev' && scripts['party:deploy'] === 'partykit deploy',
      step: 'package.json "scripts": "party:dev": "partykit dev", "party:deploy": "partykit deploy"',
    },
    {
      done: /(^|\n)\s*\/?\.partykit\/?\s*(\n|$)/.test(text('.gitignore')),
      step: '.gitignore: add the line   .partykit/   (PartyKit\'s local dev state)',
    },
    {
      done: !localHostInEnv,
      step: `${localHostInEnv}: remove VITE_PARTY_HOST=localhost… — for local dev leave it unset, so a phone on the Wi-Fi reaches the PC's server (src/rooms/roomClient.ts picks the page's own address, port ${PARTY_PORT})`,
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
      step: `Going live (Muzzy's call — public): npm run party:deploy → wss://${name}.<your-partykit-user>.partykit.dev,
       then build the game with VITE_PARTY_HOST=${name}.<your-partykit-user>.partykit.dev (GitHub Actions: env on the build step).
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
  printSteps(gameDir, log)
  return result
}

// Next steps, in plain English — only what the game doesn't have yet
function printSteps(gameDir, log) {
  const todo = wiringSteps(gameDir).filter((w) => !w.done)
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
