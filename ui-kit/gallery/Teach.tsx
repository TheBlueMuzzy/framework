// TEACH SAMPLE (?screen=teach) — Callout on targets in every corner, one at a time (each asks for a side that
// doesn't fit, so it flips; tap it for the next), a pause (dim + pulse + Got it), and callouts aimed at a screen point and at a moving piece.
// The corner tips use the tips memory: tap one and it's seen (gone until Reset tips); Tips off hides them all.
// &teach=spotlight or &teach=point opens straight on that view (for the screenshots).
import { useEffect, useState } from 'react'
import { Button, Callout, Panel, Row, Screen, Selector, Stack, Text, Toggle, useTips, type CalloutPoint } from '../kit'

const views = ['Edges', 'Spotlight', 'Point']
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
  return (
    <Screen label="Callouts" {...slots} bottom={dot}>
      <Panel gap="s" className="gallery-teach">
        <Text kind="heading">Callouts</Text>
        <Selector label="View" options={views} value={view} onChange={(v) => { setView(v); setPaused(true) }} />
        {view === 'Edges' && <Row gap="s" justify="between">
          <Row gap="s"><Text kind="label">Tips</Text><Toggle label="Tips" on={tips.tipsOn} onChange={tips.setTipsOn} /></Row>
          <Button variant="secondary" onClick={tips.resetTips}>{`Reset (${tips.seenIds.length} seen)`}</Button>
        </Row>}
        {view === 'Spotlight' && <Row gap="s" justify="center">
          <Button variant="secondary" onClick={() => setPaused(true)}>Undo</Button>
          <Button data-teach="teach-plant" onClick={() => setPaused(true)}>Plant · +5</Button>
        </Row>}
        {view === 'Point' && <Stack gap="s" className="gallery-teach-track"><span className="gallery-teach-mover" data-teach="teach-mover" /></Stack>}
      </Panel>
      {view === 'Edges' && nextTip && (
        <Callout key={nextTip.id} target={`[data-teach="${nextTip.id}"]`} placement={nextTip.placement} text={nextTip.text} onDismiss={() => tips.markSeen(nextTip.id)} />
      )}
      {view === 'Spotlight' && paused && (
        <Callout target='[data-teach="teach-plant"]' dim pulse title="No word, no Magic"
          text="You can swap seeds you don’t want." action="Got it" onDismiss={() => setPaused(false)} />
      )}
      {view === 'Point' && <PointCallouts />}
    </Screen>
  )
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
