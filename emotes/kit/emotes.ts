// THE EMOTES MODULE — preset phrases players send across the table, shown in a speech bubble by their seat.
// Pure TypeScript: no React, no network, no page. People, bots, local and online all go through the same path.
//
//   const emotes = createEmotes({ settings: emotesJson, words: text.emotes, banter: text.banter, save: emoteSave, mine: ['seat-1'] })
//   emotes.sendEmote('seat-1', 'wellPlayed')   // { ok: true } | { ok: false, reason: 'cooling' | 'unknown' }
//   emotes.say('seat-3', 'banter.bully.won')    // a bot seat: the same path, the same bucket (F22 Banter calls this)
//   const off = emotes.onEmote(({ seat, id, at }) => …)   // only emotes this player should see
//   emotes.receive(message)                     // online: what the room relayed ({ seat, id })
//   emotes.mute('seat-2', true) · emotes.isMuted('seat-2') · emotes.setHideAll(true)
//   emotes.readyIn('seat-1')                    // ms until the next send is allowed (the picker's ring)
//
// Online: pass `send` (e.g. (seat, id) => online.sendEmote(id)) — a send then goes to the room, and the bubble shows
// when the room relays it back (on every screen at once, the sender's too). Without `send` (a local game) it shows here
// straight away.
// Who sees what: a muted seat's emotes are dropped before onEmote (the bubble never even starts; the muted player
// isn't told and can keep pressing). "Hide everyone's emotes" drops every seat's but this device's own (`mine`).
import { createBucket, type Bucket } from './bucket'
import { BANTER_ID, readEmotesConfig, type EmotesConfig } from './config'
import { EMOTE_SAVE, type EmoteSaveData, type EmoteSaveLike } from './save'

export interface EmoteMessage {
  /** The seat that said it (the room's seat id online; the game's own seat id locally). */
  seat: string
  /** A phrase id (content/emotes.json) or a bot's banter id (banter.<personality>.<moment>). Never words. */
  id: string
  /** When it arrived here (the clock passed in, Date.now() by default). */
  at: number
}

/** cooling = past the spam limit (readyIn says for how long) · unknown = not a phrase or banter id · offline = online, but
 *  the room isn't connected right now · server = a bot's say() while online: bots speak from the room's server
 *  (room.emote(seatId, id)) — from here it would go out as this player's own seat */
export type SendResult = { ok: true } | { ok: false; reason: 'cooling' | 'unknown' | 'offline' | 'server' }

export interface EmotesOptions {
  /** content/emotes.json as it is (read with readEmotesConfig: a bad value warns once and uses the default). */
  settings?: unknown
  /** The phrases' words: content/text/en.json "emotes" ({ hello: 'Hello!' }). */
  words?: Record<string, string>
  /** The bots' banter lines: content/text/en.json "banter" ({ bully: { won: 'Too easy.' } }) — F22. Read at every
   *  lookup, never copied; a function (() => text.banter) also follows a file whose "banter" object gets replaced. */
  banter?: Record<string, Record<string, string>> | (() => Record<string, Record<string, string>> | undefined)
  /** The seats played on THIS device (yourself; every person's seat in a hot-seat game). Their emotes always show,
   *  and they can't be muted. */
  mine?: string[]
  /** Where the switch and the mutes are kept: a saves-module save made with EMOTE_SAVE (see save.ts). Without one
   *  they last until the page is closed. */
  save?: EmoteSaveLike
  /** This match's id ('' = a local game). Mutes saved for another match are dropped. */
  match?: string
  /** Online: hand a send to the room → true if it went. The bubble then comes back through receive(). */
  send?: (seat: string, id: string) => boolean
  /** The clock (ms). Default Date.now — the looks clock: emotes are never paused by the game's pause. */
  now?: () => number
  /** Where a problem is told (a save that wouldn't write). Default console.warn. */
  warn?: (message: string) => void
}

export interface Emotes {
  readonly config: EmotesConfig
  /** The phrase ids, in picker order. */
  readonly phrases: readonly string[]
  sendEmote(seat: string, id: string): SendResult
  /** A bot seat "presses" an emote: exactly sendEmote (the same check, the same bucket, the same bubble, the same mute).
   *  Local games only: online (a `send` is set) it's refused with 'server' — bots there speak from the room's server
   *  (room.emote(seatId, id)), or the room would send the line as this player's own seat. */
  say(seat: string, id: string): SendResult
  /** Called for every emote this player should see. Returns the way to stop listening. */
  onEmote(listener: (emote: EmoteMessage) => void): () => void
  /** Online: a message the room relayed. Anything not shaped like { seat, id } with a known id is ignored. */
  receive(message: unknown): void
  mute(seat: string, on: boolean): void
  isMuted(seat: string): boolean
  /** The muted seats, for the chips' crossed-bubble badge. */
  muted(): string[]
  setHideAll(on: boolean): void
  hideAll(): boolean
  /** ms until this seat may send again (0 = now). */
  readyIn(seat: string): number
  /** The words for an id ('' when there are none — check:framework catches a phrase without words). */
  text(id: string): string
  /** Every phrase's words, for sizing the bubble once to the longest. */
  allTexts(): string[]
  /** How long a bubble with these words shows: showMs, or readMsPerWord × words when longer. */
  bubbleMs(id: string): number
  /** A new match: the mutes start clean (the switch stays). The same id again keeps them. */
  setMatch(match: string): void
  /** The seats played on this device changed (a hot-seat game started, an online seat arrived). */
  setMine(seats: string[]): void
  /** Online ↔ local in one page (a game with both modes): the room's send while online, undefined for a local game
   *  (sends show here straight away). Same as the `send` option. */
  setSend(send: ((seat: string, id: string) => boolean) | undefined): void
  /** Called when a mute, the switch or the match changes (the chips' muted marks redraw). Returns the way to stop. */
  onChange(listener: () => void): () => void
}

/** Is this an id the module knows: one of the phrases, or a banter line that has words? */
function known(config: EmotesConfig, id: string, banterText: (id: string) => string) {
  return config.phrases.includes(id) || (BANTER_ID.test(id) && banterText(id) !== '')
}

export function createEmotes(options: EmotesOptions = {}): Emotes {
  const warn = options.warn ?? ((m: string) => console.warn(`[emotes] ${m}`))
  const config = readEmotesConfig(options.settings ?? {}, warn)
  const now = options.now ?? Date.now
  const words = options.words ?? {}
  const banterNow = () => {
    const lines = typeof options.banter === 'function' ? options.banter() : options.banter
    return lines && typeof lines === 'object' ? lines : {}
  }
  let mine = new Set(options.mine ?? [])
  let send = options.send
  const listeners = new Set<(emote: EmoteMessage) => void>()
  const buckets = new Map<string, Bucket>()
  const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key) // (never __proto__ & co.)

  // What's kept: the save's copy, or a fresh one (the switch at mutedByDefault for a new player)
  const save = options.save
  if (save?.version !== undefined && save.version !== EMOTE_SAVE.version) warn(`the emotes save is version ${save.version} but the module's is ${EMOTE_SAVE.version} — make it with createSave({ ...EMOTE_SAVE, key, version: ${EMOTE_SAVE.version} }).`)
  const isNew = !save || (save.peek ? save.peek() === null : false)
  let kept: EmoteSaveData = save ? EMOTE_SAVE.clean(save.load()) : { ...EMOTE_SAVE.fresh, seats: [] }
  if (isNew) kept = { ...kept, hideAll: config.mutedByDefault }
  const match = options.match ?? ''
  if (kept.match !== match) kept = { ...kept, match, seats: [] }
  const changeListeners = new Set<() => void>()
  const write = () => {
    for (const listener of [...changeListeners]) listener()
    if (!save) return
    const result = save.save(kept) as { ok?: boolean; message?: string } | undefined
    if (result && result.ok === false) warn(`couldn't keep the emote settings (${result.message ?? 'storage refused'}) — they last until the page closes.`)
  }

  const banterText = (id: string) => {
    const [, personality, moment] = id.split('.')
    const banter = banterNow()
    const lines = own(banter, personality) ? banter[personality] : undefined
    return lines && typeof lines === 'object' && own(lines, moment) && typeof lines[moment] === 'string' ? lines[moment] : ''
  }
  const text = (id: string) => (BANTER_ID.test(id) ? banterText(id) : own(words, id) && typeof words[id] === 'string' ? words[id] : '')
  const bucketOf = (seat: string) => {
    let bucket = buckets.get(seat)
    if (!bucket) buckets.set(seat, (bucket = createBucket(config.limits)))
    return bucket
  }
  const shows = (seat: string) => mine.has(seat) || (!kept.hideAll && !kept.seats.includes(seat))
  const deliver = (seat: string, id: string) => {
    if (!shows(seat)) return
    const emote = { seat, id, at: now() }
    for (const listener of [...listeners]) listener(emote)
  }

  const sendEmote = (seat: string, id: string): SendResult => {
    if (typeof seat !== 'string' || !seat || typeof id !== 'string' || !known(config, id, banterText)) return { ok: false, reason: 'unknown' }
    if (!bucketOf(seat).take(now())) return { ok: false, reason: 'cooling' }
    if (send) {
      // (the room keeps its own count too; the bucket here is spent either way, so a dropped line can't be re-pressed at once)
      return send(seat, id) ? { ok: true } : { ok: false, reason: 'offline' }
    }
    deliver(seat, id)
    return { ok: true }
  }

  let toldServer = false
  const say = (seat: string, id: string): SendResult => {
    if (send) {
      if (!toldServer) warn('a bot\'s say() while online is refused: online, bots speak from the room\'s server (room.emote(seatId, id)) — from this device the room would send it as your own seat.')
      toldServer = true
      return { ok: false, reason: 'server' }
    }
    return sendEmote(seat, id)
  }

  return {
    config,
    phrases: config.phrases,
    sendEmote,
    say,
    onEmote(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    receive(message) {
      if (!message || typeof message !== 'object') return
      const { seat, id } = message as { seat?: unknown; id?: unknown }
      if (typeof seat !== 'string' || !seat || seat.length > 64 || typeof id !== 'string' || !known(config, id, banterText)) return
      deliver(seat, id)
    },
    mute(seat, on) {
      if (typeof seat !== 'string' || !seat || mine.has(seat)) return // (you can't mute yourself)
      const has = kept.seats.includes(seat)
      if (on === has) return
      kept = { ...kept, seats: on ? [...kept.seats, seat] : kept.seats.filter((s) => s !== seat) }
      write()
    },
    isMuted: (seat) => kept.seats.includes(seat),
    muted: () => [...kept.seats],
    setHideAll(on) {
      if (kept.hideAll === on) return
      kept = { ...kept, hideAll: on }
      write()
    },
    hideAll: () => kept.hideAll,
    readyIn: (seat) => bucketOf(seat).readyIn(now()),
    text,
    allTexts: () => config.phrases.map(text).filter(Boolean),
    bubbleMs(id) {
      const count = text(id).trim().split(/\s+/).filter(Boolean).length
      return Math.max(config.bubble.showMs, count * config.bubble.readMsPerWord)
    },
    setMatch(next) {
      if (next === kept.match) return
      kept = { ...kept, match: next, seats: [] }
      write()
    },
    setMine(seats) {
      mine = new Set(seats)
      if (kept.seats.some((s) => mine.has(s))) { kept = { ...kept, seats: kept.seats.filter((s) => !mine.has(s)) }; write() }
    },
    setSend(next) { send = next },
    onChange(listener) {
      changeListeners.add(listener)
      return () => { changeListeners.delete(listener) }
    },
  }
}
