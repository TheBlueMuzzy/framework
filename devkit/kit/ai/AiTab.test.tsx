// Runs in the framework (not copied into games): the AI tab on screen.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevKitSearch } from '../search/searchContext'
import { setSectionsOpen } from '../search/sectionState'
import { AiTab } from './AiTab'
import { aiTab } from './aiTabEntry'
import type { AiWatchEvent, DevKitAi } from './aiTypes'
import { sampleAi } from './sampleAi.test'

const ALL_SECTIONS = ['AI: who it is', 'AI: traits', 'AI: banter, nerve & words', 'AI: personality — more', 'AI: bio', 'AI: skill', 'AI: watch a game', 'AI: Personality Check'].map((t) => `ai:${t}`)

beforeEach(() => {
  localStorage.clear()
  setSectionsOpen(ALL_SECTIONS, true)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const saves = () => {
  const fetchMock = vi.fn(async (..._args: unknown[]) => new Response('{"ok":true}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return () => fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string) as { path: string; data: Record<string, unknown> })
}

describe('the AI tab', () => {
  it('shows the first personality: range sliders, goal order, numbers, shifts, bio, skill', () => {
    render(<AiTab ai={sampleAi()} />)
    expect((screen.getByLabelText('Personality') as HTMLSelectElement).value).toBe('Bully')
    expect((screen.getByLabelText('aggression low end') as HTMLInputElement).value).toBe('80')
    expect((screen.getByLabelText('aggression high end slider') as HTMLInputElement).value).toBe('95')
    expect(screen.getByText('Aggression → TRAP')).toBeTruthy()
    expect(screen.getByText('TRAP — hem rivals in.')).toBeTruthy()
    expect(within(screen.getByLabelText('Goal order')).getAllByRole('listitem').map((li) => li.textContent)).toEqual([expect.stringContaining('TRAP'), expect.stringContaining('SCORE')])
    expect((screen.getByLabelText('extras.nerve') as HTMLInputElement).value).toBe('6')
    expect((screen.getByLabelText('Shift 1 reading') as HTMLSelectElement).value).toBe('myDanger')
    expect((screen.getByLabelText('Bully bio') as HTMLTextAreaElement).value).toBe('Loves a chase.')
    expect((screen.getByLabelText('Skill') as HTMLSelectElement).value).toBe('Archmage')
  })

  it('Save writes only the changed file, whole, with its notes kept', async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    fireEvent.change(screen.getByLabelText('greed low end'), { target: { value: '40' } })
    fireEvent.click(screen.getByLabelText('Move SCORE up'))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    const [file, ...others] = written()
    expect(others).toEqual([])
    expect(file.path).toBe('content/ai/personalities.json')
    expect(file.data._sections).toEqual(sampleAi().personalities.data._sections)
    const bully = (file.data.personalities as { id: string; goals: string[]; traits: Record<string, { min: number }> }[])[0]
    expect(bully.traits.greed.min).toBe(40)
    expect(bully.goals).toEqual(['SCORE', 'TRAP'])
    expect(screen.getByRole('status').textContent).toMatch(/Saved content\/ai\/personalities\.json/)
  })

  it('a skill change saves the skills file', async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    fireEvent.change(screen.getByLabelText('wobble'), { target: { value: '0.2' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect(written().map((w) => w.path)).toEqual(['content/ai/skills.json'])
  })

  it('Copy to new makes a copy (and its bio) under a new name; Save writes both files', async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy to new…' }))
    fireEvent.change(screen.getByLabelText("New personality's name"), { target: { value: 'Brute' } })
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect((screen.getByLabelText('Personality') as HTMLSelectElement).value).toBe('Brute')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    const files = written()
    expect(files.map((f) => f.path)).toEqual(['content/ai/personalities.json', 'content/text/en.json'])
    expect((files[0].data.personalities as { id: string }[]).map((p) => p.id)).toEqual(['Bully', 'Scholar', 'Brute'])
    expect(JSON.stringify(files[1].data)).toContain('"Brute":{"bio":"Loves a chase."}')
  })

  it("shows the game's problems and won't save until they're fixed", async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    fireEvent.change(screen.getByLabelText('greed high end'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('greed low end'), { target: { value: '95' } })
    expect(screen.getByRole('alert').textContent).toContain('Bully: greed starts too high')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect(written()).toEqual([])
  })

  it('mood shifts: edit, add, remove', () => {
    render(<AiTab ai={sampleAi()} />)
    fireEvent.change(screen.getByLabelText('Shift 1 by'), { target: { value: '-5' } })
    expect((screen.getByLabelText('Shift 1 by') as HTMLInputElement).value).toBe('-5')
    fireEvent.click(screen.getByRole('button', { name: '+ Add shift' }))
    expect(screen.getByLabelText('Shift 2 trait')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Remove shift 1'))
    expect(screen.queryByLabelText('Shift 2 trait')).toBeNull()
  })

  it('Watch hands the game the table (seat 1 = the edited personality) and shows notes + belief bars', () => {
    let send: (e: AiWatchEvent) => void = () => {}
    const stop = vi.fn()
    const watch = vi.fn((_seats: Parameters<NonNullable<DevKitAi['watch']>>[0], onEvent: (e: AiWatchEvent) => void) => { send = onEvent; return stop })
    render(<AiTab ai={sampleAi({ watch })} />)
    fireEvent.change(screen.getByLabelText('greed low end'), { target: { value: '41' } })
    fireEvent.click(screen.getByRole('button', { name: '▶ Watch' }))
    const seats = watch.mock.calls[0][0]
    expect(seats.map((s) => s.personality.id)).toEqual(['Bully', 'Scholar'])
    expect(seats[0].personality.traits.greed.min).toBe(41)
    act(() => send({ seat: 0, who: 'Bully', note: 'rolled TRAP', mine: 10, beliefs: [{ seat: 1, estimate: 8, confidence: 0.5 }] }))
    expect(screen.getByLabelText('Decision notes').textContent).toContain('rolled TRAP')
    expect(screen.getByText('≈8')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '■ Stop' }))
    expect(stop).toHaveBeenCalled()
  })

  it('Run check plays the games and links the report', async () => {
    vi.stubGlobal('open', vi.fn())
    URL.createObjectURL = vi.fn(() => 'blob:report')
    URL.revokeObjectURL = vi.fn()
    const runCheck = vi.fn(async ({ onProgress }: { onProgress: (d: number, t: number) => void }) => { onProgress(6, 6); return '<p>report</p>' })
    render(<AiTab ai={sampleAi({ runCheck })} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Run check' })) })
    expect(runCheck.mock.calls[0][0]).toMatchObject({ games: 6 })
    expect(screen.getByRole('link', { name: 'open the report' }).getAttribute('href')).toBe('blob:report')
  })

  it('joins the Dev Kit search: only matching sections show', () => {
    const tab = aiTab(sampleAi())
    expect(tab.countMatches!('nerve')).toBe(3) // the section title matches: all 3 of its settings
    expect(tab.countMatches!('zzz')).toBe(0)
    render(
      <DevKitSearch.Provider value={{ query: 'wobble', goTo: () => {} }}>
        <AiTab ai={sampleAi()} />
      </DevKitSearch.Provider>,
    )
    expect(screen.getByLabelText('wobble')).toBeTruthy()
    expect(screen.queryByLabelText('aggression low end')).toBeNull()
  })
})
