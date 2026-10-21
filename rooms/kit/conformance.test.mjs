// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

function tester(adapterText, { version = '0.9.0', gameCode = [] } = {}) {
  const results = []
  const t = {
    version,
    gameCode: () => gameCode,
    has: () => true,
    adapterFile: () => 'src/devkit-game/gAdapter.ts',
    exists: () => true,
    read: () => adapterText,
    linesMatching: (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean)),
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results }
}

describe('Rooms checks', () => {
  it('canRestore that depends on being online passes; always-true fails with the line', async () => {
    const good = tester('  canRestore: () => !store.getState().online,')
    await check(good.t)
    expect(good.results[0].ok).toBe(true)
    const bad = tester('  canRestore: () => true, // offline game')
    await check(bad.t)
    expect(bad.results[0].ok).toBe(false)
    expect(bad.results[0].problems[1]).toContain('src/devkit-game/gAdapter.ts:1')
  })

  const adapter = '  canRestore: () => !online(),'
  const session = { path: 'src/ui/online/session.ts', text: [
    "import { makeRoomCode } from '../../rooms/roomCodes'",
    "export const remember = (code: string) => sessionStorage.setItem('mygame:room', code)",
  ].join('\n') }
  const live = { path: 'src/ui/online/OnlineSession.tsx', text: "import { useRoom } from '../../rooms/useRoom'\nconst room = useRoom(code, { name, create })" }
  const menu = { path: 'src/ui/menus.tsx', text: "import { matchToRejoin } from '../rooms/lastRoom'\nconst rejoin = matchToRejoin()" }

  it('rejoin: the game keeping its own room code, or no Rejoin offer, fails with the line; the kit\'s way passes', async () => {
    const own = tester(adapter, { gameCode: [session, live, menu] })
    await check(own.t)
    expect(own.results[1].ok).toBe(false)
    expect(own.results[1].problems[1]).toContain('src/ui/online/session.ts:2')
    const noOffer = tester(adapter, { gameCode: [live] })
    await check(noOffer.t)
    expect(noOffer.results[1].problems.join(' ')).toContain('Rejoin match')
    const good = tester(adapter, { gameCode: [live, menu] })
    await check(good.t)
    expect(good.results[1].ok).toBe(true)
  })

  it('rejoin: skipped for an older rooms copy, and for a game that never goes online', async () => {
    const old = tester(adapter, { version: '0.8.0', gameCode: [session, live] })
    await check(old.t)
    expect(old.results[1].skipped).toBe(true)
    const offline = tester(adapter, { gameCode: [menu] })
    await check(offline.t)
    expect(offline.results[1].skipped).toBe(true)
  })
})
