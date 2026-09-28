// IN GAME — Pause, the HUD frame, and the HUD pieces that go in it.
import { Row } from '../layout'

// PIPS — a row of little segments, some filled (hearts, lives, page dots, "3 of 5").
export function Pips({ count, filled, label }: { count: number; filled: number; label: string }) {
  return (
    <Row gap="xs" className="kit-pips" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={count} aria-valuenow={filled}>
      {Array.from({ length: count }, (_, i) => <span key={i} className="kit-pip" data-state={i < filled ? 'on' : undefined} />)}
    </Row>
  )
}
