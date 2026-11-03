// SLOW TESTS WITH NO TIME LIMIT OF THEIR OWN (F175 — Test-only commits + slow tests). A vitest reporter that check-all
// adds to the unit-test run: a test that took over 2 s here and still has vitest's default limit (5 s) will likely
// time out on GitHub's runner, which is ~2.5× slower than the PC (Glyphtender v0.14.0: a 3-whole-game save test went
// red there twice — red Checks mid-/deliver, then a 24-min re-check for a one-line fix). check-all prints them as a
// warning (never a fail: a busy PC must not turn the check red). The fix is usually `{ timeout: 60_000 }` on a test
// that plays whole games — or making it faster.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, relative } from 'node:path'

export const SLOW_FILE = 'node_modules/.cache/slow-tests.json'
const SLOW_MS = 2000 // tuning-ok: 2 s on the PC ≈ vitest's 5 s default on GitHub's ~2.5× slower runner

export default class SlowTests {
  slow = []
  limit = 5000

  onInit(vitest) {
    this.limit = vitest.config.testTimeout
  }

  onTestCaseResult(test) {
    const ms = test.diagnostic()?.duration ?? 0
    // options.timeout is the test's own limit, or the config's default when it has none (probed 2026-11-03)
    if (ms > SLOW_MS && test.options.timeout === this.limit) {
      this.slow.push({ file: relative(process.cwd(), test.module.moduleId).split('\\').join('/'), name: test.fullName, ms: Math.round(ms) })
    }
  }

  onTestRunEnd() {
    mkdirSync(dirname(SLOW_FILE), { recursive: true })
    writeFileSync(SLOW_FILE, JSON.stringify(this.slow))
  }
}
