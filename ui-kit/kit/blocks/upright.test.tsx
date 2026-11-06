// THE "TURN YOUR PHONE" CARD (F192, from Goops' Upright.tsx) — switched per game by content/ui/style.json "orientation".
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { applyStyle } from '../style/applyStyle'
import { UprightCard, wrongWayUp } from './upright'
import { pretendDevice } from './phoneDevice.test-util'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  applyStyle({ preset: 'clean' })
})

describe('the "turn your phone" card', () => {
  it('a portrait game: only a touch screen on its side is the wrong way up', () => {
    pretendDevice({ touch: true, sideways: true })
    expect(wrongWayUp('portrait')).toBe(true)
    pretendDevice({ touch: true, sideways: false })
    expect(wrongWayUp('portrait')).toBe(false)
    pretendDevice({ touch: false, sideways: true }) // a short desktop window is not a phone on its side
    expect(wrongWayUp('portrait')).toBe(false)
  })

  it('a landscape game: a touch screen held upright is the wrong way up', () => {
    pretendDevice({ touch: true, sideways: false })
    expect(wrongWayUp('landscape')).toBe(true)
    pretendDevice({ touch: true, sideways: true })
    expect(wrongWayUp('landscape')).toBe(false)
  })

  it('no orientation set ("any", or none) is never the wrong way up', () => {
    pretendDevice({ touch: true, sideways: true })
    expect(wrongWayUp('any')).toBe(false)
    expect(wrongWayUp(undefined)).toBe(false)
  })

  it("reads the game's orientation from content/ui/style.json (applyStyle); none set → never shown", () => {
    pretendDevice({ touch: true, sideways: true })
    applyStyle({ preset: 'clean', orientation: 'portrait' })
    render(<UprightCard />)
    expect(screen.getByRole('alertdialog', { name: 'Turn your phone upright' })).toBeTruthy()
    cleanup()
    applyStyle({ preset: 'clean' })
    render(<UprightCard />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it("a landscape game held upright says the reverse; a game's own words win", () => {
    pretendDevice({ touch: true, sideways: false })
    applyStyle({ preset: 'clean', orientation: 'landscape' })
    render(<UprightCard />)
    expect(screen.getByRole('alertdialog', { name: 'Turn your phone on its side' })).toBeTruthy()
    cleanup()
    render(<UprightCard words={{ sideways: 'Gira el teléfono' }} />)
    expect(screen.getByRole('alertdialog', { name: 'Gira el teléfono' })).toBeTruthy()
  })

  it('nothing on a computer, whatever the window shape', () => {
    pretendDevice({ touch: false, sideways: true })
    applyStyle({ preset: 'clean', orientation: 'portrait' })
    render(<UprightCard />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('show forces it (the gallery and screenshots): the card for the orientation given', () => {
    pretendDevice({ touch: false })
    render(<UprightCard show orientation="portrait" />)
    expect(screen.getByRole('alertdialog', { name: 'Turn your phone upright' })).toBeTruthy()
  })
})
