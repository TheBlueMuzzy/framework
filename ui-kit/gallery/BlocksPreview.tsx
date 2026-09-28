// BLOCK PREVIEW — ?block=<name> shows one built screen full-size over a stand-in game,
// for checking by eye and for screenshots. Temporary: F05 folds this into the gallery menu.
import { useEffect, useState, type ComponentType } from 'react'
import credits from '../content/credits.json'
import {
  askConfirm, Credits, EmptyState, HowToPlay, MainMenu, ModeSelect, kitScreens, Panel, RewardPopup, Row, Screen, ScreenStack, screens,
  Spinner, Stack, Text, toast, ToastStack, Tooltip,
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

// name → its screens for the stack, what to open at the start, and what sits underneath
type Demo = { screens?: Record<string, ComponentType>; open?: () => void; base?: ComponentType }
const demos: Record<string, Demo> = {
  feedback: { base: Feedback },
  confirm: { open: () => askConfirm({ title: 'Reset progress?', message: 'All your unlocks and scores will be gone. This can’t be undone.', danger: true, onConfirm: () => {}, words: { yes: 'Reset' } }) },
  rewards: { screens: { rewards: Rewards }, open: () => screens.push('rewards') },
  menu: { base: () => <MainMenu title="Roll Better" subtitle="A dice game for friends" version="v0.1.0" onContinue={noop} onPlay={noop} onSettings={noop} onHowToPlay={noop} onCredits={noop} onQuit={noop} /> },
  modes: { screens: { modes: Modes }, open: () => screens.push('modes') },
  howto: { screens: { howto: () => <HowToPlay pages={howPages} /> }, open: () => screens.push('howto') },
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
