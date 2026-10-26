// CONTENT/EMOTES.JSON — which phrases a player can send, how chatty they may be (on this device and on the room's
// server), and how long a bubble shows. Muzzy edits it in the Dev Kit or Obsidian.
// A bad value never breaks the game: it gives ONE console warning and the default is used instead.

/** A bucket: up to `burst` in a row, one comes back every `refillSeconds`, never two closer than `minGapMs`. */
export interface EmoteLimits {
  burst: number
  refillSeconds: number
  minGapMs: number
}

/** The room server's own count (it never trusts the browser's) + the most one seat may send in a match. */
export interface EmoteServerLimits {
  burst: number
  refillSeconds: number
  perMatch: number
}

export interface EmotesConfig {
  /** Phrase ids in picker order. Their words live in content/text/en.json → "emotes": { "hello": "Hello!" }. */
  phrases: string[]
  limits: EmoteLimits
  server: EmoteServerLimits
  /** How long a bubble shows: showMs, or readMsPerWord × its words when that's longer. */
  bubble: { showMs: number; readMsPerWord: number }
  picker: { closeAfterSend: boolean }
  /** The "Hide everyone's emotes" switch's starting value for a new player. */
  mutedByDefault: boolean
}

export const DEFAULT_EMOTES_CONFIG: EmotesConfig = {
  phrases: ['hello', 'wellPlayed', 'thanks', 'wow', 'oops', 'thinking', 'goodGame'],
  limits: { burst: 3, refillSeconds: 4, minGapMs: 800 }, // Muzzy's default (Ask Muzzy, F107): 3 in a row, then one every 4 s
  server: { burst: 3, refillSeconds: 4, perMatch: 200 },
  bubble: { showMs: 2500, readMsPerWord: 250 },
  picker: { closeAfterSend: true },
  mutedByDefault: false, // Muzzy's default (Ask Muzzy, F107): emotes are shown, with a switch to hide them
}

/** A phrase id: a short code name (letters, digits, - and _), never words — the words live in the text file. */
export const PHRASE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/
/** A bot's banter line (F22): banter.<personality>.<moment>, words in the text file's "banter" part. */
export const BANTER_ID = /^banter\.[A-Za-z][A-Za-z0-9_-]{0,31}\.[A-Za-z][A-Za-z0-9_-]{0,31}$/
/** More phrases than this don't fit one small panel on a phone. */
export const MAX_PHRASES = 12

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

/** Any JSON (content/emotes.json) → a complete config. Odd values → the default, with one warning each. */
export function readEmotesConfig(json: unknown, warn: (message: string) => void = console.warn): EmotesConfig {
  const file = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>
  const part = (name: string) => (file[name] && typeof file[name] === 'object' ? file[name] : {}) as Record<string, unknown>
  const pick = <T>(name: string, value: unknown, ok: (v: unknown) => v is T, fallback: T): T => {
    if (value === undefined) return fallback
    if (ok(value)) return value
    warn(`content/emotes.json: "${name}" is ${JSON.stringify(value)} — using ${JSON.stringify(fallback)} instead.`)
    return fallback
  }
  const number = (name: string, value: unknown, min: number, max: number, fallback: number) =>
    pick(name, value, (v): v is number => inRange(v, min, max), fallback)
  const whole = (name: string, value: unknown, min: number, max: number, fallback: number) => Math.round(number(name, value, min, max, fallback))
  const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
  const d = DEFAULT_EMOTES_CONFIG

  // The phrases: ids only, each once; a bad one is left out (with a warning), an empty list → the defaults
  let phrases = d.phrases
  if (file.phrases !== undefined) {
    if (!Array.isArray(file.phrases)) warn(`content/emotes.json: "phrases" should be a list of ids — using the starter phrases.`)
    else {
      const good = [...new Set(file.phrases.filter((id): id is string => typeof id === 'string' && PHRASE_ID.test(id)))]
      const bad = file.phrases.filter((id) => typeof id !== 'string' || !PHRASE_ID.test(id))
      if (bad.length) warn(`content/emotes.json: ${bad.map((b) => JSON.stringify(b)).join(', ')} ${bad.length === 1 ? "isn't a phrase id" : "aren't phrase ids"} (short code names like "wellPlayed"; the words go in content/text/en.json) — left out.`)
      if (good.length > MAX_PHRASES) warn(`content/emotes.json: ${good.length} phrases — only the first ${MAX_PHRASES} fit the picker.`)
      phrases = good.length ? good.slice(0, MAX_PHRASES) : d.phrases
    }
  }
  const limits = part('limits'), server = part('server'), bubble = part('bubble'), picker = part('picker')
  return {
    phrases,
    limits: {
      burst: whole('limits.burst', limits.burst, 1, 20, d.limits.burst),
      refillSeconds: number('limits.refillSeconds', limits.refillSeconds, 0.1, 600, d.limits.refillSeconds),
      minGapMs: whole('limits.minGapMs', limits.minGapMs, 0, 60_000, d.limits.minGapMs),
    },
    server: {
      burst: whole('server.burst', server.burst, 1, 20, d.server.burst),
      refillSeconds: number('server.refillSeconds', server.refillSeconds, 0.1, 600, d.server.refillSeconds),
      perMatch: whole('server.perMatch', server.perMatch, 1, 10_000, d.server.perMatch),
    },
    bubble: {
      showMs: whole('bubble.showMs', bubble.showMs, 500, 20_000, d.bubble.showMs),
      readMsPerWord: whole('bubble.readMsPerWord', bubble.readMsPerWord, 0, 2_000, d.bubble.readMsPerWord),
    },
    picker: { closeAfterSend: pick('picker.closeAfterSend', picker.closeAfterSend, isBool, d.picker.closeAfterSend) },
    mutedByDefault: pick('mutedByDefault', file.mutedByDefault, isBool, d.mutedByDefault),
  }
}

/** Is the server's count looser than the device's? (check:framework fails then: a hacked browser could out-talk a
 *  fair one.) → the plain-words problems, or [] */
export function looserServer(config: Pick<EmotesConfig, 'limits' | 'server'>): string[] {
  const problems: string[] = []
  if (config.server.burst > config.limits.burst) problems.push(`server.burst (${config.server.burst}) is more than limits.burst (${config.limits.burst})`)
  if (config.server.refillSeconds < config.limits.refillSeconds) problems.push(`server.refillSeconds (${config.server.refillSeconds}) is quicker than limits.refillSeconds (${config.limits.refillSeconds})`)
  return problems
}
