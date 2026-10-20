// INSTALL / UPDATE THE KIT IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-kit.mjs <game-folder> [preset] [--dry-run]
//   preset: clean (default) · cozy · cartoon · pixel · neon — only used when the game has no style.json yet
//   --dry-run: only show what would change
// What it does:
//   1. copies kit/ → <game>/src/ui/kit/ (not the kit's tests: they run here, in the framework),
//      and writes src/ui/kit/VERSION (the kit's version + the framework commit it came from)
//   2. creates content/ui/style.json and content/ui/settings.json — only if missing, never overwrites
//   3. adds the kit's fonts to content/credits.json (no duplicates)
// On an update it first lists which kit files changed, were added or were removed.
// It also warns if the game's React is older than the kit needs (REACT_NEEDED).
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// npm run check:framework (the Dev Kit's runner, src/devkit/check-framework.mjs) runs this module's own promise checks
// (kit/conformance.mjs) — asked for here while the game's package.json doesn't have the script yet
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too, and says what to wire where)'
}

const uiKitDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const kitDir = join(uiKitDir, 'kit')
const presetNames = readdirSync(join(kitDir, 'styles')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))

// The kit needs React 18 or newer (useSyncExternalStore, useId). Tested on 18.3 and 19.
export const REACT_NEEDED = 18

// The game's React major version from its package.json ("^18.2.0" → 18), or null if it can't tell.
export function gameReactMajor(gameDir) {
  const packagePath = join(gameDir, 'package.json')
  if (!existsSync(packagePath)) return null
  try {
    const pkg = JSON.parse(readText(packagePath))
    const range = pkg.dependencies?.react ?? pkg.devDependencies?.react ?? pkg.peerDependencies?.react
    const major = String(range ?? '').match(/\d+/)
    return major ? Number(major[0]) : null
  } catch { return null }
}

const isTest = (path) => /\.test\./.test(path)
const readText = (path) => readFileSync(path, 'utf8')
const writeText = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
const copyFile = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to) }
const sameFile = (a, b) => readFileSync(a).equals(readFileSync(b)) // byte for byte (fonts too)

// Every file under a folder, as paths relative to it with forward slashes ("blocks/hud.tsx").
// Links to other folders (symlinks, junctions) are skipped, so an update can never reach outside the kit.
function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// Only ever delete a file that really sits inside the game's src/ui/kit
function removeInside(target, file, log) {
  const path = join(target, file)
  if (realpathSync(path).startsWith(realpathSync(target))) rmSync(path)
  else log(`  ! skipped ${file}: it points outside src/ui/kit`)
}

// "0.1.0 (a1b2c3d)" — the kit's version and the framework commit it's copied from
function kitVersion() {
  const version = readText(join(kitDir, 'VERSION')).trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: uiKitDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const edited = execSync('git status --porcelain kit', { cwd: uiKitDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (edited) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

// The kit's font credits, with paths as they sit in the game (kit/fonts/x → src/ui/kit/fonts/x)
function kitCredits() {
  const credits = JSON.parse(readText(join(uiKitDir, 'content', 'credits.json')))
  return credits.map((entry) => ({ ...entry, paths: entry.paths.map((p) => p.replace(/^kit\//, 'src/ui/kit/')) }))
}

// Adds the kit's credits the game doesn't list yet, and drops kit entries whose files are gone
// (a font the kit no longer ships). Returns the new list and what changed.
export function mergeCredits(gameCredits, kitEntries, kitFileExists) {
  const listed = new Set(gameCredits.flatMap((entry) => entry.paths ?? []))
  const added = kitEntries.filter((entry) => !entry.paths.some((p) => listed.has(p)))
  const isGoneKitFile = (p) => p.startsWith('src/ui/kit/') && !kitFileExists(p)
  const kept = gameCredits.filter((entry) => !(entry.paths?.length && entry.paths.every(isGoneKitFile)))
  const removed = gameCredits.filter((entry) => !kept.includes(entry))
  return { credits: [...kept, ...added], added, removed }
}

export function installKit(gameDir, { preset = 'clean', dryRun = false, log = console.log } = {}) {
  if (!existsSync(gameDir)) throw new Error(`No folder at ${gameDir}`)
  if (!presetNames.includes(preset)) throw new Error(`Unknown style "${preset}". Pick one of: ${presetNames.join(', ')}`)

  const target = join(gameDir, 'src', 'ui', 'kit')
  const { version, commit } = kitVersion()
  const sourceFiles = listFiles(kitDir).filter((f) => !isTest(f) && f !== 'VERSION')
  const oldFiles = listFiles(target).filter((f) => f !== 'VERSION')
  const isUpdate = oldFiles.length > 0

  // 1. What changes in src/ui/kit/
  const added = sourceFiles.filter((f) => !oldFiles.includes(f))
  const removed = oldFiles.filter((f) => !sourceFiles.includes(f))
  const changed = sourceFiles.filter((f) => oldFiles.includes(f) && !sameFile(join(kitDir, f), join(target, f)))
  if (isUpdate) {
    const oldVersion = existsSync(join(target, 'VERSION')) ? readText(join(target, 'VERSION')).trim().split('\n').join(' ') : 'unknown'
    log(`Updating the kit in ${gameDir}: ${oldVersion} → ${version} (commit ${commit})`)
    if (!added.length && !changed.length && !removed.length) log('  Kit files: already up to date')
    for (const f of changed) log(`  changed  ${f}`)
    for (const f of added) log(`  added    ${f}`)
    for (const f of removed) log(`  removed  ${f}`)
    if (changed.length) log('  (Changed files are replaced. If the game edited any of them, move that edit into the framework kit first.)')
  } else {
    log(`Installing kit ${version} (commit ${commit}) into ${gameDir}/src/ui/kit: ${sourceFiles.length} files`)
  }

  const reactMajor = gameReactMajor(gameDir)
  if (reactMajor !== null && reactMajor < REACT_NEEDED) {
    log(`  ! The game uses React ${reactMajor}, but the kit needs React ${REACT_NEEDED} or newer. Update React first:
       npm install react@latest react-dom@latest`)
  }

  // 2. The game's own style + settings files: made once, then they're the game's
  const stylePath = join(gameDir, 'content', 'ui', 'style.json')
  const settingsPath = join(gameDir, 'content', 'ui', 'settings.json')
  const makeStyle = !existsSync(stylePath)
  const makeSettings = !existsSync(settingsPath)
  log(makeStyle ? `  create   content/ui/style.json (style: ${preset})` : '  keep     content/ui/style.json (the game\'s own)')
  log(makeSettings ? '  create   content/ui/settings.json (every standard row, but only the ones the kit wires itself are on — switch a row on when the game reads it)' : '  keep     content/ui/settings.json (the game\'s own)')

  // 3. Font credits
  const creditsPath = join(gameDir, 'content', 'credits.json')
  let gameCredits = []
  let creditsReadable = true
  if (existsSync(creditsPath)) {
    try { gameCredits = JSON.parse(readText(creditsPath)) } catch { creditsReadable = false }
  }
  const kitFileExists = (p) => sourceFiles.includes(p.replace('src/ui/kit/', ''))
  const merged = mergeCredits(gameCredits, kitCredits(), kitFileExists)
  if (!creditsReadable) log('  ! content/credits.json isn\'t valid JSON, so the kit\'s font credits were NOT added. Fix it and run this again.')
  else {
    for (const entry of merged.added) log(`  credit   + ${entry.credit || entry.paths[0]}`)
    for (const entry of merged.removed) log(`  credit   - ${entry.credit || entry.paths[0]} (the kit no longer has it)`)
  }

  if (dryRun) { log('\nDry run: nothing was changed.'); return { added, changed, removed, isUpdate } }

  // Copy
  for (const f of removed) removeInside(target, f, log)
  for (const f of sourceFiles) copyFile(join(kitDir, f), join(target, f))
  writeText(join(target, 'VERSION'), `${version}\ncommit ${commit}\n`)
  // orientation (0.26.0): "any" until the game says "portrait" / "landscape" — then check:framework skips the sizes it rules out
  if (makeStyle) writeText(stylePath, JSON.stringify({ preset, orientation: 'any', tweaks: {} }, null, 2) + '\n')
  if (makeSettings) writeText(settingsPath, JSON.stringify(starterSettings(JSON.parse(readText(join(kitDir, 'blocks', 'settings.default.json')))), null, 2) + '\n')
  if (creditsReadable && (merged.added.length || merged.removed.length)) {
    writeText(creditsPath, JSON.stringify(merged.credits, null, 2) + '\n')
  }

  // Next steps, in plain English
  log('\nDone. Next steps:')
  if (!isUpdate) {
    log(`  1. At start-up (e.g. src/main.tsx), set the style and the player's accessibility settings:
       import { applyStyle, applyAccessibility, loadSettings } from './ui/kit'
       import style from '../content/ui/style.json'
       import settings from '../content/ui/settings.json'
       applyStyle(style)
       applyAccessibility(loadSettings(settings))
  2. Draw menus and dialogs through the screen stack, once, around the game:
       <ScreenStack screens={{ settings: () => <Settings schema={settings} /> }}>
         <Game />
       </ScreenStack>
       <ToastStack />
     then open one from anywhere with screens.push('settings').
     A game with its own UI already (a letterboxed canvas, a HUD with z-indexes): don't wrap it —
     put <ScreenStack overlay screens={…} /> next to it and set --kit-overlay-z in the game's CSS.
     A game built fully from the kit: add class="kit-page" to <body> so the kit paints the page.`)
  }
  // Old page-wide CSS (Vite's index.css "button {…}", a "* { margin: 0; padding: 0 }" reset) is
  // unlayered, so it beats every kit rule. Say how to tame it.
  const globalCss = ['src/index.css', 'src/App.css'].filter((f) => {
    const text = existsSync(join(gameDir, f)) ? readText(join(gameDir, f)) : ''
    return /(^|\n)\s*(\*|button|input|a)\s*[,{]/.test(text) && !text.includes('game-base')
  })
  if (globalCss.length) {
    log(`  CSS: ${globalCss.join(' and ')} style every button / every element. Wrap those page-wide rules in
       @layer game-base { … } (the kit's weakest layer) so they can't reach kit parts; the game's own
       screens keep their look. Screenshot the game's other screens before and after.`)
  }
  log(`  ${isUpdate ? 1 : 3}. Check the game's UI code keeps the rules: node src/ui/kit/check-ui.mjs src/ui --css src
     (--css src also warns about the game's CSS restyling kit parts — use the style file or a kit option instead)
  ${isUpdate ? 2 : 4}. Run the game's tests and build, and look at every screen on a phone and a desktop.`)
  if (!isUpdate) log('  To try another look later, change "preset" in content/ui/style.json (clean, cozy, cartoon, pixel, neon).')
  // Vite's ESLint setup flags the kit's shared word lists (a fast-refresh hint, not a bug). The kit is
  // tested in the framework, so the game's linter should skip it, like any copied-in library.
  const eslintConfig = readdirSync(gameDir).find((f) => /^eslint\.config\./.test(f))
  if (eslintConfig && !readText(join(gameDir, eslintConfig)).includes('src/ui/kit')) {
    log(`  ESLint: add 'src/ui/kit' to the ignores in ${eslintConfig} (the kit is checked in the framework).`)
  }
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { added, changed, removed, isUpdate }
}

// Run from the command line
/** The rows the kit makes work on its own (applyAccessibility: text size + reduce motion; the version info row). */
export const KIT_WIRED_ROWS = ['textSize', 'reduceMotion', 'version']

/** A new game's settings.json: every standard row, but only the kit-wired ones on. A row that's on and read by nothing
 *  is a fake setting players can flip (Glyphtender shipped 12 — Graphics quality, Vibration, Tips, Reset progress…).
 *  Section headings stay on: one with no row on under it isn't drawn, so it shows up by itself once its rows are on. */
export function starterSettings(schema) {
  const keepOn = (row) => row.type === 'heading' || KIT_WIRED_ROWS.includes(row.id)
  return { ...schema, tabs: schema.tabs.map((tab) => ({ ...tab, rows: tab.rows.map((row) => (keepOn(row) ? row : { ...row, on: false })) })) }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const [gameDir, preset] = args.filter((a) => !a.startsWith('--'))
  if (!gameDir) {
    console.log('Usage: node scripts/install-kit.mjs <game-folder> [clean|cozy|cartoon|pixel|neon] [--dry-run]')
    process.exit(1)
  }
  try {
    installKit(gameDir, { preset, dryRun: args.includes('--dry-run') })
  } catch (error) {
    console.log(`✗ ${error.message}`)
    process.exit(1)
  }
}
