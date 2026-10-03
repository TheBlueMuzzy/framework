// Runs in the framework (not copied into games): the search box, collapsible sections and "go to section".
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DevKit, type DevKitTab } from '../DevKit'
import { TuningTab } from '../tuning/TuningTab'
import { searchTuning, tuningSections } from '../tuning/tuningSections'
import { countFound } from './searchLogic'

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
const index = tuningSections(files)
const tuningTab: DevKitTab = {
  id: 'tuning',
  label: 'Tuning',
  Panel: () => <TuningTab files={files} order={[]} />,
  countMatches: (q) => countFound(searchTuning(index, q)),
}
const notesTab: DevKitTab = { id: 'notes', label: 'Notes', Panel: () => <p>notes tool</p> }

const box = () => screen.getByRole('searchbox', { name: 'Search settings', hidden: true }) as HTMLInputElement
const type = (text: string) => act(() => { fireEvent.change(box(), { target: { value: text } }) })
const sectionEl = (title: string) => document.querySelector(`[data-dk-section="tuning:${title}"]`) as HTMLElement
const headOf = (title: string) => sectionEl(title).querySelector('.dk-section-btn') as HTMLElement
const open = () => act(() => { fireEvent.keyDown(window, { key: '`' }) })

describe('Dev Kit search', () => {
  it('is only there when a tab can be searched', () => {
    render(<DevKit tabs={[notesTab]} />)
    expect(screen.queryByRole('searchbox', { hidden: true })).toBeNull()
  })

  it('filters live by a fragment INSIDE a word, highlights it, and counts the matches', () => {
    render(<DevKit tabs={[notesTab, tuningTab]} />)
    type('ade') // inside "fade"
    expect(screen.getByRole('status', { hidden: true }).textContent).toBe('1 setting')
    expect([...document.querySelectorAll('mark.dk-hit')].map((m) => m.textContent)).toContain('ade')
    expect(screen.getByLabelText('trailFade', { selector: 'input[type=number]' })).toBeTruthy()
    expect(screen.queryByLabelText('trailLead')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Tuning · 1', hidden: true })).toBeTruthy()
    expect((screen.getByText('notes tool').closest('section') as HTMLElement).hidden).toBe(true)
  })

  it('a section title that matches shows its whole section; help text matches too', () => {
    render(<DevKit tabs={[tuningTab]} />)
    type('trails')
    expect(screen.getByRole('status', { hidden: true }).textContent).toBe('2 settings')
    type('seconds grow')
    expect(screen.getByRole('status', { hidden: true }).textContent).toBe('1 setting')
  })

  it('says so when nothing matches; ✕ clears it back to the normal view', () => {
    render(<DevKit tabs={[tuningTab]} />)
    type('zzz')
    expect(screen.getByText(/Nothing matches “zzz”/)).toBeTruthy()
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

  it('tapping a section title in the results clears the search, shows that tab and opens the section', async () => {
    render(<DevKit tabs={[notesTab, tuningTab]} />)
    expect(sectionEl('Score pops').dataset.open).toBeUndefined() // several sections: closed to start
    type('grow')
    fireEvent.click(screen.getByRole('button', { name: /Score pops/, hidden: true }))
    expect(box().value).toBe('')
    expect(screen.getByRole('tab', { name: 'Tuning', hidden: true }).getAttribute('aria-selected')).toBe('true')
    expect(sectionEl('Score pops').dataset.open).toBe('true')
    expect(sectionEl('Trails').dataset.open).toBeUndefined()
  })

  it('picking a tab clears the search', () => {
    render(<DevKit tabs={[notesTab, tuningTab]} />)
    type('trail')
    fireEvent.click(screen.getByRole('tab', { name: 'Notes', hidden: true }))
    expect(box().value).toBe('')
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
