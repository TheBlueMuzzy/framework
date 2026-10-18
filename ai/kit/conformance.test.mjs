// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

// a tiny stand-in for check-framework's tester: content/ai files + game code
function tester({ content = [], code = [] }) {
  const results = []
  const linesMatching = (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const t = {
    rel: 'src/ai/kit',
    files: () => content.map((path) => ({ path, text: '{}' })),
    gameCode: () => code, linesMatching,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
  }
  return { t, results }
}

describe('AI checks', () => {
  it('a game that hands bots the rules clock passes', async () => {
    const { t, results } = tester({
      content: ['content/ai/personalities.json'],
      code: [
        { path: 'src/main.tsx', text: "import { setPaceClock } from './ai/kit/pace'\nsetPaceClock(rulesClock)" },
        { path: 'src/store/localBot.ts', text: "import { botWait } from '../ai/kit/pace'\nbotWait(ms, act)" },
      ],
    })
    await check(t)
    expect(results.every((r) => r.ok)).toBe(true)
  })
  it('bots on setTimeout + no personalities: says where and what to do', async () => {
    const { t, results } = tester({ code: [{ path: 'src/store/localBot.ts', text: "import { thinkDelay } from '../ai/kit/pace'\ntimer = setTimeout(() => act(), ms)" }] })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([false, false])
    expect(results[1].problems).toContain('  src/store/localBot.ts:2  timer = setTimeout(() => act(), ms)')
    expect(results[1].fix).toContain('setPaceClock(rulesClock)')
  })
})
