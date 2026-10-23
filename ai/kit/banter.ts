// THE AI MODULE — BANTER. Should this bot say something at this moment, and what?
//
// The game names its MOMENTS from its own events ("tangledRival", "gotTangled", "stoleWord", "calledIt", "won"…): the
// plug's moments(event, seat) says what an event means to one seat (the same "tangled" event is "tangledRival" for the
// one who did it and "gotTangled" for the one it happened to). The lines are data — content/text/en.json
// "banter": { "<personality>": { "<moment>": "…", "<moment>_2": "…" } } — and the numbers live in
// content/ai/banter.json (chance per moment, cooldown, the moments that ignore it, preset emotes per moment, how long
// a bot takes to speak). This picks: a chance per moment × the personality's chattiness, nothing again for a few moves
// after it spoke (cooldown — some moments may skip it), and a line it hasn't said lately. Memory is plain JSON per seat.
import { nextRandom } from './random'

/** A moment's name: a short code name the game picks ("won", "gotTangled"). Its lines are banter.<personality>.<moment>. */
export type Moment = string

/** The game's moment map (on its plug): what this event means to this seat — one moment, a few (most important
 *  first: the bot says at most one line per change), or nothing. Seat = the Table's seat number. */
export type MomentMap<Event> = (event: Event, seat: number) => Moment | readonly Moment[] | null | undefined

/** The moment names most games have, with what each means — a starting list for content/ai/banter.json and the Dev
 *  Kit's labels. A game adds its own (any code name), and leaves out the ones it doesn't have. */
export const COMMON_MOMENTS: Readonly<Record<string, string>> = {
  gameStart: 'the game begins',
  bigMove: 'it just made a great move',
  rivalBigMove: 'someone else just made a great move',
  hitRival: 'it just hurt another player',
  gotHit: 'another player just hurt it',
  closeCall: 'it nearly lost something big',
  won: 'the game ended and it won',
  lost: 'the game ended and it lost',
}

/** A moment's name must be a code name (it becomes part of an emote id: banter.<personality>.<moment>). */
export const MOMENT_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/

export interface BanterSettings {
  /** 0–1: the chance for a fully chatty (100) personality to speak at each moment. Unlisted moments: never. The keys
   *  are the game's moments (the Dev Kit and check:framework read them from here). */
  chance: Record<string, number>
  /** Moves (changes at the table) of quiet after it speaks. */
  cooldownTurns: number
  /** Moments that ignore the cooldown (e.g. the end of the game). */
  alwaysAllowed?: string[]
  /** Preset emote ids (content/emotes.json phrases) a bot may press at a moment it has no lines of its own for
   *  ({ "won": ["goodGame"] }). */
  presets?: Record<string, string[]>
  /** Seconds between the moment and the line (picked between min and max, on the rules clock — a pause stops it). */
  delay?: { min: number; max: number }
  /** Seconds after any bot speaks before another may (so two bubbles never talk over each other): a second bot waits
   *  for the gap and answers a beat later — or lets its line go when that would be more than delay.max + tableGap
   *  after its moment. 0 = off. */
  tableGap?: number
}

export const DEFAULT_BANTER_SETTINGS: Required<BanterSettings> = {
  chance: { gameStart: 0.3, bigMove: 0.5, rivalBigMove: 0.3, hitRival: 0.6, gotHit: 0.5, closeCall: 0.4, won: 0.9, lost: 0.6 },
  cooldownTurns: 2,
  alwaysAllowed: ['won', 'lost'],
  presets: { won: ['goodGame'], lost: ['wellPlayed'], rivalBigMove: ['wow'] },
  delay: { min: 0.6, max: 1.6 },
  tableGap: 3, // (longer than a bubble shows — emotes' bubble.showMs 2.5 s — so bots never have two bubbles up at once)
}

/** content/ai/banter.json → the settings. A bad value → one warning (plain words) + the default for it. Unlisted
 *  keys (_help…) are ignored. */
export function readBanterSettings(json: unknown, warn: (message: string) => void = (m) => console.warn(`[ai banter] ${m}`)): Required<BanterSettings> {
  const d = DEFAULT_BANTER_SETTINGS
  if (json === undefined || json === null) return { ...d }
  if (typeof json !== 'object' || Array.isArray(json)) {
    warn('content/ai/banter.json isn\'t an object — using the defaults.')
    return { ...d }
  }
  const file = json as Record<string, unknown>
  const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const out: Required<BanterSettings> = { ...d, chance: {}, presets: {} }

  if (file.chance === undefined) out.chance = { ...d.chance }
  else if (!isObject(file.chance)) { warn('"chance" must be { "<moment>": 0–1 } — using the defaults.'); out.chance = { ...d.chance } }
  else {
    for (const [moment, value] of Object.entries(file.chance)) {
      if (moment.startsWith('_')) continue
      if (!MOMENT_NAME.test(moment)) warn(`"chance": "${moment}" isn't a code name (letters, digits, - or _, starting with a letter) — left out.`)
      else if (!isNumber(value) || value < 0 || value > 1) warn(`"chance.${moment}" is ${JSON.stringify(value)} — it must be 0–1; left out.`)
      else out.chance[moment] = value
    }
  }

  if (file.cooldownTurns !== undefined) {
    if (isNumber(file.cooldownTurns) && file.cooldownTurns >= 0) out.cooldownTurns = Math.round(file.cooldownTurns)
    else warn(`"cooldownTurns" is ${JSON.stringify(file.cooldownTurns)} — 0 or more; using ${d.cooldownTurns}.`)
  }
  if (file.alwaysAllowed !== undefined) {
    if (Array.isArray(file.alwaysAllowed) && file.alwaysAllowed.every((m) => typeof m === 'string')) out.alwaysAllowed = [...file.alwaysAllowed]
    else warn('"alwaysAllowed" must be a list of moment names — using the defaults.')
  }

  if (file.presets === undefined) out.presets = { ...d.presets }
  else if (!isObject(file.presets)) { warn('"presets" must be { "<moment>": ["<phrase id>"] } — using the defaults.'); out.presets = { ...d.presets } }
  else {
    for (const [moment, ids] of Object.entries(file.presets)) {
      if (moment.startsWith('_')) continue
      if (Array.isArray(ids) && ids.every((id) => typeof id === 'string' && MOMENT_NAME.test(id))) out.presets[moment] = [...ids]
      else warn(`"presets.${moment}" must be a list of phrase ids (content/emotes.json) — left out.`)
    }
  }

  if (file.delay !== undefined) {
    const delay = file.delay as { min?: unknown; max?: unknown }
    if (isObject(delay) && isNumber(delay.min) && isNumber(delay.max) && delay.min >= 0 && delay.max >= delay.min && delay.max <= 30) out.delay = { min: delay.min, max: delay.max }
    else warn(`"delay" must be { "min": seconds, "max": seconds } with 0 ≤ min ≤ max ≤ 30 — using ${d.delay.min}–${d.delay.max} s.`)
  }
  if (file.tableGap !== undefined) {
    if (isNumber(file.tableGap) && file.tableGap >= 0 && file.tableGap <= 60) out.tableGap = file.tableGap
    else warn(`"tableGap" is ${JSON.stringify(file.tableGap)} — seconds, 0–60; using ${d.tableGap}.`)
  }
  return out
}

/** May this seat see this event? A Table event says (seen: 'all' | { seats }); anything else counts as seen by all. */
function sees(event: unknown, seat: number): boolean {
  const seen = event && typeof event === 'object' ? (event as { seen?: unknown }).seen : undefined
  if (!seen || typeof seen !== 'object') return true
  const seats = (seen as { seats?: unknown }).seats
  return !Array.isArray(seats) || seats.includes(seat)
}

/** What one change means to one seat: every moment the plug names for its events, in order, no repeats. Events the
 *  seat may not see (a Table event's `seen`) are skipped — a bot never comments on a secret. */
export function momentsFor<Event>(map: MomentMap<Event>, events: readonly Event[], seat: number): Moment[] {
  const out: Moment[] = []
  for (const event of events) {
    if (!sees(event, seat)) continue
    const named = map(event, seat)
    const list = named === null || named === undefined ? [] : typeof named === 'string' ? [named] : named
    for (const moment of list) if (typeof moment === 'string' && MOMENT_NAME.test(moment) && !out.includes(moment)) out.push(moment)
  }
  return out
}

/** The game's banter lines as content/text/en.json holds them: personality → moment (or moment_2, moment_3…) → words. */
export type BanterLines = Record<string, Record<string, string>>

const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)

/** Is this key a line for this moment: the moment itself, or a numbered extra line (won_2, won_3…)? */
export const isLineFor = (key: string, moment: Moment) => key === moment || (key.startsWith(`${moment}_`) && /^\d+$/.test(key.slice(moment.length + 1)))

/** The emote ids of a personality's lines for a moment — banter.<personality>.<moment>, banter.<personality>.<moment>_2…
 *  (only those with words). Read every time (never copied), so a line edited in the Dev Kit counts at the next moment. */
export function linesFor(lines: BanterLines | undefined, personality: string, moment: Moment): string[] {
  if (!lines || typeof lines !== 'object' || !own(lines, personality)) return []
  const mine = lines[personality]
  if (!mine || typeof mine !== 'object') return []
  return Object.keys(mine)
    .filter((key) => isLineFor(key, moment) && typeof mine[key] === 'string' && mine[key].trim() !== '' && MOMENT_NAME.test(key))
    .map((key) => `banter.${personality}.${key}`)
}

export interface BanterMemory {
  /** The turn it last spoke on (−Infinity is not JSON: use null for never). */
  lastSpokeTurn: number | null
  /** Lines it has said, oldest first (so it doesn't repeat itself). */
  said: string[]
}

export const quietMemory = (): BanterMemory => ({ lastSpokeTurn: null, said: [] })

export function maybeSay(
  moment: string,
  turn: number,
  chattiness: number,
  lines: readonly string[],
  memory: BanterMemory,
  settings: BanterSettings,
  rng: number,
): { line: string | null; memory: BanterMemory; rng: number } {
  const quiet = { line: null, memory, rng }
  if (!lines.length) return quiet
  const cooling = memory.lastSpokeTurn !== null && turn - memory.lastSpokeTurn <= settings.cooldownTurns
  if (cooling && !settings.alwaysAllowed?.includes(moment)) return quiet
  const roll = nextRandom(rng)
  if (roll.value >= (settings.chance[moment] ?? 0) * (chattiness / 100)) return { ...quiet, rng: roll.rng }
  // A line it hasn't said lately: the ones never said, else the one said longest ago.
  const fresh = lines.filter((l) => !memory.said.includes(l))
  const pickFrom = fresh.length ? fresh : [memory.said.find((l) => lines.includes(l))!]
  const pick = nextRandom(roll.rng)
  const line = pickFrom[Math.floor(pick.value * pickFrom.length)]
  return { line, memory: { lastSpokeTurn: turn, said: [...memory.said.filter((l) => l !== line), line].slice(-50) }, rng: pick.rng }
}
