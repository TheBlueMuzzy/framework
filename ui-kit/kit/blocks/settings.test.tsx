// Settings is drawn from its list: add a row → it appears; switch it off → it's gone; values are remembered.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ScreenStack, screens } from '..'
import { kitScreens } from './dialogs'
import { loadSettings, Settings, settingsStorageKey, type SettingsSchema } from './Settings'

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
    render(<Settings schema={schema()} />) // opening Settings again
    expect(screen.getByRole('switch', { name: 'Music' }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByText('Reset to defaults'))
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
    expect(audio.rows.map((row) => [row.id, row.default])).toEqual([
      ['masterVolume', 80], ['musicVolume', 50], ['ambienceVolume', 60], ['sfxVolume', 80], ['uiVolume', 70],
      ['muteAll', false], ['muteInBackground', true], ['mono', false],
    ])
  })
})
