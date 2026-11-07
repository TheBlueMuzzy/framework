// PUT TODAY'S FRAMEWORK MODULES IN THIS GAME — npm run install-modules
// The starter keeps only its own game in git (F186 — Slimmed framework): the module copies (src/ui/kit, src/devkit,
// src/rooms, …) are gitignored, so a fresh copy of the starter has none until this runs. Run it once after copying:
//   npm install
//   npm run install-modules            every module the game doesn't have yet, fresh from the framework
//   npm run install-modules -- --all   every module, even ones already there (what scripts/starter-check.mjs does)
// Each module's own installer does the work — the same one install-module.mjs runs. Later updates of ONE module in a
// real game go through `node ~/.claude/config/bmuz/scripts/install-module.mjs <module> .` (it runs the module's own
// checks first); this script is only for filling an empty copy.
// The framework is found at ../.. (the starter inside the framework), else ~/Documents/dev/framework, else name it:
//   node scripts/install-modules.mjs --framework <framework-folder>
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const game = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const all = args.includes('--all')
const named = args.includes('--framework') ? args[args.indexOf('--framework') + 1] : null

// The game folder each module's copy lives in (the same list as install-module.mjs) — used to see what's already here
const FOLDERS = {
  devkit: 'src/devkit', 'ui-kit': 'src/ui/kit', audio: 'src/audio', table: 'src/table', ai: 'src/ai/kit', rooms: 'src/rooms',
  saves: 'src/saves', version: 'src/version', crashes: 'src/crashes', lint: 'src/lint', tutorial: 'src/tutorial',
}

const isFramework = (folder) => folder && existsSync(join(folder, 'ui-kit', 'kit', 'VERSION'))
const framework = [named && resolve(named), resolve(game, '..', '..'), join(homedir(), 'Documents', 'dev', 'framework')].find(isFramework)
if (!framework) stop(`Can't find the framework (looked at ../.. and ~/Documents/dev/framework) — name it: node scripts/install-modules.mjs --framework <folder>`)

// Every module = every framework folder with a kit/VERSION (found, not typed in — the same rule as the framework's checks).
// These go in first: other installers look for them and leave parts out without them (crashes' "Something broke" screen
// needs the UI kit; ai, version and saves add their Settings rows / Dev Kit parts only when those are there)
const FIRST = ['ui-kit', 'devkit', 'saves']
const found = readdirSync(framework).filter((folder) => existsSync(join(framework, folder, 'kit', 'VERSION')))
const modules = [...FIRST.filter((module) => found.includes(module)), ...found.filter((module) => !FIRST.includes(module))]
let installed = 0
for (const module of modules) {
  const folder = FOLDERS[module]
  if (!folder) { console.log(`- ${module}: not used by this starter, skipped`); continue }
  if (!all && existsSync(join(game, folder, 'VERSION'))) { console.log(`- ${module}: already in ${folder} (update it with install-module.mjs)`); continue }
  const scripts = join(framework, module, 'scripts')
  const installer = existsSync(scripts) && readdirSync(scripts).find((file) => /^install-.*\.mjs$/.test(file) && !file.includes('.test.'))
  if (!installer) stop(`${module} has no scripts/install-*.mjs in the framework, so it can't be installed`)
  // an installer may use its module's own packages (crashes' reads source maps with 'source-map')
  if (!existsSync(join(framework, module, 'node_modules'))) stop(`${module} has no node_modules in the framework — run \`npm ci\` in ${join(framework, module)} once (its installer may need its packages)`)
  const result = spawnSync(process.execPath, [join(scripts, installer), game], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  if (result.status !== 0) stop(`${module}'s installer failed:\n${`${result.stdout}${result.stderr}`.trim()}`)
  console.log(`✓ ${module} ${readFileSync(join(framework, module, 'kit', 'VERSION'), 'utf8').trim()} installed`)
  installed++
}
console.log(`\n${installed} module${installed === 1 ? '' : 's'} installed from ${framework}`)

function stop(message) {
  console.log(`✗ ${message}`)
  process.exit(1)
}
