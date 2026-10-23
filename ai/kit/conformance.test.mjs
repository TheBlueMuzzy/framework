// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BANTER_CHECKS, check } from './conformance.mjs'

// a tiny stand-in for check-framework's tester: content files (path → text or JSON) + game code (+ party/ files)
function tester({ content = [], files = {}, code = [], party = [] }) {
  const results = []
  const linesMatching = (list, re) => list.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const all = { ...Object.fromEntries(content.map((p) => [p, '{}'])), ...Object.fromEntries(Object.entries(files).map(([p, v]) => [p, typeof v === 'string' ? v : JSON.stringify(v)])) }
  const t = {
    rel: 'src/ai/kit',
    files: ({ dirs }) => (dirs[0] === 'party' ? party : Object.entries(all).filter(([p]) => dirs.some((d) => p.startsWith(d + '/'))).map(([path, text]) => ({ path, text }))),
    exists: (p) => (p === 'party' ? party.length > 0 : p in all),
    json: (p) => { try { return JSON.parse(all[p]) } catch { return null } },
    gameCode: () => code, linesMatching,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    warn: (name, problems, fix) => results.push({ name, ok: true, warning: true, problems, fix }),
    skip: (name, detail) => results.push({ name, skipped: true, detail }),
  }
  return { t, results }
}
const byName = (results, name) => results.find((r) => r.name === name)

describe('AI checks', () => {
  it('a game that hands bots the rules clock passes — a setTimeout elsewhere in a file that imports pace is not blamed', async () => {
    const { t, results } = tester({
      content: ['content/ai/personalities.json'],
      code: [
        { path: 'src/main.tsx', text: "import { setPaceClock } from './ai/kit/pace'\nsetPaceClock(rulesClock)" },
        { path: 'src/ui/Toast.tsx', text: "import type { Pace } from '../ai/kit/pace'\nsetTimeout(() => hide(), 2000)" },
        { path: 'src/store/localBot.ts', text: "import { thinkDelay, botWait } from '../ai/kit'\nconst d = thinkDelay(p, k, s, r)\nbotWait(d.ms, act)" },
      ],
    })
    await check(t)
    expect(results.slice(0, 2).map((r) => [r.ok, r.detail])).toEqual([[true, 'personalities.json'], [true, 'src/main.tsx:2  setPaceClock(rulesClock)']])
  })
  it('no clock handed over + no personalities: fails, and hints at bot code on plain timers (imported through the kit index too)', async () => {
    const { t, results } = tester({ code: [{ path: 'src/store/localBot.ts', text: "import { thinkDelay } from '../ai/kit'\nconst d = thinkDelay(p, k, s, r)\ntimer = setTimeout(() => act(), d.ms)" }] })
    await check(t)
    expect(results.slice(0, 2).map((r) => r.ok)).toEqual([false, false])
    expect(results[1].problems).toContain('  src/store/localBot.ts:3  timer = setTimeout(() => act(), d.ms)')
    expect(results[1].fix).toContain('setPaceClock(rulesClock)')
  })
})

describe('AI checks — banter (F22)', () => {
  const people = { personalities: [{ id: 'Bully', chattiness: 70 }, { id: 'Shy', chattiness: 20 }, { id: 'Mute', chattiness: 0 }] }
  const settings = { chance: { won: 1, gotHit: 0.5, _note: 'x' } }
  const wired = [{ path: 'src/game/bots.ts', text: "const banter = botBanter({ moments, bots, settings, lines: () => text.banter, say, seed })\nbanter.hear(applied.events)" }]

  it('every personality with chattiness > 0 has lines for the game\'s moments; wired; nothing hard-coded → all pass', async () => {
    const { t, results } = tester({
      files: { 'content/ai/personalities.json': people, 'content/ai/banter.json': settings, 'content/text/en.json': { banter: { Bully: { won: 'Too easy.', won_2: 'Next!' }, Shy: { gotHit: 'Oh dear.' } } } },
      code: wired,
    })
    await check(t)
    expect(byName(results, BANTER_CHECKS.lines)).toMatchObject({ ok: true, detail: 'Bully 2 · Shy 1' })
    expect(byName(results, BANTER_CHECKS.hardCoded)).toMatchObject({ ok: true })
    expect(byName(results, BANTER_CHECKS.wired)).toMatchObject({ ok: true, detail: 'src/game/bots.ts · hear in src/game/bots.ts' })
  })

  it('a chatty personality with no lines (or only lines for moments the game never names) fails, named', async () => {
    const { t, results } = tester({
      files: { 'content/ai/personalities.json': people, 'content/ai/banter.json': settings, 'content/text/en.json': { banter: { Bully: { won: 'Too easy.' }, Shy: { sneezed: 'Achoo.' } } } },
      code: wired,
    })
    await check(t)
    const r = byName(results, BANTER_CHECKS.lines)
    expect(r.ok).toBe(false)
    expect(r.problems[0]).toContain('Shy (chattiness 20')
    expect(r.problems.join('\n')).toContain('banter.Shy.sneezed — "sneezed" isn\'t one of the moments')
    expect(r.problems.join('\n')).not.toContain('Mute') // (chattiness 0: nothing to say)
  })

  it('a stray line alone is a warning; no content/ai/banter.json fails', async () => {
    const lines = { banter: { Bully: { won: 'Too easy.', wonn: 'Typo.' }, Shy: { gotHit: 'Oh dear.' } } }
    const warned = tester({ files: { 'content/ai/personalities.json': people, 'content/ai/banter.json': settings, 'content/text/en.json': lines }, code: wired })
    await check(warned.t)
    expect(byName(warned.results, BANTER_CHECKS.lines)).toMatchObject({ ok: true, warning: true })
    const missing = tester({ files: { 'content/ai/personalities.json': people, 'content/text/en.json': lines }, code: wired })
    await check(missing.t)
    expect(byName(missing.results, BANTER_CHECKS.lines).problems.join('\n')).toContain('content/ai/banter.json is missing')
  })

  it('a line\'s words typed into the game\'s code (or its server) fail, named; the kit\'s own folder and comments don\'t count', async () => {
    const { t, results } = tester({
      files: { 'content/ai/personalities.json': people, 'content/ai/banter.json': settings, 'content/text/en.json': { banter: { Bully: { won: 'Too easy.' }, Shy: { gotHit: 'Oh dear.' } } } },
      code: [...wired, { path: 'src/ui/End.tsx', text: "// says 'Too easy.' sometimes\nreturn <p>Oh dear.</p>" }, { path: 'src/ai/kit/x.ts', text: "'Too easy.'" }],
      party: [{ path: 'party/server.ts', text: "room.broadcastEvent({ text: 'Too easy.' })" }],
    })
    await check(t)
    const r = byName(results, BANTER_CHECKS.hardCoded)
    expect(r.ok).toBe(false)
    expect(r.problems).toEqual(['src/ui/End.tsx — "Oh dear."', 'party/server.ts — "Too easy."'])
  })

  it('chatty bots that nothing makes talk (or never hear a change) fail; online, botBanter in party/ counts; nobody chatty → skipped', async () => {
    const files = { 'content/ai/personalities.json': people, 'content/ai/banter.json': settings, 'content/text/en.json': { banter: { Bully: { won: 'Too easy.' }, Shy: { gotHit: 'Oh dear.' } } } }
    const none = tester({ files, code: [] })
    await check(none.t)
    expect(byName(none.results, BANTER_CHECKS.wired).problems[0]).toContain('Bully, Shy have chattiness > 0, but nothing makes')
    const deaf = tester({ files, code: [{ path: 'src/bots.ts', text: 'const b = botBanter(options)' }] })
    await check(deaf.t)
    expect(byName(deaf.results, BANTER_CHECKS.wired).problems[0]).toContain('nothing calls its hear(events)')
    const online = tester({ files, code: [], party: [{ path: 'party/server.ts', text: 'const banter = botBanter({ say: (s, id) => room.emote(ids[s], id) })\nbanter.hear(events)' }] })
    await check(online.t)
    expect(byName(online.results, BANTER_CHECKS.wired)).toMatchObject({ ok: true })
    const quiet = tester({ files: { 'content/ai/personalities.json': { personalities: [{ id: 'Mute', chattiness: 0 }] } } })
    await check(quiet.t)
    expect(byName(quiet.results, BANTER_CHECKS.lines)).toMatchObject({ ok: true, detail: 'no personality talks (chattiness 0)' })
    expect(byName(quiet.results, BANTER_CHECKS.wired)).toMatchObject({ skipped: true })
  })
})
