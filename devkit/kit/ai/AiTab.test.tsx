// Runs in the framework (not copied into games): the AI tab on screen.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setSectionsOpen } from '../search/sectionState'
import { AiTab } from './AiTab'
import { aiTab } from './aiTabEntry'
import { getAt } from './aiLogic'
import type { AiPersonality, AiTuneProgress, AiTuneResult, AiWatchEvent, DevKitAi } from './aiTypes'
import { bullySuggestion, sampleAi } from './sampleAi.test'

const ALL_SECTIONS = ['AI: who it is', 'AI: traits', 'AI: banter, nerve & words', 'AI: personality — more', 'AI: bio', 'AI: big moments', 'AI: skill', 'AI: watch a game', 'AI: Personality Check'].map((t) => `ai:${t}`)

beforeEach(() => {
  localStorage.clear()
  setSectionsOpen(ALL_SECTIONS, true)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const saves = () => {
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => new Response('{"ok":true}', { status: 200 }))
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
    expect(JSON.stringify(files[1].data)).toContain('"Brute":{"name":"the Brute","bio":"Loves a chase."}')
  })

  it('focus: a 0–1 slider that saves with the personality', async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    expect((screen.getByLabelText('focus') as HTMLInputElement).value).toBe('0.8')
    fireEvent.change(screen.getByLabelText('focus slider'), { target: { value: '0.5' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect((written()[0].data.personalities as { focus: number }[])[0].focus).toBe(0.5)
  })

  it('steady: one row per goal — set one, clear one (empty = not set, and no goal left = no "steady")', async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    expect(screen.getByText('Always tries to score too')).toBeTruthy() // its _labels name
    expect((screen.getByLabelText('steady.SCORE') as HTMLInputElement).value).toBe('0.6')
    expect((screen.getByLabelText('steady.TRAP') as HTMLInputElement).value).toBe('') // not set
    fireEvent.change(screen.getByLabelText('steady.TRAP'), { target: { value: '0.25' } })
    fireEvent.change(screen.getByLabelText('steady.SCORE'), { target: { value: '' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect((written()[0].data.personalities as { steady?: object }[])[0].steady).toEqual({ TRAP: 0.25 })
    fireEvent.click(screen.getByLabelText('Clear steady TRAP'))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect('steady' in (written()[1].data.personalities as object[])[0]).toBe(false)
  })

  it("the game's goal settings: a bigAt row per goal with its help line; Save writes goals.json with its notes", async () => {
    const written = saves()
    render(<AiTab ai={sampleAi()} />)
    expect(screen.getByText('Big moment: hunt (TRAP)')).toBeTruthy()
    expect(screen.getByText('Hunting: 55 ≈ a tangle.')).toBeTruthy()
    expect(screen.getByText("Each goal's big-moment bar.")).toBeTruthy()
    fireEvent.change(screen.getByLabelText('bigAt.TRAP'), { target: { value: '60' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    const [file, ...others] = written()
    expect(others).toEqual([])
    expect(file.path).toBe('content/ai/goals.json')
    expect(file.data).toEqual({ ...sampleAi().settings![0].data, bigAt: { TRAP: 60, SCORE: 17 } })
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
    expect(screen.getByLabelText('Decision notes (newest first)').textContent).toContain('rolled TRAP')
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
    expect(screen.queryByText('What wins?')).toBeNull() // an older report has no "What wins?": nothing shown
  })

  it('Run check shows the report\'s "What wins?" sentences (0.25.0), and says when there are too few games', async () => {
    vi.stubGlobal('open', vi.fn())
    URL.createObjectURL = vi.fn(() => 'blob:report')
    URL.revokeObjectURL = vi.fn()
    const page = '<h2>What wins?</h2><section><ol data-what-wins><li>Players with score lead 10 or more after turn 5 win 78% (of 240 games, ±6%) — vs 12% with -3 or less</li><li>Players with &lt;tiles&gt; 2 at the end win 40%</li></ol></section><p data-what-wins-left="3">Left out</p>'
    const runCheck = vi.fn(async () => page)
    const { unmount } = render(<AiTab ai={sampleAi({ runCheck })} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Run check' })) })
    expect(screen.getByText('What wins?')).toBeTruthy()
    expect([...screen.getByText('What wins?').parentElement!.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Players with score lead 10 or more after turn 5 win 78% (of 240 games, ±6%) — vs 12% with -3 or less', 'Players with <tiles> 2 at the end win 40%'])
    expect(screen.getByText('3 left out for too few games (listed on the report).')).toBeTruthy()
    unmount()
    render(<AiTab ai={sampleAi({ runCheck: vi.fn(async () => '<p data-what-wins-none>No situation…</p>') })} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Run check' })) })
    expect(screen.getByText(/No situation has enough games yet/)).toBeTruthy()
  })

  describe('Suggest sliders (0.26.0)', () => {
    const runCheck = async () => '<p>report</p>'

    it('runs the tuner for the picked personality with progress, shows old → new and targets now → suggested', async () => {
      let finish: (r: AiTuneResult) => void = () => {}
      let progress: (p: AiTuneProgress) => void = () => {}
      const suggest = vi.fn((o: { personality: string; onProgress: (p: AiTuneProgress) => void }) => { progress = o.onProgress; return new Promise<AiTuneResult>((r) => { finish = r }) })
      render(<AiTab ai={sampleAi({ runCheck, suggest })} />)
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Suggest sliders for Bully' })) })
      expect(suggest.mock.calls[0][0]).toMatchObject({ personality: 'Bully', personalities: [expect.objectContaining({ id: 'Bully' }), expect.objectContaining({ id: 'Scholar' })] })
      act(() => progress({ phase: 'search', tryNo: 4, tries: 20, game: 3, games: 12 }))
      expect(screen.getByRole('button', { name: 'Try 4 / 20 · game 3/12' })).toBeTruthy()
      expect(screen.getByRole('progressbar', { name: 'Suggest sliders' }).getAttribute('aria-valuenow')).toBe('16') // (3 + 3/12) / 20
      await act(async () => finish(bullySuggestion()))
      expect(screen.getByText('Suggested: 1 → 2 of 2 targets green on 24 fresh games.')).toBeTruthy()
      const rows = screen.getAllByRole('row').map((r) => r.textContent)
      expect(rows).toContain('traits.aggression80–9560–75')
      expect(rows).toContain('steady.SCORE0.60.3')
      expect(rows.some((r) => r?.includes('traits.greed'))).toBe(false) // unchanged sliders aren't listed
      expect(rows).toContainEqual(expect.stringMatching(/^hems rivals in — tangles, wants ≥ 0\.6✗ 0\.4✓ 0\.7$/))
    })

    it('Apply puts the values in as unsaved edits: Save writes them, Undo unsaved takes them back', async () => {
      const written = saves()
      const suggest = vi.fn(async () => bullySuggestion())
      render(<AiTab ai={sampleAi({ runCheck, suggest })} />)
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Suggest sliders for Bully' })) })
      expect(written()).toEqual([]) // nothing is written by suggesting
      expect((screen.getByLabelText('aggression low end') as HTMLInputElement).value).toBe('80') // not applied yet
      fireEvent.click(screen.getByRole('button', { name: 'Apply to Bully' }))
      expect((screen.getByLabelText('aggression low end') as HTMLInputElement).value).toBe('60')
      expect((screen.getByLabelText('aggression high end slider') as HTMLInputElement).value).toBe('75')
      expect(screen.getByText(/Applied to Bully as unsaved edits/)).toBeTruthy()
      expect(written()).toEqual([]) // still nothing written
      fireEvent.click(screen.getByRole('button', { name: 'Undo unsaved' }))
      expect((screen.getByLabelText('aggression low end') as HTMLInputElement).value).toBe('80')
      // apply again → Save writes the personalities file with the new values
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Suggest sliders for Bully' })) })
      fireEvent.click(screen.getByRole('button', { name: 'Apply to Bully' }))
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
      const [file] = written()
      const saved = (file.data.personalities as AiPersonality[]).find((p) => p.id === 'Bully')!
      expect(saved.traits.aggression).toEqual({ min: 60, max: 75 })
      expect(saved.steady).toEqual({ SCORE: 0.3 })
      expect(saved.nudge).toBe(0.2)
    })

    it('says when nothing held up (no Apply), and when the tuner stopped', async () => {
      const none = vi.fn(async () => bullySuggestion({ verdict: 'noGain', suggested: null, message: 'No slider move hit more targets in 20 tries — keep what you have.', sliders: [], cantReach: [{ label: 'hems rivals in', why: "measured 0.4, wants ≥ 0.6 — couldn't reach it within these ranges" }] }))
      const { unmount } = render(<AiTab ai={sampleAi({ runCheck, suggest: none })} />)
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Suggest sliders for Bully' })) })
      expect(screen.getByText(/keep what you have/)).toBeTruthy()
      expect(screen.getByText(/Couldn't reach “hems rivals in”: measured 0.4, wants ≥ 0.6 — couldn't reach it within these ranges/)).toBeTruthy()
      expect(screen.queryByRole('button', { name: /Apply to/ })).toBeNull()
      unmount()
      render(<AiTab ai={sampleAi({ runCheck, suggest: vi.fn(async () => { throw new Error("this game's check worker can't suggest sliders yet") }) })} />)
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Suggest sliders for Bully' })) })
      expect(screen.getByText(/Suggest sliders stopped: this game's check worker can't suggest sliders yet/)).toBeTruthy()
    })

    it('a game without a tuner shows no button', () => {
      render(<AiTab ai={sampleAi({ runCheck })} />)
      expect(screen.queryByRole('button', { name: /Suggest sliders/ })).toBeNull()
    })
  })

  it('the Dev Kit search (its query, while the tab is open): only matching sections show, with a count', () => {
    const { rerender } = render(<AiTab ai={sampleAi()} query="wobble" />)
    expect(screen.getByLabelText('wobble')).toBeTruthy()
    expect(screen.queryByLabelText('aggression low end')).toBeNull()
    rerender(<AiTab ai={sampleAi()} query="nerve" />)
    expect(screen.getByRole('status').textContent).toBe('3 settings found') // the section title matches: all 3
    rerender(<AiTab ai={sampleAi()} query="zzz" />)
    expect(screen.getByRole('status').textContent).toMatch(/Nothing in AI matches “zzz”/)
  })

  describe('banter lines (0.24.0)', () => {
    // The game's text file as it imported it — the bios and the lines share it (as in most games)
    const withBanter = () => {
      const ai = sampleAi()
      const text = ai.bios!.data as Record<string, unknown>
      text.banter = { Bully: { won: 'Too easy.', won_2: 'Next!' }, Scholar: { lost: 'Fascinating.' } }
      return { ai: { ...ai, banter: { path: 'content/text/en.json', data: text, moments: ['won', 'gotHit', 'lost'], describe: { won: 'the game ended and it won' } } }, text }
    }
    beforeEach(() => setSectionsOpen(['ai:AI: banter lines'], true))

    it('shows the picked personality\'s lines per moment; an edit is live in the game\'s own object at once', () => {
      const { ai, text } = withBanter()
      const held = text.banter as Record<string, Record<string, string>>
      render(<AiTab ai={ai} />)
      expect((screen.getByLabelText('Bully won line') as HTMLInputElement).value).toBe('Too easy.')
      expect((screen.getByLabelText('Bully won_2 line') as HTMLInputElement).value).toBe('Next!')
      expect(screen.getByText('the game ended and it won')).toBeTruthy()
      fireEvent.change(screen.getByLabelText('Bully won line'), { target: { value: 'Is that all?' } })
      expect(held.Bully.won).toBe('Is that all?') // live: the bots' next "won" says it, no reload, no Save yet
      fireEvent.click(screen.getByLabelText('Add a gotHit line'))
      fireEvent.change(screen.getByLabelText('Bully gotHit line'), { target: { value: 'Ow.' } })
      expect(held.Bully).toEqual({ won: 'Is that all?', won_2: 'Next!', gotHit: 'Ow.' })
      fireEvent.click(screen.getByLabelText('Remove Bully won_2'))
      expect(held.Bully).not.toHaveProperty('won_2')
      fireEvent.click(screen.getByRole('button', { name: 'Undo unsaved' }))
      expect(held.Bully).toEqual({ won: 'Too easy.', won_2: 'Next!' }) // (undo is live too)
    })

    it('Save writes the text file once — the bios and the lines together, nothing reloaded', async () => {
      const written = saves()
      const { ai } = withBanter()
      render(<AiTab ai={ai} />)
      fireEvent.change(screen.getByLabelText('Bully bio'), { target: { value: 'Hunts.' } })
      fireEvent.change(screen.getByLabelText('Bully won line'), { target: { value: 'Is that all?' } })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
      const files = written()
      expect(files.map((f) => f.path)).toEqual(['content/text/en.json'])
      expect(files[0]).not.toHaveProperty('reload')
      expect(getAt(files[0].data, ['ai', 'personality', 'Bully', 'bio'])).toBe('Hunts.')
      expect(files[0].data.banter).toEqual({ Bully: { won: 'Is that all?', won_2: 'Next!' }, Scholar: { lost: 'Fascinating.' } })
      // a later bios-only save still carries the saved lines (never the copy the tab took at the start)
      fireEvent.change(screen.getByLabelText('Bully bio'), { target: { value: 'Hunts hard.' } })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
      expect((written()[1].data.banter as Record<string, Record<string, string>>).Bully.won).toBe('Is that all?')
    })

    it('Save keeps a "_help" note beside the lines (review fix: it was dropped from en.json)', async () => {
      const written = saves()
      const { ai, text } = withBanter()
      ;(text.banter as Record<string, unknown>)._help = 'Bots\' lines.'
      render(<AiTab ai={ai} />)
      fireEvent.change(screen.getByLabelText('Bully won line'), { target: { value: 'Is that all?' } })
      expect((text.banter as Record<string, unknown>)._help).toBe('Bots\' lines.') // (live edit leaves it too)
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
      expect((written()[0].data.banter as Record<string, unknown>)._help).toBe('Bots\' lines.')
    })

    it('a quiet personality is told it never talks; lines for a moment the game doesn\'t name are listed as never said', () => {
      const { ai } = withBanter()
      ai.personalities.data.personalities = [{ ...(ai.personalities.data.personalities as AiPersonality[])[0], chattiness: 0 }]
      ;(ai.banter.data.banter as Record<string, Record<string, string>>).Bully.sneezed = 'Achoo.'
      render(<AiTab ai={ai} />)
      expect(screen.getByText(/Its chattiness is 0/)).toBeTruthy()
      expect(screen.getByText(/never said/)).toBeTruthy()
      expect((screen.getByLabelText('Bully sneezed line') as HTMLInputElement).value).toBe('Achoo.')
    })

    it('Copy for Claude lists the line changes', async () => {
      const copied: string[] = []
      vi.stubGlobal('navigator', { clipboard: { writeText: async (t: string) => { copied.push(t) } } })
      const { ai } = withBanter()
      render(<AiTab ai={ai} />)
      fireEvent.change(screen.getByLabelText('Bully won line'), { target: { value: 'Next time.' } })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy for Claude' })) })
      expect(copied[0]).toContain('content/text/en.json → banter.Bully.won: "Too easy." → "Next time."')
    })
  })

  it('aiTab hands the search box text on to the tab', () => {
    const { Panel } = aiTab(sampleAi())
    render(<Panel query="hunt" />)
    expect(screen.getByRole('status').textContent).toBe('1 setting found') // a goal setting, by its label
  })
})
