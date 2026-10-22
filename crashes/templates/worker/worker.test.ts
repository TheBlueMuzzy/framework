// @vitest-environment node
// The worker glue, with Cloudflare faked: the Durable Object's SQLite is Node's own node:sqlite, so the class runs its
// real statements; the alarm is a number we can read.
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import worker, { CrashStore } from './worker'

const report = {
  v: 1, kind: 'error', fp: 'a1b2c3d4e5f60718', title: 'TypeError: x is undefined', frames: [{ file: 'assets/index-Bx12.js', line: 1, col: 9 }],
  version: '0.3.1.12', platform: 'web', browser: 'Chrome 141', os: 'Android 15', screen: '390x844@3', gpu: '', lang: 'en', secs: 3, moments: [], repeats: 0,
}

function fakeCloudflare(token = 'the-token') {
  const db = new DatabaseSync(':memory:')
  let alarm: number | null = null
  const state = {
    storage: {
      sql: {
        exec: (sql: string, ...values: (string | number | null)[]) => {
          const statement = db.prepare(sql)
          const rows = /^\s*SELECT/i.test(sql) ? statement.all(...values) : (statement.run(...values), [])
          return { toArray: () => rows as Record<string, unknown>[] }
        },
        get databaseSize() { return 4096 },
      },
      getAlarm: async () => alarm,
      setAlarm: async (time: number) => { alarm = time },
    },
  }
  const env = { CRASHES_TOKEN: token } as ConstructorParameters<typeof CrashStore>[1]
  const store = new CrashStore(state, env)
  const stub = { fetch: vi.fn((request: Request) => store.fetch(request)) }
  Object.assign(env, { CrashStore: { idFromName: (name: string) => name, get: () => stub } })
  return { db, store, env, stub, alarm: () => alarm }
}

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://goops-crashes.example/report', { method: 'POST', body, headers: { 'Content-Length': String(body.length), 'CF-Connecting-IP': '203.0.113.7', ...headers } })

describe('the crashes worker', () => {
  it('a report goes through the front door to the one object, is stored, and the tidy-up alarm is set for midnight', async () => {
    const cf = fakeCloudflare()
    const response = await worker.fetch(post(JSON.stringify(report)), cf.env)
    expect(response.status).toBe(204)
    expect(cf.db.prepare('SELECT COUNT(*) AS n FROM kinds').get()).toEqual({ n: 1 })
    expect(cf.alarm()).toBe(Math.floor(Date.now() / 86_400_000 + 1) * 86_400_000)
  })

  it('the front door refuses a POST with no size or over 8 KB, and answers a preflight itself — the object never sees them', async () => {
    const cf = fakeCloudflare()
    expect((await worker.fetch(new Request('https://x/report', { method: 'POST' }), cf.env)).status).toBe(413)
    expect((await worker.fetch(post('x'.repeat(9000)), cf.env)).status).toBe(413)
    const preflight = await worker.fetch(new Request('https://x/report', { method: 'OPTIONS' }), cf.env)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect((await worker.fetch(new Request('https://x/anything'), cf.env)).status).toBe(404)
    expect(cf.stub.fetch).not.toHaveBeenCalled()
  })

  it('reads the token from CRASHES_TOKEN; with none set, the summary stays closed', async () => {
    const cf = fakeCloudflare()
    const ask = (token: string) => worker.fetch(new Request('https://x/summary', { headers: { Authorization: `Bearer ${token}`, 'CF-Connecting-IP': '198.51.100.1' } }), cf.env)
    expect((await ask('the-token')).status).toBe(200)
    expect((await ask('nope')).status).toBe(404)
    const closed = fakeCloudflare('')
    expect((await worker.fetch(new Request('https://x/summary', { headers: { Authorization: 'Bearer ' } }), closed.env)).status).toBe(404)
  })

  it('the alarm tidies and comes back tomorrow while anything is stored; with nothing left it stops', async () => {
    const cf = fakeCloudflare()
    await worker.fetch(post(JSON.stringify(report)), cf.env)
    await cf.store.alarm()
    expect(cf.alarm()).toBeGreaterThan(Date.now())
    cf.db.exec('DELETE FROM kinds; DELETE FROM days; DELETE FROM samples')
    const before = cf.alarm()
    await cf.store.alarm()
    expect(cf.alarm()).toBe(before) // not set again
  })

  it('type-checks where it will live: copied into a game\'s layout (crashes/worker.ts beside src/crashes/ and content/)', () => {
    // The module's own tsc can't follow '../src/crashes/…' (that folder only exists in a game), so this builds that
    // layout in a throwaway folder inside node_modules (where @types/node is found) and runs tsc on it.
    const here = dirname(fileURLToPath(import.meta.url))
    const game = join(here, '..', '..', 'node_modules', '.cache', 'worker-typecheck')
    rmSync(game, { recursive: true, force: true })
    mkdirSync(join(game, 'src', 'crashes'), { recursive: true })
    mkdirSync(join(game, 'crashes'), { recursive: true })
    mkdirSync(join(game, 'content'), { recursive: true })
    const kit = join(here, '..', '..', 'kit')
    for (const file of readdirSync(kit)) if (/\.ts$/.test(file) && !/\.test\.ts$/.test(file)) copyFileSync(join(kit, file), join(game, 'src', 'crashes', file))
    copyFileSync(join(here, 'worker.ts'), join(game, 'crashes', 'worker.ts'))
    copyFileSync(join(here, '..', 'content', 'crashes.json'), join(game, 'content', 'crashes.json'))
    writeFileSync(join(game, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM'], module: 'ESNext', moduleResolution: 'bundler', strict: true, resolveJsonModule: true,
        noEmit: true, skipLibCheck: true, verbatimModuleSyntax: true, allowImportingTsExtensions: true, noUnusedLocals: true, types: ['node'] },
      include: ['crashes'],
    }))
    const result = spawnSync(`npx tsc -p "${game}"`, { encoding: 'utf8', shell: true }) // (one command line: npx is a .cmd on Windows)
    expect(`${result.stdout}${result.stderr}`.trim()).toBe('')
    expect(result.status).toBe(0)
    rmSync(game, { recursive: true, force: true })
  }, 60_000)

  it('nothing is logged — not the address, not the token, not the report', async () => {
    const logged = vi.spyOn(console, 'log')
    const cf = fakeCloudflare()
    await worker.fetch(post(JSON.stringify(report)), cf.env)
    await worker.fetch(new Request('https://x/summary', { headers: { Authorization: 'Bearer wrong', 'CF-Connecting-IP': '203.0.113.7' } }), cf.env)
    expect(logged).not.toHaveBeenCalled()
    logged.mockRestore()
  })
})
