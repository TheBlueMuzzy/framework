// PHONE SCREEN HANDLING (UI kit, F192) — the starter proves both pieces are wired: Settings → Full screen starts on for
// phones and off for computers, and the "turn your phone" card follows content/ui/style.json "orientation" (this game:
// "any", so it never shows) with the game's own words.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import style from '../content/ui/style.json'
import text from '../content/text/en.json'
import { UprightCard, wrongWayUp } from '../src/ui/kit/blocks/upright'
import { setGameOrientation } from '../src/ui/kit/orientation'

/** A pretend device: touch or mouse, held upright or on its side. */
function device({ touch = false, sideways = false } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse') ? touch : query.includes('fine') ? !touch
      : query.includes('landscape') ? sideways : query.includes('portrait') ? !sideways : false,
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

const fullscreenRow = async () => {
  const { settingsSchema } = await import('../src/game/settings')
  return settingsSchema.tabs.flatMap((t) => t.rows).find((r) => r.id === 'fullscreen')
}

describe('phone screen handling (UI kit)', () => {
  it('Settings has a Full screen row: on for phones, off for computers', async () => {
    device({ touch: true })
    expect((await fullscreenRow())?.default).toBe(true)
    vi.resetModules()
    device({ touch: false })
    expect((await fullscreenRow())?.default).toBe(false)
  })

  it('this game plays either way ("any"): a phone on its side or upright never sees the card', () => {
    expect(style.orientation).toBe('any')
    setGameOrientation(style.orientation)
    for (const sideways of [true, false]) {
      device({ touch: true, sideways })
      expect(wrongWayUp()).toBe(false)
    }
  })

  it('switched to portrait, a phone on its side would get the card, in the game\'s words', () => {
    device({ touch: true, sideways: true })
    expect(wrongWayUp('portrait')).toBe(true)
    const card = renderToStaticMarkup(<UprightCard show orientation="portrait" words={text.upright} />)
    expect(card).toContain(text.upright.upright)
    expect(card).toContain(text.upright.uprightMessage)
  })
})
