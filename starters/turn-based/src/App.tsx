// THE APP — one screen stack (the UI kit's) over whichever base screen is showing: the main menu, a game against the
// computer, or online play. Pause, Results (both games'), Settings and Credits open on top of it.
import { useCallback, useState } from 'react'
import { ScreenStack, ToastStack } from './ui/kit'
import { roomBeforeReload } from './rooms/lastRoom'
import { useMatch } from './game/match'
import { MainMenuScreen } from './ui/MainMenuScreen'
import { TableScreen } from './ui/TableScreen'
import { ONLINE_RESULTS, OnlineResultsScreen, OnlineScreen, type OnlineStart } from './ui/OnlineScreen'
import { CreditsScreen, PauseScreen, ResultsScreen, SettingsScreen } from './ui/menus'
import { TableWorld } from './world/TableWorld'

const SCREENS = {
  pause: PauseScreen, results: ResultsScreen, settings: SettingsScreen, credits: CreditsScreen, [ONLINE_RESULTS]: OnlineResultsScreen,
}

// A reload while in a room goes straight back in (this tab only): a match as a rejoin, a lobby as a plain join
function startOnline(): OnlineStart | null {
  const reloaded = roomBeforeReload()
  return reloaded ? { code: reloaded.code, rejoin: reloaded.phase === 'playing' } : null
}

export default function App() {
  const match = useMatch()
  const [online, setOnline] = useState<OnlineStart | null>(startOnline)
  const closeOnline = useCallback(() => setOnline(null), [])
  const base = online ? <OnlineScreen start={online} onClose={closeOnline} />
    : match ? <TableScreen />
    : <MainMenuScreen onOnline={(start) => setOnline(start)} />
  return (
    <>
      {(online || match) && <TableWorld />}
      <ScreenStack screens={SCREENS}>{base}</ScreenStack>
      <ToastStack />
    </>
  )
}
