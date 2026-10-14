import { describe, expect, it } from 'vitest'
import { checkSelectMap, countKnobs, coveredBy, readSelectObjects, tagsOf, withKnob, withoutKnob, type Known } from './selectMap'

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
    tip: { label: 'Tip', find: '.kit-callout', knobs: {} },
    broken: 'not an object',
  },
}

const known: Known = {
  tuning: ['garden.pieceScale', 'drag.liftScale', 'feel.tiers.small.grow', 'feel.tiers.big.grow'],
  text: ['explore.glyph.yours', 'explore.glyph.theirs', 'tips.first'],
  sounds: ['glyph.step', 'score.pop'],
}

describe('readSelectObjects', () => {
  it('reads objects in order, skipping malformed ones', () => {
    const objects = readSelectObjects(file)
    expect(objects.map((o) => o.id)).toEqual(['glyphling', 'tip'])
    expect(objects[0].knobs).toEqual([
      { title: 'Look', ids: ['garden.pieceScale'] },
      { title: 'Drag', ids: ['drag.liftScale', 'feel.tiers'] },
    ])
    expect(objects[1]).toMatchObject({ label: 'Tip', find: '.kit-callout', text: [], sounds: [] })
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
})

describe('checkSelectMap', () => {
  it('finds nothing wrong with good names', () => {
    expect(checkSelectMap(file, known)).toEqual([])
  })
  it('names every knob that points at nothing, in plain words', () => {
    const bad = withKnob(withKnob(withKnob(file, 'glyphling', 'tuning', 'garden.pieceScal', 'Look'), 'glyphling', 'text', 'nope'), 'tip', 'sounds', 'boom')
    expect(checkSelectMap(bad, known)).toEqual([
      'Glyphling · Look: "garden.pieceScal" — no tuning setting has this name',
      'Glyphling · Text: "nope" — no text line has this key',
      'Tip · Sounds: "boom" — no sound has this name',
    ])
  })
  it('says so when there are no objects at all', () => {
    expect(checkSelectMap({}, known)).toHaveLength(1)
  })
})

describe('withKnob / withoutKnob', () => {
  it('adds a setting to a section (new or existing) and keeps the rest of the file', () => {
    const added = withKnob(file, 'glyphling', 'tuning', 'garden.yellow', 'Look')
    expect(readSelectObjects(added)[0].knobs[0]).toEqual({ title: 'Look', ids: ['garden.pieceScale', 'garden.yellow'] })
    expect(added._help).toBe('kept')
    const fresh = withKnob(file, 'glyphling', 'tuning', 'anim.hopTime', 'Hop')
    expect(readSelectObjects(fresh)[0].knobs.map((k) => k.title)).toEqual(['Look', 'Drag', 'Hop'])
  })
  it('adds text and sounds to their lists, never twice', () => {
    const once = withKnob(file, 'glyphling', 'sounds', 'score.pop')
    expect(withKnob(once, 'glyphling', 'sounds', 'score.pop')).toBe(once)
    expect(readSelectObjects(once)[0].sounds).toEqual(['glyph.step', 'score.pop'])
  })
  it('makes the object if it is new', () => {
    expect(readSelectObjects(withKnob(file, 'board', 'text', 'tips.first'))).toContainEqual(
      expect.objectContaining({ id: 'board', label: 'board', text: ['tips.first'] }),
    )
  })
  it('takes a knob off, and an emptied section goes too', () => {
    const off = withoutKnob(file, 'glyphling', 'tuning', 'garden.pieceScale')
    expect(readSelectObjects(off)[0].knobs.map((k) => k.title)).toEqual(['Drag'])
    expect(readSelectObjects(withoutKnob(file, 'glyphling', 'text', 'explore.glyph'))[0].text).toEqual([])
    expect(withoutKnob(file, 'nobody', 'text', 'x')).toBe(file)
  })
})
