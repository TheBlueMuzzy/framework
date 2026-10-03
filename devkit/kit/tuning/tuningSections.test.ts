// Runs in the framework (not copied into games): how Tuning settings get sections and readable names.
import { describe, expect, it } from 'vitest'
import { countFound } from '../search/searchLogic'
import { searchTuning, tuningSections } from './tuningSections'

const anim = {
  name: 'anim',
  data: {
    _help: { trailLead: 'How long the trail takes to draw, in seconds.' },
    _labels: { trailLead: 'Trail: draw-on time', popTime: 'Score pop: grow time' },
    _sections: { Trails: ['trailLead'], 'Score pops': ['popTime'] },
    trailLead: 0.5,
    popTime: 0.3,
    loose: 1,
  },
}
const garden = {
  name: 'garden',
  data: {
    _labels: { trailWidth: 'Trail: line thickness' },
    _sections: { Trails: ['trailWidth'], 'Board look': ['hex'] },
    trailWidth: 0.08,
    hex: { fill: '#000000', line: '#111111' },
  },
}
const plain = { name: 'physics', data: { _help: 'Dice numbers.', maxSpeed: 20, dice: { bounce: 0.4 } } }

describe('tuningSections', () => {
  it('sections from _sections; the same title in two files becomes one section', () => {
    const sections = tuningSections([anim, garden])
    const trails = sections.find((s) => s.title === 'Trails')!
    expect(trails.items.map((i) => `${i.file}:${i.path}`)).toEqual(['anim:trailLead', 'garden:trailWidth'])
    expect(trails.id).toBe('tuning:Trails')
  })
  it('a group key brings all of its settings', () => {
    const board = tuningSections([garden]).find((s) => s.title === 'Board look')!
    expect(board.items.map((i) => i.path)).toEqual(['hex.fill', 'hex.line'])
  })
  it('labels from _labels, else made from the key; help from _help', () => {
    const items = tuningSections([anim, garden]).flatMap((s) => s.items)
    expect(items.find((i) => i.path === 'trailLead')).toMatchObject({
      label: 'Trail: draw-on time',
      help: 'How long the trail takes to draw, in seconds.',
    })
    expect(items.find((i) => i.path === 'hex.fill')!.label).toBe('Hex fill')
  })
  it('settings left out of _sections go in a "<file>.json (no section)" section', () => {
    const rest = tuningSections([anim]).find((s) => s.title === 'anim.json (no section)')!
    expect(rest.items.map((i) => i.path)).toEqual(['loose'])
  })
  it('a file with no _sections is one section, named after the file, with its note and group headings', () => {
    const [only] = tuningSections([plain])
    expect(only).toMatchObject({ title: 'physics.json', grouped: true, note: 'Dice numbers.' })
    expect(only.items.map((i) => i.label)).toEqual(['Max speed', 'Bounce'])
  })
  it('content/devkit.json sectionOrder puts sections in that order (others follow, as found)', () => {
    const titles = tuningSections([anim, garden], ['Board look', 'Score pops']).map((s) => s.title)
    expect(titles).toEqual(['Board look', 'Score pops', 'Trails', 'anim.json (no section)'])
  })
})

describe('searchTuning', () => {
  const sections = tuningSections([anim, garden, plain])
  it('finds by label, key fragment, help, section title and file name', () => {
    expect(countFound(searchTuning(sections, 'thickness'))).toBe(1) // label
    expect(countFound(searchTuning(sections, 'ounc'))).toBe(1) // inside "bounce"
    expect(countFound(searchTuning(sections, 'draw'))).toBe(1) // label + help of trailLead
    expect(countFound(searchTuning(sections, 'trails'))).toBe(2) // the section title: all of it
    expect(countFound(searchTuning(sections, 'garden.json'))).toBe(3) // file name
  })
  it('multi-word: "trail time" needs both', () => {
    expect(searchTuning(sections, 'trail time').flatMap((s) => s.items.map((i) => i.path))).toEqual(['trailLead'])
  })
})
