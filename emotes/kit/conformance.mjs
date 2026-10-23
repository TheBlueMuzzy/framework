// THE EMOTES MODULE'S PROMISE CHECKS — run by the Dev Kit's check-framework.mjs (npm run check:framework).
// MODULE-CONTRACTS.md "Emotes" (framework design/emotes.md "check:framework promises"):
//   1. every phrase has words — each id in content/emotes.json has emotes.<id> in content/text/en.json
//   2. no phrase is hard-coded — a phrase's English words never appear in the game's own code (they live in the text file)
//   3. the limits are sane — burst ≥ 1, refillSeconds > 0, and the server's count never looser than the device's
//   4. the picker is reachable — in live play (the Dev Kit adapter's startPlay), tapping the player's own seat
//      (data-emote-mine, emoteSeatProps) opens the EmotePicker
//   5. the server relays through the kit — an online game's party/server.ts passes content/emotes.json to RoomServer
//      and never handles 'emote' messages itself
//   6. the Settings switch is read — "Hide everyone's emotes" (hideEmotes) is in Settings and reaches the module
//      (applyEmoteSetting / setHideAll)
//   7. the bubble keeps the kit's bars — after a sent emote, at every screen size: the UI kit's checks (nothing
//      overlaps, clipped, touching its edge, unreadable) pass, the bubble stays inside the window with room round
//      its words, and a second, different phrase leaves it exactly the same size
export const title = 'Emotes'

export const CHECKS = {
  words: 'every phrase has words',
  hardCoded: 'no phrase is hard-coded',
  limits: 'the limits are sane',
  picker: 'the picker is reachable',
  server: 'the server relays through the kit',
  settings: 'the Settings switch is read',
  bars: 'the bubble keeps the kit\'s bars',
}

const PHRASE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/
const SIZES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'small phone', width: 360, height: 780, mobile: true },
  { name: 'phone on its side', width: 844, height: 390, mobile: true },
  { name: 'short landscape', width: 768, height: 343, mobile: true },
  { name: 'laptop', width: 1100, height: 800, mobile: false },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'HD', width: 1920, height: 1080, mobile: false },
]

/** Comments out, so a how-to comment never counts (strings stay). */
export function withoutComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
}
const calls = (name, text) => new RegExp(`\\b${name}\\s*\\(`).test(withoutComments(text))

/** content/emotes.json → the problems with its limits (plain words). */
export function limitProblems(file) {
  const problems = []
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const limits = file?.limits ?? {}, server = file?.server ?? {}
  if (limits.burst !== undefined && !(num(limits.burst) >= 1)) problems.push(`limits.burst is ${JSON.stringify(limits.burst)} — at least 1 (or nobody could ever send one)`)
  if (limits.refillSeconds !== undefined && !(num(limits.refillSeconds) > 0)) problems.push(`limits.refillSeconds is ${JSON.stringify(limits.refillSeconds)} — more than 0`)
  if (server.burst !== undefined && !(num(server.burst) >= 1)) problems.push(`server.burst is ${JSON.stringify(server.burst)} — at least 1`)
  if (server.refillSeconds !== undefined && !(num(server.refillSeconds) > 0)) problems.push(`server.refillSeconds is ${JSON.stringify(server.refillSeconds)} — more than 0`)
  if (server.perMatch !== undefined && !(num(server.perMatch) >= 1)) problems.push(`server.perMatch is ${JSON.stringify(server.perMatch)} — at least 1`)
  // (compared only once both sides are sane — a broken value is named above)
  const sane = (v, ok, fallback) => (v === undefined ? fallback : ok(num(v)) ? num(v) : null)
  const b = sane(limits.burst, (v) => v >= 1, 3), sb = sane(server.burst, (v) => v >= 1, 3)
  const r = sane(limits.refillSeconds, (v) => v > 0, 4), sr = sane(server.refillSeconds, (v) => v > 0, 4)
  if (b !== null && sb !== null && sb > b) problems.push(`server.burst (${sb}) is more than limits.burst (${b}) — the server must never be looser than the device (a changed browser could out-talk a fair one)`)
  if (r !== null && sr !== null && sr < r) problems.push(`server.refillSeconds (${sr}) is quicker than limits.refillSeconds (${r}) — the server must never be looser than the device`)
  return problems
}

export async function check(t) {
  const code = t.gameCode().filter((f) => !f.path.startsWith(`${t.rel}/`))
  const file = t.json('content/emotes.json')
  const text = t.json('content/text/en.json')
  const phrases = Array.isArray(file?.phrases) ? file.phrases.filter((id) => typeof id === 'string' && PHRASE_ID.test(id)) : []
  const words = text?.emotes && typeof text.emotes === 'object' ? text.emotes : {}

  // 1. every phrase has words
  {
    const name = CHECKS.words
    const problems = []
    if (!file) problems.push('content/emotes.json is missing (or isn\'t valid JSON) — the installer gives a starter once.')
    else if (!phrases.length) problems.push('content/emotes.json has no "phrases" (a list of ids like "wellPlayed").')
    if (!text) problems.push('content/text/en.json is missing (or isn\'t valid JSON).')
    const missing = phrases.filter((id) => typeof words[id] !== 'string' || !words[id].trim())
    if (text && missing.length) problems.push(`No words for ${missing.map((id) => `"${id}"`).join(', ')} in content/text/en.json "emotes".`)
    if (problems.length) t.fail(name, problems, 'content/text/en.json: "emotes": { "hello": "Hello!", "wellPlayed": "Well played!", … } — one line per id in content/emotes.json "phrases".')
    else t.pass(name, `${phrases.length} phrases`)
  }

  // 2. no phrase is hard-coded
  {
    const name = CHECKS.hardCoded
    const english = phrases.map((id) => words[id]).filter((w) => typeof w === 'string' && w.trim().length >= 3)
    const found = []
    for (const f of code) {
      const body = withoutComments(f.text)
      for (const w of english) {
        const quoted = new RegExp(`(['"\`>])\\s*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(['"\`<])`)
        if (quoted.test(body)) found.push(`${f.path} — "${w}"`)
      }
    }
    if (found.length) t.fail(name, found.slice(0, 12), 'Show phrases through the emotes module (emotes.text(id) / EmoteBubbles / EmoteMenu) — their words live only in content/text/en.json "emotes", so a translation is just another text file.')
    else t.pass(name, english.length ? `${english.length} phrases' words only in content/text/en.json` : 'no phrases yet')
  }

  // 3. the limits are sane
  {
    const name = CHECKS.limits
    if (!file) t.skip(name, 'no content/emotes.json')
    else {
      const problems = limitProblems(file)
      if (problems.length) t.fail(name, problems, 'content/emotes.json: "limits" (this device) and "server" (the room) — burst ≥ 1, refillSeconds > 0, and the server never looser than the device.')
      else t.pass(name, `device ${file.limits?.burst ?? 3} in a row / ${file.limits?.refillSeconds ?? 4} s · server ${file.server?.burst ?? 3} / ${file.server?.refillSeconds ?? 4} s, ${file.server?.perMatch ?? 200} a match`)
    }
  }

  // 5. the server relays through the kit (an online game)
  {
    const name = CHECKS.server
    const serverFile = ['party/server.ts', 'party/server.mts'].find((p) => t.exists(p))
    if (!serverFile) t.skip(name, 'not an online game (no party/server.ts)')
    else {
      const party = t.files({ dirs: ['party'] }).filter((f) => !/\.test\./.test(f.path))
      const own = party.filter((f) => /type\s*===?\s*['"]emote['"]|case\s+['"]emote['"]/.test(withoutComments(f.text))).map((f) => f.path)
      const passes = /super\s*\([^)]*\{[^)]*\bemotes\b/.test(withoutComments(t.read(serverFile)))
      const problems = []
      if (!passes) problems.push(`${serverFile} doesn't pass content/emotes.json to RoomServer — the room drops every emote.`)
      if (own.length) problems.push(`${own.join(', ')} handle 'emote' messages themselves — the kit's handler checks the seat, the id and the count; a second one would skip them.`)
      if (problems.length) t.fail(name, problems, `${serverFile}: import emotes from '../content/emotes.json'   then   super(party, rules, settings, { emotes })   — and leave 'emote' messages to the rooms kit (Rooms 0.12.0+).`)
      else t.pass(name, `${serverFile}: { emotes }`)
    }
  }

  // 6. the Settings switch is read
  {
    const name = CHECKS.settings
    const settingsJson = t.json('content/ui/settings.json')
    const rows = (settingsJson?.tabs ?? []).flatMap((tab) => tab?.rows ?? [])
    const row = rows.find((r) => r?.id === 'hideEmotes')
    const inCode = code.some((f) => /\bEMOTE_SETTINGS_ROWS\b|\bemoteSettingsRows\s*\(/.test(withoutComments(f.text)))
    const applied = code.filter((f) => calls('applyEmoteSetting', f.text) || calls('setHideAll', f.text)).map((f) => f.path)
    const problems = []
    if ((!row || row.on === false) && !inCode) problems.push('Settings has no "Hide everyone\'s emotes" switch (no hideEmotes row in content/ui/settings.json, no EMOTE_SETTINGS_ROWS in the code).')
    if (!applied.length) problems.push('Nothing passes the switch to the module (applyEmoteSetting(emotes, values) or emotes.setHideAll(on)) — it would do nothing.')
    // The row's default is what a new player's Settings says, and applyEmoteSetting at start-up passes it on — so it
    // must be content/emotes.json mutedByDefault, or that value is undone the moment the game starts
    const mutedByDefault = file?.mutedByDefault === true
    if (row && row.on !== false && (row.default === true) !== mutedByDefault) problems.push(`content/ui/settings.json hideEmotes has "default": ${JSON.stringify(row.default ?? false)} but content/emotes.json mutedByDefault is ${mutedByDefault} — a new player's Settings would undo mutedByDefault at start-up. Make them the same.`)
    if (problems.length) t.fail(name, problems, "Paste the hideEmotes toggle (EMOTE_SETTINGS_ROWS in src/emotes/settingsRow.ts) into a tab's rows in content/ui/settings.json, then call applyEmoteSetting(emotes, loadSettings(settingsJson)) at start-up and applyEmoteSetting(emotes, values) in <Settings onChange>.")
    else t.pass(name, `${row ? 'content/ui/settings.json' : 'EMOTE_SETTINGS_ROWS'} · ${[...new Set(applied)].join(', ')}`)
  }

  // 4 + 7: in the browser, in live play
  if (t.staticOnly) {
    t.skip(CHECKS.picker, '--static')
    t.skip(CHECKS.bars, '--static')
    return
  }
  if (!t.exists('src/ui/kit/VERSION')) {
    t.skip(CHECKS.picker, 'the game has no UI kit (its own picker is its business)')
    t.skip(CHECKS.bars, 'the game has no UI kit')
    return
  }
  const { findProblems } = await import('../ui/kit/uiProblems.mjs')
  const pickerProblems = []
  const barProblems = {}
  let playReason = ''
  for (const size of SIZES) {
    const page = await t.page(size)
    const label = `${size.name} ${size.width}×${size.height}`
    try {
      playReason = await t.startPlay(page)
      if (playReason) break
      const seat = page.locator('[data-emote-mine]').first()
      if (!(await seat.count())) { pickerProblems.push(`${label}: no seat marked as the player's own (data-emote-mine)`); continue }
      await seat.click()
      const picker = page.locator('.kit-emote-picker .kit-emote-button')
      if (!(await picker.first().isVisible({ timeout: 2000 }).catch(() => false))) { pickerProblems.push(`${label}: tapping the player's own seat didn't open the EmotePicker`); continue }
      // Send the first phrase, look; then (after the spam gap) a different one: the bubble must not change size
      await picker.first().click()
      await page.waitForTimeout(400)
      const measure = () => page.evaluate(() => {
        const el = [...document.querySelectorAll('.kit-speech')].find((b) => getComputedStyle(b).visibility !== 'hidden')
        if (!el) return null
        const box = el.getBoundingClientRect()
        const words = el.querySelector('.kit-speech-text .kit-text')
        const range = document.createRange(); range.selectNodeContents(words)
        const w = range.getBoundingClientRect()
        return { w: Math.round(box.width), h: Math.round(box.height), room: Math.min(w.left - box.left, box.right - w.right, w.top - box.top, box.bottom - w.bottom),
          inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight }
      })
      const first = await measure()
      const found = [...page.errors.map((e) => `error: ${e}`), ...(await page.evaluate(findProblems, { screenWidth: size.width, checkFocus: false }))]
      if (!first) found.push('bubble: no speech bubble showed after a sent emote')
      else {
        if (first.room < 4) found.push(`edge: the bubble's words are ${Math.round(first.room)} px from its edge`)
        if (!first.inside) found.push('clipped: the bubble runs off the window')
        await page.waitForTimeout(900)
        await seat.click()
        const buttons = page.locator('.kit-emote-picker .kit-emote-button')
        if ((await buttons.count()) > 1) {
          await buttons.last().click()
          await page.waitForTimeout(400)
          const second = await measure()
          if (second && (second.w !== first.w || second.h !== first.h)) found.push(`grows: the bubble was ${first.w}×${first.h}, then ${second.w}×${second.h} for another phrase`)
        }
      }
      barProblems[label] = found
    } finally {
      await page.close()
    }
  }
  if (playReason) { t.needsPlay(CHECKS.picker, playReason); t.needsPlay(CHECKS.bars, playReason); return }
  if (pickerProblems.length) t.fail(CHECKS.picker, pickerProblems, "Make the player's own seat (chip / portrait) a button with emoteSeatProps(seat, true) (src/emotes/ui/EmoteLayer — data-emote-mine) that opens <EmoteMenu mine …/>; opponents' seats get emoteSeatProps(seat, false) and open the mute menu.")
  else t.pass(CHECKS.picker, `${SIZES.length} sizes`)
  const lines = Object.entries(barProblems).flatMap(([where, list]) => list.map((p) => `${where}: ${p}`))
  if (lines.length) t.fail(CHECKS.bars, lines.slice(0, 15), 'Give the bubbles room: pass EmoteBubbles `avoid` (the HUD + the seats), and size them with every phrase (it does by default). An overlap on purpose → data-ui-check="skip" on it.')
  else if (Object.keys(barProblems).length) t.pass(CHECKS.bars, `${Object.keys(barProblems).length} sizes, two phrases each`)
}
