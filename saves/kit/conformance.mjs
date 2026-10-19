// THE SAVES MODULE'S PROMISE CHECKS — run by the Dev Kit's check-framework.mjs (npm run check:framework).
// MODULE-CONTRACTS.md "Saves":
//   - every save (createSave) has a golden save in tests/saves/ for each of its versions — so an update that would
//     break an old save is caught before players see it
//   - the game's save tests pass: every golden save loads with today's code, round trip, damaged saves, full storage
//   - the game's own code saves through the module, not straight into localStorage / sessionStorage
//     (room codes and player ids — the rooms module's "rooms:" keys — are fine; anything else that must stay is
//     listed in content/saves.json "storageAllowed" with why)
export const title = 'Saves'

const GOLDEN_DIR = 'tests/saves'
const SAVE_TEST = 'tests/saves/saves.test.ts'

/** The same file naming as oldSaves.ts goldenFileName: glyphtender:new-game → glyphtender_new-game-v2.json */
export const goldenPrefix = (key) => key.replace(/[^A-Za-z0-9._-]/g, '_') + '-v'

/**
 * Every createSave in the game's code → { where, key, version } or { where, problem }.
 * key and version are read as plain values in the call (key: 'goops-progress', version: 2), or from a
 * const in the same file (version: VERSION with const VERSION = 2).
 */
export function findSaves(files) {
  const found = []
  for (const { path, text: original } of files) {
    // comments out (kept as blank space, so line numbers stay right): a createSave named in a comment isn't a save
    const text = original.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).replace(/^(\s*)\/\/.*$/gm, '$1')
    const call = /\bcreateSave\s*(<[^>]*>)?\s*\(/g
    let match
    while ((match = call.exec(text))) {
      const line = text.slice(0, match.index).split('\n').length
      const where = `${path}:${line}`
      const body = text.slice(match.index, match.index + 2000)
      const key = valueOf(body.match(/\bkey\s*:\s*([^,\n}]+)/)?.[1], text, 'string')
      const version = valueOf(body.match(/\bversion\s*:\s*([^,\n}]+)/)?.[1], text, 'number')
      if (key === null || version === null) {
        found.push({ where, problem: `${where} — can't read its ${key === null ? 'key' : 'version'}: write it as a plain value in createSave (key: 'mygame:progress', version: 2) or a const in the same file` })
      } else {
        found.push({ where, key, version })
      }
    }
  }
  return found
}

/** 'goops-progress' → the string · 2 → 2 · NAME → the value of `const NAME = …` in the same file · else null */
function valueOf(expression, text, kind) {
  const raw = expression?.trim()
  if (!raw) return null
  const literal = kind === 'string' ? raw.match(/^(['"`])([^'"`$]+)\1$/)?.[2] : raw.match(/^(\d+)$/)?.[1]
  if (literal !== undefined) return kind === 'string' ? literal : Number(literal)
  if (!/^[A-Za-z_$][\w$]*$/.test(raw)) return null
  const constant = text.match(new RegExp(`\\bconst\\s+${raw}\\s*(?::[^=]+)?=\\s*([^\\n;]+)`))?.[1]
  return constant && constant.trim() !== raw ? valueOf(constant, '', kind) : null
}

/** The versions 1…version with no golden file for this key. */
export function missingVersions(key, version, fileNames) {
  const prefix = goldenPrefix(key)
  const have = new Set(fileNames.map((name) => name.replace(/^.*\//, '')).filter((n) => n.startsWith(prefix) && n.endsWith('.json'))
    .map((n) => Number(n.slice(prefix.length).match(/^(\d+)(-.*)?\.json$/)?.[1])).filter(Boolean))
  return Array.from({ length: version }, (_, i) => i + 1).filter((v) => !have.has(v))
}

export async function check(t) {
  const code = t.gameCode()
  const saves = findSaves(code)
  {
    const name = 'every save has a golden copy for each version'
    if (!saves.length) {
      t.skip(name, 'no createSave in the game\'s code yet')
    } else {
      const goldens = t.files({ dirs: [GOLDEN_DIR], exts: /\.json$/ }).map((f) => f.path)
      const problems = []
      for (const save of saves) {
        if (save.problem) { problems.push(save.problem); continue }
        for (const v of missingVersions(save.key, save.version, goldens)) problems.push(`"${save.key}" (${save.where}) has no golden save for version ${v} → ${GOLDEN_DIR}/${goldenPrefix(save.key)}${v}.json`)
      }
      if (problems.length) t.fail(name, problems.slice(0, 16), `Add a real save from each version to ${GOLDEN_DIR}/ (README: Golden saves): { "about": "…", "stored": <the browser's stored value for the key>, "expect": { …values it must load with } }.`)
      else t.pass(name, saves.map((s) => `${s.key} v1–${s.version}`).join(' · '))
    }
  }
  {
    const name = 'the game\'s save tests pass (golden saves, round trip, damaged saves, full storage)'
    if (!saves.length) t.skip(name, 'no createSave in the game\'s code yet')
    else if (!t.exists(SAVE_TEST)) t.fail(name, [`${SAVE_TEST} is missing.`], `Run the saves installer again (it gives the starter once): ${'node <framework>/saves/scripts/install-saves.mjs .'}`)
    else if (!t.exists('node_modules/vitest')) t.skip(name, 'the game has no vitest')
    else {
      const run = t.run('npx', ['vitest', 'run', SAVE_TEST])
      if (run.code === 0) t.pass(name, SAVE_TEST)
      else t.fail(name, [`npx vitest run ${SAVE_TEST} failed:`, ...run.out.split(/\r?\n/).filter((l) => l.trim()).slice(-14).map((l) => '  ' + l)], `Run it yourself (npx vitest run ${SAVE_TEST}) — each failure names the save and what didn't load.`)
    }
  }
  {
    const name = 'the game saves through the module, not straight into the browser\'s storage'
    const settings = t.json('content/saves.json')
    const allowed = Array.isArray(settings?.storageAllowed) ? settings.storageAllowed.map((a) => (typeof a === 'string' ? a : a?.file)).filter(Boolean) : []
    const direct = t.linesMatching(code, /\b(localStorage|sessionStorage)\b/)
      .filter((line) => !line.startsWith(`${t.rel}/`)) // this module's own copy (an older Dev Kit doesn't know to skip it)
      .filter((line) => !/['"`]rooms:/.test(line)) // the rooms module's ids
      .filter((line) => !allowed.some((file) => line.startsWith(`${file}:`)))
    const problems = []
    if (!settings) problems.push('content/saves.json is missing (or isn\'t valid JSON) — the installer gives a starter once.')
    if (direct.length) problems.push('Game code uses the browser\'s storage directly (no version, no backups, no save code):', ...direct.map((l) => '  ' + l))
    if (problems.length) t.fail(name, problems.slice(0, 20), 'Move each onto createSave (src/saves). One that must stay (e.g. a room code, until F95) → list its file in content/saves.json "storageAllowed": [{ "file": "src/…", "why": "…" }].')
    else t.pass(name, allowed.length ? `${allowed.length} file${allowed.length === 1 ? '' : 's'} allowed in content/saves.json` : 'no direct storage use')
  }
}
