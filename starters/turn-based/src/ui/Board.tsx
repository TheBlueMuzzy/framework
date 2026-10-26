// THE BOARD — nine UI kit Buttons in three Rows. The rules decide everything; this only shows the board and says
// which square was tapped. Its size is content/tuning/board.json (live in the Dev Kit); the winning line pulses on
// the LOOKS clock (it keeps pulsing in the Dev Kit's half pause, stops in a full pause).
import { useEffect, useState } from 'react'
import boardTuning from '../../content/tuning/board.json'
import text from '../../content/text/en.json'
import { Button, Row, Stack, fill } from './kit'
import { looksClock } from '../devkit/gameClock'
import type { Cell } from '../game/rules'
import { useShortSide, useTuningEdits } from './hooks'

type BoardProps = {
  board: Cell[]
  winLine: number[] | null
  /** May you tap a free square right now? */
  canPlay: boolean
  onPlay: (cell: number) => void
}

const ROWS = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
const markOf = (cell: Cell) => (cell === 0 ? text.table.marks.x : cell === 1 ? text.table.marks.o : '')
const markName = (cell: Cell) => (cell === 0 ? text.table.markNames.x : text.table.markNames.o)

export function Board({ board, winLine, canPlay, onPlay }: BoardProps) {
  useTuningEdits('board')
  const shortSide = useShortSide()
  // One square: the tuned size, but never more than the board's share of the window (3 squares + the gaps between)
  const cellPx = Math.max(44, Math.min(boardTuning.cellSize, Math.floor((shortSide * boardTuning.boardShare) / 3.4)))
  const lit = useWinPulse(winLine !== null)

  return (
    <Stack gap="s" role="group" aria-label={text.table.board} data-board="">
      {ROWS.map((row, r) => (
        <Row key={r} gap="s" justify="center">
          {row.map((i) => {
            const winning = winLine?.includes(i) ?? false
            const label = board[i] === null ? fill(text.table.square, { n: i + 1 }) : fill(text.table.squareTaken, { n: i + 1, mark: markName(board[i]) })
            return (
              <Button key={i} icon size={cellPx} sound={false} aria-label={label} data-cell={i} data-mark={board[i] ?? ''}
                variant={winning && lit ? 'primary' : 'secondary'}
                aria-disabled={(!canPlay && board[i] === null) || undefined}
                onClick={() => canPlay && board[i] === null && onPlay(i)}>
                {markOf(board[i])}
              </Button>
            )
          })}
        </Row>
      ))}
    </Stack>
  )
}

/** On / off every half pulse while there's a winning line (looks clock). */
function useWinPulse(on: boolean) {
  const [lit, setLit] = useState(true)
  const halfPulseMs = Math.max(100, boardTuning.winPulseMs / 2) // read each draw: a Dev Kit edit restarts the pulse
  useEffect(() => {
    if (!on) return
    return looksClock.every(halfPulseMs, () => setLit((l) => !l))
  }, [on, halfPulseMs])
  return lit
}
