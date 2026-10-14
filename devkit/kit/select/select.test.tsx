import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TuningTab } from '../tuning/TuningTab'
import { allTagged, objectAt } from './domPicker'
import { DevKitPick, type PanelPick } from './pickContext'
import { readSelectObjects, type SelectFile } from './selectMap'
import { getSelect, initSelect, resetSelect, setSelect } from './selectStore'
import { SelectLayer } from './SelectLayer'
import { SelectTab } from './SelectTab'

const file: SelectFile = {
  objects: {
    board: { label: 'Board', knobs: { Look: ['garden.hexFill'] } },
    glyphling: { label: 'Glyphling', knobs: { Look: ['garden.pieceScale'], Drag: ['drag.liftScale'] } },
    tip: { label: 'Tip', find: '.tip' },
  },
}
const objects = readSelectObjects(file)

// jsdom has no layout: give elements the boxes a real page would
function place(el: Element, left: number, top: number, width: number, height: number) {
  el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
}

beforeEach(() => {
  localStorage.clear()
  resetSelect()
  initSelect(file)
})
afterEach(() => {
  cleanup()
  document.body.replaceChildren()
})

describe('the DOM picker', () => {
  function page() {
    document.body.innerHTML = `
      <div data-knobs="board" id="board"><span data-knobs="glyphling" id="g1"></span><span data-knobs="glyphling" id="g2"></span></div>
      <div class="tip" id="tip"></div><div data-knobs="unknown"></div>
      <aside class="devkit"><div data-knobs="glyphling" id="inside"></div></aside>`
    place(document.getElementById('board')!, 0, 0, 400, 400)
    place(document.getElementById('g1')!, 10, 10, 40, 40)
    place(document.getElementById('g2')!, 100, 10, 40, 40)
    place(document.getElementById('tip')!, 300, 300, 50, 20)
    place(document.getElementById('inside')!, 0, 0, 1000, 1000)
  }
  it('finds tagged things and find selectors, never the Dev Kit, never unknown ids', () => {
    page()
    expect(allTagged(objects).map((f) => f.el.id)).toEqual(['board', 'g1', 'g2', 'tip'])
  })
  it('the smallest box under the point wins', () => {
    page()
    expect(objectAt(20, 20, objects)?.el.id).toBe('g1')
    expect(objectAt(200, 200, objects)?.id).toBe('board')
    expect(objectAt(310, 305, objects)?.id).toBe('tip')
    expect(objectAt(900, 900, objects)).toBeNull()
  })
})

describe('the store', () => {
  it('remembers the pick and the outline for this game, not select mode', () => {
    setSelect({ on: true, picked: 'glyphling', outline: 0.5 })
    resetSelect()
    initSelect(file)
    expect(getSelect()).toMatchObject({ on: false, picked: 'glyphling', outline: 0.5 })
  })
  it('forgets a remembered pick that is no longer in the file', () => {
    setSelect({ picked: 'glyphling' })
    resetSelect()
    initSelect({ objects: { board: { label: 'Board' } } })
    expect(getSelect().picked).toBeNull()
  })
})

describe('the Select tab', () => {
  it('turns select mode on and off', () => {
    render(<SelectTab />)
    fireEvent.click(screen.getByRole('button', { name: /select mode: off/i }))
    expect(getSelect().on).toBe(true)
    expect(screen.getByRole('button', { name: /select mode: on/i })).toHaveProperty('ariaPressed', 'true')
  })
  it('lists every object, and picking one from the list shows it', () => {
    render(<SelectTab />)
    fireEvent.click(screen.getByRole('button', { name: /Glyphling/ }))
    expect(getSelect().picked).toBe('glyphling')
    expect(document.querySelector('.sel-picked-name')?.textContent).toBe('Glyphling')
    fireEvent.click(screen.getByRole('button', { name: 'Clear the pick' }))
    expect(getSelect().picked).toBeNull()
  })
  it('shows problems in the file in red', () => {
    resetSelect()
    initSelect({ objects: { board: { label: 'Board', knobs: { Look: ['garden.nope'] } } } })
    render(<SelectTab />)
    expect(screen.getByRole('alert').textContent).toContain('"garden.nope" — no tuning setting has this name')
  })
})

describe('select mode catches clicks', () => {
  it('a click on the game picks instead of playing; the Dev Kit still works', () => {
    document.body.innerHTML = '<div data-knobs="glyphling" id="g1"></div><aside class="devkit"><button id="dk">x</button></aside>'
    place(document.getElementById('g1')!, 10, 10, 40, 40)
    let gameSawIt = 0
    let devkitSawIt = 0
    document.getElementById('g1')!.addEventListener('pointerdown', () => gameSawIt++)
    document.getElementById('dk')!.addEventListener('pointerdown', () => devkitSawIt++)
    const host = document.createElement('div')
    document.body.appendChild(host)
    render(<SelectLayer panelOpen />, { container: host })
    act(() => setSelect({ on: true }))
    fireEvent.pointerDown(document.getElementById('g1')!, { clientX: 20, clientY: 20 })
    fireEvent.pointerUp(document.getElementById('g1')!, { clientX: 20, clientY: 20 })
    expect(gameSawIt).toBe(0)
    expect(getSelect().picked).toBe('glyphling')
    fireEvent.pointerDown(document.getElementById('dk')!)
    expect(devkitSawIt).toBe(1)
  })
  it('closing the Dev Kit turns select mode off and lets clicks through again', () => {
    document.body.innerHTML = '<div data-knobs="glyphling" id="g1"></div>'
    let gameSawIt = 0
    document.getElementById('g1')!.addEventListener('pointerdown', () => gameSawIt++)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const { rerender } = render(<SelectLayer panelOpen />, { container: host })
    act(() => setSelect({ on: true }))
    rerender(<SelectLayer panelOpen={false} />)
    expect(getSelect().on).toBe(false)
    fireEvent.pointerDown(document.getElementById('g1')!)
    expect(gameSawIt).toBe(1)
  })
})

describe('a panel under the Select tab', () => {
  const files = [
    { name: 'garden', data: { pieceScale: 1, hexFill: '#112233', yellow: '#ffff00', _labels: { pieceScale: 'Piece size' } } },
    { name: 'drag', data: { liftScale: 1.2, liftTime: 0.1 } },
  ]
  it('the Tuning tab shows only the pick, in the object’s sections, with ✕ to take one off', () => {
    const removed: string[] = []
    const value: PanelPick = {
      pick: { objectId: 'glyphling', label: 'Glyphling', tuning: [{ title: 'Look', ids: ['garden.pieceScale'] }, { title: 'Drag', ids: ['drag'] }], text: [], sounds: [] },
      remove: (kind, id) => removed.push(`${kind}:${id}`),
    }
    render(
      <DevKitPick.Provider value={value}>
        <TuningTab files={files} />
      </DevKitPick.Provider>,
    )
    expect([...document.querySelectorAll('.dk-section-title')].map((t) => t.textContent)).toEqual(['Look', 'Drag'])
    expect(document.querySelectorAll('.tt-row')).toHaveLength(3) // pieceScale + the whole drag file (liftScale, liftTime)
    expect(screen.queryByText('Yellow')).toBeNull()
    expect(screen.getByRole('button', { name: 'Save tuning' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Take garden.pieceScale off Glyphling' }))
    expect(removed).toEqual(['tuning:garden.pieceScale'])
  })
  it('shows nothing when the pick has no tuning', () => {
    const value: PanelPick = { pick: { objectId: 'tip', label: 'Tip', tuning: [], text: [], sounds: [] }, remove: () => {} }
    const { container } = render(
      <DevKitPick.Provider value={value}>
        <TuningTab files={files} />
      </DevKitPick.Provider>,
    )
    expect(container.textContent).toBe('')
  })
})
