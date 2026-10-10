// Runs in the framework (not copied into games): the search box (it searches only the open tab), collapsible
// sections and "go to section".
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DevKit, type DevKitTab } from '../DevKit'
import { TuningTab } from '../tuning/TuningTab'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const files = [
  {
    name: 'anim',
    data: {
      _labels: { trailLead: 'Trail: draw-on time', trailFade: 'Trail: fade time', popTime: 'Score pop: grow time' },
      _help: { popTime: 'How long one pop takes to grow, in seconds.' },
      _sections: { Trails: ['trailLead', 'trailFade'], 'Score pops': ['popTime'] },
      trailLead: 0.5,
      trailFade: 0.2,
      popTime: 0.3,
    },
  },
]
const tuningTab: DevKitTab = { id: 'tuning', label: 'Tuning', Panel: ({ query }) => <TuningTab files={files} order={[]} query={query} /> }
const heard: string[] = [] // what the Notes tab was told
const notesTab: DevKitTab = { id: 'notes', label: 'Notes', Panel: ({ query = '' }) => { heard.push(query); return <p>notes tool</p> } }
const quietTab: DevKitTab = { id: 'quiet', label: 'Quiet', Panel: () => <p>nothing to search</p>, searchable: false }

const box = (tab = 'Tuning') => screen.getByRole('searchbox', { name: `Search ${tab}`, hidden: true }) as HTMLInputElement
const type = (text: string, tab = 'Tuning') => act(() => { fireEvent.change(box(tab), { target: { value: text } }) })
const sectionEl = (title: string) => document.querySelector(`[data-dk-section="tuning:${title}"]`) as HTMLElement
const headOf = (title: string) => sectionEl(title).querySelector('.dk-section-btn') as HTMLElement
const open = () => act(() => { fireEvent.keyDown(window, { key: '`' }) })
const status = () => screen.getByRole('status', { hidden: true }).textContent

describe('Dev Kit search (the open tab only)', () => {
  it('says what it searches, and hides on a tab with nothing to search', () => {
    render(<DevKit tabs={[tuningTab, quietTab]} />)
    expect(box().placeholder).toBe('Search Tuning…')
    fireEvent.click(screen.getByRole('tab', { name: 'Quiet', hidden: true }))
    expect(screen.queryByRole('searchbox', { hidden: true })).toBeNull()
  })

  it('only the open tab gets the text; other tabs stay as they are', () => {
    heard.length = 0
    render(<DevKit tabs={[tuningTab, notesTab]} />)
    type('ade')
    expect(heard.every((q) => q === '')).toBe(true)
    expect(screen.getByText('notes tool').closest('section')!.hidden).toBe(true) // the Notes tab isn't shown or searched
  })

  it('filters live by a fragment INSIDE a word, highlights it, and counts the matches', () => {
    render(<DevKit tabs={[tuningTab, notesTab]} />)
    type('ade') // inside "fade"
    expect(status()).toBe('1 setting found')
    expect([...document.querySelectorAll('mark.dk-hit')].map((m) => m.textContent)).toContain('ade')
    expect(screen.getByLabelText('trailFade', { selector: 'input[type=number]' })).toBeTruthy()
    expect(screen.queryByLabelText('trailLead')).toBeNull()
  })

  it('a section title that matches shows its whole section; help text matches too', () => {
    render(<DevKit tabs={[tuningTab]} />)
    type('trails')
    expect(status()).toBe('2 settings found')
    type('seconds grow')
    expect(status()).toBe('1 setting found')
  })

  it('says so when nothing matches; ✕ clears it back to the normal view', () => {
    render(<DevKit tabs={[tuningTab]} />)
    type('zzz')
    expect(screen.getByText(/Nothing in Tuning matches “zzz”/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear the search', hidden: true }))
    expect(box().value).toBe('')
    expect(screen.getByRole('navigation', { name: 'Tuning sections', hidden: true })).toBeTruthy()
  })

  it('Esc clears the search first, then closes the panel', () => {
    render(<DevKit tabs={[tuningTab]} />)
    open()
    type('pop')
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect(box().value).toBe('')
    expect((document.querySelector('aside.devkit') as HTMLElement).hidden).toBe(false)
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect((document.querySelector('aside.devkit') as HTMLElement).hidden).toBe(true)
  })

  it('tapping a section title in the results clears the search and opens that section', () => {
    render(<DevKit tabs={[notesTab, tuningTab]} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Tuning', hidden: true }))
    expect(sectionEl('Score pops').dataset.open).toBeUndefined() // several sections: closed to start
    type('grow')
    fireEvent.click(screen.getByRole('button', { name: /Score pops/, hidden: true }))
    expect(box().value).toBe('')
    expect(screen.getByRole('tab', { name: 'Tuning', hidden: true }).getAttribute('aria-selected')).toBe('true')
    expect(sectionEl('Score pops').dataset.open).toBe('true')
    expect(sectionEl('Trails').dataset.open).toBeUndefined()
  })

  it('picking another tab clears the search (and it then searches that tab)', () => {
    render(<DevKit tabs={[tuningTab, notesTab]} />)
    type('trail')
    fireEvent.click(screen.getByRole('tab', { name: 'Notes', hidden: true }))
    expect(box('Notes').value).toBe('')
    expect(screen.getByText('notes tool')).toBeTruthy()
  })
})

describe('collapsible sections', () => {
  it('open and close by their title, show their count, and are remembered (per game, in localStorage)', () => {
    const { unmount } = render(<TuningTab files={files} order={[]} />)
    const head = headOf('Trails')
    expect(head.getAttribute('aria-expanded')).toBe('false')
    expect(head.textContent).toContain('2')
    fireEvent.click(head)
    expect(head.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByLabelText('trailFade')).toBeTruthy()
    unmount()
    render(<TuningTab files={files} order={[]} />)
    expect(headOf('Trails').getAttribute('aria-expanded')).toBe('true')
    expect(JSON.stringify(localStorage)).toContain('tuning:Trails')
  })

  it('Expand all / Collapse all; chips open their section', () => {
    render(<TuningTab files={files} order={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0)
    const chip = [...document.querySelectorAll('.dk-chip')].find((c) => c.textContent?.startsWith('Score pops')) as HTMLElement
    fireEvent.click(chip)
    expect(sectionEl('Score pops').dataset.open).toBe('true')
  })

  it('a changed setting puts a dot on its section title, even while it is closed', () => {
    render(<TuningTab files={files} order={[]} />)
    fireEvent.click(headOf('Trails'))
    fireEvent.change(screen.getByLabelText('trailFade'), { target: { value: '0.4' } })
    fireEvent.click(headOf('Trails'))
    expect(sectionEl('Trails').querySelector('.dk-section-head .dk-dot')).toBeTruthy()
  })
})
