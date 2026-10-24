// PARTS — every layout box and control on one page, built only from style names.
import { useState, type ReactNode } from 'react'
import {
  Hud, Panel, Stack, Row, Grid,
  Avatar, Badge, Button, Card, Carousel, ListRow, ProgressBar, RoomCodeInput, ScrollArea,
  Selector, Slider, Stepper, Tabs, Text, TextInput, Toggle,
} from '../kit'
import { ScreensDemo } from './ScreensDemo'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="m">
      <Text kind="title">{title}</Text>
      {children}
    </Stack>
  )
}

export function Parts({ onMenu }: { onMenu: () => void }) {
  return (
    <main className="gallery">
      <Stack gap="xl">
        <Row gap="m">
          <Button variant="secondary" onClick={onMenu}>◀ Menu</Button>
          <Text kind="display">Parts</Text>
        </Row>
        <LayoutBoxes />
        <ScreensDemo />
        <Buttons />
        <Inputs />
        <Display />
      </Stack>
    </main>
  )
}

function LayoutBoxes() {
  return (
    <Section title="Layout boxes">
      <Text kind="caption">Screen: safe slots around the edges, the centre in the middle. Taps pass through empty space.</Text>
      <div className="gallery-stage">
        {/* Built with Hud (0.33.2): its corners keep their width and, in a narrow box, the middle takes its own row.
            As a plain Screen, "Round 2" slid over the Health bar at 200% text (a plain Screen's three columns let a
            corner shrink to nothing — fine for menus, which is what plain Screens are for). */}
        <Hud
          words={{ label: 'HUD demo' }}
          vitals={<Row gap="s"><Avatar name="Muzzy" active /><ProgressBar label="Health" value={0.7} variant="danger" /></Row>}
          status={<Badge variant="primary">Round 2</Badge>}
          onPause={() => {}}
          bottomLeft={<Badge>corner</Badge>}
          actions={<Button>Roll</Button>}
          bottomRight={<Badge variant="danger">3 left</Badge>}
          banner={<Panel depth={2}><Text kind="heading">Centre</Text></Panel>}
        />
      </div>
      <Grid gap="m" min="m">
        <Panel gap="s"><Text kind="label">Panel · Stack</Text><Badge>one</Badge><Badge>two</Badge><Badge>three</Badge></Panel>
        <Panel gap="s"><Text kind="label">Row (wraps)</Text><Row gap="s"><Badge>one</Badge><Badge>two</Badge><Badge>three</Badge><Badge>four</Badge></Row></Panel>
        <Panel gap="s"><Text kind="label">Grid</Text><Grid gap="s" min="s"><Badge>1</Badge><Badge>2</Badge><Badge>3</Badge><Badge>4</Badge></Grid></Panel>
        <Panel gap="s" depth={2}><Text kind="label">Panel, depth 2</Text><Text kind="caption">Shadows come from the style.</Text></Panel>
      </Grid>
    </Section>
  )
}

function Buttons() {
  return (
    <Section title="Buttons">
      <Row gap="s">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Delete save</Button>
        <Button variant="secondary" icon aria-label="Settings">⚙</Button>
        <Button loading>Joining</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" size={72}>Piece-sized</Button>
        <Button variant="secondary" size={72} compact>Compact</Button>
      </Row>
    </Section>
  )
}

function Inputs() {
  const [tab, setTab] = useState('Audio')
  const [music, setMusic] = useState(true)
  const [shake, setShake] = useState(false)
  const [volume, setVolume] = useState(70)
  const [difficulty, setDifficulty] = useState('Normal')
  const [players, setPlayers] = useState(2)
  const [code, setCode] = useState('')
  return (
    <Section title="Inputs">
      <Tabs label="Settings" tabs={['Audio', 'Display', 'Controls', 'Accessibility']} value={tab} onChange={setTab} />
      <Panel gap="xs">
        <ListRow label="Music"><Toggle label="Music" on={music} onChange={setMusic} /></ListRow>
        <ListRow label="Screen shake" detail="Off is easier on the eyes"><Toggle label="Screen shake" on={shake} onChange={setShake} /></ListRow>
        <ListRow label="Volume"><Slider label="Volume" value={volume} onChange={setVolume} /></ListRow>
        <ListRow label="Difficulty"><Selector label="Difficulty" options={['Easy', 'Normal', 'Hard']} value={difficulty} onChange={setDifficulty} /></ListRow>
        <ListRow label="Players"><Stepper label="Players" value={players} min={1} max={4} onChange={setPlayers} /></ListRow>
        <ListRow label="Credits" detail="A whole row can be a button" onClick={() => {}}><Text kind="caption">›</Text></ListRow>
      </Panel>
      <Grid gap="m" min="m">
        <TextInput label="Your name" placeholder="Player 1" />
        <Stack gap="xs"><Text kind="label">Room code</Text><RoomCodeInput length={4} value={code} onChange={setCode} /></Stack>
      </Grid>
    </Section>
  )
}

function Display() {
  const [mode, setMode] = useState('Party')
  const players = ['Muzzy', 'Sherman M', 'Ada', 'Lin', 'Sam', 'Kai']
  return (
    <Section title="Display">
      <Grid gap="m" min="s">
        {['Solo', 'Party', 'Online'].map((m) => (
          <Card key={m} title={m} selected={mode === m} onClick={() => setMode(m)}>
            <Text kind="caption">{m === 'Online' ? 'Room code play' : 'Pick a mode'}</Text>
          </Card>
        ))}
      </Grid>
      <Panel gap="xs">
        <Text kind="label">Carousel (moves on every 4 s; tap, ◀ ▶ or swipe holds it 3 s)</Text>
        <Carousel label="Highlights">
          {[['Lockdown', 'Blue: 9 moves → 2'], ['Long word', 'GARDENS, 7 letters'], ['Close call', 'One move from tangled, got out']].map(([title, why]) => (
            <Row key={title} gap="s"><Text kind="label">{title}</Text><Text kind="caption">{why}</Text></Row>
          ))}
        </Carousel>
      </Panel>
      <Row gap="s"><Badge>Neutral</Badge><Badge variant="primary">NEW</Badge><Badge variant="danger">3</Badge></Row>
      <Row gap="s">{players.slice(0, 4).map((p, i) => <Avatar key={p} name={p} active={i === 0} />)}</Row>
      <Stack gap="s">
        <ProgressBar label="Loading" value={0.45} />
        <ProgressBar label="XP" value={0.8} variant="accent" />
        <ProgressBar label="Health" value={0.25} variant="danger" />
      </Stack>
      <Panel gap="xs">
        <Text kind="label">Scroll area</Text>
        <ScrollArea label="Players" max="s">
          {players.map((p, i) => <ListRow key={p} label={p} detail={`${(6 - i) * 120} pts`}><Avatar name={p} /></ListRow>)}
        </ScrollArea>
      </Panel>
      <Stack gap="xs">
        <Text kind="display">Display</Text>
        <Text kind="title">Title</Text>
        <Text kind="heading">Heading</Text>
        <Text kind="body">Body text — never below the accessibility floor.</Text>
        <Text kind="label">Label</Text>
        <Text kind="caption">Caption</Text>
      </Stack>
    </Section>
  )
}
