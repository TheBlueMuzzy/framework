// Runs in the framework: the Moments panel — ▶ / 🔁, the style picker, live edits, Save.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TUNING_EVENT } from '../tuning/liveTuning'
import { MomentsPanel } from './MomentsPanel'
import type { DevKitMoment } from './momentTypes'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const disk: Record<string, object> = {
  'content/tuning/feel.json': { _ranges: { 'tiers.big.grow': [0, 1, 0.01] }, tiers: { big: { grow: 0.5 } } },
  'content/audio.json': {
    _labels: { 'sounds.*.volumeDb': 'Volume (dB)' },
    _help: { 'sounds.*.volumeDb': 'How loud it plays.' },
    _ranges: { 'sounds.*.volumeDb': [-40, 6, 0.5] },
    sounds: { 'score.pop': { volumeDb: -8 } },
  },
}
const load = async (file: string) => ({ disk: structuredClone(disk[file]), now: structuredClone(disk[file]) })

const pop: DevKitMoment = {
  id: 'pop', screen: 'board', label: 'Score pop', note: 'the +1s',
  knobs: [
    { file: 'content/tuning/feel.json', path: 'tiers.big.grow' },
    { file: 'content/audio.json', path: 'sounds.score.pop.volumeDb' },
  ],
  play: () => {},
}
const win: DevKitMoment = { id: 'win', screen: 'reveal', label: 'Winner', knobs: [{ file: 'content/tuning/feel.json', path: 'tiers.big.grow' }], play: () => {} }

async function setup(fire = vi.fn(async () => {}), save = vi.fn(async () => {})) {
  render(<MomentsPanel moments={[pop]} all={[pop, win]} fire={fire} load={load} save={save} />)
  await screen.findByText('Score pop')
  return { fire, save }
}
const slider = (path: string) => screen.getByLabelText(path) as HTMLInputElement // the number box

describe('Moments panel', () => {
  it('lists the moment with its knobs: labels and ranges from the files (wildcards too), help, who shares it', async () => {
    await setup()
    expect(screen.getByText('score.pop: Volume (dB)')).toBeTruthy()
    expect(screen.getByText('How loud it plays.')).toBeTruthy()
    expect(screen.getByLabelText('sounds.score.pop.volumeDb slider (-40 to 6)')).toBeTruthy()
    expect(screen.getByText('Also changes: Winner')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Balanced', pressed: true })).toBeTruthy()
  })

  it('▶ plays it once in the preview', async () => {
    const { fire } = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Play Score pop' }))
    expect(fire).toHaveBeenCalledWith('pop', 0, false)
  })

  it('a style sets every knob at once, live; a tweak after it says "custom"', async () => {
    await setup()
    const sent: { file: string; data: unknown }[] = []
    const listen = (e: Event) => sent.push((e as CustomEvent).detail)
    window.addEventListener(TUNING_EVENT, listen)
    fireEvent.click(screen.getByRole('button', { name: 'Punchy' }))
    expect(slider('tiers.big.grow').value).toBe('0.7')
    expect(slider('sounds.score.pop.volumeDb').value).toBe('-6')
    expect(sent.map((s) => s.file).sort()).toEqual(['audio', 'feel'])
    expect(screen.getByRole('button', { name: 'Punchy', pressed: true })).toBeTruthy()
    fireEvent.change(slider('tiers.big.grow'), { target: { value: '0.65' } })
    expect(screen.getAllByText('custom').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { pressed: true })).toBeNull()
    window.removeEventListener(TUNING_EVENT, listen)
  })

  it('Save writes each changed file whole (its notes too); Undo goes back', async () => {
    const { save } = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Soft' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect(save).toHaveBeenCalledTimes(2)
    const audio = save.mock.calls.find((c) => (c as unknown[])[0] === 'content/audio.json') as unknown as [string, { _help: object; sounds: Record<string, { volumeDb: number }> }]
    expect(audio[1].sounds['score.pop'].volumeDb).toBe(-11)
    expect(audio[1]._help).toEqual({ 'sounds.*.volumeDb': 'How loud it plays.' })
    fireEvent.click(screen.getByRole('button', { name: 'Punchy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo unsaved' }))
    expect(slider('tiers.big.grow').value).toBe('0.3')
  })

  it('🔁 loops it every interval until pressed again', async () => {
    vi.useFakeTimers()
    const fire = vi.fn(async () => {})
    render(<MomentsPanel moments={[pop]} fire={fire} load={load} />)
    await act(async () => { await vi.runOnlyPendingTimersAsync() })
    fireEvent.click(screen.getByRole('button', { name: 'Loop Score pop' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    expect(fire).toHaveBeenCalledTimes(1)
    expect(fire).toHaveBeenLastCalledWith('pop', 0, true)
    await act(async () => { await vi.advanceTimersByTimeAsync(2500) })
    expect(fire).toHaveBeenCalledTimes(2)
    expect(fire).toHaveBeenLastCalledWith('pop', 1, true)
    fireEvent.click(screen.getByRole('button', { name: 'Loop Score pop' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
    expect(fire).toHaveBeenCalledTimes(2)
  })
})
