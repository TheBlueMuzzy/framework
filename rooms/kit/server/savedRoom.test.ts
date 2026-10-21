import { describe, expect, it } from 'vitest'
import { jsonProblem, readSavedRoom, SAVED_ROOM_VERSION, wakeUpAt } from './savedRoom'
import type { SavedRoom } from './savedRoom'

const saved = (): SavedRoom => ({
  version: SAVED_ROOM_VERSION,
  data: { code: 'BAKU', phase: 'playing', seats: [], kicked: [], seatsMade: 2 },
  game: { total: 3 },
  botTurns: { 'seat-2': 1 },
  onClock: ['seat-1'],
  timersEndAt: { turn: 5000, 'room:match-expires': 9000 },
})

describe('jsonProblem: can the game state be saved as JSON?', () => {
  it('plain JSON is fine (missing optional fields too)', () => {
    expect(jsonProblem({ a: 1, b: 'x', c: [true, null, { d: 2.5 }], e: undefined })).toBeNull()
  })

  it('says where the problem is, in plain words', () => {
    expect(jsonProblem({ bag: new Map() })).toBe('state.bag is a Map (only plain objects can be saved)')
    expect(jsonProblem({ seen: new Set() })).toBe('state.seen is a Set (only plain objects can be saved)')
    expect(jsonProblem({ when: new Date() })).toBe('state.when is a Date (only plain objects can be saved)')
    expect(jsonProblem({ score: NaN })).toBe("state.score is NaN (JSON can't hold it)")
    expect(jsonProblem({ list: [1, undefined] })).toBe('state.list[1] is undefined (it would come back as null)')
    expect(jsonProblem({ go: () => 1 })).toBe('state.go is a function')
  })
})

describe('readSavedRoom', () => {
  it('reads back what was saved (pack → JSON text → unpack is the same)', () => {
    expect(readSavedRoom(JSON.stringify(saved()))).toEqual(saved())
  })

  it('missing, broken or an older shape → null (the room starts empty)', () => {
    expect(readSavedRoom(undefined)).toBeNull()
    expect(readSavedRoom('{{{')).toBeNull()
    expect(readSavedRoom(JSON.stringify({ ...saved(), version: 0 }))).toBeNull()
    expect(readSavedRoom(JSON.stringify({ ...saved(), data: { ...saved().data, phase: 'lobby' } }))).toBeNull()
    expect(readSavedRoom(JSON.stringify({ ...saved(), timersEndAt: { turn: 'soon' } }))).toBeNull()
  })
})

describe('wakeUpAt', () => {
  it('the earliest timer end — when the storage alarm must wake the room', () => {
    expect(wakeUpAt(saved())).toBe(5000)
    expect(wakeUpAt({ ...saved(), timersEndAt: {} })).toBeNull()
    expect(wakeUpAt(null)).toBeNull()
  })
})
