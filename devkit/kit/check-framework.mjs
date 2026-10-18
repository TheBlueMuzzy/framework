// FRAMEWORK CHECK — does this game keep every installed module's promises? Run from the game folder:
//   npm run check:framework                    (the Dev Kit's installer asks for the script)
//   node src/devkit/check-framework.mjs [--port 5197] [--static] [--only devkit,ui]
//     --port:   where the checks serve the game (default 5197 — never the usual dev ports 5173 / 5199)
//     --static: only the checks that read code (no browser)
//     --only:   only these modules (their folder names: devkit, ui, audio, table, ai, rooms)
// Needs Playwright in the game for the browser checks: npm install -D playwright-core (Playwright's own Chromium —
// never your installed Chrome).
//
// How it works: every framework module the game has installed sits in src/ with a VERSION file (src/devkit/VERSION,
// src/ui/kit/VERSION, src/audio/VERSION, src/table/VERSION, src/ai/kit/VERSION, src/rooms/VERSION). Each module ships
// its OWN checks beside that file — conformance.mjs — written from what MODULE-CONTRACTS.md says a game must provide.
// This file finds them, runs them, and prints one plain-English report: every failure says what to wire and where.
// Browser checks share one Vite dev server (the game's own vite.config, so the Dev Kit's plugin is in) and one
// headless browser; they reach the game through the Dev Kit's adapter (src/devkit-game/, window.__devkit).
//
// A module's conformance.mjs:
//   export const title = 'UI kit'
//   export async function check(t) { … t.pass(name, detail) · t.fail(name, problems, fix) · t.skip(name, why) … }
// `t` (the tester) is made by makeTester below — its comments are the API.
import { spawnSync } from 'node:child_process'
import net from 'node:net'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DEFAULT_PORT = 5197

/** --port 5197 --static --only devkit,ui → { port, staticOnly, only } */
export function readArgs(args) {
  const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
  const port = Number(value('--port') ?? DEFAULT_PORT)
  if (!Number.isInteger(port) || port <= 0) throw new Error(`--port must be a number (got "${value('--port')}")`)
  const only = value('--only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null
  return { port, staticOnly: args.includes('--static'), only }
}

/** Every installed module: { id: 'ui', rel: 'src/ui/kit', dir, version, checks: path to conformance.mjs or null }. */
export function findModules(root) {
  const src = join(root, 'src')
  if (!existsSync(src)) return []
  const found = []
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    for (const sub of ['', 'kit']) {
      const dir = join(src, entry.name, sub)
      if (!existsSync(join(dir, 'VERSION'))) continue
      const version = readFileSync(join(dir, 'VERSION'), 'utf8').trim().split(/\s/)[0]
      const checks = join(dir, 'conformance.mjs')
      found.push({ id: entry.name, rel: relative(root, dir).replaceAll('\\', '/'), dir, version, checks: existsSync(checks) ? checks : null })
      break // src/ui/VERSION wins over src/ui/kit/VERSION (there's only ever one)
    }
  }
  // The Dev Kit first (its adapter is what the others' browser checks lean on), then A–Z
  return found.sort((a, b) => (a.id === 'devkit' ? -1 : b.id === 'devkit' ? 1 : a.id.localeCompare(b.id)))
}

/** The framework installer command that updates a module, for messages ("update it: …"). */
export const UPDATE_HINT = {
  devkit: 'node <framework>/devkit/scripts/install-devkit.mjs .',
  ui: 'node <framework>/ui-kit/scripts/install-kit.mjs .',
  audio: 'node <framework>/audio/scripts/install-audio.mjs .',
  table: 'node <framework>/table/scripts/install-table.mjs .',
  ai: 'node <framework>/ai/scripts/install-ai.mjs .',
  rooms: 'node <framework>/rooms/scripts/install-rooms.mjs .',
}

/** Text files under the game's folders (forward-slash paths relative to the game), for checks that read code. */
export function sourceFiles(root, { dirs = ['src'], skip = [], exts = /\.(m?[jt]sx?)$/ } = {}) {
  const out = []
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = join(dir, entry.name)
      const rel = relative(root, path).replaceAll('\\', '/')
      if (skip.some((s) => rel === s || rel.startsWith(s.endsWith('/') ? s : s + '/'))) continue
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(path) }
      else if (exts.test(entry.name)) out.push({ path: rel, text: readFileSync(path, 'utf8') })
    }
  }
  for (const d of dirs) walk(join(root, d))
  return out
}

/** The framework's own folders inside a game (code the game didn't write) — skipped when checking the game's code. */
export const KIT_FOLDERS = ['src/devkit', 'src/ui/kit', 'src/audio', 'src/table', 'src/ai/kit', 'src/rooms']
const isTestFile = (path) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(path) || /(^|\/)(tests?|e2e|__tests__)\//.test(path)
/** The game's own code: src/ minus the framework's folders, the Dev Kit's game folder and tests. */
export const gameCode = (root) => sourceFiles(root, { skip: [...KIT_FOLDERS, 'src/devkit-game'] }).filter((f) => !isTestFile(f.path))

/** "src/a.ts:12" for every line matching `re` (comments skipped) — suspects to name in a message. */
export function linesMatching(files, re) {
  const out = []
  for (const { path, text } of files) {
    text.split(/\r?\n/).forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '')
      if (re.test(code) && !/^\s*(\*|\/\*)/.test(line)) out.push(`${path}:${i + 1}  ${line.trim().slice(0, 90)}`)
    })
  }
  return out
}

/** The registered adapter's file: what src/devkit-game/tabs.ts passes to registerDevKitGame. */
export function adapterFile(root) {
  const tabs = join(root, 'src/devkit-game/tabs.ts')
  if (!existsSync(tabs)) return null
  const text = readFileSync(tabs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '') // not the how-to comments
  const name = text.match(/registerDevKitGame\(\s*([A-Za-z_$][\w$]*)/)?.[1]
  if (!name) return null
  const from = text.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`))?.[1]
  if (!from) return 'src/devkit-game/tabs.ts'
  const base = join('src/devkit-game', from).replaceAll('\\', '/')
  return ['.ts', '.tsx', '/index.ts'].map((e) => base + e).find((p) => existsSync(join(root, p))) ?? base
}

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' })
    sock.once('connect', () => { sock.destroy(); resolve(true) })
    sock.once('error', () => resolve(false))
  })
}

/** One shared Vite server + browser for every module's checks, made the first time a check needs them. */
function makeShared(root, port) {
  let server = null
  let listening = false
  let browser = null
  let query = null // the adapter's conformance.query, read on the first page
  const shared = {
    async vite() {
      if (server) return server
      const { createServer } = await import('vite') // the game's own (found from src/devkit/, up the folders)
      server = await createServer({ root, logLevel: 'error', clearScreen: false, server: { port, strictPort: true, host: '127.0.0.1', hmr: false } })
      return server
    },
    async url() {
      const s = await shared.vite()
      if (!listening) {
        if (await portInUse(port)) throw new Error(`port ${port} is already in use — stop whatever runs there, or pass --port`)
        await s.listen()
        listening = true
      }
      return `http://127.0.0.1:${port}${s.config.base ?? '/'}`
    },
    async browser() {
      if (browser) return browser
      let playwright
      for (const name of ['playwright', 'playwright-core']) {
        try { playwright = await import(name); break } catch { /* next */ }
      }
      if (!playwright) throw new Error('Playwright is missing: npm install -D playwright-core   then   npx playwright install chromium')
      const chromium = playwright.chromium ?? playwright.default?.chromium
      browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
      return browser
    },
    get query() { return query },
    set query(q) { query = q },
    async close() {
      try { await browser?.close() } catch { /* gone */ }
      try { await server?.close() } catch { /* gone */ }
    },
  }
  return shared
}

/** The tester a module's check(t) gets. */
export function makeTester({ root, module, modules, shared, staticOnly, results }) {
  const record = (r) => { results.push(r); return r }
  const t = {
    /** The game folder, the module's folder in it (src/ui/kit), its version, and every installed module's id. */
    root, rel: module.rel, version: module.version, modules: modules.map((m) => m.id),
    /** Is a module installed? t.has('devkit') */
    has: (id) => modules.some((m) => m.id === id),
    /** true with --static: browser checks should t.skip. */
    staticOnly,
    pass: (name, detail = '') => record({ name, ok: true, detail }),
    /** problems: lines saying exactly what's wrong and where ("src/a.ts:12 — …"); fix: what to do, in plain words. */
    fail: (name, problems, fix) => record({ name, ok: false, problems: [].concat(problems).filter(Boolean), fix }),
    skip: (name, why) => record({ name, skipped: true, detail: why }),
    /** Read a JSON file in the game (null if missing or broken). */
    json(path) { try { return JSON.parse(readFileSync(join(root, path), 'utf8')) } catch { return null } },
    exists: (path) => existsSync(join(root, path)),
    read: (path) => readFileSync(join(root, path), 'utf8'),
    files: (opts) => sourceFiles(root, opts),
    /** The game's own code (no framework folders, no tests). */
    gameCode: () => gameCode(root),
    linesMatching,
    adapterFile: () => adapterFile(root),
    /** The game's package.json scripts. */
    scripts: () => t.json('package.json')?.scripts ?? {},
    /** Run a command in the game folder → { code, out } (out = stdout + stderr). */
    run(command, args = [], opts = {}) {
      const options = { cwd: root, encoding: 'utf8', timeout: 10 * 60_000, ...opts }
      const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)
      const r = command === 'node'
        ? spawnSync(process.execPath, args, options) // this same Node
        : spawnSync([command, ...args].map(quote).join(' '), { ...options, shell: true }) // npx etc. (a .cmd on Windows)
      return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
    },
    /** Load a game module (TypeScript is fine) through the game's own Vite: t.load('src/devkit/tuning/liveGuard.ts') */
    async load(path) { return (await shared.vite()).ssrLoadModule('/' + path.replace(/^\//, '')) },
    /**
     * A browser page with the game loaded (dev server, Dev Kit on) at a size: t.page({ width: 390, height: 844, mobile: true }).
     * Waits until the Dev Kit has started (window.__devkit). page.errors = the page's errors so far. Close it when done.
     */
    async page({ width = 1280, height = 800, mobile = false } = {}) {
      const base = await shared.url()
      const browser = await shared.browser()
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
      const page = await context.newPage()
      page.errors = []
      page.on('pageerror', (e) => page.errors.push(e.message))
      page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()) })
      const open = async (q) => {
        await page.goto(base + (q ?? ''), { waitUntil: 'load' })
        await page.waitForFunction(() => !!window.__devkit, null, { timeout: 20_000 }).catch(() => {})
        await page.evaluate(() => document.fonts?.ready)
      }
      await open(shared.query ?? '')
      if (shared.query === null) {
        shared.query = await page.evaluate(() => window.__devkit?.game()?.conformance?.query ?? '').catch(() => '')
        if (shared.query) await open(shared.query)
      }
      page.close = ((close) => async () => { await close(); await context.close() })(page.close.bind(page))
      return page
    },
    /**
     * From the loaded page into live play, through the adapter's conformance.startPlay. Returns '' when play is running,
     * else the reason (no Dev Kit / no adapter / no startPlay / it threw) — say it with t.needsPlay(name, reason).
     */
    async startPlay(page) {
      const reason = await page.evaluate(async () => {
        const kit = window.__devkit
        if (!kit) return 'nokit'
        const game = kit.game()
        if (!game) return 'noadapter'
        if (!game.conformance?.startPlay) return 'nostart'
        try { await game.conformance.startPlay() } catch (e) { return 'threw:' + (e?.message ?? e) }
        return ''
      })
      if (!reason) await page.waitForTimeout(400) // a few frames of play
      return reason
    },
    /** Record a failure for a check that couldn't reach live play, with the exact wiring to add. */
    needsPlay(name, reason) {
      const where = adapterFile(root) ?? 'src/devkit-game/<game>Adapter.ts'
      const fixes = {
        nokit: ['The Dev Kit never started in the page (window.__devkit is missing).', 'src/main.tsx: in dev, import(\'./devkit/mount\').then((m) => m.mountDevKit()) — see the Dev Kit README, Install step 1.'],
        noadapter: ['No game adapter is registered, so the checks can\'t reach the game.', 'Write src/devkit-game/<game>Adapter.ts and call registerDevKitGame(adapter) in src/devkit-game/tabs.ts (Dev Kit README: Plug the game in).'],
        nostart: [`The adapter (${where}) has no conformance.startPlay, so the checks can't get from the menu into live play.`,
          `Add to the adapter in ${where}:\n        conformance: {\n          startPlay: async () => { /* click Start, then wait until play runs */ },\n          query: '?seed=1', // optional: a fixed, replayable game\n        },`],
      }
      const [problem, fix] = reason.startsWith('threw:') ? [`conformance.startPlay() in ${where} threw: ${reason.slice(6)}`, 'Make startPlay work from the page as it first loads.'] : fixes[reason] ?? [reason, '']
      return t.fail(name, [problem], fix)
    },
  }
  return t
}

const symbols = { ok: '✓', bad: '✗', skip: '–' }

/** The report as plain text lines. */
export function formatReport(gameName, sections) {
  const lines = []
  const all = sections.flatMap((s) => s.results)
  const failed = all.filter((r) => !r.ok && !r.skipped)
  lines.push(`Framework check — ${gameName}: ${sections.map((s) => `${s.title} ${s.version}`).join(' · ') || 'no framework modules found'}`)
  for (const s of sections) {
    lines.push('', `${s.title} ${s.version} (${s.rel}/)`)
    for (const r of s.results) {
      lines.push(`  ${r.skipped ? symbols.skip : r.ok ? symbols.ok : symbols.bad} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`)
      if (!r.ok && !r.skipped) {
        for (const p of r.problems ?? []) lines.push(`      ${p.replace(/\n/g, '\n      ')}`)
        if (r.fix) lines.push(`      FIX: ${r.fix.replace(/\n/g, '\n      ')}`)
      }
    }
  }
  const skipped = all.filter((r) => r.skipped).length
  lines.push('', failed.length
    ? `FAIL — ${failed.length} promise${failed.length === 1 ? '' : 's'} not kept: ${failed.map((r) => r.name).join(' · ')}`
    : `PASS — ${all.length - skipped} check${all.length - skipped === 1 ? '' : 's'} kept${skipped ? `, ${skipped} skipped` : ''}`)
  return { text: lines.join('\n'), failed: failed.length }
}

async function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url)) // src/devkit/ → the game folder
  const { port, staticOnly, only } = readArgs(process.argv.slice(2))
  const modules = findModules(root)
  const shared = makeShared(root, port)
  const sections = []
  let gameName = 'this game'
  try { gameName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name ?? gameName } catch { /* fine */ }
  try {
    for (const module of modules) {
      if (only && !only.includes(module.id)) continue
      const results = []
      const section = { title: module.id, version: module.version, rel: module.rel, results }
      sections.push(section)
      if (!module.checks) {
        results.push({ name: 'has its own checks', ok: false, problems: [`${module.rel}/ has no conformance.mjs — this copy is older than its checks.`], fix: `Update it: ${UPDATE_HINT[module.id] ?? 'run its framework installer again'}` })
        continue
      }
      const t = makeTester({ root, module, modules, shared, staticOnly, results })
      try {
        const mod = await import(pathToFileURL(module.checks).href)
        section.title = mod.title ?? module.id
        console.log(`… ${section.title}`)
        await mod.check(t)
      } catch (e) {
        results.push({ name: 'its checks ran', ok: false, problems: [`${module.rel}/conformance.mjs stopped: ${e?.stack ?? e}`], fix: 'A framework bug, or the game is missing something it needs — the line above says which.' })
      }
    }
  } finally {
    await shared.close()
  }
  const { text, failed } = formatReport(gameName, sections)
  console.log('\n' + text)
  process.exit(failed ? 1 : 0)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
