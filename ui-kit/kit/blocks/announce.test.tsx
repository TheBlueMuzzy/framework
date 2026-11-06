// The announcer (0.32.0, F116): the page's one live region is made once, before its first line, and only its text
// changes after; LiveAnnouncer speaks at most once a second. (Moved here with announce.tsx in 0.40.0, F186.)
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { announce, LiveAnnouncer, liveRegion } from './announce'

afterEach(() => { cleanup(); vi.useRealTimers() })

// The page's one live region (0.32.0, F116): made once, before its first line, and only its text changes after
describe('the live region (announce)', () => {
  const statuses = () => document.querySelectorAll('[role="status"]')
  // eslint-disable-next-line no-restricted-syntax -- lets the live region's own shorter first-moment timer run first (timers keep their order)
  beforeAll(async () => { liveRegion(); await new Promise((done) => setTimeout(done, 150)) }) // past its first moment

  it('a new page: the region goes on the page EMPTY, and its first line arrives a moment later (never made with it)', () => {
    vi.useFakeTimers()
    const page = document.implementation.createHTMLDocument('fresh')
    announce('Ada: Hello!', page)
    const region = page.querySelector('[role="status"]')!
    expect([region.getAttribute('aria-live'), region.getAttribute('aria-atomic'), region.parentElement]).toEqual(['polite', 'true', page.body])
    expect(region.textContent).toBe('')
    announce('Bo: Wow!', page) // still waiting: the newest line is the one said
    vi.advanceTimersByTime(100)
    expect(region.textContent).toBe('Bo: Wow!')
  })
  it('one region for the whole page, lasting: parts come and go, the same element just changes its text', () => {
    const region = liveRegion()
    const first = render(<LiveAnnouncer text="Ada: Hello!" stamp={1} />)
    expect(region.textContent).toBe('Ada: Hello!')
    first.unmount()
    expect(region.isConnected).toBe(true)
    render(<LiveAnnouncer text="Bo: Wow!" stamp={2} />)
    render(<LiveAnnouncer text="Cy: Oops!" stamp={3} />)
    expect(statuses()).toHaveLength(1)
    expect(statuses()[0]).toBe(region)
    expect(region.textContent).toBe('Cy: Oops!')
  })
  it('the same line twice is said twice: the text still changes (a trailing no-break space toggles)', () => {
    const region = liveRegion()
    announce('Ada: Well played!')
    const once = region.textContent
    announce('Ada: Well played!')
    const twice = region.textContent
    announce('Ada: Well played!')
    expect(new Set([once, twice, region.textContent]).size).toBe(2)
    expect([once, twice, region.textContent].map((t) => t!.trim())).toEqual(Array(3).fill('Ada: Well played!'))
  })
  it('nothing to say: nothing changes', () => {
    announce('Ada: Hi!')
    announce('')
    expect(liveRegion().textContent).toBe('Ada: Hi!')
  })
  it('a region taken off the page (a game clearing <body>) is made again on the next line', () => {
    liveRegion().remove()
    vi.useFakeTimers()
    announce('Back again')
    vi.advanceTimersByTime(100)
    expect(statuses()).toHaveLength(1)
    expect(liveRegion().textContent).toBe('Back again')
  })
})

describe('LiveAnnouncer', () => {
  // eslint-disable-next-line no-restricted-syntax -- lets the live region's own shorter first-moment timer run first (timers keep their order)
  beforeAll(async () => { liveRegion(); await new Promise((done) => setTimeout(done, 150)) })
  it('says each new line once, at most one a second (the rest skipped)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    const { rerender } = render(<LiveAnnouncer text="Ada: Hello!" stamp={1} />)
    const region = screen.getByRole('status')
    expect(region.textContent).toBe('Ada: Hello!')
    vi.setSystemTime(10_400)
    rerender(<LiveAnnouncer text="Bo: Wow!" stamp={2} />)
    expect(region.textContent).toBe('Ada: Hello!') // too soon: skipped
    vi.setSystemTime(11_100)
    rerender(<LiveAnnouncer text="Bo: Oops!" stamp={3} />)
    expect(region.textContent).toBe('Bo: Oops!')
  })
})
