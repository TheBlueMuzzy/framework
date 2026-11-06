// TEACH SAMPLE (?screen=teach) — Callout on targets in every corner, one at a time (each asks for a side that
// doesn't fit, so it flips; tap it for the next), a pause (dim + pulse + Got it), and callouts aimed at a screen point and at a moving piece.
// The corner tips use the tips memory: tap one and it's seen (gone until Reset tips); Tips off hides them all.
// Board (0.43.0): the Spotlight (two holes) + a Callout keeping clear of the board.
// &teach=spotlight, &teach=point or &teach=board opens straight on that view (for the screenshots).
import { useEffect, useState } from 'react'
import { Button, Callout, Panel, Row, Screen, Selector, Spotlight, Stack, Text, Toggle, useTips, type CalloutPoint } from '../kit'

const views = ['Edges', 'Spotlight', 'Point', 'Board']
// Read once when the gallery loads (the gallery rewrites its link as it opens a screen, dropping &teach=)
const askedView = new URLSearchParams(location.search).get('teach') ?? ''
const firstView = () => views.find((v) => v.toLowerCase() === askedView.toLowerCase()) ?? 'Edges'

// The corner targets: each asks for the side that runs off the screen, so the callout has to flip
const corners = [
  { id: 'teach-tl', slot: 'topLeft', label: 'Score', placement: 'top', text: 'I asked to sit above. No room, so I moved.' },
  { id: 'teach-tr', slot: 'topRight', label: '?', placement: 'right', text: 'I asked for the right. No room, so I moved.' },
  { id: 'teach-bl', slot: 'bottomLeft', label: 'Undo', placement: 'left', text: 'I asked for the left. No room, so I moved.' },
  { id: 'teach-br', slot: 'bottomRight', label: 'Plant', placement: 'bottom', text: 'I asked to sit below. No room, so I moved.' },
] as const

export function TeachSample() {
  const [view, setView] = useState(firstView)
  const tips = useTips()
  const [paused, setPaused] = useState(true)
  const nextTip = corners.find((c) => tips.shouldShow(c.id)) // one tip at a time, like a game (tap it: the next one)
  const slots = Object.fromEntries(corners.map((c) => [c.slot, <Button key={c.id} variant="secondary" data-teach={c.id}>{c.label}</Button>]))
  // Point view: a dot in the bottom slot shows where the point is (the callout is only given its x, y)
  const dot = view === 'Point' ? <span className="gallery-teach-dot" data-teach="teach-dot" /> : undefined
  const [board, setBoard] = useState({ on: true, at: 0 }) // Board view: the lesson's step, and whether it's up
  const switcher = <Selector label="View" options={views} value={view} onChange={(v) => { setView(v); setPaused(true) }} />
  return (
    // (Board view: no corner buttons — the board needs the room on a short screen)
    // (Board view: no corner buttons, and the view switcher up in the top slot — the room round the board is the
    // bubble's, so it never has to cover the switcher to keep off the board)
    <Screen label="Callouts" {...(view === 'Board' ? { top: <Row className="gallery-teach-switch">{switcher}</Row> } : slots)} bottom={dot}>
      <Panel gap="s" className="gallery-teach">
        {view !== 'Board' && <Text kind="heading">Callouts</Text>}
        {view !== 'Board' && switcher}
        {view === 'Edges' && <Row gap="s" justify="between">
          <Row gap="s"><Text kind="label">Tips</Text><Toggle label="Tips" on={tips.tipsOn} onChange={tips.setTipsOn} /></Row>
          <Button variant="secondary" onClick={tips.resetTips}>{`Reset (${tips.seenIds.length} seen)`}</Button>
        </Row>}
        {view === 'Spotlight' && <Row gap="s" justify="center">
          <Button variant="secondary" onClick={() => setPaused(true)}>Undo</Button>
          <Button data-teach="teach-plant" onClick={() => setPaused(true)}>Plant · +5</Button>
        </Row>}
        {view === 'Point' && <Stack gap="s" className="gallery-teach-track"><span className="gallery-teach-mover" data-teach="teach-mover" /></Stack>}
        {view === 'Board' && <Row gap="l" justify="center" className="gallery-teach-play">
          <BoardGrid />
          {/* Plant is in a hole: a tap reaches it (the next step). A tap on the dim ends the lesson; this brings it back */}
          {board.on ? <Button data-teach="teach-plant" onClick={() => setBoard({ on: true, at: board.at + 1 })}>Plant</Button>
            : <Button variant="secondary" onClick={() => setBoard({ on: true, at: 0 })}>Teach again</Button>}
        </Row>}
      </Panel>
      {view === 'Edges' && nextTip && (
        <Callout key={nextTip.id} target={`[data-teach="${nextTip.id}"]`} placement={nextTip.placement} text={nextTip.text} onDismiss={() => tips.markSeen(nextTip.id)} />
      )}
      {view === 'Spotlight' && paused && (
        <Callout target='[data-teach="teach-plant"]' dim pulse title="No word, no Magic"
          text="You can swap seeds you don’t want." action="Got it" onDismiss={() => setPaused(false)} />
      )}
      {view === 'Point' && <PointCallouts />}
      {view === 'Board' && board.on && <BoardTeach at={board.at} next={() => setBoard({ on: true, at: board.at + 1 })} end={() => setBoard({ on: false, at: 0 })} />}
    </Screen>
  )
}

// BOARD (0.43.0, F199): a Spotlight lights two things at once — the cell being taught and the Plant button — and a
// Callout keeps clear of the board (keepClear: as little of it covered as it can, away from the live cell, toward the
// board's nearer edge). Tap the bubble or Plant (it's in a hole, so the tap reaches it) for the next step — each step
// puts the cell and the live cell somewhere else; a tap on the dim ends the lesson (onOutsideTap).
const boardSize = 6
const boardSteps = [
  { cell: [0, 0], live: [3, 0], text: 'I keep off the board.' },
  { cell: [5, 0], live: null, text: 'Nearer edge: off it.' },
  { cell: [3, 1], live: [1, 1], text: 'Not toward the glow.' },
] as const
const cellSel = ([r, c]: readonly [number, number]) => `[data-teach="cell-${r}-${c}"]`

function BoardGrid() {
  return (
    <div className="gallery-teach-board" data-teach="teach-board">
      {Array.from({ length: boardSize * boardSize }, (_, i) => {
        const r = Math.floor(i / boardSize), c = i % boardSize
        return <span key={i} className="gallery-teach-cell" data-teach={`cell-${r}-${c}`} />
      })}
    </div>
  )
}

function BoardTeach({ at, next, end }: { at: number; next: () => void; end: () => void }) {
  const step = boardSteps[at % boardSteps.length]
  // The live cell glows (what the player is working on): a game draws its own; here a data attribute
  useEffect(() => {
    const el = step.live && document.querySelector(cellSel(step.live))
    el?.setAttribute('data-live', '')
    return () => el?.removeAttribute('data-live')
  }, [step])
  return <>
    <Spotlight targets={[cellSel(step.cell), '[data-teach="teach-plant"]']} pulse onOutsideTap={end} />
    <Callout key={at} target={cellSel(step.cell)} text={step.text} onDismiss={next}
      keepClear={{ area: '[data-teach="teach-board"]', live: step.live ? cellSel(step.live) : null, avoid: ['[data-teach="teach-plant"]', '.gallery-teach-switch'] }} />
  </>
}

// One callout aimed at a screen point (a point has no size: the dot's centre, measured once and on resize — the
// callout never sees the dot itself), one following a moving piece
function PointCallouts() {
  const [point, setPoint] = useState<CalloutPoint | null>(null)
  useEffect(() => {
    const measure = () => {
      const r = document.querySelector('[data-teach="teach-dot"]')?.getBoundingClientRect()
      if (r) setPoint({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])
  return <>
    {point && <Callout target={point} text="Aimed at a point on the screen." />}
    <Callout target='[data-teach="teach-mover"]' placement="top" text="I follow it as it moves." />
  </>
}
