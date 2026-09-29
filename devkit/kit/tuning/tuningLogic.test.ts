// Runs in the framework (not copied into games): the Tuning tool's logic.
import { describe, expect, it } from 'vitest'
import { groupOf, listFields, listTuningChanges, nameOf, sliderRange, tuningChanged, tuningName, valueAt, withValue } from './tuningLogic'

const file = {
  _help: 'Dice numbers.',
  _ranges: { 'dice.bounce': [0, 1, 0.05] },
  maxSpeed: 20,
  dice: { bounce: 0.4, spin: { max: -3.5 }, glow: true },
  label: 'fast',
  points: [8, 6, 4],
}

describe('listing a file\'s values (flatten)', () => {
  it('gives every value a dotted path, in file order, skipping _help and _ranges', () => {
    expect(listFields(file)).toEqual([
      { path: 'maxSpeed', kind: 'number', value: 20 },
      { path: 'dice.bounce', kind: 'number', value: 0.4 },
      { path: 'dice.spin.max', kind: 'number', value: -3.5 },
      { path: 'dice.glow', kind: 'boolean', value: true },
      { path: 'label', kind: 'text', value: 'fast' },
      { path: 'points.0', kind: 'number', value: 8 },
      { path: 'points.1', kind: 'number', value: 6 },
      { path: 'points.2', kind: 'number', value: 4 },
    ])
  })

  it('headings and names come from the path', () => {
    expect(groupOf('dice.spin.max')).toBe('dice › spin')
    expect(groupOf('maxSpeed')).toBe('')
    expect(nameOf('dice.spin.max')).toBe('max')
    expect(valueAt(file, 'dice.spin.max')).toBe(-3.5)
    expect(valueAt(file, 'points.1')).toBe(6)
  })
})

describe('changing a value (unflatten)', () => {
  it('changes only that value, keeps lists as lists and keeps _help / _ranges', () => {
    const edited = withValue(withValue(file, 'dice.spin.max', -2), 'points.1', 7)
    expect(edited).toEqual({ ...file, dice: { ...file.dice, spin: { max: -2 } }, points: [8, 7, 4] })
    expect(Array.isArray(edited.points)).toBe(true)
    expect(file.dice.spin.max).toBe(-3.5) // the original is untouched
    expect(tuningChanged(file, edited)).toBe(true)
    expect(tuningChanged(file, structuredClone(file))).toBe(false)
  })
})

describe('slider ranges', () => {
  it('uses the file\'s _ranges when it has one', () => {
    expect(sliderRange(0.4, 'dice.bounce', file._ranges)).toEqual({ min: 0, max: 1, step: 0.05 })
    expect(sliderRange(0.4, 'x', { x: [0, 2] })).toEqual({ min: 0, max: 2, step: 0.01 }) // no step → a sensible one
  })
  it('otherwise 0 → twice the value, decimals in fine steps', () => {
    expect(sliderRange(0.25, 'm')).toEqual({ min: 0, max: 0.5, step: 0.001 })
    expect(sliderRange(2.5, 'm')).toEqual({ min: 0, max: 5, step: 0.01 })
    expect(sliderRange(0.4, 'dice.bounce', { other: [0, 9, 1] }).max).toBe(0.8)
  })
  it('negatives go −value → +value', () => {
    expect(sliderRange(-3.5, 'm')).toEqual({ min: -3.5, max: 3.5, step: 0.01 })
    expect(sliderRange(-20, 'm')).toEqual({ min: -40, max: 40, step: 1 })
  })
  it('whole numbers step by 1 and get at least 0–10', () => {
    expect(sliderRange(20, 'm')).toEqual({ min: 0, max: 40, step: 1 })
    expect(sliderRange(1, 'm')).toEqual({ min: 0, max: 10, step: 1 })
    expect(sliderRange(0, 'm')).toEqual({ min: 0, max: 10, step: 1 })
  })
})

describe('Copy for Claude lines', () => {
  it('names the file and path with old → new', () => {
    const edited = withValue(withValue(file, 'maxSpeed', 24), 'dice.glow', false)
    expect(listTuningChanges('physics', file, edited)).toEqual([
      { name: 'physics.json: maxSpeed', from: '20', to: '24' },
      { name: 'physics.json: dice.glow', from: 'true', to: 'false' },
    ])
    expect(listTuningChanges('physics', file, file)).toEqual([])
  })
  it('file names come from the glob path', () => {
    expect(tuningName('../../../content/tuning/physics.json')).toBe('physics')
  })
})
