import { describe, expect, it } from 'vitest'
import { BOARD_PORT, BOARD_WORDS, boardAddress, keepForBoard, lastBoardName, loadBoard, newPlayerId, removeMyScore, sendScore, waitingForBoard, type BoardOptions } from './board'
import { checkWaiting, handleBoard, memoryBoardRows, PLAYER_SHAPE, type BoardGame } from './boardRoutes'
import { DEFAULT_SAVES_CONFIG, type BoardConfig } from './config'
import { addRunMove, dailySeed, recordRun, utcDay, type RunRecord } from './replay'
import { memoryStorage } from './storage'

// A tiny one-player Daily game: start at the day's number (0–9), add 1, 2 or 3 each move; over at 30 or more.
// The score = how close to exactly 30 you land (30 → 10 points, 31 → 9, 32 → 8).
type Count = { total: number; over: boolean }
type Add = { add: number }
const countRules = {
  setup: ({ seed }: { seed: number }): Count => ({ total: seed % 10, over: false }),
  check: (s: Count, seat: number, a: Add) => (s.over ? 'over' : seat !== 0 ? 'one player' : [1, 2, 3].includes(a?.add) ? null : 'add 1, 2 or 3'),
  apply: (s: Count, _seat: number, a: Add) => ({ state: { total: s.total + a.add, over: s.total + a.add >= 30 } }),
}
const countBoard: BoardGame<Count, Add, { seed: number }> = {
  rulesVersion: 1, rules: () => countRules, dailySetup: (day) => ({ seed: dailySeed('count', day) }),
  score: (s) => (s.over ? 40 - s.total : null), maxMoves: 40,
}
const NOW = Date.UTC(2026, 9, 20, 12)
const TODAY = utcDay(NOW)

/** Today's game played with `step` each move (the last one lands on 30 exactly when it can). */
function play(step = 1): RunRecord<{ seed: number }, Add> {
  const setup = countBoard.dailySetup(TODAY)
  let record = recordRun<{ seed: number }, Add>({ rulesVersion: 1, setup })
  let s = countRules.setup(setup)
  while (!s.over) {
    const add = Math.min(step, Math.max(1, 30 - s.total))
    record = addRunMove(record, 0, { add })
    s = countRules.apply(s, 0, { add }).state
  }
  return record
}

/** The game's board worker, in memory: every fetch goes straight to the routes. */
function fakeServer(settings: Partial<BoardConfig> = {}, checkLater = false) {
  const rows = memoryBoardRows()
  const context = { rows, game: countBoard, settings: { ...DEFAULT_SAVES_CONFIG.board, ...settings }, secret: 's', now: NOW, checkLater }
  const fetch = (async (url: string, init: RequestInit) => handleBoard(new Request(url, init), { ...context, address: '203.0.113.7' })) as unknown as typeof globalThis.fetch
  return { rows, context, fetch }
}

const device = (server: ReturnType<typeof fakeServer>, extra: Partial<BoardOptions> = {}): BoardOptions =>
  ({ url: 'https://count-board.example', game: 'count', storage: memoryStorage(), fetch: server.fetch, online: () => true, now: () => NOW, ...extra })

describe('the Daily board (the game side)', () => {
  it('a finished game is kept until sent; the board shows the SERVER\'s score; the name is remembered', async () => {
    const server = fakeServer()
    const me = device(server)
    expect(waitingForBoard(me)).toBeNull()
    expect(await sendScore('ADA', me)).toEqual({ ok: false, message: BOARD_WORDS.nothingToSend })
    keepForBoard(play(), TODAY, me)
    expect(waitingForBoard(me)).toEqual({ day: TODAY })
    const sent = await sendScore('ada', me)
    expect(sent).toEqual({ ok: true, score: 10, best: 10, rank: 1 })
    expect(waitingForBoard(me)).toBeNull() // sent: it never goes twice
    expect(lastBoardName(me)).toBe('ADA')
    const board = await loadBoard(me)
    expect(board).toMatchObject({ ok: true, day: TODAY, top: [{ rank: 1, name: 'ADA', score: 10, you: true }], mine: { rank: 1, score: 10 } })
  })

  it('no signal → a plain sentence, and the game stays waiting to be sent later', async () => {
    const server = fakeServer()
    const me = device(server, { online: () => false })
    keepForBoard(play(), TODAY, me)
    expect(await sendScore('ADA', me)).toEqual({ ok: false, message: BOARD_WORDS.offline })
    expect(waitingForBoard(me)).toEqual({ day: TODAY })
  })

  it('a refusal for good (no tries left) → its sentence, and that game is dropped', async () => {
    const server = fakeServer()
    const me = device(server)
    keepForBoard(play(), TODAY, me)
    await sendScore('ADA', me)
    keepForBoard(play(3), TODAY, me)
    expect(await sendScore('ADA', me)).toEqual({ ok: false, message: BOARD_WORDS.noTriesLeft(1) })
    expect(waitingForBoard(me)).toBeNull()
  })

  it('checking later: "checking" → the alarm replays it → the score appears', async () => {
    const server = fakeServer({}, true)
    const me = device(server)
    keepForBoard(play(), TODAY, me)
    expect(await sendScore('ADA', me)).toEqual({ ok: true, checking: true })
    expect(await loadBoard(me)).toMatchObject({ checking: 1, mine: null })
    checkWaiting(server.context)
    expect(await loadBoard(me)).toMatchObject({ checking: 0, mine: { score: 10 } })
  })

  it('remove my score → gone; another device (another player id) can\'t remove it', async () => {
    const server = fakeServer()
    const me = device(server)
    const stranger = device(server)
    keepForBoard(play(), TODAY, me)
    await sendScore('ADA', me)
    expect(await removeMyScore(stranger)).toEqual({ ok: true, message: BOARD_WORDS.nothingToRemove })
    expect(server.rows.scores).toHaveLength(1)
    expect(await removeMyScore(me)).toEqual({ ok: true, message: BOARD_WORDS.removed })
    expect(server.rows.scores).toHaveLength(0)
    expect((await loadBoard(me)) as { top: unknown[] }).toMatchObject({ top: [], mine: null })
  })

  it('a game kept from before yesterday can\'t be sent any more', () => {
    const server = fakeServer()
    const me = device(server)
    keepForBoard(play(), '2026-10-17', me)
    expect(waitingForBoard(me)).toBeNull()
  })

  it('player ids: 128 random bits, the shape the server takes', () => {
    const a = newPlayerId()
    expect(a).toMatch(PLAYER_SHAPE)
    expect(a).toHaveLength(22)
    expect(newPlayerId()).not.toBe(a)
  })

  it('where the board is: the build\'s setting, else the PC\'s own (port 1996) on this PC / the Wi-Fi, else none', () => {
    expect(boardAddress('glyphtender-board.joebrogno.workers.dev', null)).toBe('https://glyphtender-board.joebrogno.workers.dev')
    expect(boardAddress('', { protocol: 'http:', hostname: '192.168.1.20' })).toBe(`http://192.168.1.20:${BOARD_PORT}`)
    expect(boardAddress(undefined, { protocol: 'https:', hostname: 'thebluemuzzy.github.io' })).toBeNull()
  })
})
