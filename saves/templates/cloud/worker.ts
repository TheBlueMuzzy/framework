// THE LINK-CODE CLOUD (saves module, F96) — Cloudflare runs this file (cloud/wrangler.json "main") on Muzzy's own
// account. It keeps the save codes players send for a link code ("K7QM-2XRP"), for content/saves.json cloud.keepDays,
// then deletes them. Everything it answers is decided in src/saves/cloudRoutes.ts (no Cloudflare there, so it's
// tested on its own); this file only stores rows and sets the alarm that tidies up.
//   Local:  npm run cloud:dev   (port 1998)   ·   Live: npm run cloud:deploy (Muzzy's call — it's public)
// Template version: 2 (keep this line: the installer compares it with the kit's to say what changed since your copy)
//
// ONE copy of the SaveCloud class (named "saves") holds every link code in its own SQLite: a SQLite Durable Object,
// the free plan's kind (100,000 rows written a day — KV's free plan allows only 1,000 writes).
// No packages: a plain class with fetch() and alarm() is a Durable Object to Cloudflare.
import savesJson from '../content/saves.json'
import { readSavesConfig } from '../src/saves/config'
import { handleCloud, type CloudRows, type TryKind } from '../src/saves/cloudRoutes'

// The few Cloudflare shapes used here (written out, so the game needs no Cloudflare type package)
type SqlStorage = { exec(sql: string, ...values: (string | number)[]): { toArray(): Record<string, unknown>[] }; readonly databaseSize: number }
interface ObjectState { storage: { sql: SqlStorage; getAlarm(): Promise<number | null>; setAlarm(time: number): Promise<void> } }
interface ObjectStub { fetch(request: Request): Promise<Response> }
interface Env {
  SaveCloud: { idFromName(name: string): unknown; get(id: unknown): ObjectStub }
  /** e2e only: `wrangler dev --var TEST_KEEP_SECONDS:5` = link codes last 5 seconds. Never set on the live server. */
  TEST_KEEP_SECONDS?: string
}

const settings = readSavesConfig(savesJson).cloud

export class SaveCloud {
  private state: ObjectState
  private env: Env
  private sqlite: SqlStorage

  constructor(state: ObjectState, env: Env) {
    this.state = state
    this.env = env
    this.sqlite = state.storage.sql
    this.query('CREATE TABLE IF NOT EXISTS saves (link TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at INTEGER NOT NULL)')
    this.query('CREATE INDEX IF NOT EXISTS saves_by_expiry ON saves (expires_at)')
    this.query('CREATE TABLE IF NOT EXISTS tries (who TEXT NOT NULL, what TEXT NOT NULL, hour INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (who, what, hour))')
    // The secret that scrambles addresses: made once at random, kept here, never sent anywhere (review F96)
    this.query('CREATE TABLE IF NOT EXISTS secret (v TEXT NOT NULL)')
    if (!this.query('SELECT v FROM secret').length) {
      const random = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
      this.query('INSERT INTO secret (v) VALUES (?)', random)
    }
    this.secret = String(this.query('SELECT v FROM secret')[0].v)
  }
  private secret: string

  /** Runs one SQL statement on this object's own SQLite (the ?s are filled from values) → its rows. */
  private query(sql: string, ...values: (string | number)[]): Record<string, unknown>[] {
    return this.sqlite.exec(sql, ...values).toArray()
  }

  async fetch(request: Request): Promise<Response> {
    const testSeconds = Number(this.env.TEST_KEEP_SECONDS)
    const response = await handleCloud(request, {
      rows: this.rows(),
      settings,
      address: request.headers.get('CF-Connecting-IP') ?? 'unknown', // Cloudflare always sets it on the live server
      secret: this.secret,
      keepMs: testSeconds > 0 ? testSeconds * 1000 : undefined,
    })
    await this.wakeForNextTidy()
    return response
  }

  /** Cloudflare calls this at the alarm's time: delete what's expired, then set the next alarm. */
  async alarm(): Promise<void> {
    const next = this.rows().tidy(Date.now())
    if (next !== null) await this.state.storage.setAlarm(next)
  }

  /** An alarm for the soonest thing to tidy — only set when there's none yet or it's later (each set is a write). */
  private async wakeForNextTidy() {
    const next = this.nextDue()
    if (next === null) return
    const alarm = await this.state.storage.getAlarm()
    if (alarm === null || alarm > next) await this.state.storage.setAlarm(next)
  }

  private nextDue(): number | null {
    const save = this.query('SELECT MIN(expires_at) AS t FROM saves')[0]?.t
    const tryHour = this.query('SELECT MIN(hour) AS h FROM tries')[0]?.h
    const times = [save, tryHour === null || tryHour === undefined ? null : (Number(tryHour) + 1) * 3_600_000]
      .filter((t): t is number => t !== null && t !== undefined).map(Number)
    return times.length ? Math.min(...times) : null
  }

  /** The table, as the routes' CloudRows. */
  private rows(): CloudRows {
    return {
      add: (link, code, expiresAt) => {
        if (this.query('SELECT link FROM saves WHERE link = ?', link).length) return false
        this.query('INSERT INTO saves (link, code, expires_at) VALUES (?, ?, ?)', link, code, expiresAt)
        return true
      },
      get: (link) => {
        const found = this.query('SELECT code, expires_at FROM saves WHERE link = ?', link)[0]
        return found ? { code: String(found.code), expiresAt: Number(found.expires_at) } : null
      },
      remove: (link) => {
        const there = this.query('SELECT link FROM saves WHERE link = ?', link).length > 0
        this.query('DELETE FROM saves WHERE link = ?', link)
        return there
      },
      count: (who, what: TryKind, hour) => Number(this.query('SELECT n FROM tries WHERE who = ? AND what = ? AND hour = ?', who, what, hour)[0]?.n ?? 0),
      bump: (who, what: TryKind, hour) => {
        this.query('INSERT INTO tries (who, what, hour, n) VALUES (?, ?, ?, 1) ON CONFLICT (who, what, hour) DO UPDATE SET n = n + 1', who, what, hour)
      },
      tidy: (now) => {
        this.query('DELETE FROM saves WHERE expires_at <= ?', now)
        this.query('DELETE FROM tries WHERE (hour + 1) * 3600000 <= ?', now)
        return this.nextDue()
      },
      storedBytes: () => this.sqlite.databaseSize,
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname
    if (path === '/health' || path.startsWith('/saves/')) {
      // always the ONE store, so a link code made on one device is found from any other
      return env.SaveCloud.get(env.SaveCloud.idFromName('saves')).fetch(request)
    }
    return new Response('Not found', { status: 404 })
  },
}
