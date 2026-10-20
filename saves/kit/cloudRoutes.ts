// THE LINK-CODE CLOUD'S WEB ADDRESSES (F96) — the game's cloud worker (cloud/worker.ts) sends every /saves/… request
// here. Plain web Requests in, Responses out, the store passed in: no Cloudflare, so the tests call it directly
// (Glyphtender's wordsRoutes.ts pattern). The worker only keeps the rows (SQLite) and sets the tidy-up alarm.
//   POST /saves/link    { code }   a save code → { ok: true, link: 'K7QM2XRP', expiresAt }   (a new link code)
//   POST /saves/get     { link }   → { ok: true, code, expiresAt }   (the save code under it — NOT deleted: see below)
//   POST /saves/delete  { link }   → { ok: true }                    ("Delete my data")
//   GET  /health                   → { ok: true }                    (live-check: is the server up?)
// Refusals: { ok: false, code } — not-a-link · not-a-save · too-big · not-found (wrong, expired or deleted: the
// same answer, so a guess learns nothing) · too-many-tries · too-many-codes · server-full · bad-request.
// Called from the game's page on any site (github.io, itch.io) → CORS open; nothing here needs a login.
//
// Why a fetch doesn't delete the code: the player may bring it to a third device, or try again when the other
// device's storage was full. It lasts until it expires (content/saves.json cloud.keepDays) or "Delete my data".
import type { CloudConfig } from './config'
import { MAX_CODE_CHARS } from './saveCode'

/** 32 characters that can't be mistaken for each other: no O / 0, no I / 1. 32^8 ≈ 1.1 trillion link codes. */
export const LINK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const LINK_LENGTH = 8
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
/** The free plan's Durable Object holds 1 GB; new codes stop a little before that, so old ones can still be fetched. */
export const MAX_STORED_BYTES = 900_000_000

/** A new random link code ("K7QM2XRP"), from the browser's / Cloudflare's secure random numbers. */
export function newLinkCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LINK_LENGTH))
  return Array.from(bytes, (b) => LINK_ALPHABET[b % LINK_ALPHABET.length]).join('') // 256 / 32 = 8: every letter equally likely
}

/** What the player typed → the 8 characters ("k7qm-2xrp " → "K7QM2XRP"), or null when it can't be a link code. */
export function readLinkCode(typed: string): string | null {
  const link = (typed ?? '').toUpperCase().replace(/[\s-]+/g, '')
  if (link.length !== LINK_LENGTH) return null
  return [...link].every((c) => LINK_ALPHABET.includes(c)) ? link : null
}

/** "K7QM2XRP" → "K7QM-2XRP" (how it's shown: two halves are easier to read out and type). */
export function showLinkCode(link: string): string {
  return `${link.slice(0, LINK_LENGTH / 2)}-${link.slice(LINK_LENGTH / 2)}`
}

// --- the store ----------------------------------------------------------------------------------------------------

/** What one address did in one hour: typed a wrong link code, or made a new one. */
export type TryKind = 'wrong' | 'upload'

/** The rows the routes need. The worker keeps them in its SQLite; the tests in memory (memoryCloudRows). */
export interface CloudRows {
  /** Keep a save code under a link code. false = that link code is already taken (pick another). */
  add(link: string, code: string, expiresAt: number): boolean
  get(link: string): { code: string; expiresAt: number } | null
  /** false = there was nothing under it. */
  remove(link: string): boolean
  /** How many times `who` (a scrambled address) did `what` in `hour` (hours since 1970). */
  count(who: string, what: TryKind, hour: number): number
  bump(who: string, what: TryKind, hour: number): void
  /** Delete expired saves and tries from past hours. → when the next one is due (ms), or null when nothing's left. */
  tidy(now: number): number | null
  /** About how much is stored (bytes). */
  storedBytes(): number
}

/** The store in memory — for tests, and to try the routes without Cloudflare. */
export function memoryCloudRows(): CloudRows & { saves: Map<string, { code: string; expiresAt: number }>; tries: Map<string, number> } {
  const saves = new Map<string, { code: string; expiresAt: number }>()
  const tries = new Map<string, number>() // "who|what|hour" → count
  const nextDue = (): number | null => {
    const times = [...saves.values()].map((s) => s.expiresAt)
    for (const key of tries.keys()) times.push((Number(key.split('|')[2]) + 1) * HOUR)
    return times.length ? Math.min(...times) : null
  }
  return {
    saves,
    tries,
    add: (link, code, expiresAt) => (saves.has(link) ? false : (saves.set(link, { code, expiresAt }), true)),
    get: (link) => saves.get(link) ?? null,
    remove: (link) => saves.delete(link),
    count: (who, what, hour) => tries.get(`${who}|${what}|${hour}`) ?? 0,
    bump: (who, what, hour) => { tries.set(`${who}|${what}|${hour}`, (tries.get(`${who}|${what}|${hour}`) ?? 0) + 1) },
    tidy: (now) => {
      for (const [link, save] of saves) if (save.expiresAt <= now) saves.delete(link)
      for (const key of tries.keys()) if ((Number(key.split('|')[2]) + 1) * HOUR <= now) tries.delete(key)
      return nextDue()
    },
    storedBytes: () => [...saves.values()].reduce((total, s) => total + s.code.length, 0),
  }
}

// --- the routes ---------------------------------------------------------------------------------------------------

export interface CloudContext {
  rows: CloudRows
  /** content/saves.json → cloud (readSavesConfig(savesJson).cloud). */
  settings: CloudConfig
  /** The caller's address (Cloudflare's CF-Connecting-IP header). Only ever kept scrambled, for an hour. */
  address: string
  now?: number
  /** How long a new link code lasts, in ms — normally settings.keepDays. (A test server sets seconds.) */
  keepMs?: number
  /** Stop making new codes past this many bytes stored. */
  maxStoredBytes?: number
  /** Where new link codes come from (tests pass their own). */
  newLink?: () => string
}

const OPEN_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...OPEN_CORS } })
const refuse = (code: string, status: number) => json({ ok: false, code }, status)

/** The body as JSON, or null when it's too big or not JSON. */
async function readJson(request: Request, maxChars: number): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get('Content-Length') ?? 0) > maxChars) return null
  const text = await request.text()
  if (text.length > maxChars) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body === 'object' ? body : null
  } catch {
    return null
  }
}

/** An address → a scrambled number (SHA-256, the first 16 hex digits): enough to count tries, never the address. */
export async function scramble(address: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`saves-cloud:${address}`))
  return Array.from(new Uint8Array(hash).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** The same shape as a save code (saveCode.ts) — the cloud only carries save codes, nothing else. */
const SAVE_CODE_SHAPE = /^[A-Za-z0-9]+-\d+[zj]-[A-Za-z0-9_-]+$/
/** A body is a save code + a little JSON around it. */
const MAX_BODY_CHARS = MAX_CODE_CHARS + 1_000

export async function handleCloud(request: Request, context: CloudContext): Promise<Response> {
  const { rows, settings, address } = context
  const now = context.now ?? Date.now()
  const hour = Math.floor(now / HOUR)
  const path = new URL(request.url).pathname
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: OPEN_CORS })
  if (path === '/health' && request.method === 'GET') return json({ ok: true })
  if (request.method !== 'POST' || !['/saves/link', '/saves/get', '/saves/delete'].includes(path)) return refuse('not-found', 404)
  const who = await scramble(address)

  if (path === '/saves/link') {
    if (rows.count(who, 'upload', hour) >= settings.uploadsPerHour) return refuse('too-many-codes', 429)
    const body = await readJson(request, MAX_BODY_CHARS)
    if (!body) return refuse('too-big', 413) // (or not JSON at all — the game never sends that)
    const code = body.code
    if (typeof code !== 'string' || !SAVE_CODE_SHAPE.test(code)) return refuse('not-a-save', 400)
    if (code.length > MAX_CODE_CHARS) return refuse('too-big', 413)
    if (rows.storedBytes() + code.length > (context.maxStoredBytes ?? MAX_STORED_BYTES)) return refuse('server-full', 507)
    const expiresAt = now + (context.keepMs ?? settings.keepDays * DAY)
    for (let attempt = 0; attempt < 5; attempt++) { // a taken code is one in a trillion; five tries is plenty
      const link = (context.newLink ?? newLinkCode)()
      if (rows.add(link, code, expiresAt)) {
        rows.bump(who, 'upload', hour)
        return json({ ok: true, link, expiresAt })
      }
    }
    return refuse('server-full', 507)
  }

  // /saves/get and /saves/delete: both need the right link code, so both count wrong tries
  if (rows.count(who, 'wrong', hour) >= settings.wrongTriesPerHour) return refuse('too-many-tries', 429)
  const body = await readJson(request, 1_000)
  const link = typeof body?.link === 'string' ? readLinkCode(body.link) : null
  if (!link) return refuse('not-a-link', 400) // can't match anything, so it isn't counted as a guess
  const saved = rows.get(link)
  if (!saved || saved.expiresAt <= now) {
    rows.bump(who, 'wrong', hour)
    return refuse('not-found', 404)
  }
  if (path === '/saves/delete') {
    rows.remove(link)
    return json({ ok: true })
  }
  return json({ ok: true, code: saved.code, expiresAt: saved.expiresAt })
}
