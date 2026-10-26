// THE AI PLUG — teaches the framework's AI brain (src/ai/kit) what to care about in tic-tac-toe.
// Three goals, each tied to a trait in content/ai/personalities.json:
//   WIN   (aggression) — finish three in a row
//   BLOCK (caution)    — stop the other player's three in a row
//   BUILD (planning)   — take a good square: the centre, then corners, and squares that make two in a row
// Nothing is hidden in tic-tac-toe, so the bot "imagines" the board exactly as it is.
// A new game writes its own goals here; the brain, the personalities and the Dev Kit's AI tab stay the same.
import type { GamePlug, Goal } from './kit/types'
import type { MomentMap } from './kit/banter'
import { emptyCells, LINES, otherSeat, winningCells, type Action, type Event, type View } from '../game/rules'

// How good a square is on an empty board: centre 3, corners 2, edges 1.
const SQUARE_VALUE = [2, 1, 2, 1, 3, 1, 2, 1, 2]

const win: Goal<View, Action, View> = {
  id: 'WIN',
  trait: 'aggression',
  bigAt: 1, // a winning move is always a big moment (with focus 1 the careful bot never misses one)
  score: ({ cell }, ctx) => (winningCells(ctx.world.board, ctx.seat).includes(cell) ? { value: 1, why: 'three in a row' } : { value: 0 }),
}

const block: Goal<View, Action, View> = {
  id: 'BLOCK',
  trait: 'caution',
  score: ({ cell }, ctx) => (winningCells(ctx.world.board, otherSeat(ctx.seat)).includes(cell) ? { value: 1, why: 'blocks your row' } : { value: 0 }),
}

const build: Goal<View, Action, View> = {
  id: 'BUILD',
  trait: 'planning',
  score: ({ cell }, ctx) => {
    const board = [...ctx.world.board]
    board[cell] = ctx.seat
    // lines this square opens up: mine, with nobody else's mark in them
    const openLines = LINES.filter((line) => line.includes(cell) && line.every((c) => board[c] !== otherSeat(ctx.seat))).length
    return { value: SQUARE_VALUE[cell] + openLines, why: `a good square (${openLines} open lines)` }
  },
}

export const plug: GamePlug<View, Action, View, Event> = {
  goals: [win, block, build],
  readings: (view, seat) => ({
    myDanger: winningCells(view.board, otherSeat(seat)).length > 0 ? 10 : 0,
    myChance: winningCells(view.board, seat).length > 0 ? 10 : 0,
  }),
  imagine: (view, _seat, rng) => ({ world: view, rng }),
  candidates: (world, _seat, limit, rng) => ({ actions: emptyCells(world.board).slice(0, limit).map((cell) => ({ cell })), rng }),
  key: ({ cell }) => String(cell),
  describe: ({ cell }) => `square ${cell + 1}`,
}

// Banter: what each event means to this seat (the keys of content/ai/banter.json "chance"). Its own export, not
// plug.moments: GamePlug's moments type has no room for { moment, by } (who caused it), which botBanter's MomentMap takes.
export const moments: MomentMap<Event> = (event, seat) => {
  if (event.type === 'won') return event.seat === seat ? 'won' : 'lost'
  if (event.type === 'draw') return 'closeCall'
  if (event.type === 'placed') {
    const mine = event.seat === seat
    if (event.blocked) return mine ? 'hitRival' : 'gotHit'
    if (event.threat) return mine ? 'bigMove' : { moment: 'rivalBigMove', by: event.seat }
  }
  return null
}
