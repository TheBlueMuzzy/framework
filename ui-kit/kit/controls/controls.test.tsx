// Behaviour tests for the controls that have real logic: Selector, Stepper, Tabs, RoomCodeInput, Button size.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Button, RoomCodeInput, ScrollArea, Selector, Stepper, Tabs, Toggle, setControlSound } from '.'

afterEach(cleanup)

function SelectorDemo() {
  const [value, setValue] = useState('Easy')
  return <Selector label="Difficulty" options={['Easy', 'Normal', 'Hard']} value={value} onChange={setValue} />
}

function RoomCodeDemo() {
  const [code, setCode] = useState('')
  return <RoomCodeInput length={4} value={code} onChange={setCode} />
}

const boxes = () => screen.getAllByRole('textbox') as HTMLInputElement[]
const code = () => boxes().map((box) => box.value).join('')

describe('Selector ◀ option ▶', () => {
  it('holds an invisible copy of every option, so it is as wide as the longest and never changes width (0.10.4)', () => {
    const { container } = render(<SelectorDemo />)
    const sizers = [...container.querySelectorAll('.kit-picker-sizer')]
    expect(sizers.map((s) => s.textContent)).toEqual(['Easy', 'Normal', 'Hard'])
    expect(sizers.every((s) => s.getAttribute('aria-hidden') === 'true')).toBe(true) // read out once, as the value
    expect(screen.getByRole('status').textContent).toBe('Easy')
  })

  it('steps with the arrow keys and wraps around', () => {
    render(<SelectorDemo />)
    const group = screen.getByRole('group', { name: 'Difficulty' })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(group.textContent).toContain('Normal')
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(group.textContent).toContain('Hard') // wrapped from Easy to the end
  })

  it('steps with the ◀ ▶ buttons', () => {
    render(<SelectorDemo />)
    fireEvent.click(screen.getByLabelText('Next Difficulty'))
    expect(screen.getByRole('group').textContent).toContain('Normal')
  })
})

describe('Stepper', () => {
  it('stops at max', () => {
    let value = 4
    render(<Stepper label="Players" value={value} min={1} max={4} onChange={(v) => (value = v)} />)
    expect(screen.getByLabelText('Next Players')).toHaveProperty('disabled', true)
    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowRight' })
    expect(value).toBe(4)
  })
})

describe('Tabs', () => {
  it('moves with arrow keys', () => {
    let value = 'Audio'
    render(<Tabs label="Settings" tabs={['Audio', 'Display']} value={value} onChange={(t) => (value = t)} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(value).toBe('Display')
  })
})

describe('RoomCodeInput', () => {
  it('auto-advances as you type', () => {
    render(<RoomCodeDemo />)
    fireEvent.change(boxes()[0], { target: { value: 'a' } })
    expect(document.activeElement).toBe(boxes()[1])
    fireEvent.change(boxes()[1], { target: { value: 'b' } })
    expect(code()).toBe('AB')
  })

  it('backspace on an empty box deletes the letter before and moves back', () => {
    render(<RoomCodeDemo />)
    fireEvent.change(boxes()[0], { target: { value: 'a' } })
    fireEvent.change(boxes()[1], { target: { value: 'b' } })
    fireEvent.keyDown(boxes()[2], { key: 'Backspace' })
    expect(code()).toBe('A')
    expect(document.activeElement).toBe(boxes()[1])
  })

  it('clearing a box without Backspace (Delete, cut, some phone keyboards) empties it', () => {
    render(<RoomCodeDemo />)
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => 'ABCD' } })
    fireEvent.change(boxes()[3], { target: { value: '' } }) // no Backspace keydown, just an empty box
    expect(code()).toBe('ABC')
    fireEvent.change(boxes()[1], { target: { value: '' } }) // from the middle: later letters close the gap
    expect(code()).toBe('AC')
    expect(document.activeElement).toBe(boxes()[1])
  })

  it('pasting fills every box and ignores junk', () => {
    render(<RoomCodeDemo />)
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => 'x7-k2 99' } })
    expect(code()).toBe('X7K2') // cut to 4 letters
  })
})

describe('Button size', () => {
  it('a game can make a button as big as its pieces (px), passed to the CSS as --kit-button-size', () => {
    render(<Button size={96.4} style={{ opacity: 1 }}>Cast</Button>)
    const button = screen.getByRole('button', { name: 'Cast' })
    expect(button.dataset.sized).toBe('true')
    expect(button.style.getPropertyValue('--kit-button-size')).toBe('96px')
    expect(button.style.opacity).toBe('1') // its own style is kept
  })

  it('compact: marked for the narrower side padding', () => {
    render(<><Button compact>Tight</Button><Button>Roomy</Button></>)
    expect(screen.getByRole('button', { name: 'Tight' }).dataset.compact).toBe('true')
    expect(screen.getByRole('button', { name: 'Roomy' }).dataset.compact).toBeUndefined()
  })

  it('no size (or 0): the normal button', () => {
    render(<><Button>Plain</Button><Button size={0}>Zero</Button></>)
    for (const name of ['Plain', 'Zero']) {
      const button = screen.getByRole('button', { name })
      expect(button.dataset.sized).toBeUndefined()
      expect(button.style.getPropertyValue('--kit-button-size')).toBe('')
    }
  })
})

describe('control sounds (setControlSound)', () => {
  afterEach(() => setControlSound(null))

  it('a Button says tap, sound="back" says back, sound={false} says nothing; a Toggle says toggle.on / toggle.off', () => {
    const heard: string[] = []
    setControlSound((kind) => heard.push(kind))
    render(<>
      <Button>Play</Button>
      <Button sound="back">Back</Button>
      <Button sound={false}>Cast</Button>
      <Toggle on={false} onChange={() => {}} label="Mono" />
      <Toggle on onChange={() => {}} label="Shake" />
    </>)
    fireEvent.click(screen.getByText('Play'))
    fireEvent.click(screen.getByText('Back'))
    fireEvent.click(screen.getByText('Cast'))
    fireEvent.click(screen.getByRole('switch', { name: 'Mono' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Shake' }))
    expect(heard).toEqual(['tap', 'back', 'toggle.on', 'toggle.off'])
  })

  it('a Toggle turning OFF sounds first then changes; turning ON changes first then sounds (a Sound switch is heard both ways)', () => {
    const order: string[] = []
    setControlSound((kind) => order.push(kind))
    render(<>
      <Toggle on onChange={(on) => order.push(`change ${on}`)} label="Sound" />
      <Toggle on={false} onChange={(on) => order.push(`change ${on}`)} label="Mono" />
    </>)
    fireEvent.click(screen.getByRole('switch', { name: 'Sound' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Mono' }))
    fireEvent.keyDown(screen.getByRole('switch', { name: 'Mono' }), { key: 'ArrowRight' })
    expect(order).toEqual(['toggle.off', 'change false', 'change true', 'toggle.on', 'change true', 'toggle.on'])
  })

  it('still runs the button\'s own onClick, and is silent with no listener', () => {
    let pressed = 0
    render(<Button onClick={() => pressed++}>Go</Button>)
    fireEvent.click(screen.getByText('Go'))
    expect(pressed).toBe(1)
  })

  it('Tabs and ◀ ▶ say tap', () => {
    const heard: string[] = []
    setControlSound((kind) => heard.push(kind))
    render(<SelectorDemo />)
    fireEvent.click(screen.getByLabelText('Next Difficulty'))
    expect(heard).toEqual(['tap'])
  })
})

// ScrollArea (0.10.0): no scroll bar, so it says where there's more to see — data-more-start / data-more-end drive the
// edge fades, data-scrolls lets it keep swipes only when it really scrolls. jsdom has no layout: sizes are stood in for.
describe('ScrollArea "more this way" flags', () => {
  function sized(box: HTMLElement, contentH: number, boxH: number) {
    Object.defineProperty(box, 'scrollHeight', { configurable: true, value: contentH })
    Object.defineProperty(box, 'clientHeight', { configurable: true, value: boxH })
  }
  const flags = (box: HTMLElement) => ['data-scrolls', 'data-more-start', 'data-more-end'].filter((f) => box.hasAttribute(f))

  it('contents that fit: no flags at all (it never catches a swipe)', () => {
    render(<ScrollArea label="List"><p>one row</p></ScrollArea>)
    const box = screen.getByRole('region', { name: 'List' })
    sized(box, 100, 100)
    fireEvent.scroll(box)
    expect(flags(box)).toEqual([])
  })

  it('taller contents: more below at the top, more both ways in the middle, more above at the end', () => {
    render(<ScrollArea label="List"><p>many rows</p></ScrollArea>)
    const box = screen.getByRole('region', { name: 'List' })
    sized(box, 500, 200)
    box.scrollTop = 0
    fireEvent.scroll(box)
    expect(flags(box)).toEqual(['data-scrolls', 'data-more-end'])
    box.scrollTop = 150
    fireEvent.scroll(box)
    expect(flags(box)).toEqual(['data-scrolls', 'data-more-start', 'data-more-end'])
    box.scrollTop = 300
    fireEvent.scroll(box)
    expect(flags(box)).toEqual(['data-scrolls', 'data-more-start'])
  })

  it('stays keyboard-focusable (arrow keys scroll it)', () => {
    render(<ScrollArea label="List"><p>rows</p></ScrollArea>)
    expect(screen.getByRole('region', { name: 'List' }).tabIndex).toBe(0)
  })
})
