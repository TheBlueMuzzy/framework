// INSTALL / UPDATE THE DEV KIT IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-devkit.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   1. copies kit/  → <game>/src/devkit/          (the panel and its tools — browser code)
//      copies vite/ → <game>/vite-plugins/devkit/ (the Vite plugin: release switch + Save endpoint — build code)
//      Not the tests: they run here, in the framework. Each gets a VERSION file (kit version + framework commit).
//      Files the kit no longer ships are removed — only ever inside those two folders.
//   2. creates src/devkit-game/tabs.ts (the game's own tabs) and content/devkit.json — only if missing, never overwrites
//   3. adds the two wiring lines that are pure bookkeeping (0.20.1): "check:framework" in package.json's scripts and
//      devkit.local.json in .gitignore — only when missing, so re-running changes nothing
//   4. prints the wiring the game still needs (main.tsx, vite.config, package.json) — only the missing bits
// On an update it first lists which kit files changed, were added or were removed.
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const devkitDir = join(dirname(fileURLToPath(import.meta.url)), '..')

// What gets copied where. "from" is in the framework's devkit/, "to" is in the game.
export const COPIES = [
  { from: 'kit', to: 'src/devkit' },
  { from: 'vite', to: 'vite-plugins/devkit' },
]

// Roll Better's hand-made Dev Kit, from before this module. They clash with the kit
// (e.g. two __DEVKIT_IN_RELEASE__ declarations), so the game should delete them.
export const OLD_FILES = ['src/devkit-flags.d.ts', 'vite-plugins/devkitSave.ts', 'vite-plugins/devkitSave.test.ts', 'e2e/devkit-release-check.mjs']

export const RELEASE_SWITCH = {
  _help: 'Dev Kit (the ` panel) in RELEASE builds. true = friends testing the live link can open it (prototype/alpha/beta). /deliver sets this to false at the 1.0 full release — then the live game has no Dev Kit at all. Local dev always has it.',
  inReleaseBuilds: true,
}

const CHECK_SCRIPT = 'node src/devkit/check-devkit.mjs'
export const FRAMEWORK_CHECK_SCRIPT = 'node src/devkit/check-framework.mjs'

const isTest = (path) => /\.test\./.test(path)
const readText = (path) => readFileSync(path, 'utf8')
const writeText = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
const copyFile = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to) }
const sameFile = (a, b) => readFileSync(a).equals(readFileSync(b)) // byte for byte

// Every file under a folder, as paths relative to it with forward slashes ("color/ColorTab.tsx").
// Links to other folders (symlinks, junctions) are skipped, so an update can never reach outside the kit.
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

// "0.1.0" + "a1b2c3d" — the kit's version and the framework commit it's copied from
// Worked out once per run: it starts two git processes, which take 0.2–2 s each on a busy Windows PC (F128, as saves
// 0.6.2 did in F125: the install tests call installDevkit many times, and under check:fast those git runs were most of the test's time).
// The kit's commit can't change while one install runs, so asking again only costs time.
let kitVersionOnce = null
function kitVersion() {
  kitVersionOnce ??= readKitVersion()
  return kitVersionOnce
}

function readKitVersion() {
  const version = readText(join(devkitDir, 'kit', 'VERSION')).trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: devkitDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const edited = execSync('git status --porcelain kit vite devkit-game', { cwd: devkitDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (edited) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

// The wiring a game needs, as { done, step } — so only the missing steps are printed
export function wiringSteps(gameDir) {
  const text = (file) => (existsSync(join(gameDir, file)) ? readText(join(gameDir, file)) : '')
  const main = ['src/main.tsx', 'src/main.ts', 'src/main.jsx'].find((f) => existsSync(join(gameDir, f))) ?? 'src/main.tsx'
  const viteConfig = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'].find((f) => existsSync(join(gameDir, f))) ?? 'vite.config.ts'
  let pkg = {}
  try { pkg = JSON.parse(text('package.json') || '{}') } catch { /* unreadable: every package step shows */ }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const tsconfigNode = text('tsconfig.node.json')

  return [
    {
      done: text(main).includes('devkit/mount'),
      step: `${main}: start the Dev Kit (in dev always; in release builds while content/devkit.json says so):
       if (import.meta.env.DEV) import('./devkit/mount').then((m) => m.mountDevKit())
       else if (__DEVKIT_IN_RELEASE__) addEventListener('load', () => requestIdleCallback(() => import('./devkit/mount').then((m) => m.mountDevKit()), { timeout: 3000 }), { once: true })
       (release builds load it after the first screen, when idle — it was ~47 KB of Glyphtender's first download; worked example: Glyphtender src/main.tsx)`,
    },
    {
      done: text(viteConfig).includes('vite-plugins/devkit/devkitVite'),
      step: `${viteConfig}: add the Dev Kit plugin (release switch + Save button):
       import { devkit } from './vite-plugins/devkit/devkitVite'
       plugins: [react(), devkit()],
     (If it still has the old devkitSave() plugin or its own __DEVKIT_IN_RELEASE__ define, remove those.)`,
    },
    {
      done: !tsconfigNode || /["/]vite-plugins["/]/.test(tsconfigNode),
      step: 'tsconfig.node.json: add "vite-plugins" to "include" (so the plugin is type-checked like vite.config.ts)',
    },
    {
      done: pkg.scripts?.['check:devkit'] === CHECK_SCRIPT,
      step: `package.json "scripts": "check:devkit": "${CHECK_SCRIPT}"   (/deliver runs it: builds both ways and checks each)`,
    },
    {
      done: pkg.scripts?.['check:framework'] === FRAMEWORK_CHECK_SCRIPT,
      step: `package.json "scripts": "check:framework": "${FRAMEWORK_CHECK_SCRIPT}"   (every installed module's promise checks — what the game must wire, and where; /deliver runs it)`,
    },
    {
      done: /^\/?devkit\.local\.json\s*$/m.test(text('.gitignore')),
      step: '.gitignore: add the line  devkit.local.json   (each computer\'s own Dev Kit settings, e.g. where its font library is — never synced)',
    },
    {
      done: Boolean(deps.playwright || deps['playwright-core']),
      step: 'The release check needs Playwright: npm install -D playwright   then   npx playwright install chromium',
    },
  ]
}

// The two bits of wiring the installer does itself (0.20.1) — each only when missing, so a re-run changes nothing.
// A game's own different "check:framework" is left alone (the wiring step still points it out).
export function addBookkeeping(gameDir, { dryRun = false, log = console.log } = {}) {
  const added = []
  const pkgPath = join(gameDir, 'package.json')
  if (existsSync(pkgPath)) {
    const text = readText(pkgPath)
    let pkg = null
    try { pkg = JSON.parse(text) } catch { log('  ! package.json could not be read — add the check:framework script by hand') }
    if (pkg && pkg.scripts?.['check:framework'] === undefined) {
      pkg.scripts = { ...pkg.scripts, 'check:framework': FRAMEWORK_CHECK_SCRIPT }
      const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '  '
      const eol = text.includes('\r\n') ? '\r\n' : '\n'
      if (!dryRun) writeText(pkgPath, JSON.stringify(pkg, null, indent).replaceAll('\n', eol) + eol)
      added.push('package.json "check:framework" script')
    }
  }
  const ignorePath = join(gameDir, '.gitignore')
  const ignore = existsSync(ignorePath) ? readText(ignorePath) : ''
  if (!/^\/?devkit\.local\.json\s*$/m.test(ignore)) {
    const eol = ignore.includes('\r\n') ? '\r\n' : '\n'
    const end = ignore && !ignore.endsWith('\n') ? eol : ''
    const block = `${ignore ? eol : ''}# each computer's own Dev Kit settings (Dev Kit 0.17+)${eol}devkit.local.json${eol}`
    if (!dryRun) writeText(ignorePath, ignore + end + block)
    added.push('.gitignore line devkit.local.json')
  }
  for (const a of added) log(`  ${dryRun ? 'would add' : 'add     '} ${a}`)
  return added
}

export function installDevkit(gameDir, { dryRun = false, log = console.log } = {}) {
  if (!existsSync(gameDir)) throw new Error(`No folder at ${gameDir}`)
  const { version, commit } = kitVersion()

  // 1. What changes in each copied folder
  const plans = COPIES.map(({ from, to }) => {
    const source = join(devkitDir, from)
    const target = join(gameDir, to)
    const sourceFiles = listFiles(source).filter((f) => !isTest(f) && f !== 'VERSION')
    const oldFiles = listFiles(target).filter((f) => f !== 'VERSION')
    return {
      source, target, to, sourceFiles,
      handMade: oldFiles.length > 0 && !existsSync(join(target, 'VERSION')),
      added: sourceFiles.filter((f) => !oldFiles.includes(f)),
      removed: oldFiles.filter((f) => !sourceFiles.includes(f)),
      changed: sourceFiles.filter((f) => oldFiles.includes(f) && !sameFile(join(source, f), join(target, f))),
      isUpdate: oldFiles.length > 0,
    }
  })
  const isUpdate = plans.some((p) => p.isUpdate)
  if (isUpdate) {
    const versionFile = join(gameDir, 'src', 'devkit', 'VERSION')
    const oldVersion = existsSync(versionFile) ? readText(versionFile).trim().split('\n').join(' ') : 'none (hand-made)'
    log(`Updating the Dev Kit in ${gameDir}: ${oldVersion} → ${version} (commit ${commit})`)
  } else {
    log(`Installing Dev Kit ${version} (commit ${commit}) into ${gameDir}`)
  }
  for (const p of plans) {
    if (!p.isUpdate) { log(`  ${p.to}/: ${p.sourceFiles.length} file${p.sourceFiles.length === 1 ? '' : 's'}`); continue }
    if (p.handMade) {
      log(`  ! ${p.to}/ already has files that didn't come from the framework (no VERSION file).
    They are replaced by the kit's — anything marked "removed" below is deleted. A game's own tools belong
    in src/devkit-game/ (see tabs.ts there): move them there first, or they are lost.`)
    }
    if (!p.added.length && !p.changed.length && !p.removed.length) log(`  ${p.to}/: already up to date`)
    for (const f of p.changed) log(`  changed  ${p.to}/${f}`)
    for (const f of p.added) log(`  added    ${p.to}/${f}`)
    for (const f of p.removed) log(`  removed  ${p.to}/${f}`)
  }
  if (plans.some((p) => p.changed.length && !p.handMade)) {
    log('  (Changed files are replaced. If the game edited any of them, move that edit into the framework devkit first.)')
  }

  // 2. The game's own files: made once, then they're the game's
  const tabsPath = join(gameDir, 'src', 'devkit-game', 'tabs.ts')
  const switchPath = join(gameDir, 'content', 'devkit.json')
  const makeTabs = !existsSync(tabsPath)
  const makeSwitch = !existsSync(switchPath)
  log(makeTabs ? '  create   src/devkit-game/tabs.ts (the game\'s own Dev Kit tabs — none yet)' : '  keep     src/devkit-game/ (the game\'s own tabs)')
  log(makeSwitch ? '  create   content/devkit.json (Dev Kit in release builds: on, until 1.0)' : '  keep     content/devkit.json (the game\'s own)')

  const oldFiles = OLD_FILES.filter((f) => existsSync(join(gameDir, f)))
  if (oldFiles.length) {
    log(`  ! Old hand-made Dev Kit files — the kit replaces them; delete them:\n${oldFiles.map((f) => `      ${f}`).join('\n')}`)
  }

  const bookkeeping = addBookkeeping(gameDir, { dryRun: true, log })
  const result = { plans, isUpdate, makeTabs, makeSwitch, oldFiles, bookkeeping }
  if (dryRun) { log('\nDry run: nothing was changed.'); return result }

  // Copy
  for (const p of plans) {
    for (const f of p.removed) removeInside(p.target, f, log)
    for (const f of p.sourceFiles) copyFile(join(p.source, f), join(p.target, f))
    writeText(join(p.target, 'VERSION'), `${version}\ncommit ${commit}\n`)
  }
  if (makeTabs) copyFile(join(devkitDir, 'devkit-game', 'tabs.ts'), tabsPath)
  if (makeSwitch) writeText(switchPath, JSON.stringify(RELEASE_SWITCH, null, 2) + '\n')
  addBookkeeping(gameDir, { log: () => {} }) // listed above as "would add"

  // Next steps, in plain English — only what the game doesn't have yet
  const todo = wiringSteps(gameDir).filter((w) => !w.done)
  log('\nDone.' + (todo.length || oldFiles.length ? ' Next steps:' : ' The game is already wired up.'))
  let n = 1
  if (oldFiles.length) log(`  ${n++}. Delete the old hand-made Dev Kit files listed above.`)
  for (const w of todo) log(`  ${n++}. ${w.step}`)
  log(`  ${n}. Run the game's tests and build, press \` in npm run dev, then npm run check:devkit and npm run check:framework.`)
  log('  To add a game tool: make it in src/devkit-game/ and list it in src/devkit-game/tabs.ts.')
  return result
}

// Run from the command line
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const [gameDir] = args.filter((a) => !a.startsWith('--'))
  if (!gameDir) {
    console.log('Usage: node scripts/install-devkit.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  try {
    installDevkit(gameDir, { dryRun: args.includes('--dry-run') })
  } catch (error) {
    console.log(`✗ ${error.message}`)
    process.exit(1)
  }
}
