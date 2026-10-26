// THE LOCAL MATCH — you (seat 0, X) against a computer opponent (seat 1, O) on this device.
// Every move goes through the rules' one door (ticTacToe.apply) and into the move record, so a match can be saved
// (Continue), snapshotted by the Dev Kit and replayed exactly. Timing lives on the RULES clock (src/devkit/gameClock):
// the bot's think time and the wait before the results — so the game's own pause and both Dev Kit pauses hold them.
import { useSyncExternalStore } from 'react'
import boardTuning from '../../content/tuning/board.json'
import paceFile from '../../content/ai/pace.json'
import { rulesClock } from '../devkit/gameClock'
import { botWait, paceNow, thinkDelay, waitLeft } from '../ai/kit/pace'
import { addMove, replay, type MoveRecord, type Seat } from '../table/core'
import { botMove, personalityOf, type Opponent } from '../ai/bots'
import { playSound } from '../audio'
import { moment } from '../crashes'
import { ticTacToe, type Action, type Event, type Setup, type State } from './rules'
import { banter, emotes, setBanterBots } from './table'
import { matchRun, progressSave } from './saves'
import { botSpeed } from './settings'

export const YOU: Seat = 0
export const BOT: Seat = 1

export interface Match {
  opponent: Opponent
  record: MoveRecord<Setup, Action>
  state: State
  /** The bot's random position (seeded: the same seed + the same moves = the same game). */
  rng: number
  /** Wins this sitting against this opponent (Play again keeps them). */
  series: { you: number; them: number }
  /** The results show a moment after the last move (content/tuning/board.json resultsDelayMs). */
  resultsOpen: boolean
}

let match: Match | null = null
let cancelWait: (() => void) | null = null
const listeners = new Set<() => void>()
const logListeners = new Set<(line: string) => void>()

function set(next: Match | null) {
  match = next
  for (const listener of listeners) listener()
}
const log = (line: string) => { for (const listener of logListeners) listener(line) }
const stopWaiting = () => { cancelWait?.(); cancelWait = null }

export const getMatch = () => match
export const subscribeMatch = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const useMatch = () => useSyncExternalStore(subscribeMatch, getMatch)
/** Short lines as things happen (the Dev Kit's bug capture). Returns "stop listening". */
export const onMatchLog = (listener: (line: string) => void) => { logListeners.add(listener); return () => { logListeners.delete(listener) } }

/** Scripted checks get a fixed game: in a dev build driven by Playwright, you always go first. */
const fixedMode = () => import.meta.env.DEV && typeof navigator !== 'undefined' && navigator.webdriver
/** ?seed=7 in the address = a fixed, replayable game (the Dev Kit's snapshots and the checks use it). */
const seedFromAddress = () => Number(new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get('seed')) || 0

/** Who goes first: random, except in the fixed mode above (or when the caller says — tests). */
export function pickFirstSeat(): Seat {
  if (fixedMode()) return YOU
  return Math.random() < 0.5 ? YOU : BOT
}

export function startMatch(opponent: Opponent, options: { firstSeat?: Seat; seed?: number } = {}) {
  stopWaiting()
  const setup: Setup = { firstSeat: options.firstSeat ?? pickFirstSeat() }
  const sameOpponent = match && match.opponent.personality === opponent.personality
  const rng = options.seed ?? (seedFromAddress() || Math.floor(Math.random() * 2 ** 31))
  begin({ opponent, record: { setup, moves: [] }, state: ticTacToe.setup(setup), rng, series: sameOpponent ? match!.series : { you: 0, them: 0 }, resultsOpen: false })
  moment('matchStart', setup.firstSeat)
  log(`New game vs ${opponent.personality} — ${setup.firstSeat === YOU ? 'you go' : 'the bot goes'} first`)
}

/** Continue (main menu): the saved record is played again through the rules, so the board is exactly as it was. */
export function continueMatch(saved: { opponent: Opponent; record: MoveRecord<Setup, Action> }) {
  stopWaiting()
  const { state } = replay(ticTacToe, saved.record)
  begin({ opponent: saved.opponent, record: saved.record, state, rng: seedFromAddress() || Math.floor(Math.random() * 2 ** 31), series: { you: 0, them: 0 }, resultsOpen: false })
  log(`Continued a game vs ${saved.opponent.personality} at move ${saved.record.moves.length + 1}`)
}

function begin(next: Match) {
  set(next)
  setBanterBots(() => (match ? [{ seat: BOT, personality: personalityOf(match.opponent.personality) }] : []))
  emotes.setMatch('') // a local game: mutes start clean
  matchRun.autosave({ opponent: next.opponent, record: next.record })
  nextTurn()
}

/** You tap a square. Anything that isn't allowed right now is simply ignored (the board only offers free squares). */
export function playCell(cell: number) {
  if (!match || match.state.turn !== YOU || ticTacToe.check(match.state, YOU, { cell })) return
  move(YOU, { cell })
}

function move(seat: Seat, action: Action) {
  if (!match) return
  const applied = ticTacToe.apply(match.state, seat, action)
  const record = addMove(match.record, seat, action, seat === BOT ? 'bot' : 'seat')
  set({ ...match, state: applied.state, record })
  hear(applied.events)
  if (applied.state.over) finish(applied.state)
  else {
    matchRun.autosave({ opponent: match.opponent, record })
    nextTurn()
  }
}

function hear(events: Event[]) {
  for (const event of events) {
    if (event.type === 'placed') {
      playSound(event.seat === YOU ? 'mark.x' : 'mark.o')
      log(`${event.seat === YOU ? 'You' : 'Bot'} took square ${event.cell + 1}${event.blocked ? ' (a block)' : ''}`)
    }
    if (event.type === 'won') {
      playSound(event.seat === YOU ? 'game.win' : 'game.lose')
      log(`${event.seat === YOU ? 'You' : 'The bot'} won`)
    }
    if (event.type === 'draw') {
      playSound('game.draw')
      log('A draw')
    }
  }
  banter.hear(events)
}

function finish(state: State) {
  if (!match) return
  matchRun.end() // a finished game never comes back as Continue
  const progress = progressSave.load()
  progressSave.save({
    wins: progress.wins + (state.winner === YOU ? 1 : 0),
    losses: progress.losses + (state.winner === BOT ? 1 : 0),
    draws: progress.draws + (state.winner === null ? 1 : 0),
  })
  const series = { you: match.series.you + (state.winner === YOU ? 1 : 0), them: match.series.them + (state.winner === BOT ? 1 : 0) }
  set({ ...match, series })
  moment('matchEnd', state.winner === null ? 2 : state.winner)
  scheduleResults()
}

/** The finished board stays in view a moment, then the results open (rules clock: a pause holds it). */
function scheduleResults() {
  cancelWait = rulesClock.after(boardTuning.resultsDelayMs, () => {
    cancelWait = null
    if (match) set({ ...match, resultsOpen: true })
  })
}

/** The bot's turn: it decides now, then "thinks" for a person-like moment on the rules clock before it moves. */
function nextTurn() {
  if (!match || match.state.over || match.state.turn !== BOT) return
  const started = paceNow()
  const thought = botMove(match.opponent, ticTacToe.viewFor(match.state, BOT), BOT, match.rng)
  const delay = thinkDelay(paceFile, 'move', botSpeed(), thought.rng)
  log(`Bot: ${thought.note}`)
  // (the random position moves on only when the move is made — a snapshot taken mid-think restores the same think)
  cancelWait = botWait(waitLeft(delay.ms, paceNow() - started), () => {
    cancelWait = null
    if (match) set({ ...match, rng: delay.rng })
    move(BOT, thought.action)
  })
}

/** Back to the main menu. An unfinished game is ended (left from the menu = abandoned, no Continue). */
export function leaveMatch() {
  stopWaiting()
  banter.stop()
  if (match && !match.state.over) matchRun.end()
  setBanterBots(() => [])
  set(null)
}

/** The Dev Kit's snapshots: the match as plain JSON, and back. The board is rebuilt from the record, so junk is refused. */
export function matchSnapshot(): Match | null {
  return match && JSON.parse(JSON.stringify(match))
}

export function restoreMatch(snapshot: unknown) {
  if (snapshot === null) return leaveMatch()
  const s = snapshot as Partial<Match>
  if (!s || typeof s !== 'object' || !s.record || !s.opponent || typeof s.rng !== 'number') throw new Error('That is not a tic-tac-toe moment (no record, opponent or rng).')
  const { state } = replay(ticTacToe, s.record) // throws in plain words if a move isn't allowed
  stopWaiting()
  set({ opponent: s.opponent, record: s.record, state, rng: s.rng, series: s.series ?? { you: 0, them: 0 }, resultsOpen: s.resultsOpen === true })
  setBanterBots(() => (match ? [{ seat: BOT, personality: personalityOf(match.opponent.personality) }] : []))
  if (state.over && !s.resultsOpen) scheduleResults()
  else nextTurn()
}
