// THE TABLE — a game against the computer: the UI kit's Hud (whose turn it is + Pause), the board in its middle and the
// seats along the bottom (tap your own seat for an emote, the bot's to mute it). Opening Pause pauses the game itself
// (rulesClock.scale = 0): the bot stops thinking and the results wait.
import { useEffect, useRef } from 'react'
import text from '../../content/text/en.json'
import { Hud, HudText, fill, screens, useScreens } from './kit'
import { EmoteSeats } from '../emotes/ui/EmoteLayer'
import { rulesClock } from '../devkit/gameClock'
import { BOT, YOU, getMatch, leaveMatch, playCell, useMatch } from '../game/match'
import { emotes, seatId } from '../game/table'
import { Board } from './Board'
import { personalityName } from './names'

export function TableScreen() {
  const match = useMatch()
  const stack = useScreens()
  const paused = stack.includes('pause')

  // The game's own pause: the rules clock stops while Pause is open
  useEffect(() => {
    rulesClock.scale = paused ? 0 : 1
    return () => { rulesClock.scale = 1 }
  }, [paused])

  // The results open a moment after the last move (match.ts)
  const resultsOpen = match?.resultsOpen === true
  useEffect(() => {
    if (resultsOpen && !screens.current.includes('results')) screens.push('results')
  }, [resultsOpen])

  // Esc (or a phone's Back) closes the results like their Main menu button (F160): the game is over, so "back" means
  // leave it — never the finished board left behind them with nothing to do but Pause. (Play again and Main menu
  // close them too, but they start a new match or leave first, so this sees no finished match left.)
  const resultsUp = stack.includes('results')
  const resultsWereUp = useRef(false)
  useEffect(() => {
    if (resultsUp) resultsWereUp.current = true
    else if (resultsWereUp.current) {
      resultsWereUp.current = false
      if (getMatch()?.resultsOpen) leaveMatch()
    }
  }, [resultsUp])

  if (!match) return null
  const { state } = match
  const botName = personalityName(match.opponent.personality)
  const status = state.over ? text.table.over : state.turn === YOU ? text.table.yourTurn : fill(text.table.theirTurn, { name: botName })
  const seats = [
    { id: seatId(YOU), name: text.table.you, score: match.series.you },
    { id: seatId(BOT), name: botName, score: match.series.them },
  ]

  return (
    <Hud
      status={<HudText pop>{status}</HudText>}
      onPause={() => screens.push('pause')}
      words={{ pause: text.table.pause }}
      banner={<Board board={state.board} winLine={state.winLine} canPlay={!state.over && state.turn === YOU} onPlay={playCell} />}
      actions={<EmoteSeats emotes={emotes} seats={seats} mine={seatId(YOU)} activeId={state.over ? undefined : seatId(state.turn)} avoid=".kit-hud-slot" />}
    />
  )
}
