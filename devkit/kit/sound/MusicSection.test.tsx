import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SoundTab } from './SoundTab'
import type { RawAudio } from './soundLogic'
import type { SoundBoardAudio, SoundMusicState } from './soundTypes'

const FILE: RawAudio = {
  _help: { 'music.tracks.garden': 'The game screen.' },
  sounds: { 'ui.tap': { bus: 'ui', files: ['ui/ui_button_tap_01.mp3'] } },
  music: {
    tracks: {
      garden: {
        layers: { harp: { file: 'mus/harp.mp3' }, pad: { file: 'mus/pad.mp3', volumeDb: -6, fromIntensity: 0.3, fullAtIntensity: 0.8 } },
        playsBeforeRest: 2,
        restSeconds: [60, 90],
      },
      menu: { layers: { main: { file: 'mus/menu.mp3' } } },
    },
  },
}

/** A stand-in engine with music */
function fakeAudio(withMusic = true) {
  let config: unknown = null
  let music: SoundMusicState = { track: null, phase: 'off', play: 0, playsBeforeRest: 0, restLeftMs: 0, intensity: 0, layers: [] }
  const audio = {
    config: () => config as any,
    setMusic: (next: Partial<SoundMusicState>) => { music = { ...music, ...next } },
    play: vi.fn(),
    stop: vi.fn(),
    setConfig: vi.fn((raw: unknown) => { config = raw }),
    preload: vi.fn(async () => {}),
    reloadFile: vi.fn(),
    snapshot: vi.fn(),
    unlock: vi.fn(),
    state: () => 'running',
    log: { entries: () => [], clear: vi.fn() },
    onLog: () => () => {},
    ...(withMusic
      ? {
        playMusic: vi.fn((name: string) => { music = { ...music, track: name, phase: 'playing', play: 1, playsBeforeRest: 2 } }),
        stopMusic: vi.fn(),
        setMusicIntensity: vi.fn(),
        restMusic: vi.fn(),
        endMusicRest: vi.fn(),
        musicState: () => music,
      }
      : {}),
  }
  return audio as typeof audio & SoundBoardAudio
}

const renderTab = (audio: SoundBoardAudio, query = '') =>
  render(<SoundTab getAudio={() => audio} file={FILE} path="content/audio.json" tuningName="audio" baseUrl="/" query={query} />)
const openMusic = () => fireEvent.click(screen.getByRole('button', { name: /^Music [0-9]/ }))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('the Sound tab — Music section', () => {
  it('lists the tracks with their layer counts; ▶ / ■ play and stop a track', () => {
    const audio = fakeAudio()
    renderTab(audio)
    openMusic()
    expect(screen.getByRole('button', { name: 'garden' })).toBeTruthy()
    expect(screen.getByText('2 layers')).toBeTruthy()
    expect(screen.getByText('1 layer')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Play music garden' }))
    expect(audio.unlock).toHaveBeenCalled()
    expect(audio.playMusic).toHaveBeenCalledWith('garden')
    expect(screen.getByText('garden · play 1 of 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Stop music garden' }))
    expect(audio.stopMusic).toHaveBeenCalledWith({ track: 'garden' })
  })

  it('the intensity slider is live (not saved)', () => {
    const audio = fakeAudio()
    renderTab(audio)
    openMusic()
    fireEvent.change(screen.getByRole('slider', { name: /Music intensity slider/ }), { target: { value: '0.6' } })
    expect(audio.setMusicIntensity).toHaveBeenCalledWith(0.6, { rampMs: 150 })
    expect(audio.setConfig).not.toHaveBeenCalled()
  })

  it("a layer's and a track's sliders edit the file live (Save writes it)", () => {
    const audio = fakeAudio()
    renderTab(audio)
    openMusic()
    fireEvent.click(screen.getByRole('button', { name: 'garden' }))
    fireEvent.change(screen.getByRole('slider', { name: /music\.tracks\.garden\.layers\.pad\.fullAtIntensity slider/ }), { target: { value: '0.9' } })
    expect(audio.config().music.tracks.garden.layers.pad.fullAtIntensity).toBe(0.9)
    fireEvent.change(screen.getByRole('slider', { name: /music\.tracks\.garden\.restSeconds\.1 slider/ }), { target: { value: '120' } })
    expect(audio.config().music.tracks.garden.restSeconds).toEqual([60, 120])
    fireEvent.click(screen.getByRole('checkbox', { name: /Loop/ }))
    expect(audio.config().music.tracks.garden.loop).toBe(false)
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Rest now / Come back now follow what the music is doing', () => {
    vi.useFakeTimers()
    const audio = fakeAudio()
    renderTab(audio)
    openMusic()
    const restNow = screen.getByRole('button', { name: 'Rest now' }) as HTMLButtonElement
    const backNow = screen.getByRole('button', { name: 'Come back now' }) as HTMLButtonElement
    expect(restNow.disabled).toBe(true) // nothing playing
    fireEvent.click(screen.getByRole('button', { name: 'Play music garden' }))
    expect(restNow.disabled).toBe(false)
    fireEvent.click(restNow)
    expect(audio.restMusic).toHaveBeenCalled()
    audio.setMusic({ phase: 'resting', restLeftMs: 41000 })
    act(() => { vi.advanceTimersByTime(300) }) // the "Now" line refreshes on its own
    expect(screen.getByText('garden · resting — back in 41 s')).toBeTruthy()
    fireEvent.click(backNow)
    expect(audio.endMusicRest).toHaveBeenCalled()
  })

  it('the search box filters the tracks', () => {
    renderTab(fakeAudio(), 'menu')
    openMusic()
    expect(screen.getByRole('button', { name: 'menu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'garden' })).toBeNull()
  })

  it('an older audio module (no music) gets a plain note', () => {
    renderTab(fakeAudio(false))
    openMusic()
    expect(screen.getByText(/Music needs the audio module 0\.2\.0/)).toBeTruthy()
  })
})
