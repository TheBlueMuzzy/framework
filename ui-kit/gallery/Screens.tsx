// SCREENS — every built screen with realistic sample data, run LIVE through the real screen stack.
// The Stage is a stand-in game; opening a screen pushes it on the stack, exactly like a game would.
// Back, Esc or the phone's Back close it; when the last one closes, the gallery goes back to its menu.
// The buttons are wired up like a small game: Main menu → Settings, Results → Victory → Post-game, and so on.
import { useEffect, useState, type ComponentType } from 'react'
import credits from '../content/credits.json'
import {
  askConfirm, Bar, Button, ConnectionDot, Countdown, Counter, Credits, EmptyState, GameOver, HowToPlay, Hud, kitScreens,
  Loading, Lobby, MainMenu, ModeSelect, Panel, Pause, PlayerSeats, PostGame, presets, Rank, Reconnecting, Results,
  RewardPopup, RoundIntro, Row, Score, Screen, ScreenStack, screens, Selector, Settings, Spinner, Stack, Text,
  TimerRing, toast, Tooltip, TurnBanner, Victory,
} from '../kit'

const noop = () => {}

// ── Sample data ──
const modes = [
  { id: 'solo', name: 'Solo', description: 'Beat your best score' },
  { id: 'party', name: 'Party', description: '2–6 players, one phone', badge: 'Popular' },
  { id: 'online', name: 'Online', description: 'Play with a room code' },
]
const howPages = [
  { title: 'Roll the dice', body: 'Tap Roll. Keep the dice you like, and roll the rest up to two more times.' },
  { title: 'Score a row', body: 'Pick one empty row on your card. Some rows want pairs, some want runs.' },
  { title: 'Most points wins', body: 'After 13 rounds every card is full. Highest total wins the game.' },
]
const people = [
  { role: 'Design & art', names: ['Muzzy'] }, { role: 'Code', names: ['Claude'] },
  { role: 'Playtesters', names: ['Sherman Meredith', 'Ada', 'Lin'] },
]
const scores = [
  { id: 'a', name: 'Muzzy', score: 212 }, { id: 'b', name: 'Sam', score: 187 }, { id: 'c', name: 'Ada', score: 212 },
  { id: 'd', name: 'Lin', score: 96 }, { id: 'e', name: 'Sherman Meredith', score: 140 },
]
const stats = [{ label: 'Best roll', value: 'Five of a kind' }, { label: 'Points', value: 212 }, { label: 'Time', value: '6:42' }]

// ── Samples that need a little state ──
function Feedback() {
  useEffect(() => { toast('Game saved'); toast('Sam joined the room'); toast('Connection lost', { variant: 'danger', seconds: 60 }) }, [])
  return (
    <Screen label="Feedback">
      <Panel gap="m" className="kit-modal">
        <Row gap="s"><Text kind="heading">Tooltip</Text><Tooltip text="Rolling three sixes gives you a bonus turn." /></Row>
        <Row gap="m"><Spinner /><Text kind="caption">Spinner</Text></Row>
        <EmptyState icon="🏆" title="No trophies yet" message="Win a round to earn your first one." actionLabel="Play now" onAction={() => toast('Let’s go!')} />
      </Panel>
    </Screen>
  )
}

function Modes() {
  const [mode, setMode] = useState('party')
  return <ModeSelect modes={modes} value={mode} onChange={setMode} onStart={() => screens.replace('countdown')} />
}

// A HUD whose numbers change every 1.5 s, to show the float-ups, combo pop, timer and turn banner
function HudSample() {
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
      actions={<Stack gap="s"><PlayerSeats players={players} activeId={turn.id} /><Row justify="center"><Button onClick={() => toast('Rolled!')}>Roll</Button></Row></Stack>}
    />
  )
}

// Counts down, says Go!, then starts again
function CountdownSample() {
  const [run, setRun] = useState(0)
  return <Countdown key={run} onDone={() => setTimeout(() => setRun((n) => n + 1), 1500)} />
}

function LobbyJoin() {
  const [name, setName] = useState('Muzzy')
  const [error, setError] = useState('')
  const join = (code: string) => (code === 'QX2T' ? screens.replace('room') : setError(`No room called ${code} — try QX2T.`))
  return <Lobby name={name} onNameChange={setName} error={error} onCreate={() => screens.replace('room')} onJoin={join}
    onReady={noop} onStart={noop} onLeave={() => screens.pop()} />
}

function LobbyRoom() {
  const [ready, setReady] = useState(false)
  const players = [{ id: 'h', name: 'Sherman Meredith' }, { id: 'me', name: 'Muzzy', ready }, { id: 'c', name: 'Ada', ready: true }, { id: 'd', name: 'Lin' }]
  return <Lobby roomCode="QX2T" meId="me" hostId="h" players={players} onCreate={noop} onJoin={noop}
    onReady={setReady} onStart={noop} onLeave={() => screens.pop()} />
}

// ── Every screen the stack can open, by name ──
const samples: Record<string, ComponentType> = {
  feedback: Feedback,
  rewards: () => <RewardPopup rewards={[{ icon: '🪙', amount: 250, label: 'Coins' }, { icon: '💎', amount: 3, label: 'Gems' }, { icon: '🎲', label: 'Gold dice skin' }]} />,
  menu: () => <MainMenu title="Roll Better" subtitle="A dice game for friends" version="v0.1.0" onContinue={() => screens.push('hud')}
    onPlay={() => screens.push('modes')} onSettings={() => screens.push('settings')} onHowToPlay={() => screens.push('howto')}
    onCredits={() => screens.push('credits')} onQuit={() => screens.pop()} />,
  modes: Modes,
  howto: () => <HowToPlay pages={howPages} />,
  credits: () => <Credits people={people} assets={credits} />,
  settings: () => <Settings info={{ version: '0.1.0' }} onAction={(id) => toast(`Action: ${id}`)} />,
  hud: HudSample,
  pause: () => <Pause onSettings={() => screens.push('settings')} onHowToPlay={() => screens.push('howto')} onQuit={() => { screens.pop(); screens.pop() }} />,
  loading: () => <Loading progress={0.6} tip="Tip: keep your sixes for the big rows." />,
  countdown: CountdownSample,
  round: () => <RoundIntro round={2} total={5} detail="Doubles score twice this round" />,
  results: () => <Results players={scores} meId="a" onContinue={() => screens.replace('victory')} />,
  victory: () => <Victory message="You beat Sam by 25 points." stats={stats} onContinue={() => screens.replace('postgame')} />,
  gameover: () => <GameOver message="Out of lives on round 4." stats={stats} onRetry={() => screens.replace('countdown')} onQuit={() => screens.pop()} />,
  postgame: () => (
    <PostGame onRematch={() => screens.replace('countdown')} onLobby={() => screens.replace('room')} onQuit={() => screens.pop()}>
      <Text kind="caption">2 of 4 players want a rematch</Text>
    </PostGame>
  ),
  lobby: LobbyJoin,
  room: LobbyRoom,
  reconnecting: () => <Reconnecting onQuit={() => { screens.pop(); screens.pop() }} />,
  failed: () => <Reconnecting failed onRetry={() => screens.replace('reconnecting')} onQuit={() => { screens.pop(); screens.pop() }} />,
}

// How each menu entry opens. Most push the screen of the same name; these start differently.
const openers: Record<string, () => void> = {
  confirm: () => askConfirm({ title: 'Reset progress?', message: 'All your unlocks and scores will be gone. This can’t be undone.',
    danger: true, onConfirm: () => toast('Progress reset'), words: { yes: 'Reset' } }),
  pause: () => { screens.push('hud'); screens.push('pause') },
  reconnecting: () => { screens.push('hud'); screens.push('reconnecting') },
  failed: () => { screens.push('hud'); screens.push('failed') },
}
const isKnown = (id: string) => Object.hasOwn(samples, id) || Object.hasOwn(openers, id)

// ── The stage: a bar (back to the menu, style) over a stand-in game that runs the screen stack ──
type StageProps = { id: string; preset: string; onPreset: (preset: string) => void; onMenu: () => void }
export function Stage({ id, preset, onPreset, onMenu }: StageProps) {
  useEffect(() => { if (isKnown(id)) (openers[id] ?? (() => screens.push(id)))() }, [id])
  return (
    <div className="gallery-stage-page">
      <Row gap="s" justify="between" className="gallery-bar">
        <Button variant="secondary" onClick={onMenu}>◀ Menu</Button>
        <Selector label="Style" options={Object.keys(presets)} value={preset} onChange={onPreset} />
      </Row>
      <div className="gallery-game">
        <ScreenStack screens={{ ...kitScreens, ...samples }}>
          <Stack gap="xs" className="gallery-game-label">
            <Text kind="caption">{isKnown(id) ? '(the game)' : `No screen called “${id}”.`}</Text>
          </Stack>
        </ScreenStack>
      </div>
    </div>
  )
}
