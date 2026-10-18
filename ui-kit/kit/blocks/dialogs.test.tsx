// Toast timing, and Confirm opened through the screen stack.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ScreenStack, screens } from '..'
import { askConfirm, kitScreens, MAX_TOASTS, Modal, toast, toasts, ToastStack } from './dialogs'

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
