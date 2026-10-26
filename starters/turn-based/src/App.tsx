// THE APP — one screen stack (the UI kit's) over whichever base screen is showing: the main menu, a game against the
// computer, or online play. Pause, Results, Settings and Credits open on top of it.
import { useState } from 'react'
import { ScreenStack, ToastStack } from './ui/kit'
import { useMatch } from './game/match'
import { MainMenuScreen } from './ui/MainMenuScreen'
import { TableScreen } from './ui/TableScreen'
import { CreditsScreen, PauseScreen, ResultsScreen, SettingsScreen } from './ui/menus'

const SCREENS = { pause: PauseScreen, results: ResultsScreen, settings: SettingsScreen, credits: CreditsScreen }

export default function App() {
  const match = useMatch()
  const [, setOnline] = useState(false)
  const base = match ? <TableScreen /> : <MainMenuScreen onOnline={() => setOnline(true)} />
  return (
    <>
      <ScreenStack screens={SCREENS}>{base}</ScreenStack>
      <ToastStack />
    </>
  )
}
