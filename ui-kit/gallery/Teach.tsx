// TEACH SAMPLE (?screen=teach) — Callout on targets in every corner (each asks for a side that doesn't fit, so it
// flips), a pause (dim + pulse + Got it), and callouts aimed at a screen point and at a moving piece.
// The corner tips use the tips memory: tap one and it's seen (gone until Reset tips); Tips off hides them all.
// &teach=spotlight or &teach=point opens straight on that view (for the screenshots).
import { useEffect, useState } from 'react'
import { Button, Callout, Panel, Row, Screen, Selector, Stack, Text, Toggle, useTips, type CalloutPoint } from '../kit'

const views = ['Edges', 'Spotlight', 'Point']
const firstView = () => {
  const asked = new URLSearchParams(location.search).get('teach') ?? ''
  return views.find((v) => v.toLowerCase() === asked.toLowerCase()) ?? 'Edges'
}

// The corner targets: each asks for the side that runs off the screen, so the callout has to flip
const corners = [
  { id: 'teach-tl', slot: 'topLeft', label: 'Menu', placement: 'top', text: 'Asked for the top, so it flips below.' },
  { id: 'teach-tr', slot: 'topRight', label: '?', placement: 'right', text: 'Asked for the right: it flips left.' },
  { id: 'teach-bl', slot: 'bottomLeft', label: 'Undo', placement: 'left', text: 'Asked for the left: it flips right.' },
  { id: 'teach-br', slot: 'bottomRight', label: 'Plant', placement: 'bottom', text: 'Asked for the bottom: it flips above.' },
] as const

export function TeachSample() {
  const [view, setView] = useState(firstView)
  const tips = useTips()
  const [paused, setPaused] = useState(true)
  const slots = Object.fromEntries(corners.map((c) => [c.slot, <Button key={c.id} variant="secondary" data-teach={c.id}>{c.label}</Button>]))
  return (<>
    {view === 'Point' && <div className="gallery-teach-dots" />}
    <Screen label="Callouts" {...slots}>
      <Panel gap="s" className="gallery-teach">
        <Text kind="heading">Callouts</Text>
        <Selector label="View" options={views} value={view} onChange={(v) => { setView(v); setPaused(true) }} />
        {view === 'Edges' && <>
          <Row gap="s" justify="between"><Text kind="label">Tips</Text><Toggle label="Tips" on={tips.tipsOn} onChange={tips.setTipsOn} /></Row>
          <Row gap="s" justify="between">
            <Text kind="caption">{`Seen ${tips.seenIds.length} of ${corners.length}`}</Text>
            <Button variant="secondary" onClick={tips.resetTips}>Reset tips</Button>
          </Row>
        </>}
        {view === 'Spotlight' && <Row gap="s" justify="center">
          <Button variant="secondary" onClick={() => setPaused(true)}>Undo</Button>
          <Button data-teach="teach-plant" onClick={() => setPaused(true)}>Plant · +5</Button>
        </Row>}
        {view === 'Point' && <Stack gap="s" className="gallery-teach-track"><span className="gallery-teach-mover" data-teach="teach-mover" /></Stack>}
      </Panel>
      {view === 'Edges' && corners.filter((c) => tips.shouldShow(c.id)).map((c) => (
        <Callout key={c.id} target={`[data-teach="${c.id}"]`} placement={c.placement} text={c.text} onDismiss={() => tips.markSeen(c.id)} />
      ))}
      {view === 'Spotlight' && paused && (
        <Callout target='[data-teach="teach-plant"]' dim pulse title="No word, no Magic"
          text="You can swap seeds you don’t want." action="Got it" onDismiss={() => setPaused(false)} />
      )}
      {view === 'Point' && <PointCallouts />}
    </Screen>
  </>)
}

// One callout aimed at a fixed point near the bottom-right (a point has no size; the dot under it is drawn by
// .gallery-teach-dots at the same 80% / 88% of the game area), one following a moving piece
function PointCallouts() {
  const [point, setPoint] = useState<CalloutPoint | null>(null)
  useEffect(() => {
    const area = document.querySelector('.gallery-teach-dots')
    const measure = () => {
      const r = area?.getBoundingClientRect()
      if (r) setPoint({ x: r.left + r.width * 0.8, y: r.top + r.height * 0.88 })
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
