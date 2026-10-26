// THE GAME'S DEV KIT ADAPTER — how Snapshots, Bug capture, the Pause buttons and check:framework reach the game.
// The match (src/game/match.ts) is plain JSON, rebuilt from its move record on restore, so a snapshot comes back exactly.
// Online games: restore and pause are off (the room's server owns the truth).
import type { DevKitGame } from '../devkit/devkitGame'
import { versionLabel } from '../version'
import { getMatch, matchSnapshot, onMatchLog, restoreMatch } from '../game/match'
import { isOnline } from '../game/online'

export const ticTacToeAdapter: DevKitGame = {
  name: 'Tic-tac-toe starter',
  version: versionLabel,
  getState: () => matchSnapshot(),
  setState: (state) => restoreMatch(state),
  canRestore: () => !isOnline(),
  canPause: () => !isOnline(),
  pauseModes: ['full', 'half'],
  onEvent: (send) => onMatchLog((line) => send(line)),
  describe: (state) => {
    const m = state as ReturnType<typeof getMatch>
    if (!m) return 'main menu'
    return `${m.opponent.personality} · move ${m.record.moves.length + 1}${m.state?.over ? ' · over' : ''}`
  },
  conformance: {
    // From the main menu to live play: start a game against Careless Cass (you go first in the checks' fixed mode)
    startPlay: async () => {
      const play = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Careless'))
      if (!play) throw new Error('No "Play Careless Cass" button on the main menu')
      play.click()
      for (let i = 0; i < 100 && !document.querySelector('[data-board]'); i++) await new Promise((r) => requestAnimationFrame(r))
      if (!document.querySelector('[data-board]')) throw new Error('The board never showed')
    },
    query: '?seed=7',
  },
}
