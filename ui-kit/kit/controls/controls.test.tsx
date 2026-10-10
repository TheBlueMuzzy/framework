// Behaviour tests for the controls that have real logic: Selector, Stepper, Tabs, RoomCodeInput, Button size.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Button, RoomCodeInput, Selector, Stepper, Tabs, Toggle, setControlSound } from '.'

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
