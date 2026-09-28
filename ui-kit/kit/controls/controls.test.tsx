// Behaviour tests for the controls that have real logic: Selector, Stepper, Tabs, RoomCodeInput.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { RoomCodeInput, Selector, Stepper, Tabs } from '.'

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
