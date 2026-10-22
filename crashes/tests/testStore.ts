// TESTS ONLY — the crash server's tables on a real SQLite (Node's own node:sqlite), so the tests run the very SQL the
// worker runs on Cloudflare. `written` counts rows changed — what Cloudflare bills as "rows written".
import { DatabaseSync } from 'node:sqlite'
import { sqlCrashRows, type RunSql } from '../kit/crashRows'

export function testStore() {
  const db = new DatabaseSync(':memory:')
  const counts = { written: 0, statements: 0 }
  const run: RunSql = (sql, ...values) => {
    counts.statements += 1
    const statement = db.prepare(sql)
    if (/^\s*SELECT/i.test(sql)) return statement.all(...values) as Record<string, unknown>[]
    counts.written += Number(statement.run(...values).changes)
    return []
  }
  const rows = sqlCrashRows(run)
  counts.written = 0
  counts.statements = 0
  /** Everything in a table, for looking at what's really stored. */
  const all = (table: 'kinds' | 'samples' | 'days') => db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]
  return { db, rows, run, counts, all }
}
