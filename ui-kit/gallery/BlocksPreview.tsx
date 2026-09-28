// BLOCK PREVIEW — ?block=<name> shows one built screen full-size over a stand-in game,
// for checking by eye and for screenshots. Temporary: F05 folds this into the gallery menu.
import { useEffect, useState, type ComponentType } from 'react'
import credits from '../content/credits.json'
import {
  Lobby, Reconnecting, Countdown, GameOver, Loading, PostGame, Results, RoundIntro, Victory,
  askConfirm, Bar, Button, ConnectionDot, Counter, Credits, Hud, Pause, PlayerSeats, Rank, Score, TimerRing, TurnBanner, EmptyState, HowToPlay, MainMenu, ModeSelect, kitScreens, Panel, RewardPopup, Row, Screen, ScreenStack, screens,
  Settings, Spinner, Stack, Text, toast, ToastStack, Tooltip,
} from '../kit'

function Feedback() {
  useEffect(() => { toast('Game saved'); toast('Sam joined the room'); toast('Connection lost', { variant: 'danger', seconds: 60 }) }, [])
  return (
    <Screen label="Feedback">
      <Panel gap="m" className="kit-modal">
        <Row gap="s"><Text kind="heading">Tooltip</Text><Tooltip text="Rolling three sixes gives you a bonus turn." /></Row>
        <Row gap="m"><Spinner /><Text kind="caption">Spinner</Text></Row>
        <EmptyState icon="🏆" title="No trophies yet" message="Win a round to earn your first one." actionLabel="Play now" onAction={() => {}} />
      </Panel>
    </Screen>
  )
}

function Rewards() {
  return <RewardPopup rewards={[{ icon: '🪙', amount: 250, label: 'Coins' }, { icon: '💎', amount: 3, label: 'Gems' }, { icon: '🎲', label: 'Gold dice skin' }]} />
}

const noop = () => {}
function Modes() {
  const [mode, setMode] = useState('party')
  const modes = [
    { id: 'solo', name: 'Solo', description: 'Beat your best score' },
    { id: 'party', name: 'Party', description: '2–6 players, one phone', badge: 'Popular' },
    { id: 'online', name: 'Online', description: 'Play with a room code' },
  ]
  return <ModeSelect modes={modes} value={mode} onChange={setMode} onStart={noop} />
}
const howPages = [
  { title: 'Roll the dice', body: 'Tap Roll. Keep the dice you like, and roll the rest up to two more times.' },
  { title: 'Score a row', body: 'Pick one empty row on your card. Some rows want pairs, some want runs.' },
  { title: 'Most points wins', body: 'After 13 rounds every card is full. Highest total wins the game.' },
]
const people = [{ role: 'Design & art', names: ['Muzzy'] }, { role: 'Code', names: ['Claude'] }, { role: 'Playtesters', names: ['Sherman Meredith', 'Ada', 'Lin'] }]

// A HUD whose numbers change every 1.5 s, to show the float-ups, combo pop, timer and turn banner
function HudDemo() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = setInterval(() => setTick((n) => n + 1), 1500); return () => clearInterval(timer) }, [])
  const players = [{ id: 'a', name: 'Muzzy', score: 42 }, { id: 'b', name: 'Sam', score: 37 }, { id: 'c', name: 'Ada', score: 18 }]
  const turn = players[tick % 3]
  return (
    <Hud
      vitals={<Stack gap="xs"><Bar label="Health" icon="❤" value={70} variant="danger" /><Bar label="Lives" pips value={2} max={3} /></Stack>}
      status={<Row gap="s"><TimerRing seconds={20 - (tick % 21)} total={20} /><Score value={120 + tick * 15} combo={1 + (tick % 4)} /></Row>}
      currency={<Counter label="Coins" icon="🪙" value={250 + tick * 5} />}
      onPause={() => screens.push('pause')}
      banner={<TurnBanner text={`${turn.name}'s turn`} detail="Roll up to 3 times" />}
      bottomLeft={<ConnectionDot status="weak" />}
      bottomRight={<Rank place={2} of={3} />}
      actions={<Stack gap="s"><PlayerSeats players={players} activeId={turn.id} /><Row justify="center"><Button>Roll</Button></Row></Stack>}
    />
  )
}
const scores = [
  { id: 'a', name: 'Muzzy', score: 212 }, { id: 'b', name: 'Sam', score: 187 }, { id: 'c', name: 'Ada', score: 212 },
  { id: 'd', name: 'Lin', score: 96 }, { id: 'e', name: 'Sherman Meredith', score: 140 },
]
const stats = [{ label: 'Best roll', value: 'Five of a kind' }, { label: 'Points', value: 212 }, { label: 'Time', value: '6:42' }]
function LobbyJoin() {
  const [name, setName] = useState('Muzzy')
  return <Lobby name={name} onNameChange={setName} error="No room called QXZT — check the code." onCreate={noop} onJoin={noop} onReady={noop} onStart={noop} onLeave={noop} />
}
function LobbyRoom() {
  const [ready, setReady] = useState(false)
  const players = [{ id: 'h', name: 'Sherman Meredith' }, { id: 'me', name: 'Muzzy', ready }, { id: 'c', name: 'Ada', ready: true }, { id: 'd', name: 'Lin' }]
  return <Lobby roomCode="K7QD" meId="me" hostId="h" players={players} onCreate={noop} onJoin={noop} onReady={setReady} onStart={noop} onLeave={noop} />
}
const pauseScreen = () => <Pause onSettings={noop} onHowToPlay={noop} onQuit={noop} />

// name → its screens for the stack, what to open at the start, and what sits underneath
type Demo = { screens?: Record<string, ComponentType>; open?: () => void; base?: ComponentType }
const demos: Record<string, Demo> = {
  feedback: { base: Feedback },
  confirm: { open: () => askConfirm({ title: 'Reset progress?', message: 'All your unlocks and scores will be gone. This can’t be undone.', danger: true, onConfirm: () => {}, words: { yes: 'Reset' } }) },
  rewards: { screens: { rewards: Rewards }, open: () => screens.push('rewards') },
  menu: { base: () => <MainMenu title="Roll Better" subtitle="A dice game for friends" version="v0.1.0" onContinue={noop} onPlay={noop} onSettings={noop} onHowToPlay={noop} onCredits={noop} onQuit={noop} /> },
  modes: { screens: { modes: Modes }, open: () => screens.push('modes') },
  howto: { screens: { howto: () => <HowToPlay pages={howPages} /> }, open: () => screens.push('howto') },
  settings: { screens: { settings: () => <Settings info={{ version: '0.1.0' }} onAction={(id) => toast(`Action: ${id}`)} /> }, open: () => screens.push('settings') },
  hud: { base: HudDemo, screens: { pause: pauseScreen } },
  pause: { base: HudDemo, screens: { pause: pauseScreen }, open: () => screens.push('pause') },
  loading: { base: () => <Loading progress={0.6} tip="Tip: keep your sixes for the big rows." /> },
  countdown: { base: () => <Countdown onDone={noop} /> },
  round: { base: () => <RoundIntro round={2} total={5} detail="Doubles score twice this round" /> },
  results: { screens: { results: () => <Results players={scores} meId="a" onContinue={noop} /> }, open: () => screens.push('results') },
  victory: { screens: { victory: () => <Victory message="You beat Sam by 25 points." stats={stats} onContinue={noop} /> }, open: () => screens.push('victory') },
  gameover: { screens: { gameover: () => <GameOver message="Out of lives on round 4." stats={stats} onRetry={noop} onQuit={noop} /> }, open: () => screens.push('gameover') },
  postgame: { screens: { postgame: () => <PostGame onRematch={noop} onLobby={noop} onQuit={noop}><Text kind="caption">2 of 4 players want a rematch</Text></PostGame> }, open: () => screens.push('postgame') },
  lobby: { base: LobbyJoin },
  room: { base: LobbyRoom },
  reconnecting: { base: HudDemo, screens: { r: () => <Reconnecting onQuit={noop} /> }, open: () => screens.push('r') },
  failed: { base: HudDemo, screens: { r: () => <Reconnecting failed onRetry={noop} onQuit={noop} /> }, open: () => screens.push('r') },
  credits: { screens: { credits: () => <Credits people={people} assets={credits} /> }, open: () => screens.push('credits') },
}
export const blockNames = Object.keys(demos)

export function BlocksPreview({ name }: { name: string }) {
  const demo = demos[name]
  useEffect(() => { demo?.open?.() }, [demo])
  if (!demo) return <Text>No block called “{name}”. Try: {blockNames.join(', ')}</Text>
  const Base = demo.base
  return (
    <div className="gallery-game">
      <ScreenStack screens={{ ...kitScreens, ...demo.screens }}>
        <Stack gap="xs" className="gallery-game-label"><Text kind="caption">(the game)</Text></Stack>
        {Base && <Base />}
      </ScreenStack>
      <ToastStack />
    </div>
  )
}
