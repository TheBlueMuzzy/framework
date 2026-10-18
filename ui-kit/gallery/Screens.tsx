// SCREENS — every built screen with realistic sample data, run LIVE through the real screen stack.
// The Stage is a stand-in game; opening a screen pushes it on the stack, exactly like a game would.
// Back, Esc or the phone's Back close it; when the last one closes, the gallery goes back to its menu.
// The buttons are wired up like a small game: Main menu → Settings, Results → Victory → Post-game, and so on.
import { createContext, useContext, useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react'
import credits from '../content/credits.json'
import { TeachSample } from './Teach'
import seats from './content/seats.json' // player colours come from content JSON, like a game's would
import {
  ArtLayer, ArtStage, LevelMeter, PullHandle, TitleArt, type LevelStep,
  askConfirm, Bar, Button, Grid, ConnectionDot, Countdown, Counter, Credits, EmptyState, GameOver, HowToPlay, Hud, HudText, kitScreens,
  ListRow, Loading, Lobby, MainMenu, ModeSelect, Panel, Pause, PinnedBox, PlayerChip, PlayerSeats, PostGame, presets, Rank, Reconnecting, Results,
  HandView, IdleWarning, rackLayout, RewardPopup, RoundIntro, Row, Score, Screen, ScrollArea, ScreenStack, screens, SeatPicker, Selector, Settings, Spinner, Stack, Stepper, Text,
  TimerRing, Toggle, toast, Tooltip, TurnBanner, Victory, type HandPlace, type HandStage, type ToastPlace,
} from '../kit'

const noop = () => {}
// A game's own art (gallery/public/art/ — simple stand-ins): button pictures up / down, a logo, a backdrop, a frame
const art = (file: string) => `${import.meta.env.BASE_URL}art/${file}`
const redButton = { up: art('red-up.svg'), down: art('red-down.svg') }
const tealButton = { up: art('teal-up.svg'), down: art('teal-down.svg') }
const woodFrame = { src: art('frame.svg'), slice: [56, 56, 56, 56] as [number, number, number, number], scale: 0.0625, ink: 'on-game' as const }

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
      <Panel gap="m" className="kit-wide">
        <Grid gap="l" min="m">
          <Stack gap="m">
            <Row gap="s"><Text kind="heading">Tooltip</Text><Tooltip text="Rolling three sixes gives you a bonus turn." /></Row>
            <Row gap="m"><Spinner /><Text kind="caption">Spinner</Text></Row>
            <Stack gap="xs"><Text kind="label">Toasts at</Text>
              <Selector label="Toasts at" options={['top', 'center', 'bottom']} value={place} onChange={moveToasts} /></Stack>
          </Stack>
          <EmptyState icon="🏆" title="No trophies yet" message="Win a round to earn your first one." actionLabel="Play now" onAction={() => toast('Let’s go!')} />
        </Grid>
      </Panel>
    </Screen>
  )
}

// <Screen scroll>: a New-Game-style menu taller than a phone. The whole screen drags as one, with no scroll bar;
// turning on "More options" opens a section that pushes Start further down — still reachable by dragging
function ScrollingMenu() {
  const [players, setPlayers] = useState(2)
  const [board, setBoard] = useState('Medium')
  const [more, setMore] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const flag = (name: string) => (
    <ListRow key={name} label={name} detail="A rule you can switch on or off">
      <Toggle label={name} on={!!flags[name]} onChange={(on) => setFlags({ ...flags, [name]: on })} />
    </ListRow>
  )
  return (
    <Screen scroll label="New game">
      <Panel depth={2} gap="m">
        <Row gap="s" justify="between">
          <Text kind="title">New game</Text>
          <Button variant="secondary" onClick={() => screens.pop()}>Back</Button>
        </Row>
        <ListRow label="Players" detail="Who sits at the table"><Stepper label="Players" value={players} min={2} max={4} onChange={setPlayers} /></ListRow>
        <ListRow label="Board" detail="Bigger boards make longer games">
          <Selector label="Board" options={['Small', 'Medium', 'Large']} value={board} onChange={setBoard} />
        </ListRow>
        {['Short words', 'Hide pieces', 'Word hints'].map(flag)}
        <ListRow label="More options" detail="Opens more rules below"><Toggle label="More options" on={more} onChange={setMore} /></ListRow>
        {more && ['Timer', 'Bonus tiles', 'Steal turns', 'Double points', 'Sudden death'].map(flag)}
        <Button onClick={() => { toast('Starting!'); screens.pop() }}>Start</Button>
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
      vitals={<Stack gap="xs"><Bar label="Health" icon="❤" value={70} variant="danger" width="m" /><Bar label="Energy" value={40 + (tick % 4) * 20} variant="accent" width="s" showLabel />
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

// PINNED — kit pieces stuck to points on a stand-in table (a Goal row, then a row per player), sized WITH the
// table: make the window smaller and the chips shrink with the dice. The table is 12 units wide; a game's own
// adapter (CATALOG.md → Pinned) works out pixelsPerUnit from its camera, here it's just the table's width / 12.
// Each chip's right-middle sits on a point just left of its row's first die (anchor="right").
const TABLE_UNITS = 12
function PinnedTable() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = setInterval(() => setTick((n) => n + 1), 1500); return () => clearInterval(timer) }, [])
  const table = useRef<HTMLDivElement>(null)
  const [pixelsPerUnit, setPixelsPerUnit] = useState(0)
  useEffect(() => {
    const measure = () => setPixelsPerUnit((table.current?.offsetWidth ?? 0) / TABLE_UNITS)
    const watcher = new ResizeObserver(measure)
    if (table.current) watcher.observe(table.current)
    return () => watcher.disconnect()
  }, [])
  const players = [{ id: 'me', name: 'Muzzy', color: seats[3].color }, ...seats.slice(0, 3).map((s) => ({ ...s, badge: 'Bot' }))]
  const pin = { pixelsPerUnit, fit: [3.3, 1] as [number, number], rem: 0.3 }
  const row = (key: string, piece: ReactNode) => (
    <div key={key} className="gallery-table-row">
      <span className="gallery-table-point">{pixelsPerUnit > 0 && <PinnedBox {...pin} name={key}>{piece}</PinnedBox>}</span>
      {Array.from({ length: 6 }, (_, i) => <span key={i} className="gallery-die" />)}
    </div>
  )
  return (
    <Screen label="Pinned to the table" top={<HudText size="s">Chips grow and shrink with the table</HudText>}>
      <div ref={table} className="gallery-table">
        {row('goal', <PlayerChip name="Goal" avatar={false} showName={false} size="xs" score={12 + (tick % 3) * 4} />)}
        {players.map((p, i) => row(p.id, <PlayerChip name={p.name} showName={false} color={p.color} badge={'badge' in p ? p.badge : undefined}
          size="xs" detail={`S${1 + ((tick + i) % 3)} · T${3 + i}`} score={4 * i + tick} active={i === 0} />))}
      </div>
    </Screen>
  )
}

// HAND (rack preset) — HandView with plain shapes instead of game art: a disc per piece on a rounded place.
// Tap a piece to hold it (it lifts; the tap is found by data-place, like a game's input code would).
// E is "aimed" (played somewhere else: only a dashed ring). The 4th place is empty (a played piece's place).
// Swap 2 plays the shrink → grow stages on the first two pieces; Pass hides the hand; Wait dims it.
// Make room shows the target feedback for a piece dragged into the 3rd gap: the places slide apart + a marker line.
const HAND_TILE = 64 // how big the sample wants each place, in pixels (a game passes e.g. its board hex's size)
const HAND_MOTION = { shrinkTime: 0.25, growTime: 0.35, stagger: 0.12, overshoot: 0.15 }
const EMPTY = 'gap' // an empty place in the order (the table module's GAP)
function HandSample() {
  const room = useRef<HTMLDivElement>(null)
  const [roomWidth, setRoomWidth] = useState(0)
  useEffect(() => {
    const measure = () => setRoomWidth(room.current?.offsetWidth ?? 0)
    const watcher = new ResizeObserver(measure)
    if (room.current) watcher.observe(room.current)
    return () => watcher.disconnect()
  }, [])
  const [order, setOrder] = useState(['A', 'B', 'C', EMPTY, 'D', 'E', 'F', 'G'])
  const [held, setHeld] = useState<string | null>('B')
  const [stage, setStage] = useState<HandStage>()
  const [staged, setStaged] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [making, setMaking] = useState(false)
  const nextLetter = useRef(7) // the new pieces are H, I, J…
  const aimed = 'E'

  // Shrink two pieces away, swap them for new ones, grow those in, done
  const swap = () => {
    if (stage) return
    const picks = order.flatMap((id, i) => (id !== EMPTY && id !== aimed ? [i] : [])).slice(0, 2)
    const shrinkMs = (HAND_MOTION.shrinkTime + HAND_MOTION.stagger * (picks.length - 1)) * 1000 + 200
    const growMs = (HAND_MOTION.growTime + HAND_MOTION.stagger * (picks.length - 1)) * 1000
    setHeld(null); setStaged(picks); setStage('out')
    setTimeout(() => {
      setOrder((now) => now.map((id, i) => (picks.includes(i) ? String.fromCharCode(65 + (nextLetter.current++ % 26)) : id)))
      setStage('in')
    }, shrinkMs)
    setTimeout(() => { setStage(undefined); setStaged([]) }, shrinkMs + growMs)
  }

  const places: HandPlace<string>[] = order.map((id, i) => ({
    key: id === EMPTY ? `empty-${i}` : id,
    piece: id === EMPTY ? undefined : id,
    attrs: { 'data-place': i },
    held: id === held, aimed: id === aimed, waiting, staged: staged.includes(i),
  }))
  const layout = rackLayout({ room: roomWidth, tileWanted: HAND_TILE, places: order.length, tileMin: 44, gap: 8 })
  const tap = (e: MouseEvent<HTMLDivElement>) => {
    const index = (e.target as Element).closest('[data-place]')?.getAttribute('data-place')
    const id = index == null ? undefined : order[Number(index)]
    if (id && id !== EMPTY && id !== aimed && !stage) setHeld(id === held ? null : id)
  }
  return (
    <Screen label="Hand: rack" top={<HudText size="s">Tap a piece to hold it</HudText>}
      bottom={<Stack gap="m" className="gallery-hand">
        <Row gap="s" justify="center">
          <Button variant="secondary" compact onClick={swap}>Swap 2</Button>
          <Button variant="secondary" compact onClick={() => setHidden(!hidden)}>{hidden ? 'Show' : 'Pass'}</Button>
          <Button variant="secondary" compact onClick={() => setWaiting(!waiting)}>{waiting ? 'Go' : 'Wait'}</Button>
          <Button variant="secondary" compact onClick={() => setMaking(!making)}>{making ? 'Close up' : 'Make room'}</Button>
        </Row>
        <div ref={room} className="gallery-hand-room" onClick={tap}>
          {roomWidth > 0 && <HandView layout={layout} boxWidth={roomWidth} places={places} hidden={hidden} stage={stage} motion={HAND_MOTION}
            label="Your hand" insertAt={making ? 2 : undefined} makeRoomAt={making ? 2 : undefined}
            renderMarker={({ x, y, tile }) => <rect className="gallery-hand-marker" x={x - tile * 0.04} y={y - tile * 0.45}
              width={tile * 0.08} height={tile * 0.9} rx={tile * 0.04} />}
            renderEmpty={({ x, y, tile }) => <rect className="gallery-hand-place" x={x - tile * 0.46} y={y - tile * 0.46}
              width={tile * 0.92} height={tile * 0.92} rx={tile * 0.18} />}
            renderPiece={(place, { x, y, tile }) => (place.aimed
              ? <circle className="gallery-hand-ring" cx={x} cy={y} r={tile * 0.36} strokeWidth={tile * 0.05} strokeDasharray={`${tile * 0.1} ${tile * 0.08}`} />
              : <g className="gallery-hand-piece">
                <circle cx={x} cy={y} r={tile * 0.34} />
                {place.held && <circle className="gallery-hand-ring" cx={x} cy={y} r={tile * 0.41} strokeWidth={tile * 0.05} />}
                <text x={x} y={y} dy="0.35em" fontSize={tile * 0.36}>{place.piece}</text>
              </g>)} />}
        </div>
      </Stack>} />
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
  // children: the host's game options, under the players
  return <Lobby roomCode="QX2T" meId="me" hostId="me" players={players} onCreate={noop} onJoin={noop}
    onStart={() => screens.replace('countdown')} onLeave={() => screens.pop()}>
    <ListRow label="Board"><Selector label="Board" options={['Small', 'Large']} value="Small" onChange={noop} /></ListRow>
  </Lobby>
}

// Idle warning: the bar drains for 30 s, then "A bot is playing for you — tap to play"; the button stands in for any tap
function IdleSample({ startBot = false }: { startBot?: boolean }) {
  const [endsAt, setEndsAt] = useState<number | null>(() => (startBot ? null : Date.now() + 30_000))
  useEffect(() => {
    if (endsAt === null) return
    const takeover = setTimeout(() => setEndsAt(null), Math.max(0, endsAt - Date.now()))
    return () => clearTimeout(takeover)
  }, [endsAt])
  return (
    <Screen label="Idle warning">
      <IdleWarning endsAt={endsAt} botPlaying={endsAt === null} />
      <Button variant="secondary" onClick={() => setEndsAt(Date.now() + 30_000)}>Tap (I’m here)</Button>
    </Screen>
  )
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

// ── Art stage (0.12.0): a machine drawn from the game's own pictures — pull the lever (drag it down, or tap it):
// the screen slides away and back, and the level meter fills with the XP "earned" (a level-up on the way). The repair
// panel is drawn switched off. <Screen column>: a phone-shaped column on a wide window; title + gear at the bottom.
const levelNeeds = (level: number) => 3000 + 500 * level
function levelOf(total: number) {
  let level = 1, left = total
  while (left >= levelNeeds(level)) { left -= levelNeeds(level); level++ }
  return { level, xp: left, max: levelNeeds(level) }
}
// the bar's steps from one XP total to another: one per level it passes through
function stepsBetween(from: number, to: number): LevelStep[] {
  const steps: LevelStep[] = []
  let at = from
  for (;;) {
    const { level, xp, max } = levelOf(at)
    const end = Math.min(max, xp + (to - at))
    steps.push({ level, from: xp, to: end, max })
    at += end - xp
    if (end < max) return steps // stopped inside this level
    if (at >= to) return [...steps, { level: level + 1, from: 0, to: 0, max: levelNeeds(level + 1) }] // ended exactly on a level-up
  }
}
function ArtStageSample() {
  const [total, setTotal] = useState(2400)
  const [slide, setSlide] = useState<'out' | 'in' | undefined>()
  const [steps, setSteps] = useState<LevelStep[] | undefined>()
  const [play, setPlay] = useState(false)
  const [hint, setHint] = useState('Pull the lever')
  const now = levelOf(total)
  const slideEnd = () => {
    if (slide === 'out') { setSteps(stepsBetween(total, total + 1100)); setTotal((t) => t + 1100); setPlay(false); setSlide('in') }
    else { setSlide(undefined); setPlay(true) }
  }
  return (
    <Screen column backdrop={art('backdrop.svg')} slide={slide} onSlideEnd={slideEnd}
      bottom={<TitleArt src={art('logo.svg')} alt="Roll Better" size="s" />}
      bottomRight={<Button art={{ ...tealButton, label: 'hidden', size: 's' }} onClick={() => screens.push('settings')}>Settings</Button>}>
      <ArtStage size={[400, 640]} view={[0, 40, 400, 590]} viewShort={[0, 40, 400, 330]} label="Machine">
        <ArtLayer src={art('machine-body.svg')} at={[20, 180, 360, 440]} dim={slide === 'out'} />
        <ArtLayer at={[64, 222, 272, 52]} text={18} dim={slide === 'out'}>
          <LevelMeter words={{ label: 'Level' }} level={now.level} xp={now.xp} xpToNext={now.max} steps={steps} play={play}
            art={{ fill: art('meter-fill.svg'), ratio: 20 }} onLevelUp={(level) => setHint(`Level ${level}!`)} />
        </ArtLayer>
        <ArtLayer at={[64, 282, 272, 22]} text={16} tone={hint.startsWith('Level') ? 'accent' : 'muted'}>{hint}</ArtLayer>
        <ArtLayer src={art('machine-panel.svg')} at={[60, 345, 280, 170]} off label="Repair panel — not working yet" />
        <ArtLayer at={[60, 322, 280, 20]} text={16} tone="primary" off>Repair panel</ArtLayer>
        <ArtLayer at={[140, -110, 120, 300]}>
          <PullHandle label="Pull the lever" travel={0.35} pulled={slide === 'out'} onPull={() => { setHint('Pull the lever'); setSlide('out') }}>
            <img src={art('machine-lever.svg')} alt="" draggable={false} />
          </PullHandle>
        </ArtLayer>
      </ArtStage>
    </Screen>
  )
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
  // art skins (0.11.0): logo + backdrop + art buttons; the words still come from the game
  artstage: ArtStageSample,
  artmenu: () => <MainMenu title="Roll Better" titleArt={art('logo.svg')} backdrop={art('backdrop.svg')} subtitle="A dice game for friends" items={[
    { label: 'Play', onClick: () => screens.push('artend'), art: redButton }, { label: 'Settings', onClick: () => screens.push('settings'), art: tealButton },
  ]} />,
  modes: Modes,
  scrolling: ScrollingMenu,
  howto: () => <HowToPlay pages={howPages} />,
  credits: () => <Credits people={people} assets={credits} />,
  settings: () => <Settings info={{ version: '0.1.0' }} onAction={(id) => toast(`Action: ${id}`)} />,
  hud: HudSample,
  chips: PlayerChips,
  pinned: PinnedTable,
  hand: HandSample,
  pause: () => <Pause note="Doubles score twice · 13 rounds" onSettings={() => screens.push('settings')} onHowToPlay={() => screens.push('howto')} onQuit={() => { screens.pop(); screens.pop() }} />,
  loading: () => <Loading progress={0.6} tip="Tip: keep your sixes for the big rows." />,
  countdown: CountdownSample,
  round: () => <RoundIntro round={2} total={5} detail="Doubles score twice this round" />,
  results: () => <Results players={scores} meId="a" onContinue={() => screens.replace('victory')} />,
  endgame: () => <Results title="You win!" message="Muzzy takes it by 25 points." players={endScores} meId="a"
    onRematch={() => screens.replace('countdown')} onQuit={() => screens.pop()} />,
  // dim: the end of a game over the table — the game stays visible, darkened (here over the HUD)
  endgamedim: () => <Results dim title="You win!" message="Muzzy takes it by 25 points." players={endScores} meId="a"
    onRematch={() => screens.replace('countdown')} onQuit={() => { screens.pop(); screens.pop() }} />,
  victory: () => <Victory message="You beat Sam by 25 points." stats={stats} onContinue={() => screens.replace('postgame')}
    onQuit={() => screens.pop()} onSwipeUp={() => screens.pop()} words={{ swipe: '⇧ Swipe up to go back' }} />,
  gameover: () => <GameOver message="Out of lives on round 4." stats={stats} onRetry={() => screens.replace('countdown')} onQuit={() => screens.pop()} />,
  artend: () => <GameOver message="Out of lives on round 4." stats={stats} frame={woodFrame} backdrop={art('backdrop.svg')}
    art={{ retry: redButton, quit: tealButton }} onRetry={() => screens.replace('artmenu')} onQuit={() => screens.pop()} />,
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
  idle: () => <IdleSample />,
  idlebot: () => <IdleSample startBot />,
  teach: TeachSample,
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
const darkScreens = ['hud', 'chips', 'pinned']
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
