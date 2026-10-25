// Toast timing, and Confirm opened through the screen stack.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode, useEffect } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button, ScreenStack, screens } from '..'
import { askConfirm, kitScreens, MAX_TOASTS, Modal, showWhatsNew, toast, toasts, ToastStack, WhatsNew } from './dialogs'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  toasts.current.forEach((t) => toasts.dismiss(t.id))
  while (screens.current.length) screens.pop()
})

describe('Modal', () => {
  it('a ‹ in its header only when onBack is given (0.10.1)', () => {
    const onBack = vi.fn()
    const { rerender } = render(<Modal title="Pick a word" />)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    rerender(<Modal title="Pick a word" onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('headerAction goes on the right of its header row; actions stay the bottom buttons (0.27.0)', () => {
    const respec = vi.fn()
    const { container } = render(<Modal title="Upgrades" headerAction={<Button compact onClick={respec}>Respec</Button>}
      actions={<Button>Done</Button>} />)
    const header = container.querySelector('.kit-menu-header')!
    const slot = header.querySelector('.kit-menu-header-action')!
    expect(header.lastElementChild).toBe(slot)
    expect(slot.textContent).toBe('Respec')
    fireEvent.click(screen.getByRole('button', { name: 'Respec' }))
    expect(respec).toHaveBeenCalledOnce()
    expect(header.contains(screen.getByRole('button', { name: 'Done' }))).toBe(false)
  })
})

describe('toasts', () => {
  it('each toast goes away on its own after its time', () => {
    vi.useFakeTimers()
    toast('Saved')
    vi.advanceTimersByTime(1000)
    toast('Sam joined', { seconds: 5 })
    expect(toasts.current.map((t) => t.text)).toEqual(['Saved', 'Sam joined'])
    vi.advanceTimersByTime(2000) // 3 s: "Saved" is done
    expect(toasts.current.map((t) => t.text)).toEqual(['Sam joined'])
    vi.advanceTimersByTime(3000)
    expect(toasts.current).toEqual([])
  })

  it(`keeps at most ${MAX_TOASTS}, dropping the oldest`, () => {
    ;['a', 'b', 'c', 'd'].forEach((text) => toast(text))
    expect(toasts.current.map((t) => t.text)).toEqual(['b', 'c', 'd'])
  })
})

describe('ToastStack place', () => {
  it('top by default; place moves it to the centre or the bottom', () => {
    const { container, rerender } = render(<ToastStack />)
    const place = () => container.querySelector('.kit-toasts')?.getAttribute('data-place')
    expect(place()).toBe('top')
    rerender(<ToastStack place="bottom" />)
    expect(place()).toBe('bottom')
  })

  it('place="at" (0.14.0): the bottom edge of the stack sits on the --kit-toasts-at point the game sets, and glides when it moves', () => {
    const { container } = render(<ToastStack place="at" />)
    expect(container.querySelector('.kit-toasts')?.getAttribute('data-place')).toBe('at')
    // (jsdom has no layout and vitest drops CSS, so WHERE it sits is proven in a real browser: the gallery's
    // ?screen=feedback&toasts=at, and Goops' e2e/hud-shots.mjs, which measures the stack's bottom edge at the point)
  })
})

describe('ToastStack variant="plain" (0.15.0)', () => {
  it('ordinary toasts are glowing words with no plate; a dismissible one keeps its plate (it can be tapped)', () => {
    toast('Still filling')
    toast('Tap me', { dismissible: true, seconds: 60 })
    const { container } = render(<ToastStack variant="plain" />)
    const words = screen.getByText('Still filling').closest('.kit-toast')!
    expect(words.classList.contains('kit-hud-text')).toBe(true)
    expect(words.classList.contains('kit-panel')).toBe(false)
    expect(screen.getByText('Tap me').closest('.kit-toast')!.hasAttribute('data-plain')).toBe(false)
    expect(container.querySelectorAll('.kit-toast[data-plain]')).toHaveLength(1)
  })
})

describe('dismissible toasts', () => {
  it('the Close button hides it early; others stay', () => {
    toast('Saved')
    toast('Tap me', { dismissible: true, seconds: 60 })
    render(<ToastStack />)
    act(() => { fireEvent.click(screen.getByLabelText('Close')) })
    expect(toasts.current.map((t) => t.text)).toEqual(['Saved'])
  })
  it('tapping the toast itself hides it too', () => {
    toast('Tap me', { dismissible: true })
    render(<ToastStack />)
    act(() => { fireEvent.click(screen.getByText('Tap me')) })
    expect(toasts.current).toEqual([])
  })
  it('an ordinary toast has no Close button', () => {
    toast('Saved')
    render(<ToastStack />)
    expect(screen.queryByLabelText('Close')).toBeNull()
  })
})

describe('askConfirm', () => {
  it('opens a Confirm on the stack; yes closes it and calls back', () => {
    const onConfirm = vi.fn()
    render(<ScreenStack screens={kitScreens} />)
    act(() => askConfirm({ title: 'Reset progress?', danger: true, onConfirm, words: { yes: 'Reset' } }))
    expect(screen.getByRole('dialog', { name: 'Reset progress?' })).toBeTruthy()
    fireEvent.click(screen.getByText('Reset'))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screens.current).toEqual([])
  })
})

describe('Confirm cancel', () => {
  // Any close that isn't "yes" is a "no": Esc, phone Back and tapping the dim all pop the screen.
  const open = (onConfirm = vi.fn(), onCancel = vi.fn()) => {
    render(<ScreenStack overlay screens={kitScreens} />)
    act(() => askConfirm({ title: 'Quit?', onConfirm, onCancel }))
    return { onConfirm, onCancel }
  }

  it('closing it without Yes (Esc, Back, the dim: all a screen pop) calls onCancel once', async () => {
    const { onConfirm, onCancel } = open()
    await act(async () => screens.pop())
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Esc counts as cancel', async () => {
    const { onCancel } = open()
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(screens.current).toEqual([])
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('the Cancel button calls onCancel once, not twice', async () => {
    const { onCancel } = open()
    await act(async () => { fireEvent.click(screen.getByText('Cancel')) })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('React StrictMode (which closes and reopens screens once while developing) is not a cancel', async () => {
    const onCancel = vi.fn()
    render(<StrictMode><ScreenStack screens={kitScreens} /></StrictMode>)
    await act(async () => askConfirm({ title: 'Quit?', onConfirm: () => {}, onCancel }))
    expect(onCancel).not.toHaveBeenCalled()
    await act(async () => screens.pop())
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('Yes never calls onCancel', async () => {
    const { onConfirm, onCancel } = open()
    await act(async () => { fireEvent.click(screen.getByText('OK')) })
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })
})

describe('showWhatsNew + WhatsNew (0.35.0)', () => {
  const versions = { '0.4.0': ['Two new boards', 'Faster dice', 'A calmer Settings'] }
  const key = 'test-whats-new'
  afterEach(() => localStorage.removeItem(key))

  it('first install: nothing opens, this version is remembered', () => {
    render(<ScreenStack screens={kitScreens} />)
    act(() => { expect(showWhatsNew({ version: '0.4.0.3', versions, storageKey: key })).toBe(false) })
    expect(screens.current).toEqual([])
    expect(localStorage.getItem(key)).toBe('0.4.0')
  })

  it('after an update: opens once with the lines; remembered as it opens, so the next launch shows nothing', () => {
    localStorage.setItem(key, '0.3.0')
    render(<ScreenStack screens={kitScreens} />)
    act(() => { expect(showWhatsNew({ version: '0.4.0.3', versions, storageKey: key })).toBe(true) })
    expect(screen.getByRole('dialog', { name: 'What’s new in v0.4' })).toBeTruthy()
    for (const line of versions['0.4.0']) expect(screen.getByText(line)).toBeTruthy()
    expect(localStorage.getItem(key)).toBe('0.4.0')
    fireEvent.click(screen.getByText('Got it'))
    expect(screens.current).toEqual([])
    act(() => { expect(showWhatsNew({ version: '0.4.0.4', versions, storageKey: key })).toBe(false) })
  })

  it('React StrictMode (an effect run twice while developing) still opens it once', async () => {
    localStorage.setItem(key, '0.3.0')
    const Menu = () => { useEffect(() => { showWhatsNew({ version: '0.4.0', versions, storageKey: key }) }, []); return null }
    render(<StrictMode><ScreenStack screens={kitScreens} /><Menu /></StrictMode>)
    await act(async () => {})
    expect(screens.current).toEqual(['whats-new'])
  })

  it('a Full notes button only for a web address; the game words replace the defaults', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { rerender } = render(<WhatsNew version="0.4.1" lines={['One']} />)
    expect(screen.queryByText('Full notes')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'What’s new in v0.4.1' })).toBeTruthy()
    rerender(<WhatsNew version="0.4.1" lines={['One']} notesUrl="javascript:alert(1)" />)
    expect(screen.queryByText('Full notes')).toBeNull()
    rerender(<WhatsNew version="0.4.1" lines={['One']} notesUrl="https://example.com/devlog"
      words={{ title: 'New in {version}', notes: 'Devlog', close: 'Nice' }} />)
    fireEvent.click(screen.getByText('Devlog'))
    expect(open).toHaveBeenCalledWith('https://example.com/devlog', '_blank', 'noopener')
    expect(screen.getByRole('dialog', { name: 'New in 0.4.1' })).toBeTruthy()
    expect(screen.getByText('Nice')).toBeTruthy()
  })

  it('never more than 5 lines on the panel', () => {
    render(<WhatsNew version="0.4.0" lines={['1', '2', '3', '4', '5', '6']} />)
    expect(screen.queryByText('6')).toBeNull()
    expect(screen.getByText('5')).toBeTruthy()
  })
})

describe('ScreenStack overlay', () => {
  it('holds open screens in a cover over the game; tapping the dim closes the top one', () => {
    const { container } = render(<ScreenStack overlay screens={kitScreens} />)
    const cover = container.querySelector('.kit-overlay')!
    expect(cover.hasAttribute('data-open')).toBe(false)
    act(() => askConfirm({ title: 'Quit?', onConfirm: () => {} }))
    expect(cover.hasAttribute('data-open')).toBe(true)
    expect(cover.contains(screen.getByRole('dialog', { name: 'Quit?' }))).toBe(true)
    fireEvent.click(screen.getByText('Quit?')) // a tap inside the dialog doesn't close it
    expect(screens.current).toEqual(['confirm'])
    fireEvent.click(cover)
    expect(screens.current).toEqual([])
  })
})
