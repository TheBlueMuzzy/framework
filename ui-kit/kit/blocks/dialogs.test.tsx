// Toast timing, and Confirm opened through the screen stack.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ScreenStack, screens } from '..'
import { askConfirm, kitScreens, MAX_TOASTS, toast, toasts } from './dialogs'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  toasts.current.forEach((t) => toasts.dismiss(t.id))
  while (screens.current.length) screens.pop()
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
