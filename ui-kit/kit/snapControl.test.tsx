// 0.13.0: SnapControl (a slider with snap stops / a dial with snap angles; drag AND tap), ArtLayer blink + shake,
// Button art size "fill".
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { SnapControl } from './controls'
import { Button } from './controls'
import { nearestAngle, nearestStop, nearestTurn, nextClockwise } from './controls/SnapControl'
import { ArtLayer, ArtStage } from './artStage'

afterEach(cleanup)
const rootOf = (hit: HTMLElement) => hit.closest('.kit-snap') as HTMLElement
const shown = (hit: HTMLElement) => Number(rootOf(hit).style.getPropertyValue('--kit-snap'))
// the control's box on screen: a 200 × 50 track at the origin, or a 100 × 100 dial
const boxed = (hit: HTMLElement, w: number, h: number) => {
  rootOf(hit).getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) })
}
const press = (el: HTMLElement, path: [number, number][], id = 1) => {
  fireEvent.pointerDown(el, { pointerId: id, clientX: path[0][0], clientY: path[0][1] })
  for (const [x, y] of path.slice(1)) fireEvent.pointerMove(el, { pointerId: id, clientX: x, clientY: y })
  const [x, y] = path[path.length - 1]
  fireEvent.pointerUp(el, { pointerId: id, clientX: x, clientY: y })
}

// A game that keeps whatever the control says (or refuses every move)
function Slide({ start = 1, refuse = false, onChange = () => {} }: { start?: number; refuse?: boolean; onChange?: (i: number) => void }) {
  const [v, setV] = useState(start)
  return <SnapControl label="Slider" stops={3} knob={0.25} value={v} onChange={(i) => { onChange(i); if (!refuse) setV(i) }} valueText={(i) => ['left', 'middle', 'right'][i]} />
}
function Dial({ onChange = () => {} }: { onChange?: (i: number) => void }) {
  const [v, setV] = useState(0)
  return <SnapControl kind="turn" label="Dial" angles={[310, 50, 140, 220]} value={v} onChange={(i) => { onChange(i); setV(i) }} />
}

describe('SnapControl helpers', () => {
  it('nearest stop / angle, the short way round, next clockwise', () => {
    expect(nearestStop(0.4, 3)).toBe(1)
    expect(nearestStop(0.9, 2)).toBe(1)
    expect(nearestAngle(20, [310, 50, 140, 220])).toBe(1) // 20° is nearer 50 than 310 (−50)
    expect(nearestAngle(-30, [310, 50, 140, 220])).toBe(0) // −30 = 330
    expect(nearestTurn(310, 20)).toBe(-50) // from 20° to 310° is 70° back, not 290° forward
    expect(nextClockwise(0, [310, 50, 140, 220])).toBe(1) // 310 → 50 (through up)
    expect(nextClockwise(1, [310, 50, 140, 220], -1)).toBe(0)
  })
})

describe('SnapControl — slide', () => {
  it('is read out as a slider at its stop; the knob rests at the stop (0 → 1)', () => {
    render(<Slide />)
    const hit = screen.getByRole('slider', { name: 'Slider' })
    expect(hit.getAttribute('aria-valuenow')).toBe('1')
    expect(hit.getAttribute('aria-valuetext')).toBe('middle')
    expect(hit.getAttribute('aria-orientation')).toBe('horizontal')
    expect(shown(hit)).toBe(0.5)
  })

  it('a drag starts from where the knob IS (no jump), follows the finger, and settles at the nearest stop', () => {
    const onChange = vi.fn()
    render(<Slide onChange={onChange} />)
    const hit = screen.getByRole('slider')
    boxed(hit, 200, 50) // knob 50 long → the knob travels 150 px from stop 0 to stop 2
    fireEvent.pointerDown(hit, { pointerId: 1, clientX: 20, clientY: 25 }) // pressed far from the knob
    fireEvent.pointerMove(hit, { pointerId: 1, clientX: 23, clientY: 25 }) // inside the tap slop: nothing yet
    expect(shown(hit)).toBe(0.5)
    expect(rootOf(hit).dataset.dragging).toBeUndefined()
    fireEvent.pointerMove(hit, { pointerId: 1, clientX: 50, clientY: 25 }) // +30 px = +0.2
    expect(shown(hit)).toBeCloseTo(0.7)
    expect(rootOf(hit).dataset.dragging).toBe('true')
    fireEvent.pointerMove(hit, { pointerId: 1, clientX: 400, clientY: 25 }) // past the end: held at the end
    expect(shown(hit)).toBe(1)
    fireEvent.pointerUp(hit, { pointerId: 1, clientX: 400, clientY: 25 })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(2)
    expect(shown(hit)).toBe(1)
  })

  it('a small drag that settles back on the same stop changes nothing — and is never also a tap', () => {
    const onChange = vi.fn()
    render(<Slide onChange={onChange} />)
    const hit = screen.getByRole('slider')
    boxed(hit, 200, 50)
    press(hit, [[150, 25], [165, 25], [170, 25]]) // dragged 20 px (0.13): back to the middle
    expect(onChange).not.toHaveBeenCalled()
    expect(shown(hit)).toBe(0.5)
  })

  it('a tap goes to the stop nearest the tap; a tap on the knob itself steps it toward that side', () => {
    const onChange = vi.fn()
    render(<Slide onChange={onChange} />)
    const hit = screen.getByRole('slider')
    boxed(hit, 200, 50)
    press(hit, [[10, 25]]) // left end
    expect(onChange).toHaveBeenLastCalledWith(0)
    press(hit, [[30, 25]]) // on the knob (now at the left end): one step right
    expect(onChange).toHaveBeenLastCalledWith(1)
    press(hit, [[190, 25]])
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('a game that refuses the move: the knob goes back to its value', () => {
    render(<Slide refuse />)
    const hit = screen.getByRole('slider')
    boxed(hit, 200, 50)
    press(hit, [[100, 25], [140, 25], [200, 25]])
    expect(shown(hit)).toBe(0.5)
    expect(hit.getAttribute('aria-valuenow')).toBe('1')
  })

  it('keys: arrows step, Home / End, Enter = a tap; a vertical one uses ↑ ↓', () => {
    const onChange = vi.fn()
    render(<><Slide onChange={onChange} /><SnapControl label="Up down" axis="y" stops={2} value={1} onChange={onChange} /></>)
    const [x, y] = screen.getAllByRole('slider')
    fireEvent.keyDown(x, { key: 'ArrowLeft' }); expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(x, { key: 'End' }); expect(onChange).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(x, { key: 'Enter' }); expect(onChange).toHaveBeenLastCalledWith(1)
    expect(y.getAttribute('aria-orientation')).toBe('vertical')
    fireEvent.keyDown(y, { key: 'ArrowUp' }); expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('disabled: no drag, no tap, no keys, out of the tab order', () => {
    const onChange = vi.fn()
    render(<SnapControl label="Off" value={0} onChange={onChange} disabled />)
    const hit = screen.getByRole('slider')
    boxed(hit, 200, 50)
    press(hit, [[190, 25]])
    press(hit, [[10, 25], [100, 25], [190, 25]])
    fireEvent.keyDown(hit, { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
    expect(hit.getAttribute('tabindex')).toBe('-1')
  })
})

describe('SnapControl — turn (a dial)', () => {
  it('a drag turns it by how far the finger goes round the centre, then it settles on the nearest corner', () => {
    const onChange = vi.fn()
    render(<Dial onChange={onChange} />)
    const hit = screen.getByRole('slider', { name: 'Dial' })
    boxed(hit, 100, 100)
    expect(shown(hit)).toBe(310)
    // grab at the top (0°) and go round to the right (90°): +90 from where it was
    press(hit, [[50, 0], [80, 10], [100, 50]])
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1) // 310 + 90 = 400 = 40° → nearest is 50°
    expect(shown(hit)).toBe(410) // 50° the short way from 400 (no spin back round)
  })

  it('the middle of the dial does not turn it (tiny moves there would spin it)', () => {
    const onChange = vi.fn()
    render(<Dial onChange={onChange} />)
    const hit = screen.getByRole('slider')
    boxed(hit, 100, 100)
    press(hit, [[50, 0], [51, 49], [49, 51], [50, 0]])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('a tap steps it to the next corner clockwise; arrows step both ways', () => {
    const onChange = vi.fn()
    render(<Dial onChange={onChange} />)
    const hit = screen.getByRole('slider')
    boxed(hit, 100, 100)
    press(hit, [[50, 50]])
    expect(onChange).toHaveBeenLastCalledWith(1)
    expect(shown(hit)).toBe(410) // 310 → 50 clockwise = +100, not back round
    fireEvent.keyDown(hit, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(0)
    expect(shown(hit)).toBe(310)
  })
})

describe('ArtLayer blink + shake, Button art fill', () => {
  it('blink marks the layer (not when off); each shake count change flips the wobble so it replays', () => {
    const { container, rerender } = render(<ArtStage size={[10, 10]}><ArtLayer at={[0, 0, 5, 5]} blink="fast" shake={0} /><ArtLayer at={[0, 0, 5, 5]} blink="slow" off /></ArtStage>)
    const [a, b] = container.querySelectorAll('.kit-art-layer') as NodeListOf<HTMLElement>
    expect(a.dataset.blink).toBe('fast')
    expect(b.dataset.blink).toBeUndefined()
    expect(a.dataset.shake).toBeUndefined()
    rerender(<ArtStage size={[10, 10]}><ArtLayer at={[0, 0, 5, 5]} blink="fast" shake={1} /></ArtStage>)
    expect(a.dataset.shake).toBe('a')
    rerender(<ArtStage size={[10, 10]}><ArtLayer at={[0, 0, 5, 5]} blink="fast" shake={2} /></ArtStage>)
    expect(a.dataset.shake).toBe('b')
  })

  it('a fill picture button: marked fill, words read out', () => {
    render(<Button art={{ up: '/u.svg', down: '/d.svg', label: 'hidden', size: 'fill' }}>Blue</Button>)
    const b = screen.getByRole('button', { name: 'Blue' })
    expect(b.dataset.artSize).toBe('fill')
  })
})
