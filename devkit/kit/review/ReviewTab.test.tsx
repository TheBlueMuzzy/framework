// Runs in the framework (not copied into games): the Review list tab — clicking, order, Save, search.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DevKit } from '../DevKit'
import { ReviewTab } from './ReviewTab'
import { reviewTab } from './reviewTabEntry'
import type { ReviewChange, ReviewItem } from './reviewTypes'

afterEach(cleanup)

const WORDS: ReviewItem[] = [
  { id: 'wry', label: 'WRY', status: 'no', detail: 'lost word' },
  { id: 'zygotes', label: 'ZYGOTES', status: 'open', detail: 'lost word · B001' },
  { id: 'rooster', label: 'ROOSTER', status: 'yes', detail: 'swear or word · cock' },
  { id: 'thy', label: 'THY', status: 'open' },
]

/** The rows, top to bottom, as "LABEL:status" */
const rows = () => [...document.querySelectorAll<HTMLButtonElement>('.rv-row')].map((r) => `${r.querySelector('.rv-label')!.textContent}:${r.dataset.status}`)
const row = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('.rv-row')].find((r) => r.querySelector('.rv-label')!.textContent === label)!
const saveButton = () => screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement

async function renderTab(options: { save?: (c: ReviewChange[]) => Promise<void>; load?: () => Promise<ReviewItem[]>; query?: string } = {}) {
  const load = options.load ?? (async () => WORDS.map((w) => ({ ...w })))
  const save = options.save ?? vi.fn(async () => {})
  const view = render(<ReviewTab label="Words" what="word" load={load} save={save} query={options.query ?? ''} />)
  await act(async () => {}) // let load() answer
  return { save, view }
}

describe('the Review list tab', () => {
  it('loads sorted: Open A–Z, then Yes, then No', async () => {
    await renderTab()
    expect(rows()).toEqual(['THY:open', 'ZYGOTES:open', 'ROOSTER:yes', 'WRY:no'])
    expect(screen.getByText('2 open · 1 yes · 1 no')).toBeTruthy()
  })

  it('a click cycles Open → Yes → No → Open, with three different boxes and the state in its name', async () => {
    await renderTab()
    const zyg = row('ZYGOTES')
    expect(zyg.getAttribute('aria-label')).toMatch(/^ZYGOTES: Open/)
    fireEvent.click(zyg)
    expect(zyg.dataset.status).toBe('yes')
    expect(zyg.querySelector('.rv-box')!.textContent).toBe('✓')
    expect(zyg.getAttribute('aria-label')).toMatch(/^ZYGOTES: Yes .*not saved yet/)
    fireEvent.click(zyg)
    expect(zyg.querySelector('.rv-box')!.textContent).toBe('✗')
    expect(zyg.title).toMatch(/^No/)
    fireEvent.click(zyg)
    expect(zyg.dataset.status).toBe('open')
    expect(zyg.querySelector('.rv-box')!.textContent).toBe('')
    expect(zyg.classList.contains('is-changed')).toBe(false) // back where it was saved = not a change
  })

  it('is a real button, so Space and Enter work from the keyboard', async () => {
    await renderTab()
    expect(row('THY').tagName).toBe('BUTTON')
  })

  it('does not move rows while clicking; marks them unsaved; Save is off until something changes', async () => {
    await renderTab()
    expect(saveButton().disabled).toBe(true)
    fireEvent.click(row('THY')) // open → yes
    fireEvent.click(row('WRY')) // no → open
    expect(rows()).toEqual(['THY:yes', 'ZYGOTES:open', 'ROOSTER:yes', 'WRY:open'])
    expect(row('THY').classList.contains('is-changed')).toBe(true)
    expect(screen.getByText('2 open · 2 yes · 0 no — 2 unsaved')).toBeTruthy()
    expect(saveButton().disabled).toBe(false)
  })

  it('Save sends only the changes, then clears the marks and sorts again', async () => {
    const { save } = await renderTab()
    fireEvent.click(row('THY')) // open → yes
    fireEvent.click(row('WRY')) // no → open
    await act(async () => { fireEvent.click(saveButton()) })
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith([{ id: 'thy', status: 'yes' }, { id: 'wry', status: 'open' }])
    expect(rows()).toEqual(['WRY:open', 'ZYGOTES:open', 'ROOSTER:yes', 'THY:yes'])
    expect(document.querySelectorAll('.rv-row.is-changed')).toHaveLength(0)
    expect(saveButton().disabled).toBe(true)
    expect(screen.getByText(/Saved 2/)).toBeTruthy()
  })

  it('a failed Save shows why in plain words and keeps the changes', async () => {
    await renderTab({ save: async () => { throw new Error('the dev server is not reachable') } })
    fireEvent.click(row('ZYGOTES'))
    await act(async () => { fireEvent.click(saveButton()) })
    expect(screen.getByText(/Couldn't save — your changes are still here: the dev server is not reachable/)).toBeTruthy()
    expect(row('ZYGOTES').dataset.status).toBe('yes')
    expect(row('ZYGOTES').classList.contains('is-changed')).toBe(true)
    expect(saveButton().disabled).toBe(false)
  })

  it('a failed load says why, and Retry loads again', async () => {
    let calls = 0
    const load = async () => {
      calls++
      if (calls === 1) throw new Error('content/words/submitted.csv is missing')
      return WORDS
    }
    await renderTab({ load })
    expect(screen.getByText("Couldn't load the Words list: content/words/submitted.csv is missing")).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry' })) })
    expect(rows()).toHaveLength(4)
  })

  it('the search box filters by label or detail, with a "words found" count', async () => {
    const { view } = await renderTab({ query: 'lost' })
    expect(rows()).toEqual(['ZYGOTES:open', 'WRY:no'])
    expect(screen.getByText('2 words found')).toBeTruthy()
    view.rerender(<ReviewTab label="Words" what="word" load={async () => WORDS} save={async () => {}} query="zzz" />)
    expect(rows()).toEqual([])
    expect(screen.getByText(/Nothing in Words matches “zzz”/)).toBeTruthy()
  })
})

describe('reviewTab — plugged into the Dev Kit', () => {
  it('shows as its own tab, searched by the Dev Kit search box', async () => {
    const tab = reviewTab({ id: 'words', label: 'Words', what: 'word', load: async () => WORDS, save: async () => {} })
    render(<DevKit tabs={[tab]} />)
    await act(async () => {})
    expect(screen.getByRole('tab', { name: 'Words', hidden: true })).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Words', hidden: true }), { target: { value: 'rooster' } })
    expect(rows()).toEqual(['ROOSTER:yes'])
    expect(screen.getByText('1 word found')).toBeTruthy()
  })
})
