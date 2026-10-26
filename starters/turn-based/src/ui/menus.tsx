// THE SCREENS OVER THE GAME — Pause, Results, Settings, Credits: UI kit blocks, words from content/text/en.json.
// They open through the kit's screen stack (screens.push('pause')); Esc and the phone's Back close the top one.
import text from '../../content/text/en.json'
import credits from '../../content/credits.json'
import { Credits, Pause, Results, Settings, fill, screens } from './kit'
import { versionLabel } from '../version'
import { BOT, YOU, getMatch, leaveMatch, startMatch, useMatch } from '../game/match'
import { applySettings, settingsSchema } from '../game/settings'
import { progressSave, settingsSave } from '../game/saves'
import { seatId } from '../game/table'
import { personalityName } from './names'

export function PauseScreen() {
  return (
    <Pause
      words={text.pause}
      onSettings={() => screens.push('settings')}
      onQuit={() => { screens.pop(); leaveMatch() }}
    />
  )
}

export function ResultsScreen() {
  const match = useMatch()
  if (!match) return null
  const botName = personalityName(match.opponent.personality)
  const { winner } = match.state
  const title = winner === YOU ? text.results.win : winner === BOT ? fill(text.results.lose, { name: botName }) : text.results.draw
  const progress = progressSave.load()
  return (
    <Results
      dim
      title={title}
      message={fill(text.results.record, { wins: progress.wins, losses: progress.losses, draws: progress.draws })}
      meId={seatId(YOU)}
      players={[
        { id: seatId(YOU), name: text.table.you, score: match.series.you },
        { id: seatId(BOT), name: botName, score: match.series.them },
      ]}
      words={{ rematch: text.results.rematch, quit: text.results.quit, points: text.results.points, winner: text.results.winner, you: text.results.you }}
      onRematch={() => {
        const opponent = getMatch()?.opponent
        screens.pop()
        if (opponent) startMatch(opponent)
      }}
      onQuit={() => { screens.pop(); leaveMatch() }}
    />
  )
}

export function SettingsScreen() {
  return (
    <Settings
      schema={settingsSchema}
      version={versionLabel}
      load={() => settingsSave.load()}
      save={(values) => { settingsSave.save(values) }}
      onChange={(values) => applySettings(values)}
      onAction={(id) => { if (id === 'credits') screens.push('credits') }}
    />
  )
}

export function CreditsScreen() {
  return <Credits assets={credits} />
}
