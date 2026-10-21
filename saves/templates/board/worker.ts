// THE CHECKED LEADERBOARD (saves module, F98) — Cloudflare runs this file (board/wrangler.json "main") on Muzzy's own
// account. Players send a finished Daily game's RECORD (setup + every move); this server replays it with THE GAME'S OWN
// RULES (imported below, never a copy) and puts the score it computed on the day's board under 3 letters. A score sent
// by a player is never read. Everything it answers is decided in src/saves/boardRoutes.ts (no Cloudflare there, so
// it's tested on its own); this file only stores rows, runs the alarm, and plugs the game in.
//   Local:  npm run board:dev   (port 1996)   ·   Live: npm run board:deploy (Muzzy's call — it's public)
// Template version: 4 (keep this line: the installer compares it with the kit's to say what changed since your copy)
//
// ONE copy of the DailyBoard class (named "board") holds every day's board in its own SQLite: a SQLite Durable Object,
// the free plan's kind. No packages: a plain class with fetch() and alarm() is a Durable Object to Cloudflare.
import savesJson from '../content/saves.json'
import { readSavesConfig } from '../src/saves/config'
import { checkWaiting, handleBoard, MAX_RECORD_CHARS, nextMidnight, tidyBoard, type BoardCount, type BoardGame, type BoardRows, type BoardScore } from '../src/saves/boardRoutes'
import { refuseHugeBody } from '../src/saves/cloudRoutes'

// ── THE GAME — fill this in (the installer lists it until it's done) ──────────────────────────────────────────────
// The board needs four things from the game, all from the game's own code (so the server and the phone can't disagree):
//   rulesVersion   the game's RULES_VERSION (+1 when a rule change would replay old games differently)
//   rules(setup)   the game's rules for that setup (Glyphtender: glyphtenderRules(its word list))
//   dailySetup(day) the very function the game starts its Daily game with
//   score(state)   the score of a finished game (null when it isn't over)
//   maxMoves       the most moves a whole game can take
// e.g. (Glyphtender):
//   import { glyphtenderRules } from '../src/engine/rules'
//   import { dailyScore, dailySetup, RULES_VERSION } from '../src/game/record'
//   const game: BoardGame<GameState, Action, GameSetup> = { rulesVersion: RULES_VERSION, rules: (setup) => …, dailySetup, score: dailyScore, maxMoves: 400 }
// A game whose rules need a data file (a word list) bundles it as text, like its online server does (wrangler.json "rules").
const game: BoardGame<unknown, unknown, unknown> = THE_GAME_GOES_HERE()
function THE_GAME_GOES_HERE(): never {
  throw new Error('board/worker.ts: fill in THE GAME (its rules, Daily setup and score) — see the comment above.')
}

/** true = a sent game shows "checking…" and the alarm replays it a moment later, one game per alarm — for a game whose
 *  replay takes longer than the plan's CPU time per request (Workers Free: 10 ms). Measure it (`npm run board:dev`
 *  logs "replay … ms" for each game) and set it to match. */
const CHECK_LATER = true
/** How many moves one alarm replays (each alarm has the same CPU limit as a request). Measure it too: the alarm logs
 *  "replay (alarm): N moves in X ms" — keep X well under 10. */
const MOVES_PER_ALARM = 10
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The few Cloudflare shapes used here (written out, so the game needs no Cloudflare type package)
type SqlStorage = { exec(sql: string, ...values: (string | number)[]): { toArray(): Record<string, unknown>[] }; readonly databaseSize: number }
interface ObjectState { storage: { sql: SqlStorage; getAlarm(): Promise<number | null>; setAlarm(time: number): Promise<void>; sync(): Promise<void> } }
interface ObjectStub { fetch(request: Request): Promise<Response> }
interface Env {
  DailyBoard: { idFromName(name: string): unknown; get(id: unknown): ObjectStub }
  /** Measuring / e2e only: `wrangler dev --var CHECK_NOW:1` = every game is replayed inside its request (to time it). Never set on the live server. */
  CHECK_NOW?: string
}

const settings = readSavesConfig(savesJson).board

export class DailyBoard {
  private state: ObjectState
  private checkLater: boolean
  private sqlite: SqlStorage
  private secret: string

  constructor(state: ObjectState, env: Env) {
    this.state = state
    this.checkLater = CHECK_LATER && env.CHECK_NOW !== '1'
    this.sqlite = state.storage.sql
    this.query('CREATE TABLE IF NOT EXISTS scores (day TEXT NOT NULL, player TEXT NOT NULL, name TEXT NOT NULL, score REAL NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (day, player))')
    this.query('CREATE INDEX IF NOT EXISTS scores_by_rank ON scores (day, score DESC, at)')
    this.query('CREATE TABLE IF NOT EXISTS waiting (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, player TEXT NOT NULL, name TEXT NOT NULL, record TEXT NOT NULL, at INTEGER NOT NULL, progress INTEGER NOT NULL DEFAULT 0, state TEXT, attempts INTEGER NOT NULL DEFAULT 0)')
    this.query('CREATE TABLE IF NOT EXISTS counts (who TEXT NOT NULL, what TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (who, what, day))')
    // The secret for the keyed hashes of addresses and player ids: made once at random, kept here, never sent anywhere
    this.query('CREATE TABLE IF NOT EXISTS secret (v TEXT NOT NULL)')
    if (!this.query('SELECT v FROM secret').length) {
      const random = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
      this.query('INSERT INTO secret (v) VALUES (?)', random)
    }
    this.secret = String(this.query('SELECT v FROM secret')[0].v)
  }

  /** Runs one SQL statement on this object's own SQLite (the ?s are filled from values) → its rows. */
  private query(sql: string, ...values: (string | number)[]): Record<string, unknown>[] {
    return this.sqlite.exec(sql, ...values).toArray()
  }

  async fetch(request: Request): Promise<Response> {
    const response = await handleBoard(request, {
      rows: this.rows(), game, settings, secret: this.secret, checkLater: this.checkLater, movesPerStep: MOVES_PER_ALARM,
      address: request.headers.get('CF-Connecting-IP') ?? 'unknown', // Cloudflare always sets it on the live server
      timed: (ms, moves) => console.log(`replay: ${moves} moves in ${ms.toFixed(1)} ms`),
    })
    await this.wake(this.rows().waiting(1).length ? Date.now() : nextMidnight())
    return response
  }

  /** Cloudflare calls this at the alarm's time: one step (MOVES_PER_ALARM moves) of the oldest waiting game — each alarm
   *  has its own CPU time — and a tidy of old days; then it comes back at once if games still wait, else at the next
   *  midnight (UTC) while anything is stored. */
  async alarm(): Promise<void> {
    const rows = this.rows()
    // Count this step BEFORE it runs, and wait until that's really saved: a step that runs out of CPU time is stopped
    // with its writes lost — counted first, a game that always dies is dropped after a few tries (review F98)
    const [next] = rows.waiting(1)
    if (next) {
      rows.attemptWaiting(next.id)
      await this.state.storage.sync()
    }
    const left = checkWaiting({ rows, game, timed: (ms, moves) => console.log(`replay (alarm): ${moves} moves in ${ms.toFixed(1)} ms`) }, MOVES_PER_ALARM)
    tidyBoard(rows, settings)
    if (left > 0) await this.state.storage.setAlarm(Date.now())
    else if (rows.anything()) await this.state.storage.setAlarm(nextMidnight())
  }

  /** An alarm at `time` — only set when there's none yet or it's later (each set is a write). */
  private async wake(time: number) {
    const alarm = await this.state.storage.getAlarm()
    if (alarm === null || alarm > time) await this.state.storage.setAlarm(time)
  }

  /** The tables, as the routes' BoardRows. */
  private rows(): BoardRows {
    const asScore = (r: Record<string, unknown>): BoardScore => ({ day: String(r.day), player: String(r.player), name: String(r.name), score: Number(r.score), at: Number(r.at) })
    return {
      count: (who, what: BoardCount, day) => Number(this.query('SELECT n FROM counts WHERE who = ? AND what = ? AND day = ?', who, what, day)[0]?.n ?? 0),
      bump: (who, what: BoardCount, day, by = 1) => {
        this.query('INSERT INTO counts (who, what, day, n) VALUES (?, ?, ?, ?) ON CONFLICT (who, what, day) DO UPDATE SET n = n + ?', who, what, day, by, by)
      },
      score: (day, player) => {
        const found = this.query('SELECT * FROM scores WHERE day = ? AND player = ?', day, player)[0]
        return found ? asScore(found) : null
      },
      putScore: (row) => {
        this.query('INSERT OR REPLACE INTO scores (day, player, name, score, at) VALUES (?, ?, ?, ?, ?)', row.day, row.player, row.name, row.score, row.at)
      },
      top: (day, n) => this.query('SELECT * FROM scores WHERE day = ? ORDER BY score DESC, at ASC LIMIT ?', day, n).map(asScore),
      higher: (day, score) => Number(this.query('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?', day, score)[0]?.n ?? 0),
      wait: (g) => { this.query('INSERT INTO waiting (day, player, name, record, at) VALUES (?, ?, ?, ?, ?)', g.day, g.player, g.name, g.record, g.at) },
      waiting: (n) => this.query('SELECT * FROM waiting ORDER BY id LIMIT ?', n)
        .map((r) => ({ id: Number(r.id), day: String(r.day), player: String(r.player), name: String(r.name), record: String(r.record), at: Number(r.at),
          progress: Number(r.progress), state: r.state === null ? null : String(r.state), attempts: Number(r.attempts ?? 0) })),
      attemptWaiting: (id) => { this.query('UPDATE waiting SET attempts = attempts + 1 WHERE id = ?', id) },
      waitingFor: (day, player) => Number(this.query('SELECT COUNT(*) AS n FROM waiting WHERE day = ? AND player = ?', day, player)[0]?.n ?? 0),
      stepWaiting: (id, progress, state) => { this.query('UPDATE waiting SET progress = ?, state = ?, attempts = 0 WHERE id = ?', progress, state, id) },
      doneWaiting: (id) => { this.query('DELETE FROM waiting WHERE id = ?', id) },
      remove: (day, player) => {
        const there = this.query('SELECT (SELECT COUNT(*) FROM scores WHERE day = ? AND player = ?) + (SELECT COUNT(*) FROM waiting WHERE day = ? AND player = ?) AS n', day, player, day, player)
        this.query('DELETE FROM scores WHERE day = ? AND player = ?', day, player)
        this.query('DELETE FROM waiting WHERE day = ? AND player = ?', day, player)
        return Number(there[0]?.n ?? 0) > 0
      },
      tidy: (oldestDay, countsFrom) => {
        this.query('DELETE FROM scores WHERE day < ?', oldestDay)
        this.query('DELETE FROM waiting WHERE day < ?', oldestDay)
        this.query('DELETE FROM counts WHERE day < ?', countsFrom)
      },
      anything: () => Number(this.query('SELECT (SELECT COUNT(*) FROM scores) + (SELECT COUNT(*) FROM waiting) + (SELECT COUNT(*) FROM counts) AS n')[0]?.n ?? 0) > 0,
      storedBytes: () => this.sqlite.databaseSize,
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname
    if (path === '/health' || path.startsWith('/board/')) {
      // a POST with no size, or too big, stops HERE — never read inside the one board everyone shares (security review)
      const tooBig = refuseHugeBody(request, MAX_RECORD_CHARS)
      if (tooBig) return tooBig
      // always the ONE board, so every player sees the same day
      return env.DailyBoard.get(env.DailyBoard.idFromName('board')).fetch(request)
    }
    return new Response('Not found', { status: 404 })
  },
}
