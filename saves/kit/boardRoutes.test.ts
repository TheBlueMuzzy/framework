import { describe, expect, it } from 'vitest'
import {
  BLOCKED_NAMES, checkWaiting, handleBoard, keyedHash, memoryBoardRows, nextMidnight, readArcadeName, sameSetup, SERVER_SENDS_PER_DAY,
  tidyBoard, WRONG_REMOVES_PER_DAY, type BoardContext, type BoardGame,
} from './boardRoutes'
import { DEFAULT_SAVES_CONFIG, type BoardConfig } from './config'
import { addRunMove, dailySeed, recordRun, utcDay, type RunRecord } from './replay'

// A tiny dice race (the replay tests' game): the seed lives IN the state, so the same setup + moves = the same game.
// The Daily game: 2 players, the day's seed. The score on the board = seat 0's total once the game is over.
type Race = { rng: number; scores: number[]; current: number; over: boolean }
type RaceAction = { type: 'roll' } | { type: 'pass' }
type RaceSetup = { players: number; seed: number }
const GOAL = 20

function nextRandom(rng: number) {
  const next = (rng + 0x6d2b79f5) | 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next }
}

const rules = {
  setup: ({ players, seed }: RaceSetup): Race => ({ rng: seed, scores: Array(players).fill(0), current: 0, over: false }),
  check: (s: Race, seat: number, action: RaceAction) => {
    if (s.over) return 'The game is over.'
    if (seat !== s.current) return 'It\'s not your turn.'
    if (action?.type !== 'roll' && action?.type !== 'pass') return 'That isn\'t a move in this game.'
    return null
  },
  apply(s: Race, seat: number, action: RaceAction) {
    let { rng } = s
    const scores = [...s.scores]
    if (action.type === 'roll') {
      const r = nextRandom(rng)
      rng = r.rng
      scores[seat] += 1 + Math.floor(r.value * 6)
    }
    const over = scores[seat] >= GOAL
    return { state: { rng, scores, current: over ? seat : (seat + 1) % scores.length, over } }
  },
}

const VERSION = 3
const raceBoard: BoardGame<Race, RaceAction, RaceSetup> = {
  rulesVersion: VERSION,
  rules: () => rules,
  dailySetup: (day) => ({ players: 2, seed: dailySeed('race', day) }),
  score: (s) => (s.over ? s.scores[0] : null),
  maxMoves: 200,
}

const NOW = Date.UTC(2026, 9, 20, 12, 0, 0)
const TODAY = utcDay(NOW)
const YESTERDAY = '2026-10-19'
const PLAYER = 'pAbCdEfGhIjKlMnOpQrStU'
const OTHER = 'zYxWvUtSrQpOnMlKjIhGfE'

/** A whole Daily game for `day`, played live: `pick(i)` chooses each move (rolls by default) → its record. */
function playDaily(day = TODAY, pick: (i: number) => RaceAction = () => ({ type: 'roll' })): RunRecord<RaceSetup, RaceAction> {
  const setup = raceBoard.dailySetup(day)
  let state = rules.setup(setup)
  let record = recordRun<RaceSetup, RaceAction>({ rulesVersion: VERSION, setup })
  for (let i = 0; !state.over; i++) {
    const action = pick(i)
    record = addRunMove(record, state.current, action)
    state = rules.apply(state, state.current, action).state
  }
  return record
}
/** What the server should compute for a record: the same game, replayed here. */
function scoreOf(record: RunRecord<RaceSetup, RaceAction>) {
  let state = rules.setup(record.setup)
  for (const m of record.moves) state = rules.apply(state, m.seat, m.action).state
  return state.scores[0]
}
/** A day whose race seat 0 finishes (seat 0 wins, so it has a score of 20+), for score comparisons. */
const finished = playDaily()

function setup(extra: Partial<BoardContext<Race, RaceAction, RaceSetup>> = {}, settings: Partial<BoardConfig> = {}) {
  const rows = memoryBoardRows()
  const context: BoardContext<Race, RaceAction, RaceSetup> = {
    rows, game: raceBoard, settings: { ...DEFAULT_SAVES_CONFIG.board, ...settings }, address: '203.0.113.7', now: NOW, secret: 'test-secret', ...extra,
  }
  const call = async (path: string, body?: unknown, more: Partial<BoardContext<Race, RaceAction, RaceSetup>> = {}) => {
    const request = new Request(`https://race-board.example${path}`, body === undefined ? { method: 'GET' } : { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
    const response = await handleBoard(request, { ...context, ...more })
    return { status: response.status, body: await response.json().catch(() => null), headers: response.headers }
  }
  const send = (record: unknown = finished, more: Record<string, unknown> = {}, ctx: Partial<BoardContext<Race, RaceAction, RaceSetup>> = {}) =>
    call('/board/send', { day: TODAY, name: 'ADA', player: PLAYER, record, ...more }, ctx)
  return { rows, context, call, send }
}

describe('a Daily game on the board: the score is the server\'s own', () => {
  it('a finished game → replayed → the score IT computed, ranked, on the day\'s board under 3 letters', async () => {
    const { call, send } = setup()
    const sent = await send()
    expect(sent.status).toBe(200)
    expect(sent.body).toEqual({ ok: true, score: scoreOf(finished), best: scoreOf(finished), rank: 1 })
    const board = await call('/board/day', { player: PLAYER })
    expect(board.body.top).toEqual([{ rank: 1, name: 'ADA', score: scoreOf(finished), you: true }])
    expect(board.body.mine).toEqual({ rank: 1, name: 'ADA', score: scoreOf(finished) })
    expect(board.body.tries).toEqual({ used: 1, allowed: 1 })
    // someone else sees the same board, without "you"
    expect((await call('/board/day', { player: OTHER })).body.top).toEqual([{ rank: 1, name: 'ADA', score: scoreOf(finished) }])
  })

  it('a changed score is ignored: whatever score the record carries, the board shows the replay\'s', async () => {
    const { call, send } = setup()
    await send({ ...finished, score: 9999 }, { score: 9999 })
    expect((await call('/board/day', {})).body.top[0].score).toBe(scoreOf(finished))
  })

  it('an illegal move (out of turn, a made-up action) → refused, nothing on the board, the try used', async () => {
    const { call, send } = setup()
    const outOfTurn = { ...finished, moves: finished.moves.map((m, i) => (i === 1 ? { ...m, seat: 0 } : m)) }
    expect((await send(outOfTurn)).body).toEqual({ ok: false, code: 'move-refused' })
    const { send: send2 } = setup()
    const madeUp = { ...finished, moves: [...finished.moves.slice(0, 2), { seat: 0, action: { type: 'win' } }] }
    expect((await send2(madeUp)).body).toEqual({ ok: false, code: 'move-refused' })
    const board = (await call('/board/day', { player: PLAYER })).body
    expect(board.top).toEqual([])
    expect(board.refused).toBe(1)
    expect(board.tries.used).toBe(1)
  })

  it('an unfinished game → not-finished (there is no score yet)', async () => {
    const { send } = setup()
    expect((await send({ ...finished, moves: finished.moves.slice(0, 2) })).body).toEqual({ ok: false, code: 'not-finished' })
  })

  it('another rules version → refused before any replay; a game that isn\'t today\'s Daily game (another seed) → refused', async () => {
    const { send } = setup({}, { dailyTries: 0 })
    expect((await send({ ...finished, rulesVersion: VERSION - 1 })).body).toEqual({ ok: false, code: 'other-version' })
    expect((await send({ ...finished, setup: { players: 2, seed: 12345 } })).body).toEqual({ ok: false, code: 'not-todays-game' })
    expect((await send({ ...finished, setup: { players: 1, seed: finished.setup.seed } })).body).toEqual({ ok: false, code: 'not-todays-game' })
    expect((await send(playDaily(YESTERDAY))).body).toEqual({ ok: false, code: 'not-todays-game' }) // yesterday's game sent as today's
  })

  it('days: today\'s or yesterday\'s game only; the board shows kept days only (guessing days learns nothing)', async () => {
    const { call, send } = setup({}, { dailyTries: 0 })
    expect((await send(playDaily(YESTERDAY), { day: YESTERDAY })).status).toBe(200) // finished just after midnight
    for (const day of ['2026-10-18', '2026-10-21', '2026-02-31', 'today', 20261020, null]) {
      expect((await send(finished, { day })).body.code).toBe('not-a-day')
    }
    expect((await call('/board/day', { day: YESTERDAY })).body.top).toHaveLength(1)
    expect((await call('/board/day', { day: '2026-10-13' })).body.code).toBe('not-a-day') // past keepDays (7)
    expect((await call('/board/day', { day: '2026-10-21' })).body.code).toBe('not-a-day') // tomorrow
    expect((await call('/board/day', { day: '../etc' })).body.code).toBe('not-a-day')
  })

  it('a record too big, too many moves, or not a record at all → refused unread', async () => {
    const { send } = setup({}, { dailyTries: 0 })
    expect((await send({ ...finished, moves: Array(201).fill({ seat: 0, action: { type: 'pass' } }) })).body.code).toBe('too-big')
    expect((await send({ ...finished, padding: 'x'.repeat(100_001) })).body.code).toBe('too-big')
    expect((await send('just text')).body.code).toBe('damaged')
    expect((await send({ rulesVersion: VERSION, setup: finished.setup, moves: 'all of them' })).body.code).toBe('damaged')
  })
})

describe('names: exactly 3 letters, A to Z', () => {
  it('typed loosely, kept in capitals; anything else refused', async () => {
    expect(readArcadeName(' ada ')).toBe('ADA')
    for (const typed of ['AB', 'ABCD', 'A1C', 'A C', 'ÄBC', '<b>', '', 7, null]) expect(readArcadeName(typed)).toBeNull()
    for (const blocked of BLOCKED_NAMES) expect(readArcadeName(blocked.toLowerCase())).toBeNull()
    const { send } = setup()
    expect((await send(finished, { name: 'Ada Lovelace' })).body.code).toBe('not-a-name')
    expect((await send(finished, { name: 'kkk' })).body.code).toBe('not-a-name')
  })
})

describe('dailyTries: how many finished games count per player per day', () => {
  it('1 → a second game the same day doesn\'t change the board', async () => {
    const { call, send } = setup()
    await send()
    const better = playDaily(TODAY, (i) => ({ type: i % 2 ? 'pass' : 'roll' })) // seat 0 rolls, seat 1 passes: a higher score
    expect(scoreOf(better)).not.toBe(scoreOf(finished))
    expect((await send(better)).body).toEqual({ ok: false, code: 'no-tries-left' })
    expect((await call('/board/day', {})).body.top).toEqual([{ rank: 1, name: 'ADA', score: scoreOf(finished) }])
  })

  it('N → the best of the first N; 0 → unlimited, the best counts; one line per player', async () => {
    const better = playDaily(TODAY, (i) => ({ type: i % 2 ? 'pass' : 'roll' }))
    const { call, send } = setup({}, { dailyTries: 2 })
    await send()
    await send(better, { name: 'BOB' })
    expect((await send()).body.code).toBe('no-tries-left')
    const top = (await call('/board/day', {})).body.top
    expect(top).toEqual([{ rank: 1, name: 'BOB', score: Math.max(scoreOf(better), scoreOf(finished)) }])
    const { send: sendMany } = setup({}, { dailyTries: 0 })
    for (let i = 0; i < 5; i++) expect((await sendMany()).status).toBe(200)
  })

  it('removing a score doesn\'t give a try back', async () => {
    const { call, send } = setup()
    await send()
    expect((await call('/board/remove', { day: TODAY, player: PLAYER })).body).toEqual({ ok: true })
    expect((await send()).body.code).toBe('no-tries-left')
  })
})

describe('under pressure (security review from the first brief)', () => {
  it('30 games sent at once by one player with dailyTries 1 → exactly one counts', async () => {
    const { rows, send } = setup()
    const answers = await Promise.all(Array.from({ length: 30 }, () => send()))
    expect(answers.filter((a) => a.status === 200)).toHaveLength(1)
    expect(rows.scores).toHaveLength(1)
  })

  it('30 games sent at once from one address (30 different players) → no more than sendsPerDay get in', async () => {
    const { rows, call } = setup({}, { sendsPerDay: 5 })
    const answers = await Promise.all(Array.from({ length: 30 }, (_, i) =>
      call('/board/send', { day: TODAY, name: 'ADA', player: `player-number-${String(i).padStart(4, '0')}`, record: finished })))
    expect(answers.filter((a) => a.status === 200)).toHaveLength(5)
    expect(answers.filter((a) => a.body.code === 'too-many')).toHaveLength(25)
    expect(rows.scores).toHaveLength(5)
  })

  it('forged games count against the address limit too (a flood of junk stops at the limit)', async () => {
    const { send } = setup({}, { sendsPerDay: 3 })
    for (let i = 0; i < 3; i++) await send({ ...finished, rulesVersion: 0 })
    expect((await send()).body.code).toBe('too-many')
  })

  it('a fresh IPv6 address per send from one home (/64) still hits the limit', async () => {
    const { call } = setup({}, { sendsPerDay: 3, dailyTries: 0 })
    const codes: number[] = []
    for (let i = 0; i < 6; i++) codes.push((await call('/board/send', { day: TODAY, name: 'ADA', player: PLAYER, record: finished }, { address: `2001:db8:aa:bb::${i + 1}` })).status)
    expect(codes.filter((s) => s === 429)).toHaveLength(3)
  })

  it('the whole server stops taking games past SERVER_SENDS_PER_DAY', async () => {
    const { rows, send } = setup()
    for (let i = 0; i < SERVER_SENDS_PER_DAY; i++) rows.bump('*', 'send', TODAY)
    expect((await send()).body.code).toBe('server-busy')
  })

  it('a fake removal (someone else\'s day, a guessed player id) → not-found, counted; past the limit refused', async () => {
    const { call, send, rows } = setup()
    await send()
    expect((await call('/board/remove', { day: TODAY, player: OTHER })).body.code).toBe('not-found')
    expect(rows.scores).toHaveLength(1) // still there
    for (let i = 1; i < WRONG_REMOVES_PER_DAY; i++) await call('/board/remove', { day: TODAY, player: `guess-number-${String(i).padStart(6, '0')}` })
    expect((await call('/board/remove', { day: TODAY, player: PLAYER })).body.code).toBe('too-many') // even the right one, today
    expect(rows.scores).toHaveLength(1)
  })

  it('addresses and player ids are only kept as keyed hashes; nothing sent back names another player', async () => {
    const { rows, call, send } = setup()
    await send()
    const stored = JSON.stringify([...rows.counts.keys(), rows.scores])
    expect(stored).not.toContain('203.0.113.7')
    expect(stored).not.toContain(PLAYER)
    expect(JSON.stringify((await call('/board/day', { player: OTHER })).body)).not.toContain(await keyedHash('player', PLAYER, 'test-secret'))
    expect(await keyedHash('player', PLAYER, 'a')).not.toBe(await keyedHash('player', PLAYER, 'b'))
  })

  it('wrong ways in: GET a route, an unknown path, a bad player id → refused; OPTIONS → CORS open', async () => {
    const { call } = setup()
    expect((await call('/board/send')).status).toBe(404)
    expect((await call('/board/everything', {})).status).toBe(404)
    expect((await call('/board/send', { day: TODAY, name: 'ADA', player: 'short', record: finished })).body.code).toBe('bad-request')
    const pre = await handleBoard(new Request('https://x/board/send', { method: 'OPTIONS' }), { rows: memoryBoardRows(), game: raceBoard, settings: DEFAULT_SAVES_CONFIG.board, address: 'a' })
    expect(pre.status).toBe(204)
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

describe('checking later (a replay too slow for one request)', () => {
  it('sent → "checking…" → the alarm replays it → the server\'s score; a forged one is refused by the alarm', async () => {
    const { rows, context, call, send } = setup({ checkLater: true }, { dailyTries: 0 })
    expect((await send()).body).toEqual({ ok: true, checking: true })
    await send({ ...finished, score: 9999, moves: finished.moves.map((m, i) => (i === 1 ? { ...m, seat: 0 } : m)) })
    let board = (await call('/board/day', { player: PLAYER })).body
    expect(board.checking).toBe(2)
    expect(board.top).toEqual([])
    const timed: number[] = []
    expect(checkWaiting({ ...context, timed: (ms) => timed.push(ms) })).toBe(1) // one per alarm: one still waiting
    expect(checkWaiting(context)).toBe(0)
    expect(timed).toHaveLength(1)
    board = (await call('/board/day', { player: PLAYER })).body
    expect(board).toMatchObject({ checking: 0, refused: 1, mine: { rank: 1, name: 'ADA', score: scoreOf(finished) } })
    expect(rows.queue).toHaveLength(0)
  })
})

describe('kept for keepDays, then deleted', () => {
  it('the tidy deletes days past keepDays and counts older than yesterday; the next one is at midnight UTC', async () => {
    const { rows, send } = setup({}, { dailyTries: 0 })
    await send()
    rows.putScore({ day: '2026-10-13', player: 'x', name: 'OLD', score: 1, at: 0 })
    rows.bump('y', 'send', '2026-10-18')
    tidyBoard(rows, { ...DEFAULT_SAVES_CONFIG.board, keepDays: 7 }, NOW)
    expect(rows.scores.map((s) => s.name)).toEqual(['ADA'])
    expect([...rows.counts.keys()].some((k) => k.endsWith('2026-10-18'))).toBe(false)
    expect(nextMidnight(NOW)).toBe(Date.UTC(2026, 9, 21))
  })

  it('setups compare by content, whatever order their fields were written in', () => {
    expect(sameSetup({ a: 1, b: { c: 2, d: [1, 2] } }, { b: { d: [1, 2], c: 2 }, a: 1 })).toBe(true)
    expect(sameSetup({ a: 1, gone: undefined }, { a: 1 })).toBe(true)
    expect(sameSetup({ a: 1 }, { a: 2 })).toBe(false)
  })
})
