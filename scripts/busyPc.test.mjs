// Tests for busyPc.mjs (F171 — Checks notice a busy PC) — run: node --test scripts/
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { busiestProcess, rerunTimeouts, timedOut } from './busyPc.mjs'

test('a timeout is recognised in each test runner\'s words', () => {
  assert.ok(timedOut(' FAIL  kit/save.test.ts > saves > a whole game\nError: Test timed out in 5000ms.'))         // vitest
  assert.ok(timedOut('Error: Hook timed out in 10000ms.'))                                                        // vitest hook
  assert.ok(timedOut('browserType.launch: Timeout 180000ms exceeded.'))                                            // Playwright
  assert.ok(timedOut('not ok 3 - arena\n  error: \'test timed out after 30000ms\'\n  code: \'ERR_TEST_FAILURE\'')) // node:test
  assert.ok(!timedOut(' FAIL  kit/score.test.ts > adds\nAssertionError: expected 3 to be 4'))
  assert.ok(!timedOut('error TS2322: Type \'string\' is not assignable to type \'number\'.'))
})

// a run() stand-in: each label's answers in turn, so a check can fail side by side and pass alone
function fakeRun(answers) {
  const calls = []
  const run = async ([label]) => { calls.push(label); const ok = answers[label].shift(); return { label, ok, log: ok ? '' : 'still red' } }
  return { run, calls }
}

test('only timeouts → said once, naming the busiest process, then re-run one at a time; passing alone = passed', async () => {
  const said = []
  const results = [
    { label: 'saves test', ok: false, log: 'Error: Test timed out in 5000ms.', check: ['saves test'] },
    { label: 'ai test', ok: false, log: "test timed out after 30000ms", check: ['ai test'] },
    { label: 'ui-kit test', ok: true, log: '', check: ['ui-kit test'] },
  ]
  const { run, calls } = fakeRun({ 'saves test': [true], 'ai test': [true] })
  const after = await rerunTimeouts(results, run, { say: (line) => said.push(line), busiest: () => 'node.exe (bot sims) 88%' })
  assert.deepEqual(calls, ['saves test', 'ai test'])
  assert.ok(after.every((r) => r.ok))
  assert.match(said[0], /timeouts only — the PC is busy \(busiest: node\.exe \(bot sims\) 88%\) — re-running 2 checks one at a time/)
})

test('a timed-out check that fails alone too stays red; a real failure is never re-run', async () => {
  const said = []
  const results = [
    { label: 'saves test', ok: false, log: 'Timeout 30000ms exceeded.', check: ['saves test'] },
    { label: 'score test', ok: false, log: 'AssertionError: expected 3 to be 4', check: ['score test'] },
  ]
  const { run, calls } = fakeRun({ 'saves test': [false] })
  const after = await rerunTimeouts(results, run, { say: (line) => said.push(line), busiest: () => 'chrome.exe 40%' })
  assert.deepEqual(calls, ['saves test'])
  assert.deepEqual(after.map((r) => r.ok), [false, false])
  assert.match(said[0], /1 check timed out — the PC may be busy \(busiest: chrome\.exe 40%\) — re-running it alone/)
})

test('nothing timed out → nothing re-run, nothing said', async () => {
  const said = []
  const results = [{ label: 'lint', ok: false, log: 'error  no-unused-vars', check: ['lint'] }]
  const { run, calls } = fakeRun({})
  const after = await rerunTimeouts(results, run, { say: (line) => said.push(line), busiest: () => 'x' })
  assert.deepEqual(calls, [])
  assert.deepEqual(said, [])
  assert.equal(after[0].ok, false)
})

test('the busiest process comes back as a short name with its share, or "unknown" — never throws', { timeout: 30_000 }, () => { // asks PowerShell: ~2–4 s
  const name = busiestProcess()
  assert.equal(typeof name, 'string')
  assert.ok(name.length > 0 && name.length < 120, name)
})
