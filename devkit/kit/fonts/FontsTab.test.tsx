// Runs in the framework (not copied into games): the Fonts tab — compare, pick live, ↺, Save, library Try / Add to game.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The tab finds the game's UI kit and files with import.meta.glob (nothing in the framework) — hand it the real kit here
vi.mock('../color/uiKit', async () => {
  const { applyStyle } = await import('../../../ui-kit/kit/style/applyStyle')
  const { presets } = await import('../../../ui-kit/kit/styles')
  const { kitFonts, loadGameFonts } = await import('../../../ui-kit/kit/fonts/gameFonts')
  const { createStyleStore } = await import('../color/styleStore')
  const uiKit = { applyStyle, presets, kitFonts, loadGameFonts } as never
  const styleFile = { preset: 'neon', tweaks: { primary: '#123456' } }
  const save = async (path: string, data: object) => {
    await fetch('/__devkit/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, data }) })
  }
  return {
    uiKit,
    styleFile,
    styleStore: createStyleStore(uiKit, styleFile, save),
    gameFontsFile: {
      fonts: [{ name: 'Press Start DX', file: 'press_start_dx/Press Start DX.ttf', licence: 'unknown', pixelSize: 8 }],
      samples: { title: 'Start shift', heading: 'Operator rank', body: 'Rupture! Too many open cracks', numbers: '99999' },
    },
  }
})

const { FontsTab } = await import('./FontsTab')
const { styleStore } = await import('../color/uiKit')

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  styleStore!.undo()
})

/** A stand-in dev server: the font library + Save. */
function fakeServer({ installedOn = true } = {}) {
  const calls: { url: string; body?: unknown }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url, body })
    if (url.startsWith('/__devkit/font-library?') || url === '/__devkit/font-library') {
      const installedFonts = [
        { path: 'installed1:arial.ttf', name: 'Arial', folder: 'Windows Fonts', file: 'arial.ttf', styles: 10 },
        { path: 'installed1:consola.ttf', name: 'Consolas', folder: 'Windows Fonts', file: 'consola.ttf', styles: 4 },
        { path: 'installed2:PressGothic.otf', name: 'Press Gothic', folder: 'your Windows fonts', file: 'PressGothic.otf', styles: 1 },
      ]
      if (url.includes('refresh')) installedFonts.push({ path: 'installed2:newone.ttf', name: 'New One', folder: 'your Windows fonts', file: 'newone.ttf', styles: 1 })
      return Response.json({ folder: 'C:/Users/x/Downloads/Font', found: true, more: false, fonts: [
        { path: 'folder:gb_boot/gbb__.ttf', name: 'Gbb', folder: 'gb_boot', file: 'gb_boot/gbb__.ttf' },
        { path: 'folder:press_start_dx/Press Start DX.ttf', name: 'Press Start DX', folder: 'press_start_dx', file: 'press_start_dx/Press Start DX.ttf' },
      ], installed: installedOn
        ? { on: true, folders: ['Windows Fonts', 'your Windows fonts'], fonts: installedFonts, more: false, skipped: { ttc: 15, fon: 192 }, platform: 'win32' }
        : { on: false, folders: [], fonts: [], more: false, skipped: {}, platform: 'win32' } })
    }
    if (url === '/__devkit/font-library/add') {
      if (body.path === 'installed1:consola.ttf') {
        return Response.json({ ok: true, already: false, wrote: ['public/fonts/consolas/consola.ttf', 'content/ui/fonts.json', 'content/credits.json'],
          font: { name: 'Consolas', file: 'consolas/consola.ttf', licence: 'unknown' } })
      }
      return Response.json({ ok: true, already: false, wrote: ['public/fonts/gb_boot/gbb__.ttf', 'content/ui/fonts.json', 'content/credits.json'],
        font: { name: 'Gbb', file: 'gb_boot/gbb__.ttf', licence: 'unknown' } })
    }
    return Response.json({ ok: true })
  }))
  // jsdom has no font loading
  vi.stubGlobal('FontFace', class { constructor(public family: string) {} load = async () => this })
  Object.defineProperty(document, 'fonts', { value: { add: () => {} }, configurable: true })
  return calls
}

const openSection = (title: string) =>
  fireEvent.click([...document.querySelectorAll('.dk-section-btn')].find((b) => b.querySelector('.dk-section-title')!.textContent === title)!)
const samplesIn = (title: string) =>
  [...document.querySelectorAll(`[aria-label="${title} font — compare"] .ft-sample`)] as HTMLButtonElement[]
const sampleNamed = (role: string, name: string) => samplesIn(role).find((b) => b.querySelector('.ft-sample-name')!.textContent === name)!

describe('Fonts tab', () => {
  it('compares every font (kit + game) with the game\'s own sample line, licence chips and crispness', async () => {
    fakeServer()
    await act(async () => render(<FontsTab />))
    const title = samplesIn('Title')
    expect(title[0].querySelector('.ft-sample-name')!.textContent).toBe('Style default (Orbitron)')
    expect(title.map((b) => b.querySelector('.ft-sample-name')!.textContent)).toContain('Press Start DX')
    expect(title.map((b) => b.querySelector('.ft-sample-name')!.textContent)).toContain('VT323')
    expect(title[0].textContent).toContain('Start shift')
    expect(sampleNamed('Title', 'Press Start DX').textContent).toContain('🔴')
    expect(sampleNamed('Title', 'Orbitron').textContent).toContain('🟡')
    expect(sampleNamed('Title', 'Press Start DX').querySelector('.ft-crisp, .ft-soft')).not.toBeNull()
    expect(title[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('a tap picks it, live in the game; ↺ puts it back; Save writes only the fonts', async () => {
    const calls = fakeServer()
    await act(async () => render(<FontsTab />))
    fireEvent.click(sampleNamed('Title', 'Press Start DX'))
    expect(document.documentElement.style.getPropertyValue('--font-title')).toBe("'Press Start DX', system-ui, sans-serif")
    expect(sampleNamed('Title', 'Press Start DX').getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /Reset the Title font/ }))
    expect(document.documentElement.style.getPropertyValue('--font-title')).toBe('var(--font-display)')

    openSection('Body font')
    fireEvent.click(sampleNamed('Body', 'VT323'))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })))
    const save = calls.find((c) => c.url === '/__devkit/save')!
    expect(save.body).toEqual({ path: 'content/ui/style.json', data: { preset: 'neon', tweaks: { primary: '#123456', 'font-body': "'VT323', system-ui, sans-serif" } } })
    expect(await screen.findByText(/Saved the fonts/)).toBeTruthy()
  })

  it('library: Try puts a font in the comparisons; Save waits until it is added to the game', async () => {
    const calls = fakeServer()
    await act(async () => render(<FontsTab />))
    openSection('Your font folder')
    const rows = [...document.querySelectorAll('.ft-lib-row')]
    expect(rows).toHaveLength(2)
    expect(rows[0].querySelector('.ft-list-note')!.textContent).toBe('gb_boot/gbb__.ttf') // the readable path, not the root key
    expect(rows[1].textContent).toContain('in the game ✓') // Press Start DX is already in the game
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try' })))
    fireEvent.click(sampleNamed('Title', 'Gbb'))
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Gbb is from your font library/)).toBeTruthy()

    await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Add to game' })[0]))
    expect(calls.find((c) => c.url === '/__devkit/font-library/add')!.body).toEqual({ path: 'folder:gb_boot/gbb__.ttf' })
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText(/Added Gbb/)).toBeTruthy()
    expect(screen.queryByText(/can't ship in a game/)).toBeNull() // (the installed-font warning is for installed fonts)
    expect(document.documentElement.style.getPropertyValue('--font-title')).toBe("'Gbb', system-ui, sans-serif")
  })

  it('installed on this PC: its own group, one row per family, the 🔴 note; Try previews it, Add marks it unknown + warns', async () => {
    const calls = fakeServer()
    await act(async () => render(<FontsTab />))
    openSection('Installed on this PC')
    const section = document.querySelector('[data-dk-section="fonts:Installed"]')!
    const rows = [...section.querySelectorAll('.ft-lib-row')]
    expect(rows.map((r) => r.querySelector('.ft-list-name')!.textContent)).toEqual(['Arial', 'Consolas', 'Press Gothic'])
    expect(rows[0].querySelector('.ft-list-note')!.textContent).toBe('10 styles · arial.ttf')
    expect(section.textContent).toContain("Most fonts that come with Windows can't ship in a game — check its licence.")
    expect(section.textContent).toContain('15 .ttc collections and 192 old .fon screen fonts')
    expect(document.querySelector('[data-dk-section="fonts:Library"] .ft-lib-row')).toBeNull() // the folder's group stays shut

    const consolas = rows[1]
    await act(async () => fireEvent.click(consolas.querySelector('button')!)) // Try
    expect(sampleNamed('Title', 'Consolas')).toBeTruthy()
    fireEvent.click(sampleNamed('Title', 'Consolas'))
    expect(document.documentElement.style.getPropertyValue('--font-title')).toBe("'Consolas', system-ui, sans-serif")
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)

    await act(async () => fireEvent.click([...consolas.querySelectorAll('button')].find((b) => b.textContent === 'Add to game')!))
    expect(calls.find((c) => c.url === '/__devkit/font-library/add')!.body).toEqual({ path: 'installed1:consola.ttf' })
    expect(screen.getByRole('status').textContent).toMatch(/Added Consolas.*🔴 unknown.*Most fonts that come with Windows can't ship in a game/)
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look again' })))
    expect(calls.some((c) => c.url === '/__devkit/font-library?refresh=1')).toBe(true)
    expect([...section.querySelectorAll('.ft-list-name')].map((n) => n.textContent)).toContain('New One')
  })

  it('installed fonts turned off → the group says how', async () => {
    fakeServer({ installedOn: false })
    await act(async () => render(<FontsTab />))
    openSection('Installed on this PC')
    expect(document.querySelector('[data-dk-section="fonts:Installed"]')!.textContent).toContain('"installedFonts": false')
    expect(document.querySelectorAll('[data-dk-section="fonts:Installed"] .ft-lib-row')).toHaveLength(0)
  })

  it('the search box narrows the fonts — in your folder and the installed ones', async () => {
    fakeServer()
    await act(async () => render(<FontsTab query="press" />))
    expect(samplesIn('Title').map((b) => b.querySelector('.ft-sample-name')!.textContent)).toEqual(['Press Start DX'])
    expect(screen.getByText(/fonts? found/)).toBeTruthy()
    const names = (id: string) => [...document.querySelectorAll(`[data-dk-section="${id}"] .ft-lib-row .ft-list-name`)].map((n) => n.textContent)
    expect(names('fonts:Library')).toEqual(['Press Start DX'])
    expect(names('fonts:Installed')).toEqual(['Press Gothic'])
  })
})
