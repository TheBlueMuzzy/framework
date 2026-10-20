// WHERE SAVES ARE KEPT — the browser's localStorage, reached safely. Every read and write can fail
// (a private window that refuses storage, a full disk, Safari blocking a site inside a frame), so nothing
// here ever throws: a refused read is "nothing saved", a refused write is reported back.
// Tests (and later the phone / desktop builds, F98) pass their own storage with the same three methods.

/** What a save needs from a storage. localStorage has it all; so does memoryStorage below. A storage without
 *  removeItem (an older game's test helper) works too: a removed copy is written as "" instead (read as nothing). */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

/** The browser's localStorage, or null where there is none (tests in Node, a browser that blocks it). */
export function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // some browsers throw just for looking at localStorage when storage is blocked
  }
}

/** Read a key; any failure = nothing there. */
export function readKey(storage: StorageLike | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Why a write didn't happen, in one word: the storage is full, or the browser refused it. */
export type WriteProblem = 'full' | 'blocked'

/** Write a key → null when it worked, or what went wrong. */
export function writeKey(storage: StorageLike | null, key: string, value: string): WriteProblem | null {
  if (!storage) return 'blocked'
  try {
    storage.setItem(key, value)
    return null
  } catch (error) {
    return isFullError(error) ? 'full' : 'blocked'
  }
}

export function removeKey(storage: StorageLike | null, key: string): void {
  try {
    if (storage?.removeItem) storage.removeItem(key)
    else if (storage && storage.getItem(key) !== null) storage.setItem(key, '')
  } catch {
    // refused: nothing to do
  }
}

/** Browsers name "storage is full" differently (QuotaExceededError, Firefox's NS_ERROR_DOM_QUOTA_REACHED, code 22 / 1014). */
export function isFullError(error: unknown): boolean {
  const e = error as { name?: string; code?: number } | null
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
}

/** A pretend storage for tests: keeps keys in memory. `full = true` makes every write fail like a full browser storage;
 *  `blocked = true` makes every read and write throw like a browser that refuses storage. */
export interface MemoryStorage extends StorageLike {
  removeItem(key: string): void
  data: Record<string, string>
  full: boolean
  blocked: boolean
}

export function memoryStorage(start: Record<string, string> = {}): MemoryStorage {
  const storage: MemoryStorage = {
    data: { ...start },
    full: false,
    blocked: false,
    getItem(key) {
      if (storage.blocked) throw new Error('storage is blocked')
      return Object.hasOwn(storage.data, key) ? storage.data[key] : null
    },
    setItem(key, value) {
      if (storage.blocked) throw new Error('storage is blocked')
      if (storage.full) throw Object.assign(new Error('storage is full'), { name: 'QuotaExceededError' })
      storage.data[key] = String(value)
    },
    removeItem(key) {
      if (storage.blocked) throw new Error('storage is blocked')
      delete storage.data[key]
    },
  }
  return storage
}
