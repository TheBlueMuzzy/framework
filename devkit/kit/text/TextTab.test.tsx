// Runs in the framework (not copied into games): the Text tab — boxes, ↺, {placeholder} warnings, Save, search.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DevKit } from '../DevKit'
import { TextTab } from './TextTab'
import { textTab } from './textTabEntry'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const FILE = {
  _help: 'Every word players read.',
  menu: { title: 'Glyphtender', play: 'Play', _help: 'The first screen.' },
  game: {
    turnOf: "{player}'s turn",
    rules: { pages: [{ title: 'Goal', body: 'Spell words.' }] },
    maxPlayers: 4,
  },
}

const box = (key: string) => document.getElementById(`tx:${key}`) as HTMLTextAreaElement
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement
/** Tap a section's title bar (not its chip at the top) */
const openSection = (title: string) =>
  fireEvent.click([...document.querySelectorAll('.dk-section-btn')].find((b) => b.querySelector('.dk-section-title')!.textContent === title)!)

/** A stand-in dev server: GET the file → what's "on disk"; POST /__devkit/save → remembered. */
function fakeServer(onDisk: object = FILE) {
  const saves: { path: string; data: Record<string, unknown>; reload?: boolean }[] = []
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/__devkit/save') {
      saves.push(JSON.parse(String(init!.body)))
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    return new Response(JSON.stringify(onDisk), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return saves
}

describe('the Text tab', () => {
  it('shows sections, notes, a box per string, and numbers read-only', () => {
    render(<TextTab file="content/text/en.json" data={FILE} />)
    expect(screen.getByText('Every word players read.')).toBeTruthy()
    openSection('menu')
    expect(screen.getByText('The first screen.')).toBeTruthy()
    expect(box('menu.play').value).toBe('Play')
    openSection('game')
    expect(document.querySelector('[data-key="game.maxPlayers"] .tx-fixed')!.textContent).toBe('4') // shown, not edited
    expect(document.getElementById('tx:game.maxPlayers')).toBeNull()
    openSection('rules')
    expect(screen.getByText('pages › 1 › body')).toBeTruthy()
    expect(box('game.rules.pages.0.body').value).toBe('Spell words.')
  })

  it('a changed box is marked, counted, and ↺ puts it back', () => {
    render(<TextTab file="content/text/en.json" data={FILE} />)
    openSection('menu')
    expect(screen.getByText('No changes')).toBeTruthy()
    fireEvent.change(box('menu.play'), { target: { value: 'Start' } })
    expect(box('menu.play').closest('.tx-row')!.classList.contains('is-changed')).toBe(true)
    expect(screen.getByText('1 change')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reset menu.play to the saved words' }))
    expect(box('menu.play').value).toBe('Play')
    expect(screen.getByText('No changes')).toBeTruthy()
  })

  it('a box that lost a {placeholder} warns, and Save waits until it is back', () => {
    render(<TextTab file="content/text/en.json" data={FILE} />)
    openSection('game')
    expect(screen.getByText('{player}')).toBeTruthy() // "The game fills in: {player}"
    fireEvent.change(box('game.turnOf'), { target: { value: 'Your turn' } })
    expect(screen.getByRole('alert').textContent).toContain('{player} is missing — the game fills it in')
    expect(button('Save').disabled).toBe(true)
    fireEvent.change(box('game.turnOf'), { target: { value: 'Over to {player}' } })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(button('Save').disabled).toBe(false)
  })

  it('Save writes the whole file (fresh from disk, with the edits on top) and asks for a reload', async () => {
    // Another tab saved a bio since the page loaded: it must survive this save
    const saves = fakeServer({ ...FILE, menu: { ...FILE.menu, title: 'Glyphtender!' } })
    render(<TextTab file="content/text/en.json" data={FILE} />)
    openSection('menu')
    fireEvent.change(box('menu.play'), { target: { value: 'Start' } })
    await act(async () => fireEvent.click(button('Save')))
    expect(saves).toHaveLength(1)
    expect(saves[0].path).toBe('content/text/en.json')
    expect(saves[0].reload).toBe(true)
    expect(saves[0].data).toEqual({ ...FILE, menu: { ...FILE.menu, title: 'Glyphtender!', play: 'Start' } })
    expect(Object.keys(saves[0].data)).toEqual(Object.keys(FILE))
    expect(screen.getByText('Saved content/text/en.json — the game reloads its words.')).toBeTruthy()
    expect(box('menu.title').value).toBe('Glyphtender!') // now shows what's on disk
    expect(screen.getByText('No changes')).toBeTruthy()
  })

  it('Copy for Claude gives key: "old" → "new" lines', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<TextTab file="content/text/en.json" data={FILE} />)
    openSection('menu')
    fireEvent.change(box('menu.play'), { target: { value: 'Start' } })
    await act(async () => fireEvent.click(button('Copy for Claude')))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('- menu.play: "Play" → "Start"'))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Text changes from the Dev Kit'))
  })

  it('in the Dev Kit, the search box filters strings by key or words and opens their sections', () => {
    render(<DevKit tabs={[textTab({ file: 'content/text/en.json', data: FILE })]} />)
    const search = screen.getByRole('searchbox', { name: 'Search Text', hidden: true }) as HTMLInputElement
    fireEvent.change(search, { target: { value: 'SPELL' } })
    expect(screen.getByText('1 string found')).toBeTruthy()
    expect(box('game.rules.pages.0.body')).toBeTruthy() // its sections opened
    expect(box('menu.play')).toBeNull()
    fireEvent.change(search, { target: { value: 'menu play' } })
    expect(box('menu.play')).toBeTruthy()
    expect(box('menu.title')).toBeNull()
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText(/Nothing in Text matches/)).toBeTruthy()
  })
})
