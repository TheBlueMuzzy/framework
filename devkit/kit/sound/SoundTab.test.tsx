import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TUNING_EVENT } from '../tuning/liveTuning'
import { SoundTab } from './SoundTab'
import { soundTab } from './soundTabEntry'
import { playWith, REPEAT_GAP_MS } from './soundPreview'
import type { RawAudio } from './soundLogic'
import type { SoundBoardAudio, SoundLogEntry } from './soundTypes'

const FILE: RawAudio = {
  _help: { 'sounds.*.volumeDb': 'How loud, in dB.', 'sounds.seed.land': 'The seed lands.' },
  _labels: { 'sounds.*.volumeDb': 'Volume (dB)', 'buses.music': 'Music (dB)' },
  _ranges: { 'sounds.*.volumeDb': [-40, 6, 0.5] },
  buses: { music: -8, ambience: -10, sfx: 0, ui: -8 },
  snapshots: { paused: { music: -10 }, reveal: { music: -6 } },
  sounds: {
    'seed.land': { bus: 'sfx', files: ['sfx/sfx_seed_land_01.mp3', 'sfx/sfx_seed_land_02.mp3'], volumeDb: -3 },
    'ui.tap': { bus: 'ui', files: ['ui/ui_button_tap_01.mp3'] },
    'amb.night': { bus: 'ambience', files: ['amb/amb_night_garden_loop.mp3'], loop: true },
  },
}

/** A stand-in engine that remembers what it was asked */
function fakeAudio() {
  const listeners = new Set<(e: SoundLogEntry) => void>()
  const calls: string[] = []
  let config: unknown = null
  const audio: SoundBoardAudio & { calls: string[]; config: () => any; emit: (e: SoundLogEntry) => void } = {
    calls,
    config: () => config,
    play: vi.fn((name: string) => { calls.push(`play ${name} ${JSON.stringify((config as any)?.sounds?.[name]?.files ?? null)}`) }),
    stop: vi.fn((name: string) => { calls.push(`stop ${name}`) }),
    setConfig: vi.fn((raw: unknown) => { config = raw }),
    preload: vi.fn(async (names?: string[]) => { calls.push(`preload ${names?.join(',')}`) }),
    reloadFile: vi.fn(),
    snapshot: vi.fn(),
    unlock: vi.fn(),
    state: () => 'running',
    level: vi.fn(() => 0.5),
    log: { entries: () => [], clear: vi.fn() },
    onLog: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    emit: (e) => listeners.forEach((l) => l(e)),
  }
  return audio
}

/** fetch calls to the dev server (the waveform also fetches sound files — those are left out) */
const devkitCalls = () => (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) => String(url).startsWith('/__devkit/'))

const renderTab = (audio: SoundBoardAudio | null, query = '') =>
  render(<SoundTab getAudio={() => audio} file={FILE} path="content/audio.json" tuningName="audio" baseUrl="/" query={query} />)

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('playWith — one exact version of a sound, then the live config back', () => {
  it('loads with the temporary config, plays with it, and leaves the live one in place', async () => {
    const audio = fakeAudio()
    const live = { sounds: { a: { files: ['1.mp3', '2.mp3'] } } }
    const temp = { sounds: { a: { files: ['2.mp3'] } } }
    await playWith(audio, live, temp, 'a')
    expect(audio.calls).toEqual(['preload a', 'play a ["2.mp3"]'])
    expect(audio.config()).toBe(live)
  })
})

describe('the Sound tab', () => {
  it('says so when the game has no sound engine yet', () => {
    renderTab(null)
    expect(screen.getByText(/Sound isn't started yet/)).toBeTruthy()
  })

  it('lists every sound by volume group, with its files count', () => {
    renderTab(fakeAudio())
    expect(screen.getByText('Effects (sfx)')).toBeTruthy()
    expect(screen.getByText('Menus & buttons (ui)')).toBeTruthy()
    expect(screen.getByText('Ambience')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'seed.land' })).toBeTruthy()
    expect(screen.getByText('2 files')).toBeTruthy()
    // a loop gets ■ instead of ▶×5
    expect(screen.getByRole('button', { name: 'Stop amb.night' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Play amb.night 5 times' })).toBeNull()
  })

  it('filters by the search box (only this tab\'s)', () => {
    renderTab(fakeAudio(), 'tap')
    expect(screen.getByRole('button', { name: 'ui.tap' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'seed.land' })).toBeNull()
    expect(screen.getByText('1 of 3')).toBeTruthy()
  })

  it('▶×5 plays it five times, REPEAT_GAP_MS apart', async () => {
    vi.useFakeTimers()
    const audio = fakeAudio()
    renderTab(audio)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Play seed.land 5 times' })) })
    expect(audio.play).toHaveBeenCalledTimes(1)
    await act(async () => { vi.advanceTimersByTime(REPEAT_GAP_MS * 4) })
    expect(audio.play).toHaveBeenCalledTimes(5)
  })

  it('a slider change is live (engine + the tuning event) and Save writes content/audio.json', async () => {
    const audio = fakeAudio()
    const heard: unknown[] = []
    const listener = (e: Event) => heard.push((e as CustomEvent).detail)
    window.addEventListener(TUNING_EVENT, listener)
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    const slider = screen.getByRole('slider', { name: /sounds\.seed\.land\.volumeDb slider/ })
    expect(slider.getAttribute('min')).toBe('-40')
    fireEvent.change(slider, { target: { value: '-10' } })
    expect((audio.config() as any).sounds['seed.land'].volumeDb).toBe(-10)
    expect(heard.at(-1)).toMatchObject({ file: 'audio', data: { sounds: { 'seed.land': { volumeDb: -10 } } } })
    window.removeEventListener(TUNING_EVENT, listener)

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    const [url, init] = devkitCalls()[0]
    expect(url).toBe('/__devkit/save')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.path).toBe('content/audio.json')
    expect(body.data.sounds['seed.land'].volumeDb).toBe(-10)
    expect(body.data._labels).toEqual(FILE._labels) // the notes are saved along
    expect(screen.getByText(/Saved content\/audio.json/)).toBeTruthy()
  })

  it('↺ puts a knob back to saved', () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    fireEvent.change(screen.getByRole('slider', { name: /seed\.land\.volumeDb slider/ }), { target: { value: '-10' } })
    fireEvent.click(screen.getByRole('button', { name: /Reset sounds\.seed\.land\.volumeDb/ }))
    expect((audio.config() as any).sounds['seed.land'].volumeDb).toBe(-3)
  })

  it('A / B: both play the picked file — A as saved, B as edited', async () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    fireEvent.change(screen.getByRole('slider', { name: /seed\.land\.volumeDb slider/ }), { target: { value: '-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'sfx/sfx_seed_land_02.mp3' })) // pick the second file
    const configsAtPlay: any[] = []
    ;(audio.play as ReturnType<typeof vi.fn>).mockImplementation(() => { configsAtPlay.push(audio.config()) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '▶ A saved' })) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '▶ B edit' })) })
    expect(configsAtPlay.map((c) => c.sounds['seed.land'].files)).toEqual([['sfx/sfx_seed_land_02.mp3'], ['sfx/sfx_seed_land_02.mp3']])
    expect(configsAtPlay.map((c) => c.sounds['seed.land'].volumeDb)).toEqual([-3, -10])
    // the game goes on with the edit
    expect((audio.config() as any).sounds['seed.land']).toMatchObject({ volumeDb: -10, files: ['sfx/sfx_seed_land_01.mp3', 'sfx/sfx_seed_land_02.mp3'] })
  })

  it('"game plays A" swaps the live config to the saved sound until the next edit', () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    fireEvent.change(screen.getByRole('slider', { name: /seed\.land\.volumeDb slider/ }), { target: { value: '-10' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /game plays A/ }))
    expect((audio.config() as any).sounds['seed.land'].volumeDb).toBe(-3)
    fireEvent.click(screen.getByRole('checkbox', { name: /game plays A/ }))
    expect((audio.config() as any).sounds['seed.land'].volumeDb).toBe(-10)
  })

  it('files: reorder and remove change the sound\'s list', () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    fireEvent.click(screen.getByRole('button', { name: 'Move sfx/sfx_seed_land_02.mp3 up' }))
    expect((audio.config() as any).sounds['seed.land'].files).toEqual(['sfx/sfx_seed_land_02.mp3', 'sfx/sfx_seed_land_01.mp3'])
    fireEvent.click(screen.getByRole('button', { name: 'Remove sfx/sfx_seed_land_01.mp3 from this sound' }))
    expect((audio.config() as any).sounds['seed.land'].files).toEqual(['sfx/sfx_seed_land_02.mp3'])
  })

  it('a picked file is sent to save-audio, added as a variant, then credits are asked', async () => {
    const audio = fakeAudio()
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) =>
      url.startsWith('/__devkit/save-audio')
        ? new Response(JSON.stringify({ ok: true, path: 'sfx/sfx_seed_land_03.mp3', file: 'public/audio/sfx/sfx_seed_land_03.mp3', trimmedMs: 42 }))
        : new Response(JSON.stringify({ ok: true })),
    )
    const { container } = renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: 'seed.land' }))
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    await act(async () => { fireEvent.change(input, { target: { files: [new File(['RIFF'], 'Pop Take 2.WAV')] } }) })
    const [url] = devkitCalls()[0]
    expect(url).toBe('/__devkit/save-audio?folder=sfx&stem=sfx_seed_land&bus=sfx&ext=wav')
    expect(audio.reloadFile).toHaveBeenCalledWith('sfx/sfx_seed_land_03.mp3')
    expect((audio.config() as any).sounds['seed.land'].files).toContain('sfx/sfx_seed_land_03.mp3')
    expect(screen.getByText(/silent start trimmed: 42 ms/)).toBeTruthy()
    // credits
    const credits = screen.getByRole('group', { name: 'Credits' })
    fireEvent.change(within(credits).getByPlaceholderText('who made it'), { target: { value: 'Ann' } })
    await act(async () => { fireEvent.click(within(credits).getByRole('button', { name: 'Add to credits' })) })
    const [creditUrl, init] = devkitCalls().at(-1)!
    expect(creditUrl).toBe('/__devkit/add-credit')
    expect(JSON.parse((init as RequestInit).body as string).entry).toMatchObject({
      paths: ['public/audio/sfx/sfx_seed_land_03.mp3'], source: 'Pop Take 2.WAV', author: 'Ann', licence: 'CC0', light: '🟢',
    })
  })

  it('the mixer edits the buses and plays named mixes', () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: /Mixer/ }))
    fireEvent.change(screen.getByRole('slider', { name: /buses\.music slider/ }), { target: { value: '-14' } })
    expect((audio.config() as any).buses.music).toBe(-14)
    fireEvent.click(screen.getByRole('button', { name: 'paused' }))
    expect(audio.snapshot).toHaveBeenCalledWith('paused')
    fireEvent.click(screen.getByRole('button', { name: 'normal' }))
    expect(audio.snapshot).toHaveBeenLastCalledWith(null)
  })

  it('the log lists plays and drops, newest first, in plain words; Clear empties it', () => {
    const audio = fakeAudio()
    renderTab(audio)
    fireEvent.click(screen.getByRole('button', { name: /Log/ }))
    act(() => {
      audio.emit({ t: 1, id: 'seed.land', result: 'played', file: 'sfx/sfx_seed_land_01.mp3' })
      audio.emit({ t: 2, id: 'ui.tap', result: 'dropped', reason: 'cooldown' })
    })
    const items = screen.getAllByRole('listitem').filter((li) => li.closest('.sb-log-list'))
    expect(items[0].textContent).toContain('ui.tap')
    expect(items[0].textContent).toContain('cooldown (repeated too soon)')
    expect(items[1].textContent).toContain('sfx/sfx_seed_land_01.mp3')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(audio.log.clear).toHaveBeenCalled()
    expect(screen.getByText(/Nothing yet/)).toBeTruthy()
  })
})

describe('soundTab — the entry a game lists in tabs.ts', () => {
  it('is a "Sound" tab whose Panel takes the search text (it searches only itself)', () => {
    const tab = soundTab(() => fakeAudio(), { file: FILE, baseUrl: '/' })
    expect(tab).toMatchObject({ id: 'sound', label: 'Sound' })
    const Panel = tab.Panel as (props: { query?: string }) => React.ReactElement
    render(<Panel query="night" />)
    expect(screen.getByRole('button', { name: 'amb.night' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'ui.tap' })).toBeNull()
  })
})
