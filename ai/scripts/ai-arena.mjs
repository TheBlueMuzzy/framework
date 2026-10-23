// npm run ai:arena — AI-vs-AI games + the Personality Check, on the PC (framework AI module, F24).
// Run from the game folder (npm does). Plays through the game's OWN rules and bots, loaded as TypeScript through Vite,
// and writes the report page. The game's half lives in its arena file (default src/ai/arenaGame.ts):
//   export default async function arenaGame(files) → { plug, personalities, skills, targets, columns? }
//   (files.read('content/ai/personalities.json') reads a file from the game folder) — see kit/arena.ts ArenaGameFile.
// The numbers of a run come from content/ai/arena.json (the installer gives a starter); flags change one run:
//   --games 60        mixed tables
//   --seats 2-4       table sizes (2-4, or one size: 3) — or personality names (Strategist,Scholar) = those, every game
//   --ladder 6        skill-ladder games per personality (0 = none)
//   --seed 1000       the first game's seed (same seed = same games = same report)
//   --skill FirstClass  the skill the mixed tables play at
//   --notes           print every decision note of the first game
//   --game <file>     the arena file (default src/ai/arenaGame.ts) · --out <file> where the report goes
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const root = process.cwd()
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i < 0) return undefined
  const value = args[i + 1]
  if (value === undefined || value.startsWith('--')) stop(`--${name} needs a value`)
  return value
}
function stop(message) {
  console.error(`ai:arena: ${message}`)
  process.exit(1)
}
const number = (name) => {
  const v = flag(name)
  if (v === undefined) return undefined
  if (!/^\d+$/.test(v)) stop(`--${name} wants a whole number (got "${v}")`)
  return Number(v)
}

// The kit sits next to this file once installed in a game (src/ai/kit/), or in ../kit in the framework.
const kitDir = existsSync(join(here, 'arena.ts')) ? here : join(here, '..', 'kit')
// Vite loads files by their path from the game folder ("/src/ai/arenaGame.ts"); a file outside it by its full path.
const forVite = (file) => {
  const rel = relative(root, file).split('\\').join('/')
  return rel.startsWith('..') || isAbsolute(rel) ? file.split('\\').join('/') : `/${rel}`
}
const load = async (file) => (await runnerImport(forVite(file), { root, configFile: false, logLevel: 'error' })).module
const readGameFile = (path) => readFileSync(join(root, path), 'utf8')

const gameFile = resolve(root, flag('game') ?? 'src/ai/arenaGame.ts')
if (!existsSync(gameFile)) stop(`no arena file at ${relative(root, gameFile)} — the game writes one (its plug + cast; see the AI module's README, "Arena")`)
let settings = {}
const settingsFile = join(root, 'content/ai/arena.json')
if (existsSync(settingsFile)) {
  try { settings = JSON.parse(readFileSync(settingsFile, 'utf8')) } catch (e) { stop(`content/ai/arena.json isn't valid JSON: ${e.message}`) }
}
const fromFile = Object.fromEntries(Object.entries(settings).filter(([k]) => !k.startsWith('_')))

const arena = await load(join(kitDir, 'arena.ts'))
const { reportHtml } = await load(join(kitDir, 'report.ts'))
const { averages } = await load(join(kitDir, 'check.ts'))
const game = await (await load(gameFile)).default({ read: async (path) => readGameFile(path) })

// The run: content/ai/arena.json, then the flags
const run = { ...fromFile }
for (const name of ['games', 'seed']) if (number(name) !== undefined) run[name] = number(name)
if (number('ladder') !== undefined) run.ladderGames = number('ladder')
let only
const seats = flag('seats')
if (seats !== undefined) {
  const sizes = /^(\d+)(?:-(\d+))?$/.exec(seats)
  if (sizes) [run.minSeats, run.maxSeats] = [Number(sizes[1]), Number(sizes[2] ?? sizes[1])]
  else only = seats.split(',').filter(Boolean)
}
const request = { personalities: game.personalities, skills: game.skills, targets: game.targets, mainSkill: flag('skill') ?? (fromFile.mainSkill || undefined), only, settings: run }

const started = Date.now()
let result
try {
  result = arena.runArena(game.plug, request, (done, total) => process.stdout.write(`\rgames ${done}/${total}`))
} catch (e) {
  stop(e.message)
}
const { games, results, mixedResults, report } = result
console.log(`\n${games.length} games in ${((Date.now() - started) / 1000).toFixed(1)} s`)
const t = arena.decisionTimes(games)
console.log(`decision time: median ${t.median.toFixed(1)} ms · 90% ${t.p90.toFixed(1)} ms · slowest ${t.slowest.toFixed(1)} ms (phone ≈ ×4)`)

// Each personality's meter averages at the main skill, mixed tables only (the ladder games never count here)
const mainSkill = arena.arenaPlan(request).main.id
const columns = game.columns ?? game.plug.tellMeters ?? [...new Set(results.flatMap((g) => g.seats.flatMap((s) => Object.keys(s.meters))))]
const ids = Object.keys(report.wins.overall)
const table = [['personality', 'won', ...columns], ...ids.map((id) => [id, report.wins.overall[id].toFixed(2), ...columns.map((m) => (averages(mixedResults, m, mainSkill).get(id) ?? 0).toFixed(2))])]
const widths = table[0].map((_, c) => Math.max(...table.map((row) => String(row[c]).length)))
console.log('\n' + table.map((row) => row.map((cell, c) => (c ? String(cell).padStart(widths[c] + 2) : String(cell).padEnd(widths[c]))).join('')).join('\n'))

const out = resolve(root, flag('out') ?? (fromFile.reportPath || 'e2e-shots/ai-check.html'))
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, reportHtml({ ...report, subtitle: `${report.subtitle} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}` }))
const feel = Object.values(report.feel).flat()
console.log(`\nfeel targets: ${feel.filter((x) => x.pass).length}/${feel.length} green · tell-apart ${Math.round(report.tell.overall * 100)}% · for-all checks ${report.all.filter((a) => a.pass).length}/${report.all.length}`)
if (report.whatWins) {
  const w = report.whatWins
  console.log(`\nWhat wins? (players win ${Math.round(w.baseRate * 100)}% on average)`)
  if (w.top.length) w.top.forEach((line, i) => console.log(`  ${i + 1}. ${line}`))
  else console.log('  no situation has enough games yet — play more (--games 200)')
  if (w.leftOut.length) console.log(`  left out for too few games: ${w.leftOut.length} (listed on the report)`)
}
console.log(`report: ${out}`)
if (args.includes('--notes')) console.log('\n' + games[0].notes.join('\n'))
