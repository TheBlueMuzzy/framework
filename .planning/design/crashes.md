# The Crashes module — design (framework sprint 25, F89 = layer 1; F105 = layer 2, F106 = layer 3)

Research first (2026-10-21, web research by a helper; Cloudflare numbers from its docs, legal points partly judgement — marked). Muzzy 2026-10-22 picked crash reports for sprint 25 and the default **"On, with a switch"**: reports are on, Settings has a "Send crash reports" switch, the privacy policy has one line.

## The idea
- **When a player's game breaks, Muzzy hears about it without asking anyone.** The game catches its own errors, sends each *kind* once per session to a small server of its own, the server groups them, and the next Claude session opens with "3 new errors from players, 1 came back since last time".
- **Nothing about the player travels.** No name, no IP kept, no stored id, no free text. A report is: what broke, where in the code, which version, what kind of device, the last few game moments as names and numbers.
- **Cheap and capped.** An error that fires every frame costs one request per session, not 60 a second; the server has a hard daily cap so an honest crash storm can't use up the Cloudflare account's shared allowance (online play lives there too). A deliberate flood from many addresses still can (every request counts, even refused ones) — that needs layer 2's Workers rate-limit binding or a firewall rule (F105).

## What the game catches (kit/capture.ts)
| What | How |
|---|---|
| A script error | `window.onerror` (`error` event on window) |
| A promise that failed with nobody listening | `unhandledrejection` |
| An image / script / sound file that didn't load | `addEventListener('error', fn, true)` — the capture phase, since those errors don't bubble |
| A React error | React 19 `createRoot(el, { onUncaughtError, onCaughtError })` → `reportError` + the "Something broke" screen (ui/CrashScreen.tsx) |
| The graphics card dropped the 3D canvas | `webglcontextlost` on the canvas the game names (`watchCanvas(canvas)`) |
| Anything the game wants to name itself | `report(error, { kind })` — e.g. a JSON or GLB file that didn't load |

**Not reported (noise, as Sentry's defaults do):** `ResizeObserver loop …`, `Script error.` with no file (another site's script, no details), errors whose every frame is in a browser extension (`chrome-extension://`, `moz-extension://`, `safari-web-extension://`).

Freezes, audio stuck in "suspended" and Analytics-style counts are layer 2 / 3.

## One report
```json
{ "v": 1,
  "kind": "error | rejection | asset | react | webgl | game",
  "fp": "a1b2c3d4e5f60718",
  "title": "TypeError: Cannot read properties of undefined (reading 'x')",
  "frames": [{ "file": "assets/index-Bx12.js", "line": 1, "col": 48211, "fn": "tick" }],
  "version": "0.3.1.12", "platform": "web", "browser": "Chrome 141", "os": "Android 15",
  "screen": "390x844@3", "gpu": "Adreno (TM) 740", "lang": "en",
  "secs": 314, "moments": [{ "at": -4.2, "name": "roundStart", "n": [3] }],
  "repeats": 0 }
```
- **fp (fingerprint)** = the first 16 hex of SHA-256 of `kind + cleaned title + top 3 in-game frames as file:function` (no column, no line — those change every build; file names lose their build hash `index-Bx12.js` → `index.js`). The same bug in every session and every build has the same fp. Cleaned title: numbers, hex ids and quoted text become `#`, `<id>`, `"…"`, cut to 200 characters.
- **frames**: at most 10, only files from the game's own address (in-game frames). File = the path inside the game's own folder (`assets/index-Bx12.js`, also for a game at `/GOOPS/alpha/` — the folder never travels, so a move to the real address keeps every fingerprint and the maps still match), never the full URL or its `?query`; `<anonymous>` frames (eval, a console) are left out.
- **browser / os** are read from the user-agent text on the device, as a name + major version; the full user-agent text never travels. **gpu** is the WebGL renderer name, only when the game uses WebGL.
- **moments**: the last 20, each `{ at: seconds before the error, name, n?: up to 4 numbers }`. A name must look like a code name (`^[A-Za-z][A-Za-z0-9_.:-]{0,31}$`) or it's dropped — so a player's name or chat can never get in, even by mistake. Fed by `moment('roundStart', 3)`, or from the Dev Kit adapter's `onEvent` (only its first word, if that is a code name).
- **repeats**: how many more times this fp happened since it was last sent (sent with the next report or when the page hides).
- **What never travels**: IP (Cloudflare sees it; the server never keeps it), names, chat, any typed text, save files, full URLs, location, any id that lasts beyond the tab (the session itself has no id at all).
- Size: at most 8 KB. Bigger → the frames, then the moments are cut until it fits.

## On the device
- **Once per kind per session**, at most **5 reports per session** (content/crashes.json `perSession`), then only counts.
- **Offline / closing**: unsent reports wait in memory (at most 10) and go when the page hides, by `navigator.sendBeacon` (or `fetch` with `keepalive`), never on `unload`. Held across sessions in storage = layer 2.
- **The switch**: `setOn(false)` stops everything at once; the game calls it from its Settings value (`crashReports`, a toggle, on by default) at start-up and whenever Settings changes. Off = nothing caught leaves the device.
- **Dev builds don't send** (`import.meta.env.DEV`) unless the game asks (`sendInDev`), so Muzzy's own testing isn't counted — the Dev Kit already logs errors there.

## The server (kit/crashRoutes.ts — tested without Cloudflare; templates/worker/worker.ts — the Cloudflare glue)
Its own Worker (`<game>-crashes`) + one SQLite Durable Object, like the saves cloud and the board. Local: `npm run crashes:dev` (port **1995**).

| Address | Who | Answers |
|---|---|---|
| `POST /report` | the game | 204 always (stored, counted or dropped — the game never learns which, and never retries) · 413 too big · 400 not a report |
| `GET /summary?since=<ms>` | Muzzy (token) | `{ newKinds, cameBack, reports, kinds: [...] }` — kinds seen since then, newest first |
| `GET /kinds/<fp>` | Muzzy (token) | one kind + its kept samples |
| `POST /kinds/<fp>/fixed` `{ version }` | Muzzy (token) | marks it fixed in that version |
| `GET /health` | anyone | `{ ok: true, token: 'ok' \| 'not-set' \| 'too-short' }` (live-check; the command tells "no token set" from "wrong token" — it says only whether one is set, never anything about it) |

**Stored** (SQLite): `kinds` (fp, kind, title, first_seen, last_seen, count, versions — the last 10 with counts, status open/fixed, fixed_in, came_back_at) · `samples` (fp, at, the report as sent) · `days` (UTC day, reports, dropped).

**Limits** (content/crashes.json `server`, read at deploy):
- Size at the door: 8 KB, refused before reading the body (`content-length`), and again while reading.
- **Per address**: 30 reports an hour from one address (IPv4, or an IPv6 /64), counted in the Durable Object's memory under a salted hash (SHA-256 of a random salt made at start-up + the address). Never written to storage; a restart forgets it — that's fine.
- **Daily cap**: 15,000 reports a UTC day for the whole game, then only the day's `dropped` count goes up (1 row, no new samples). 15k requests is 15% of the account's 100k free requests a day.
- **New kinds**: at most 200 new kinds a day (a flood of made-up fingerprints can't fill the table).
- **Samples**: at most 20 per kind per day, at most 100 per kind in all; the newest replace the oldest past that.
- **Kept 90 days**: an alarm once a day deletes samples older than 90 days and kinds not seen for 90 days.
- **The token**: a Wrangler secret `CRASHES_TOKEN` (`npx wrangler secret put CRASHES_TOKEN -c crashes/wrangler.json`), compared in constant time; wrong → 404 like an unknown address, and the per-address limit counts it.
- **A fixed kind comes back**: a report for a kind marked fixed, from a version the same as or newer than `fixed_in` → status open again and `came_back_at` set; older versions (players who haven't updated) only count.

**Cost per report** (free plan: 10 ms CPU, 100k rows written a day): 1 `kinds` upsert + 1 `days` upsert + 1 `samples` insert while under 20 → about 3–5 rows written. 15k reports = ~75k rows — the cap keeps it under 100k. Measured in task 8.

## Readable errors (scripts/crash-report.mjs + the Vite step)
- `vite build` with `build.sourcemap: 'hidden'` writes the `.map` files without the `//# sourceMappingURL` line players' browsers would follow. A Vite plugin from the module (`crashesMaps()`) moves every `.map` out of `dist/` into `releases/<version>/maps/` in the game's repo **after** the build, so no map is ever uploaded to Pages or itch. check:framework fails a `dist/` (and `public/`) that has a `.map` in it.
- `npm run crashes` (on the PC, never on the server — the free plan's 10 ms can't translate a stack): fetches the summary, finds each sample's version's maps, prints each kind with its real `src/game/board.ts:118 placePiece` lines, counts, versions, devices and moments. `npm run crashes -- fixed <fp> 0.3.2` marks one fixed. The `source-map` package (BSD-3, Mozilla) is the module's only new package, and only on the PC.
- The game's STATE Key facts line `Crashes: https://<game>-crashes.<account>.workers.dev` tells the command (and session start) where to look. The token lives **outside the repo**, per machine: `~/.config/bmuz/crashes/<game>.token` (never synced, like `~/.config/gws`).

## Session start (~/.claude/config/bmuz/session-start.sh)
A game whose STATE has a `Crashes:` line and whose token file exists: one `curl --max-time 3` to `/summary?since=<last time>` → **"🐞 3 new errors from players, 1 came back since last time — npm run crashes"**. Nothing new → nothing said. No answer in 3 s → nothing said (it never slows the start). "Last time" is kept per machine in `~/.config/bmuz/crashes/<game>.seen`.

## Settings + the broken-game screen
- `CRASH_SETTINGS_ROWS` (saves-module style, drawn by the UI kit's Settings): a heading + a toggle `crashReports` "Send crash reports", on, detail "If the game breaks, it sends an anonymous report so it can be fixed. No name or IP is kept." Pasted into a tab's rows.
- `CrashScreen` (ui/): a UI-kit screen, "Something broke" + "Reload" (+ "the problem was reported" when it was). Shown by the React error hook instead of a blank page.

## Privacy wording (for the game's privacy page; release-check privacy line)
> If the game breaks, it sends an anonymous technical report: what went wrong, the game version, the kind of device and browser, and the last few game actions. No name, IP address or account is stored, and nothing you type is sent. Reports are deleted after 90 days. You can turn this off in Settings → Send crash reports.

Store labels (judgement, from Apple's and Google's pages): Apple "Diagnostics → Crash Data, **not linked to you**, not used for tracking"; Google Play "App info and performance → Crash logs" (+ Diagnostics); Steam has no labels, only the privacy link. **GDPR** (judgement): with no IP and no identifier this is thin, at most pseudonymous data under legitimate interest (keeping the game working); ePrivacy's "strictly necessary" question isn't settled, which is why the switch exists. **COPPA** (amended rule, since 22 Apr 2026): "support for internal operations" needs no parental consent, and with no lasting id at all the notice rule doesn't bite.

## Decisions
- **Its own Worker**, not the rooms / saves / board server — the account's 100k requests a day are shared; its own daily cap protects online play. (Claude, 2026-10-22)
- **Durable Object SQLite, not KV** — KV allows 1k writes a day on the free plan. (Claude)
- **No translating on the server** — 10 ms CPU; maps stay on the PC, in the repo per release. (Claude, from the research)
- **On by default + a switch** (Muzzy, 2026-10-22).
- **Moments are code names + numbers only**, checked by pattern on the device — the adapter's free-text events never travel whole. (Claude)
- **No session id at all** — grouping needs only the fingerprint; "once per session" is kept in the tab's memory. (Claude)
- **The game never learns whether a report was stored** (always 204) — nothing to probe, nothing to retry. (Claude)

## Later
- **Layer 2 (F105)**: reports kept across sessions when offline (10, localStorage), freezes (Long Animation Frames + "no frame for 2 s"), audio stuck, the Workers rate-limit binding (check it's on the free plan), a private web page (Cloudflare Access or the token) with mark-fixed and came-back flags.
- **Layer 3 (F106)**: charts per version (Analytics Engine, free: 100k points a day), a player "report a bug" with an opt-in state snapshot, native crashes (Electron `crashReporter`, Capacitor / Android WebView `onRenderProcessGone`) through the same `send(report)` seam.

## Sources
Sentry grouping (https://docs.sentry.io/concepts/data-management/event-grouping/) · Cloudflare limits: Workers (https://developers.cloudflare.com/workers/platform/limits/), Durable Objects (https://developers.cloudflare.com/durable-objects/platform/pricing/), KV (https://developers.cloudflare.com/kv/platform/limits/), Analytics Engine (https://developers.cloudflare.com/analytics/analytics-engine/pricing/), rate-limit binding (https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) · Apple privacy details (https://developer.apple.com/app-store/app-privacy-details/) · Google Play Data safety (https://support.google.com/googleplay/android-developer/answer/10787469) · EDPB Guidelines 2/2023 on ePrivacy Art. 5(3), v2.0 Oct 2024.
