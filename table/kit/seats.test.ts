import { describe, expect, it } from 'vitest'
import { isLocalBot, isLocalHuman, needsHandoff, playsHere, viewerSeat, type Bot, type TableSeat } from './seats'

const person: TableSeat = { kind: 'human', where: 'local', connected: true }
const remote: TableSeat = { kind: 'human', where: 'online', connected: true }
const botHere: TableSeat = { kind: 'bot', where: 'local', connected: true }
const serverBot: TableSeat = { kind: 'bot', where: 'online', connected: true }

describe('one seat model', () => {
  it('who is who', () => {
    expect([person, remote, botHere, serverBot].map(isLocalHuman)).toEqual([true, false, false, false])
    expect([person, remote, botHere, serverBot].map(isLocalBot)).toEqual([false, false, true, false])
    expect([person, remote, botHere, serverBot].map(playsHere)).toEqual([true, false, true, false])
  })
})

describe('whose eyes the screen shows', () => {
  it('online: always my seat', () => {
    expect(viewerSeat([remote, person, remote], 0, 1, 1)).toBe(1)
  })
  it('pass-and-play: the person whose turn it is; a bot\'s turn keeps the last person', () => {
    const seats = [person, person, botHere]
    expect(viewerSeat(seats, 1, 0)).toBe(1)
    expect(viewerSeat(seats, 2, 1)).toBe(1)
    expect(viewerSeat(seats, null, 0)).toBe(0)
  })
})

describe('the handoff', () => {
  it('only between two different people here, only when secrets are hidden', () => {
    expect(needsHandoff([person, person], 0, 1, true)).toBe(true)
    expect(needsHandoff([person, person], 0, 1, false)).toBe(false)
    expect(needsHandoff([person, person], 1, 1, true)).toBe(false)
    expect(needsHandoff([person, botHere], 0, 1, true)).toBe(false)
    expect(needsHandoff([person, botHere, person], 1, 2, true)).toBe(true)
    expect(needsHandoff([person, person], null, 0, true)).toBe(true)
  })
})

describe('a bot sees only its view', () => {
  it('is a function of (view, seat, rng)', () => {
    const takeFirst: Bot<{ choices: string[] }, string> = (view, _seat, rng) => ({ action: view.choices[0], rng: rng + 1 })
    expect(takeFirst({ choices: ['a', 'b'] }, 0, 5)).toEqual({ action: 'a', rng: 6 })
  })
})
