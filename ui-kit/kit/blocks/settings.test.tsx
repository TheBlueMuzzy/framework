// Settings is drawn from its list: add a row → it appears; switch it off → it's gone; values are remembered.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ScreenStack, screens } from '..'
import { kitScreens } from './dialogs'
import { loadSettings, Settings, settingsStorageKey, type SettingsSchema } from './Settings'

/** "Reset to defaults" asks first (0.10.3): open Settings in a screen stack, press it, say yes. */
function resetWithYes() {
  fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
  const ask = screen.getByRole('dialog', { name: 'Reset to defaults?' })
  fireEvent.click(within(ask).getByRole('button', { name: 'Reset to defaults' }))
}
const inStack = (settings: () => ReactElement) => {
  render(<ScreenStack screens={{ ...kitScreens, settings }} />)
  act(() => screens.push('settings'))
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  while (screens.current.length) screens.pop()
})

const schema = (): SettingsSchema => ({ tabs: [
  { id: 'audio', label: 'Audio', rows: [{ id: 'music', type: 'toggle', label: 'Music', default: true }] },
  { id: 'about', label: 'About', rows: [{ id: 'reset', type: 'destructive', label: 'Reset progress', button: 'Reset' }] },
] })

describe('Settings', () => {
  it('adding an entry to the list makes a row appear', () => {
    const list = schema()
    list.tabs[0].rows.push({ id: 'sfx', type: 'slider', label: 'Sound effects', default: 50 })
    render(<Settings schema={list} />)
    expect(screen.getByRole('slider', { name: 'Sound effects' })).toBeTruthy()
  })

  it('a row switched off is not drawn, and a tab with no rows left disappears', () => {
    const list = schema()
    list.tabs.push({ id: 'video', label: 'Video', rows: [{ id: 'hd', type: 'toggle', label: 'HD', default: true }] })
    list.tabs[1].rows[0].on = false
    render(<Settings schema={list} />)
    expect(screen.queryByRole('tab', { name: 'About' })).toBeNull()
    expect(screen.getByRole('tab', { name: 'Audio' })).toBeTruthy()
  })

  it('with only one tab there is no tab picker, just its rows', () => {
    const list = schema()
    list.tabs.pop()
    render(<Settings schema={list} />)
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByRole('switch', { name: 'Music' })).toBeTruthy()
  })

  it('hide leaves rows out for now (e.g. in-game-only rows on the main menu)', () => {
    render(<Settings schema={schema()} hide={['reset']} />)
    expect(screen.queryByRole('tab', { name: 'About' })).toBeNull() // its only row is hidden
    expect(screen.getByRole('switch', { name: 'Music' })).toBeTruthy()
  })

  it('remembers values in the browser, and "reset to defaults" puts them back', () => {
    render(<Settings schema={schema()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Music' }))
    expect(loadSettings(schema()).music).toBe(false)
    cleanup()
    inStack(() => <Settings schema={schema()} />) // opening Settings again
    expect(screen.getByRole('switch', { name: 'Music' }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    expect(screen.getByRole('switch', { name: 'Music' }).getAttribute('aria-checked')).toBe('false') // it asks first
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Reset to defaults?' })).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('switch', { name: 'Music' }).getAttribute('aria-checked')).toBe('false') // Cancel: nothing changes
    resetWithYes()
    expect(screen.getByRole('switch', { name: 'Music' }).getAttribute('aria-checked')).toBe('true')
  })

  it('each game on one site (<user>.github.io/<game>/) keeps its own settings', () => {
    history.replaceState(history.state, '', '/game-a/')
    expect(settingsStorageKey()).toBe('kit-settings:game-a')
    render(<Settings schema={schema()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Music' }))
    expect(loadSettings(schema()).music).toBe(false) // start-up reads the same slot Settings saved to
    history.replaceState(history.state, '', '/game-b/play?screen=settings')
    expect(loadSettings(schema()).music).toBe(true) // another game: untouched
    history.replaceState(history.state, '', '/game-a/other-page')
    expect(loadSettings(schema()).music).toBe(false) // any page inside game A: same slot
    history.replaceState(history.state, '', '/')
  })

  it('storageKey picks the save slot by hand', () => {
    render(<Settings schema={schema()} storageKey="my-game" />)
    fireEvent.click(screen.getByRole('switch', { name: 'Music' }))
    expect(loadSettings(schema(), 'my-game').music).toBe(false)
    expect(loadSettings(schema()).music).toBe(true)
  })

  it('a saved value that no longer fits its row falls back to the default', () => {
    const list = schema()
    list.tabs[0].rows.push(
      { id: 'speed', type: 'selector', label: 'Speed', options: ['Slow', 'Fast'], default: 'Slow' },
      { id: 'volume', type: 'slider', label: 'Volume', default: 50 },
      { id: 'players', type: 'stepper', label: 'Players', min: 2, max: 4, default: 2 },
    )
    localStorage.setItem(settingsStorageKey(), JSON.stringify({ music: 'yes', speed: 'Warp', volume: 500, players: 3 }))
    expect(loadSettings(list)).toEqual({ music: true, speed: 'Slow', volume: 50, players: 3 })
    localStorage.setItem(settingsStorageKey(), '"not a list of settings"')
    expect(loadSettings(list)).toEqual({ music: true, speed: 'Slow', volume: 50, players: 2 })
  })

  it('uses a game’s own save function when given one', () => {
    const save = vi.fn()
    render(<Settings schema={schema()} load={() => ({ music: false })} save={save} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Music' }))
    expect(save).toHaveBeenCalledWith({ music: true })
  })

  it('a destructive row asks first, then calls onAction', () => {
    const onAction = vi.fn()
    render(<ScreenStack screens={{ ...kitScreens, settings: () => <Settings schema={schema()} onAction={onAction} /> }} />)
    act(() => screens.push('settings'))
    fireEvent.click(screen.getByRole('tab', { name: 'About' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onAction).not.toHaveBeenCalled() // a Confirm opened instead
    const confirm = screen.getByRole('dialog', { name: 'Reset progress?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Reset' }))
    expect(onAction).toHaveBeenCalledWith('reset')
  })

  it('heading rows draw a section title; one with nothing under it is not drawn; Reset ignores them (0.10.0)', () => {
    const list: SettingsSchema = { tabs: [
      { id: 'play', label: 'Play', rows: [
        { id: 'secPlay', type: 'heading', label: 'Play' },
        { id: 'music', type: 'toggle', label: 'Music', default: true },
        { id: 'secEmpty', type: 'heading', label: 'Nothing here' },
        { id: 'secOff', type: 'heading', label: 'Switched off' },
        { id: 'hd', type: 'toggle', label: 'HD', default: true, on: false },
      ] },
      { id: 'only', label: 'Only headings', rows: [{ id: 'secLonely', type: 'heading', label: 'Lonely' }] },
    ] }
    inStack(() => <Settings schema={list} />)
    expect(screen.getByRole('heading', { name: 'Play' })).toBeTruthy()
    expect(screen.queryByText('Nothing here')).toBeNull() // the next row is another heading
    expect(screen.queryByText('Switched off')).toBeNull() // its only row is off
    expect(screen.queryByRole('tab')).toBeNull() // the headings-only tab is dropped, leaving one tab: no picker
    fireEvent.click(screen.getByRole('switch', { name: 'Music' }))
    resetWithYes()
    expect(loadSettings(list).music).toBe(true)
    expect(Object.keys(loadSettings(list)).filter((id) => id.startsWith('sec'))).toEqual([]) // headings hold no value
  })

  it('a button row with "confirm" asks first (not the red button), then calls onAction; without it, straight away', () => {
    const onAction = vi.fn()
    const list: SettingsSchema = { tabs: [{ id: 'account', label: 'Account', rows: [
      { id: 'leaveTutorial', type: 'button', label: 'Leave the tutorial', button: 'Leave', confirm: 'You can play it again from the menu.' },
      { id: 'playerName', type: 'button', label: 'Change your name' },
    ] }] }
    render(<ScreenStack screens={{ ...kitScreens, settings: () => <Settings schema={list} onAction={onAction} /> }} />)
    act(() => screens.push('settings'))
    fireEvent.click(screen.getByRole('button', { name: /Leave the tutorial/ }))
    expect(onAction).not.toHaveBeenCalled()
    const confirm = screen.getByRole('dialog', { name: 'Leave the tutorial?' })
    expect(within(confirm).getByText('You can play it again from the menu.')).toBeTruthy()
    const yes = within(confirm).getByRole('button', { name: 'Leave' })
    expect(yes.getAttribute('data-variant')).toBe('primary')
    fireEvent.click(yes)
    expect(onAction).toHaveBeenCalledWith('leaveTutorial')
    fireEvent.click(screen.getByRole('button', { name: /Change your name/ }))
    expect(onAction).toHaveBeenLastCalledWith('playerName')
  })

  it('3 tabs or fewer: always the tab bar, never the ◀ ▶ picker; 4 or more: both (CSS picks by screen size)', () => {
    const tabOf = (id: string) => ({ id, label: id, rows: [{ id: `${id}Row`, type: 'toggle', label: `${id} row`, default: true }] })
    render(<Settings schema={{ tabs: ['a', 'b', 'c'].map(tabOf) }} />)
    expect(screen.getAllByRole('tablist')).toHaveLength(1)
    expect(document.querySelector('.kit-settings-picker')).toBeNull()
    cleanup()
    render(<Settings schema={{ tabs: ['a', 'b', 'c', 'd'].map(tabOf) }} />)
    expect(document.querySelector('.kit-settings-picker')).not.toBeNull()
  })

  it('every tab is drawn in one spot (the tallest sets the size), only the current one can be seen or used', () => {
    render(<Settings schema={schema()} />)
    const pages = document.querySelectorAll('.kit-settings-page')
    expect(pages).toHaveLength(2)
    expect(pages[1].hasAttribute('inert')).toBe(true)
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull() // the About tab's row: hidden for now
    fireEvent.click(screen.getByRole('tab', { name: 'About' }))
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy()
    expect(screen.queryByRole('switch', { name: 'Music' })).toBeNull()
  })

  it('has the menu header: ‹ goes back (onBack), no other Back button', () => {
    const onBack = vi.fn()
    render(<Settings schema={schema()} onBack={onBack} />)
    expect(screen.getAllByRole('button', { name: 'Back' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('version (0.24.0): one line at the bottom, the same on every tab, outside the scrolling pages', () => {
    const { container } = render(<Settings schema={schema()} version="v0.11.0.4" />)
    const lines = () => [...container.querySelectorAll('.kit-settings-version')]
    expect(lines().map((l) => l.textContent)).toEqual(['v0.11.0.4'])
    expect(lines()[0].closest('.kit-settings-pages')).toBe(null)
    fireEvent.click(screen.getByRole('tab', { name: 'About' }))
    expect(lines().map((l) => l.textContent)).toEqual(['v0.11.0.4'])
  })

  it('no version → no line; info.version still fills an info row, and version fills it when info doesn\'t', () => {
    const list = (): SettingsSchema => ({ tabs: [{ id: 'about', label: 'About', rows: [{ id: 'version', type: 'info', label: 'Version' }] }] })
    const { container, unmount } = render(<Settings schema={list()} info={{ version: 'v1.2.3' }} />)
    expect(container.querySelector('.kit-settings-version')).toBe(null)
    expect(screen.getByText('v1.2.3')).toBeTruthy()
    unmount()
    render(<Settings schema={list()} version="v0.11.0.4" />)
    expect(screen.getAllByText('v0.11.0.4')).toHaveLength(2) // the row + the bottom line
  })

  it('text size and reduce motion drive the whole kit', () => {
    const list: SettingsSchema = { tabs: [{ id: 'a11y', label: 'Accessibility', rows: [
      { id: 'reduceMotion', type: 'toggle', label: 'Reduce motion', default: false },
    ] }] }
    render(<Settings schema={list} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }))
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(true)
  })
})

describe('the standard Audio tab', () => {
  it('has the rows the audio module reads, with the standard defaults', async () => {
    const standard = (await import('./settings.default.json')).default as SettingsSchema
    const audio = standard.tabs.find((tab) => tab.id === 'audio')!
    expect(audio.rows.filter((row) => row.type !== 'heading').map((row) => [row.id, row.default])).toEqual([
      ['masterVolume', 80], ['musicVolume', 50], ['ambienceVolume', 60], ['sfxVolume', 80], ['uiVolume', 70],
      ['sound', true], ['muteInBackground', true], ['mono', false],
    ])
  })

  it('an older save with "Mute everything" (muteAll) comes out as Sound: muted → off, not muted → on; a saved Sound wins', async () => {
    const standard = (await import('./settings.default.json')).default as SettingsSchema
    localStorage.setItem('old-save', JSON.stringify({ muteAll: true, musicVolume: 20 }))
    expect(loadSettings(standard, 'old-save')).toMatchObject({ sound: false, musicVolume: 20 })
    expect(loadSettings(standard, 'old-save')).not.toHaveProperty('muteAll')
    localStorage.setItem('old-save', JSON.stringify({ muteAll: false }))
    expect(loadSettings(standard, 'old-save').sound).toBe(true)
    localStorage.setItem('old-save', JSON.stringify({ muteAll: true, sound: true }))
    expect(loadSettings(standard, 'old-save').sound).toBe(true)
    localStorage.removeItem('old-save')
  })
})
