// SAVES ON ANY PLATFORM — the kit reads and writes its storage instantly (getItem / setItem), but a phone app's
// storage (Capacitor Preferences) and a desktop app's files (Electron, through its main process) answer later. So a
// build opens its saves ONCE at start-up: openSaves loads every key into memory, then the kit reads from memory and
// each change goes out to the real storage a moment later (a few changes at once), and right away when the page is
// hidden or closed. Game code stays the same: it only waits for openSaves before its first save is read.
//
//   const saves = await openSaves(myBackend, { game: 'glyphtender' })   // in main.tsx, before rendering
//
// What can't be lost: a failed load never lets the kit write (an empty memory would overwrite the real saves);
// a failed write stays queued and goes out with the next one; the kit is told (its writes report "full" /
// "blocked", like a full browser storage) until a write gets through. Research: .planning/research/saves.md
// "Layers 6 + 8". The phone / desktop backends themselves come with the store run-through (ROADMAP F97).

import { browserStorage, setSavesStorage, type StorageLike, type WriteProblem } from './storage'

/** A platform's storage, the slow way round: everything at start-up, then a batch of changes at a time. */
export interface SavesBackend {
  /** Shown in problems ("phone storage", "desktop files"). */
  name: string
  /** true = the platform's own storage (not the browser's): the health check drops the browser-only warnings. */
  native: boolean
  /** Every key this game has, as text. Throwing = can't read (the saves are then NOT written — see above). */
  loadAll(): Promise<Record<string, string>>
  /** Write these keys (null = remove). Throwing = not written; an error named QuotaExceededError = "full". */
  write(changes: Record<string, string | null>): Promise<void>
}

export interface OpenedSaves extends StorageLike {
  removeItem(key: string): void
  /** Send every waiting change now (also done on its own a moment after each change, and when the page hides).
   *  null = all written; else why not. */
  flush(): Promise<WriteProblem | null>
  /** How many keys are waiting to be written. */
  waiting(): number
  /** What went wrong last (null = fine): 'load' = the saves couldn't be read, so nothing will be written. */
  problem(): WriteProblem | 'load' | null
  /** How long loading every key took (ms), for the start-up budget. */
  loadMs: number
  /** Stop: no more timers or page listeners (tests, or a game switching storage again). */
  close(): void
}

export interface OpenSavesOptions {
  /** The game's name, as its save keys start ("glyphtender" for "glyphtender:run"): on the first launch of the app
   *  the browser saves under this name are copied over once. */
  game: string
  /** Where the old browser saves are (default: localStorage); null = copy nothing. */
  copyFrom?: (StorageLike & { length: number; key(index: number): string | null }) | null
  /** Wait this long after a change before writing, so a few changes go out together (ms, default 250). */
  delayMs?: number
  /** Where to listen for "the page is hidden / closing" (default: the real document and window; null = don't). */
  page?: { document?: EventTarget & { visibilityState?: string }; window?: EventTarget } | null
  /** Told each time a write or the load fails (default: console.warn). */
  onProblem?: (message: string) => void
  /** false = don't switch the whole kit to these saves (default true: setSavesStorage). */
  useForKit?: boolean
  now?: () => number
}

/** Written once the browser saves were copied over, so a later launch never copies older ones on top. */
export const COPIED_MARKER = '__saves-copied__'

const isFull = (error: unknown) => (error as { name?: string } | null)?.name === 'QuotaExceededError'

export async function openSaves(backend: SavesBackend, options: OpenSavesOptions): Promise<OpenedSaves> {
  const { game, delayMs = 250, useForKit = true, now = () => performance.now() } = options
  const onProblem = options.onProblem ?? ((m: string) => console.warn(`[saves] ${m}`))
  const memory = new Map<string, string>()
  const changes = new Map<string, string | null>()
  let problem: WriteProblem | 'load' | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let writing: Promise<WriteProblem | null> | null = null

  const started = now()
  try {
    const all = await backend.loadAll()
    for (const [key, value] of Object.entries(all)) if (typeof value === 'string') memory.set(key, value)
  } catch (error) {
    problem = 'load'
    onProblem(`couldn't read the ${backend.name} (${(error as Error)?.message ?? error}) — nothing will be saved this time, so the saves there stay as they are`)
  }
  const loadMs = now() - started

  // First launch as an app: the game's browser saves come along once (kept in the browser too, just in case).
  const copyFrom = options.copyFrom === undefined ? browserList() : options.copyFrom
  if (problem === null && copyFrom && !memory.has(COPIED_MARKER)) {
    const prefix = game.toLowerCase()
    try {
      for (let i = 0; i < copyFrom.length; i++) {
        const key = copyFrom.key(i)
        if (key === null || !key.toLowerCase().startsWith(prefix) || memory.has(key)) continue // what the app has wins
        const value = copyFrom.getItem(key)
        if (value !== null) { memory.set(key, value); changes.set(key, value) }
      }
    } catch { /* the browser refused: nothing to copy */ }
    memory.set(COPIED_MARKER, '1')
    changes.set(COPIED_MARKER, '1')
  }

  function schedule() {
    if (timer !== null || problem === 'load') return
    timer = setTimeout(() => { timer = null; void flush() }, delayMs)
  }

  async function writeBatch(): Promise<WriteProblem | null> {
    const batch = Object.fromEntries(changes)
    changes.clear()
    try {
      await backend.write(batch)
      problem = null
      return null
    } catch (error) {
      // Put the batch back under anything changed since (newer values win), so it goes out with the next write.
      for (const [key, value] of Object.entries(batch)) if (!changes.has(key)) changes.set(key, value)
      problem = isFull(error) ? 'full' : 'blocked'
      onProblem(`couldn't write to the ${backend.name} (${(error as Error)?.message ?? error}) — kept, will try again with the next save`)
      return problem
    }
  }

  async function flush(): Promise<WriteProblem | null> {
    if (problem === 'load') return 'blocked'
    if (timer !== null) { clearTimeout(timer); timer = null }
    while (writing) await writing // one write at a time, in order
    if (!changes.size) return problem === 'full' || problem === 'blocked' ? problem : null
    writing = writeBatch()
    try { return await writing } finally { writing = null }
  }

  function change(key: string, value: string | null) {
    if (problem === 'load') throw new Error('storage is blocked') // never write over saves we couldn't read
    if (value === null) memory.delete(key)
    else memory.set(key, value)
    changes.set(key, value)
    schedule()
    // Kept in memory and queued either way; the kit is told a write isn't reaching the storage yet.
    if (problem === 'full') throw Object.assign(new Error(`the ${backend.name} is full`), { name: 'QuotaExceededError' })
    if (problem === 'blocked') throw new Error(`the ${backend.name} refused the last write`)
  }

  const page = options.page === undefined
    ? { document: typeof document === 'undefined' ? undefined : document, window: typeof window === 'undefined' ? undefined : window }
    : options.page
  const onHide = () => { if (!page?.document || page.document.visibilityState === 'hidden') void flush() }
  const onLeave = () => { void flush() }
  page?.document?.addEventListener('visibilitychange', onHide)
  page?.window?.addEventListener('pagehide', onLeave)

  const opened: OpenedSaves = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => change(key, String(value)),
    removeItem: (key) => { if (memory.has(key)) change(key, null) },
    flush,
    waiting: () => changes.size,
    problem: () => problem,
    loadMs,
    close() {
      if (timer !== null) { clearTimeout(timer); timer = null }
      page?.document?.removeEventListener('visibilitychange', onHide)
      page?.window?.removeEventListener('pagehide', onLeave)
    },
  }
  if (useForKit) setSavesStorage(opened, { native: backend.native })
  if (changes.size) schedule() // the copied browser saves
  return opened
}

function browserList() {
  const storage = browserStorage()
  return storage && 'length' in storage && 'key' in storage ? (storage as Storage) : null
}

// --- backends for the web and for tests ----------------------------------------------------------------------------

/** The browser's localStorage as a backend, for one game's keys — a web build that wants the same start-up path as
 *  its app build, and the stand-in for proofs. Not native (the browser's risks still apply). */
export function browserBackend(game: string, storage: Storage | null = browserList()): SavesBackend {
  const prefix = game.toLowerCase()
  return {
    name: 'browser storage',
    native: false,
    async loadAll() {
      if (!storage) throw new Error('storage is blocked')
      const all: Record<string, string> = {}
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key === null || !(key.toLowerCase().startsWith(prefix) || key === COPIED_MARKER)) continue
        const value = storage.getItem(key)
        if (value !== null) all[key] = value
      }
      return all
    },
    async write(changes) {
      if (!storage) throw new Error('storage is blocked')
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, value)
      }
    },
  }
}

/** A pretend slow backend for tests and proofs: answers after `waitMs`, counts its calls; `failLoad` / `failWrites`
 *  ('full' | 'blocked') make it fail like a real one. `data` is what's "on disk". */
export interface SlowBackend extends SavesBackend {
  data: Record<string, string>
  calls: { loadAll: number; write: number; keysWritten: number }
  waitMs: number
  failLoad: boolean
  failWrites: WriteProblem | null
}

export function slowBackend(start: Record<string, string> = {}, { waitMs = 5, native = true } = {}): SlowBackend {
  const wait = () => new Promise((resolve) => setTimeout(resolve, backend.waitMs))
  const backend: SlowBackend = {
    name: 'test storage',
    native,
    data: { ...start },
    calls: { loadAll: 0, write: 0, keysWritten: 0 },
    waitMs,
    failLoad: false,
    failWrites: null,
    async loadAll() {
      backend.calls.loadAll++
      await wait()
      if (backend.failLoad) throw new Error('could not read')
      return { ...backend.data }
    },
    async write(changes) {
      backend.calls.write++
      await wait()
      if (backend.failWrites === 'full') throw Object.assign(new Error('disk is full'), { name: 'QuotaExceededError' })
      if (backend.failWrites === 'blocked') throw new Error('write refused')
      for (const [key, value] of Object.entries(changes)) {
        backend.calls.keysWritten++
        if (value === null) delete backend.data[key]
        else backend.data[key] = value
      }
    },
  }
  return backend
}
