import { describe, expect, it } from 'vitest'
import { checkSelectMap, countKnobs, coveredBy, readSelectObjects, tagsOf, unlistedSettings, type Known } from './selectMap'

const file = {
  _help: 'kept',
  objects: {
    glyphling: {
      label: 'Glyphling',
      help: 'A piece.',
      knobs: { Look: ['garden.pieceScale'], Drag: ['drag.liftScale', 'feel.tiers'] },
      text: ['explore.glyph'],
      sounds: ['glyph.step'],
    },
    button: { label: 'Button', find: '.kit-button', style: ['primary', 'radius-control'] },
    tip: { label: 'Tip', find: '.kit-callout', knobs: {} },
    broken: 'not an object',
  },
}

const known: Known = {
  tuning: ['garden.pieceScale', 'drag.liftScale', 'feel.tiers.small.grow', 'feel.tiers.big.grow'],
  text: ['explore.glyph.yours', 'explore.glyph.theirs', 'tips.first'],
  sounds: ['glyph.step', 'score.pop'],
  style: ['primary', 'on-primary', 'radius-control'],
}

describe('readSelectObjects', () => {
  it('reads objects in order, skipping malformed ones', () => {
    const objects = readSelectObjects(file)
    expect(objects.map((o) => o.id)).toEqual(['glyphling', 'button', 'tip'])
    expect(objects[0].knobs).toEqual([
      { title: 'Look', ids: ['garden.pieceScale'] },
      { title: 'Drag', ids: ['drag.liftScale', 'feel.tiers'] },
    ])
    expect(objects[1]).toMatchObject({ label: 'Button', find: '.kit-button', style: ['primary', 'radius-control'] })
    expect(objects[2]).toMatchObject({ label: 'Tip', find: '.kit-callout', text: [], sounds: [], style: [] })
  })
  it('never throws on an empty or odd file', () => {
    expect(readSelectObjects({})).toEqual([])
    expect(readSelectObjects({ objects: [] })).toEqual([])
  })
})

describe('coveredBy / tagsOf', () => {
  it('an id covers itself and its group, not a look-alike', () => {
    expect(coveredBy('feel.tiers.big.grow', 'feel.tiers')).toBe(true)
    expect(coveredBy('feel.tiers', 'feel.tiers')).toBe(true)
    expect(coveredBy('feel.tiersX', 'feel.tiers')).toBe(false)
  })
  it('splits space-separated tags', () => {
    expect(tagsOf(' glyphling  board ')).toEqual(['glyphling', 'board'])
    expect(tagsOf(null)).toEqual([])
  })
})

describe('countKnobs', () => {
  it('counts each setting a group brings', () => {
    const [glyphling] = readSelectObjects(file)
    // tuning: pieceScale + liftScale + 2 tiers · text: 2 under explore.glyph · sounds: 1
    expect(countKnobs(glyphling, known)).toBe(7)
  })
  it('counts UI style values', () => {
    expect(countKnobs(readSelectObjects(file)[1], known)).toBe(2)
  })
})

describe('checkSelectMap', () => {
  it('finds nothing wrong with good names', () => {
    expect(checkSelectMap(file, known)).toEqual([])
  })
  it('names every knob that points at nothing, in plain words', () => {
    const bad = {
      objects: {
        glyphling: { label: 'Glyphling', knobs: { Look: ['garden.pieceScale', 'garden.pieceScal'] }, text: ['explore.glyph', 'nope'] },
        button: { label: 'Button', style: ['primary', 'radius'] },
        tip: { label: 'Tip', sounds: ['boom'] },
      },
    }
    expect(checkSelectMap(bad, known)).toEqual([
      'Glyphling · Look: "garden.pieceScal" — no tuning setting has this name',
      'Glyphling · Text: "nope" — no text line has this key',
      'Button · Style: "radius" — no UI style value has this name',
      'Tip · Sounds: "boom" — no sound has this name',
    ])
  })
  it('says so when there are no objects at all', () => {
    expect(checkSelectMap({}, known)).toHaveLength(1)
  })
})

describe('unlistedSettings', () => {
  it('names every setting no object lists (a group covers all of it)', () => {
    expect(unlistedSettings(file, [...known.tuning, 'garden.yellow', 'anim.hopTime'])).toEqual(['garden.yellow', 'anim.hopTime'])
  })
})
