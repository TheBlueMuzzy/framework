// Runs in the framework (not copied into games): the game-side live hook, and the Tuning tab itself.
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DevKit } from '../DevKit'
import { TUNING_EVENT, liveTuning, onTuning, sendTuning, useLiveTuning } from './liveTuning'
import { TuningTab } from './TuningTab'

afterEach(cleanup)

describe('liveTuning (game side — no Dev Kit imports)', () => {
  it('follows edits sent for its own file only', () => {
    const physics = liveTuning('physics-a', { speed: 20 })
    expect(physics.current.speed).toBe(20)
    sendTuning('other-file', { speed: 1 })
    expect(physics.current.speed).toBe(20)
    sendTuning('physics-a', { speed: 24 })
    expect(physics.current.speed).toBe(24)
  })

  it('listens to a plain window event, so anything can send it', () => {
    const seen = vi.fn()
    const stop = onTuning('physics-b', seen)
    window.dispatchEvent(new CustomEvent(TUNING_EVENT, { detail: { file: 'physics-b', data: { speed: 3 } } }))
    stop()
    window.dispatchEvent(new CustomEvent(TUNING_EVENT, { detail: { file: 'physics-b', data: { speed: 4 } } }))
    expect(seen).toHaveBeenCalledTimes(1)
    expect(seen).toHaveBeenCalledWith({ speed: 3 })
  })

  it('useLiveTuning is a ref: it follows edits without re-rendering', () => {
    let renders = 0
    const { result, unmount } = renderHook(() => { renders++; return useLiveTuning('physics-c', { speed: 20 }) })
    const rendersBefore = renders
    act(() => sendTuning('physics-c', { speed: 30 }))
    expect(result.current.current.speed).toBe(30)
    expect(renders).toBe(rendersBefore)
    unmount()
  })

  it('code that starts after an edit gets the edited values (e.g. a die made next round)', () => {
    sendTuning('physics-d', { speed: 50 })
    expect(liveTuning('physics-d', { speed: 20 }).current.speed).toBe(50)
    const { result } = renderHook(() => useLiveTuning('physics-d', { speed: 20 }))
    expect(result.current.current.speed).toBe(50)
  })
})

const files = [
  { name: 'physics', data: { _help: 'Dice numbers.', _ranges: { maxSpeed: [0, 50, 1] }, maxSpeed: 20, dice: { bounce: 0.4, glow: true } } },
]

describe('the Tuning tab', () => {
  it('shows each file, its help, group headings, sliders with the file\'s range', () => {
    render(<TuningTab files={files} />)
    expect(screen.getByText('Dice numbers.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'dice' })).toBeTruthy()
    const slider = screen.getByLabelText('maxSpeed slider (0 to 50)') as HTMLInputElement
    expect(slider.value).toBe('20')
    expect((screen.getByLabelText('dice.bounce') as HTMLInputElement).value).toBe('0.4')
    expect(screen.getByRole('checkbox')).toBeTruthy()
    expect(screen.queryByText(/_ranges/)).toBeNull()
  })

  it('sends each change to the game live; Undo sends the saved values back', () => {
    const seen = vi.fn()
    const stop = onTuning('physics', seen)
    render(<TuningTab files={files} />)
    fireEvent.change(screen.getByLabelText('maxSpeed'), { target: { value: '33' } })
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ maxSpeed: 33, _ranges: { maxSpeed: [0, 50, 1] } }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo unsaved' }))
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ maxSpeed: 20 }))
    stop()
  })

  it('Save writes the whole file (with _help and _ranges) through the dev server', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<TuningTab files={files} />)
    fireEvent.click(screen.getByRole('checkbox'))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.path).toBe('content/tuning/physics.json')
    expect(body.data).toEqual({ ...files[0].data, dice: { bounce: 0.4, glow: false } })
    expect(screen.getByRole('status').textContent).toMatch(/Saved content\/tuning\/physics.json/)
    vi.unstubAllGlobals()
  })

  it('Copy for Claude lists "file: key old → new"', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<TuningTab files={files} />)
    fireEvent.change(screen.getByLabelText('maxSpeed'), { target: { value: '25' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy for Claude' })) })
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('- physics.json: maxSpeed: 20 → 25'))
    vi.unstubAllGlobals()
  })

  it('_help can be one line per value; a colour gets a picker, other text is shown, not edited', () => {
    const drag = {
      name: 'drag',
      data: {
        _help: { dragHeight: 'How high a picked-up die floats.', highlightColor: 'Colour of the drop zone.' },
        _ranges: { dragHeight: [0, 3, 0.1] },
        dragHeight: 1.2,
        zoneHighlight: 'tint',
        highlightColor: '#ffffff',
      },
    }
    render(<TuningTab files={[drag]} />)
    expect(screen.getByText('How high a picked-up die floats.')).toBeTruthy()
    expect(screen.getByText('Colour of the drop zone.')).toBeTruthy()
    expect(screen.getByLabelText('dragHeight slider (0 to 3)')).toBeTruthy()
    expect(screen.getByText('tint')).toBeTruthy()
    expect((screen.getByLabelText('Highlight color — hex') as HTMLInputElement).value).toBe('#ffffff')
    expect(screen.queryByText(/\[object Object\]/)).toBeNull()
  })

  it('text with "_choices" gets a dropdown that sends the pick live, and ↺ goes back to the saved one', () => {
    const seen = vi.fn()
    const stop = onTuning('carry', seen)
    const carry = {
      name: 'carry',
      data: { _choices: { 'styles.draft': { A: 'A · Pick it up', C: 'C · Aim' }, look: ['flat', 'round'] }, styles: { draft: 'A' }, look: 'odd' },
    }
    render(<TuningTab files={[carry]} />)
    const draft = screen.getByLabelText('styles.draft') as HTMLSelectElement
    expect([...draft.options].map((o) => o.text)).toEqual(['A · Pick it up', 'C · Aim'])
    fireEvent.change(draft, { target: { value: 'C' } })
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ styles: { draft: 'C' } }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset styles.draft to the saved value (A)' }))
    expect(draft.value).toBe('A')
    // a saved value that isn't one of the options stays (an extra option), never changed by opening the tab
    expect((screen.getByLabelText('look') as HTMLSelectElement).value).toBe('odd')
    stop()
  })

  it('is hidden in a game with no content/tuning files (the framework has none)', () => {
    render(<DevKit />)
    expect(screen.queryByRole('tab', { name: 'Tuning', hidden: true })).toBeNull()
  })
})
