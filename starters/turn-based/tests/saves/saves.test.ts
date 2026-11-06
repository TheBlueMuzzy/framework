// THE GAME'S SAVE TESTS — from the saves module (framework/saves). Copied once by the installer; yours from now on.
// List every save the game makes (each createSave) in SAVES below, with a sample of real-looking data.
// For every save this proves:
//   - every golden save in this folder (a real save from each version: <key>-v<N>.json) loads with today's code
//     — and a save that keeps moves (a move record) replays them through today's rules: hand its `replay` in below
//   - a save → load round trip gives back the same data
//   - damaged saves (cut off, the wrong type, empty) fall back to the backup and never crash
//   - full or blocked storage never stops the game
// A game in progress (each createRun) goes in RUNS instead: the same checks on its save, and on top, a run ended with
// end() never comes back (not as Continue, not from a backup).
// Golden saves: see the top of src/saves/oldSaves.ts. check:framework also fails a save with no golden copy for a version.
import { describe, expect, it } from 'vitest'
import {
  checkDamagedSaves, checkFullStorage, checkGoldenSave, checkRoundTrip, checkRunEnds, goldenSavesFor, missingGoldenVersions,
  type RunUnderTest, type SaveUnderTest,
} from '../../src/saves/oldSaves'
import { matchRun, progressSave, settingsSave, type MatchRun } from '../../src/game/saves'
import { replay } from '../../src/table/core'
import { ticTacToe } from '../../src/game/rules'

// the match's moves, played again through today's rules — the same call Continue makes (src/game/match.ts)
const replayMatch = (run: MatchRun) => replay(ticTacToe, run.record)

const SAVES: SaveUnderTest[] = [
  { save: settingsSave, sample: { textSize: '150%', botSpeed: 'Slow', sound: false } },
  { save: progressSave, sample: { wins: 5, losses: 1, draws: 2 } },
]

const RUNS: RunUnderTest[] = [
  { run: matchRun, sample: { opponent: { personality: 'careful', skill: 'sharp' }, record: { setup: { firstSeat: 1 }, moves: [{ seat: 1, action: { cell: 4 }, by: 'bot' }] } }, replay: replayMatch },
]

const golden = import.meta.glob('./*.json', { eager: true, import: 'default' })

it('every save the game makes is listed in SAVES or RUNS (tests/saves/saves.test.ts)', () => {
  expect(SAVES.length + RUNS.length, 'add each createSave to SAVES (and each createRun to RUNS) at the top of this file').toBeGreaterThan(0)
})

// a run's save is tested like any other save
const everySave: SaveUnderTest[] = [...SAVES, ...RUNS.map(({ run, sample, replay }) => ({ save: run.save, sample, replay }))]

for (const { save, sample, replay } of everySave) {
  describe(`save "${save.key}" (version ${save.version})`, () => {
    it('has a golden save for every version', () => {
      expect(missingGoldenVersions(save.key, save.version, Object.keys(golden)), 'missing tests/saves/ files for these versions').toEqual([])
    })
    for (const { file, golden: copy } of goldenSavesFor(save.key, golden)) {
      it(`${file} loads with today's code`, () => expect(checkGoldenSave(save, copy, replay)).toEqual([]))
    }
    it('round trip: what is saved is what loads', () => expect(checkRoundTrip(save, sample)).toEqual([]))
    it('damaged saves fall back to the backup, never crash', () => expect(checkDamagedSaves(save, sample)).toEqual([]))
    it('full or blocked storage keeps the game running', () => expect(checkFullStorage(save, sample)).toEqual([]))
  })
}

for (const { run, sample } of RUNS) {
  it(`run "${run.key}": a run cleared at the end never comes back`, () => expect(checkRunEnds(run, sample)).toEqual([]))
}

// the replay really bites (F190): the real golden run with its second move put on a square already taken
it('a saved match whose moves today\'s rules refuse fails the golden check', () => {
  const real = golden['./turn-based-starter_run-v1.json'] as { stored: { data: MatchRun } }
  const stored = structuredClone(real.stored)
  stored.data.record.moves[1].action = { cell: 4 }
  const problems = checkGoldenSave(matchRun.save, { stored }, replayMatch)
  expect(problems).toHaveLength(1)
  expect(problems[0]).toContain('Move 2 (seat 1) is not allowed')
})
