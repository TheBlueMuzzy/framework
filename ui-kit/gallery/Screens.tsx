// SCREENS — every built screen with realistic sample data, run LIVE through the real screen stack.
// The Stage is a stand-in game; opening a screen pushes it on the stack, exactly like a game would.
// Back, Esc or the phone's Back close it; when the last one closes, the gallery goes back to its menu.
// The buttons are wired up like a small game: Main menu → Settings, Results → Victory → Post-game, and so on.
import { createContext, useContext, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import credits from '../content/credits.json'
import seats from './content/seats.json' // player colours come from content JSON, like a game's would
import {
  askConfirm, Bar, Button, Grid, ConnectionDot, Countdown, Counter, Credits, EmptyState, GameOver, HowToPlay, Hud, HudText, kitScreens,
  Loading, Lobby, MainMenu, ModeSelect, Panel, Pause, PlayerChip, PlayerSeats, PostGame, presets, Rank, Reconnecting, Results,
  RewardPopup, RoundIntro, Row, Score, Screen, ScrollArea, ScreenStack, screens, SeatPicker, Selector, Settings, Spinner, Stack, Text,
  TimerRing, toast, Tooltip, TurnBanner, Victory, type ToastPlace,
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
// End of a game: each player's colour comes from content JSON, like a game's would
const endScores = [
  { id: 'a', name: 'Muzzy', score: 212, color: seats[3].color }, { id: 'b', name: seats[0].name, score: 187, color: seats[0].color },
  { id: 'c', name: seats[1].name, score: 140, color: seats[1].color }, { id: 'd', name: seats[2].name, score: 96, color: seats[2].color },
]
const stats = [{ label: 'Best roll', value: 'Five of a kind' }, { label: 'Points', value: 212 }, { label: 'Time', value: '6:42' }]

// Where the gallery's one ToastStack shows its toasts (App.tsx owns it; the Feedback sample moves it)
export const ToastPlaceContext = createContext<{ place: ToastPlace; setPlace: (place: ToastPlace) => void }>({ place: 'top', setPlace: noop })

// ── Samples that need a little state ──
function Feedback() {
  const { place, setPlace } = useContext(ToastPlaceContext)
  const moveToasts = (to: string) => { setPlace(to as ToastPlace); toast(`Toasts now show at the ${to}`) }
  useEffect(() => {
    toast('Sam joined the room')
    toast('Connection lost', { variant: 'danger', seconds: 60 })
    toast('Tap to close me', { dismissible: true, seconds: 60 })
  }, [])
  return (
    <Screen label="Feedback">
      <Panel gap="m" className="kit-modal">
        <Row gap="s"><Text kind="heading">Tooltip</Text><Tooltip text="Rolling three sixes gives you a bonus turn." /></Row>
        <Row gap="m"><Spinner /><Text kind="caption">Spinner</Text></Row>
        <Row gap="s"><Text kind="label">Toasts at</Text><Selector label="Toasts at" options={['top', 'center', 'bottom']} value={place} onChange={moveToasts} /></Row>
        <EmptyState icon="🏆" title="No trophies yet" message="Win a round to earn your first one." actionLabel="Play now" onAction={() => toast('Let’s go!')} />
      </Panel>
    </Screen>
  )
}

function Modes() {
  const [mode, setMode] = useState('party')
  return <ModeSelect modes={modes} value={mode} onChange={setMode} onStart={() => screens.replace('countdown')} />
}

// A HUD whose numbers change every 1.5 s, to show the float-ups, combo pop, timer and turn banner.
// It sits on a dark stand-in game: the turn banner and the instructions are plain HudText (never button-like).
function HudSample() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = setInterval(() => setTick((n) => n + 1), 1500); return () => clearInterval(timer) }, [])
  const players = [{ id: 'a', name: 'Muzzy', score: 42 }, { id: 'b', name: 'Sam', score: 37 }, { id: 'c', name: 'Ada', score: 18 }]
  const turn = players[tick % 3]
  return (
    <Hud
      vitals={<Stack gap="xs"><Bar label="Health" icon="❤" value={70} variant="danger" width="m" /><Bar label="Energy" icon="⚡" value={40 + (tick % 4) * 20} variant="accent" width="s" />
        <Bar label="Lives" pips value={2} max={3} /></Stack>}
      status={<Row gap="s"><HudText>Round 1</HudText><TimerRing seconds={20 - (tick % 21)} total={20} /><Score value={120 + tick * 15} combo={1 + (tick % 4)} /></Row>}
      currency={<Row gap="s"><Counter label="Coins" icon="🪙" value={250 + tick * 5} />
        <Button variant="secondary" icon aria-label="Settings" onClick={() => screens.push('settings')}>⚙</Button></Row>}
      onPause={() => screens.push('pause')}
      banner={<Stack gap="xs"><TurnBanner variant="plain" text={`${turn.name}'s turn`} />
        {tick % 2 ? <HudText tone="accent">Locked 1!</HudText> : <HudText detail="Up to 3 times">Hold to Roll</HudText>}</Stack>}
      bottomLeft={<ConnectionDot status="weak" />}
      bottomRight={<Rank place={2} of={3} />}
      actions={<Stack gap="s"><PlayerSeats players={players} activeId={turn.id} /><Row justify="center"><Button onClick={() => toast('Rolled!')}>Roll</Button></Row></Stack>}
    />
  )
}

// PLAYER CHIPS beside stand-in game rows. A game pins each chip to a 3D point itself, so here each
// sits in a box that cuts off everything the page passes down (like a 3D library's own div would),
// wrapped in kit-scope, which brings the style's font and colours back. Every 1.5 s the turn moves
// on, the player whose turn it was scores (counting up), and Bolt dims as if a die rolls over it.
// Below them: a goal chip (an icon instead of an avatar), a small chip, an xs chip (all on one line), and a bare score chip.
// They sit on a dark stand-in game, with plain HudText ("Round 1") and a settings icon button above.
function PlayerChips() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = setInterval(() => setTick((n) => n + 1), 1500); return () => clearInterval(timer) }, [])
  const players = [{ id: 'me', name: 'Muzzy', color: seats[3].color }, ...seats.slice(0, 3).map((s) => ({ ...s, badge: 'Bot' }))]
  const score = (i: number) => 4 * i + 3 * Math.floor((tick + players.length - 1 - i) / players.length)
  const pinned = (key: string, chip: ReactNode) => <div key={key} className="gallery-outside"><div className="kit-scope">{chip}</div></div>
  return (
    <Screen label="Player chips" top={<HudText>Round 1</HudText>}
      topRight={<Button variant="secondary" icon aria-label="Settings" onClick={() => screens.push('settings')}>⚙</Button>}>
      <Stack gap="s" className="kit-wide">
        <ScrollArea label="Player chips" max="l">
          <Grid gap="m" min="l">
            {players.map((p, i) => pinned(p.id, <PlayerChip name={p.name} color={p.color} badge={'badge' in p ? p.badge : undefined}
              score={score(i)} detail={`S${1 + (tick % 3)} · T${1 + i}`} active={tick % players.length === i} dim={i === 2 && tick % 2 === 1} />))}
            {pinned('goal', <PlayerChip name="Goal" icon="◎" score={30} detail="If you lock it now" />)}
            {pinned('small', <PlayerChip name="Pip" color={seats[2].color} size="s" score={score(3)} />)}
            {pinned('xs', <PlayerChip name="Bolt" color={seats[1].color} size="xs" badge="Bot" detail={`S${1 + (tick % 3)} · T5`} score={score(2)} />)}
            {pinned('bare', <PlayerChip name="Goal" avatar={false} showName={false} size="s" score={12} />)}
          </Grid>
        </ScrollArea>
      </Stack>
    </Screen>
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
    onReady={noop} onStart={noop} onLeave={() => screens.pop()} onBack={() => screens.pop()} />
}

function LobbyRoom() {
  const [ready, setReady] = useState(false)
  const players = [{ id: 'h', name: 'Sherman Meredith' }, { id: 'me', name: 'Muzzy', ready }, { id: 'c', name: 'Ada', ready: true }, { id: 'd', name: 'Lin' }]
  return <Lobby roomCode="QX2T" meId="me" hostId="h" players={players} onCreate={noop} onJoin={noop}
    onReady={setReady} onStart={noop} onLeave={() => screens.pop()} />
}

// A game that marks players ready by itself: no onReady, so no Ready button and Start only waits for
// enough players. Player colours come from content JSON, like a game's would.
function LobbyRoomAutoReady() {
  const players = [
    { id: 'me', name: 'Muzzy', color: seats[0].color },
    { id: seats[1].id, name: seats[1].name, color: seats[1].color },
    { id: seats[2].id, name: seats[2].name, color: seats[2].color },
  ]
  return <Lobby roomCode="QX2T" meId="me" hostId="me" players={players} onCreate={noop} onJoin={noop}
    onStart={() => screens.replace('countdown')} onLeave={() => screens.pop()} />
}

// Pick a seat → "Joining…" for a moment → into the game (the HUD). Cancel goes back to the list.
function Seats({ startWaiting = false }: { startWaiting?: boolean }) {
  const [waiting, setWaiting] = useState(startWaiting)
  useEffect(() => {
    if (!waiting || startWaiting) return
    const timer = setTimeout(() => screens.replace('hud'), 2000)
    return () => clearTimeout(timer)
  }, [waiting, startWaiting])
  return <SeatPicker seats={seats} waiting={waiting} onPick={() => setWaiting(true)}
    onCancel={() => (waiting ? setWaiting(false) : screens.pop())} />
}

// ── Every screen the stack can open, by name ──
const samples: Record<string, ComponentType> = {
  feedback: Feedback,
  rewards: () => <RewardPopup rewards={[{ icon: '🪙', amount: 250, label: 'Coins' }, { icon: '💎', amount: 3, label: 'Gems' }, { icon: '🎲', label: 'Gold dice skin' }]} />,
  // items: the buttons in the game's own order (the first is the main one unless one says primary)
  menu: () => <MainMenu title="Roll Better" subtitle="A dice game for friends" version="v0.1.0" items={[
    { label: 'Play', onClick: () => screens.push('modes') }, { label: 'Play online', onClick: () => screens.push('lobby') },
    { label: 'Settings', onClick: () => screens.push('settings') }, { label: 'How to play', onClick: () => screens.push('howto') },
    { label: 'Credits', onClick: () => screens.push('credits') }, { label: 'Quit', onClick: () => screens.pop() },
  ]} />,
  modes: Modes,
  howto: () => <HowToPlay pages={howPages} />,
  credits: () => <Credits people={people} assets={credits} />,
  settings: () => <Settings info={{ version: '0.1.0' }} onAction={(id) => toast(`Action: ${id}`)} />,
  hud: HudSample,
  chips: PlayerChips,
  pause: () => <Pause onSettings={() => screens.push('settings')} onHowToPlay={() => screens.push('howto')} onQuit={() => { screens.pop(); screens.pop() }} />,
  loading: () => <Loading progress={0.6} tip="Tip: keep your sixes for the big rows." />,
  countdown: CountdownSample,
  round: () => <RoundIntro round={2} total={5} detail="Doubles score twice this round" />,
  results: () => <Results players={scores} meId="a" onContinue={() => screens.replace('victory')} />,
  endgame: () => <Results title="You win!" message="Muzzy takes it by 25 points." players={endScores} meId="a"
    onRematch={() => screens.replace('countdown')} onQuit={() => screens.pop()} />,
  // dim: the end of a game over the table — the game stays visible, darkened (here over the HUD)
  endgamedim: () => <Results dim title="You win!" message="Muzzy takes it by 25 points." players={endScores} meId="a"
    onRematch={() => screens.replace('countdown')} onQuit={() => { screens.pop(); screens.pop() }} />,
  victory: () => <Victory message="You beat Sam by 25 points." stats={stats} onContinue={() => screens.replace('postgame')} />,
  gameover: () => <GameOver message="Out of lives on round 4." stats={stats} onRetry={() => screens.replace('countdown')} onQuit={() => screens.pop()} />,
  postgame: () => (
    <PostGame onRematch={() => screens.replace('countdown')} onLobby={() => screens.replace('room')} onQuit={() => screens.pop()}>
      <Text kind="caption">2 of 4 players want a rematch</Text>
    </PostGame>
  ),
  lobby: LobbyJoin,
  room: LobbyRoom,
  roomauto: LobbyRoomAutoReady,
  reconnecting: () => <Reconnecting onQuit={() => { screens.pop(); screens.pop() }} />,
  seats: () => <Seats />,
  joining: () => <Seats startWaiting />,
  noseats: () => <SeatPicker seats={[]} onPick={noop} onCancel={() => screens.pop()} />,
  failed: () => <Reconnecting failed onRetry={() => screens.replace('reconnecting')} onQuit={() => { screens.pop(); screens.pop() }} />,
}

// How each menu entry opens. Most push the screen of the same name; these start differently.
const openers: Record<string, () => void> = {
  confirm: () => askConfirm({ title: 'Reset progress?', message: 'All your unlocks and scores will be gone. This can’t be undone.',
    danger: true, onConfirm: () => toast('Progress reset'), words: { yes: 'Reset' } }),
  pause: () => { screens.push('hud'); screens.push('pause') },
  reconnecting: () => { screens.push('hud'); screens.push('reconnecting') },
  failed: () => { screens.push('hud'); screens.push('failed') },
  endgamedim: () => { screens.push('hud'); screens.push('endgamedim') },
}
// Screens shown over a dark stand-in game (like Roll Better's table), to check plain HUD text reads on it
const darkScreens = ['hud', 'chips']
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
      <div className="gallery-game" data-dark={darkScreens.includes(id) || undefined}>
        <ScreenStack screens={{ ...kitScreens, ...samples }}>
          <Stack gap="xs" className="gallery-game-label">
            <Text kind="caption">{isKnown(id) ? '(the game)' : `No screen called “${id}”.`}</Text>
          </Stack>
        </ScreenStack>
      </div>
    </div>
  )
}
