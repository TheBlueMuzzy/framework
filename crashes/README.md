# Crashes

When a player's game breaks, you hear about it. The game catches its own errors and sends each **kind** of error once per session to a small server of its own on Cloudflare. The server groups them. `npm run crashes` on the PC prints each kind with the real file and line, and the next Claude session opens with **"🐞 3 new errors from players, 1 came back since last time"**.

Nothing about the player travels: no name, no IP kept, no stored id, no typed text. A report holds what broke, where in the code, the version, the kind of device and browser, and the last few game moments as code names and numbers. It is **on by default with a "Send crash reports" switch in Settings** (Muzzy 2026-10-22). Reports are deleted after 90 days.

- Design: `../.planning/design/crashes.md` (research, budget, privacy wording, decisions).
- Framework sprint 25: F89 = layer 1. Layer 2 (F105): kept across sessions while offline, freezes, a private web page, the rate-limit binding. Layer 3 (F106): charts, a player "report a bug", native crashes.
- Kit **0.1.0**.
- No packages at run time. The server is a small worker of the game's own (wrangler). `source-map` is used on the PC only.

## What a game gets
| File (in `src/crashes/`) | Does |
|---|---|
| `capture.ts` | **The game side.** Functions: `startCrashes({ config, version })` · `setOn(on)` · `reportError(error, { kind })` · `moment('roundStart', 3)` · `momentsFromGame(adapter.onEvent)` · `watchCanvas(canvas)` · `stopCrashes()`. It catches: script errors, promises nobody caught, files that didn't load (images, sounds, scripts), React errors, a lost 3D canvas. Each kind is sent once per session, at most 5 per session; repeats are only counted. Reports go when the page hides, held while offline (10 at most). Noise is never sent: ResizeObserver, "Script error." from other sites, browser extensions. Dev builds send nothing (unless `client.sendInDev`). It never throws and never reports its own sending. |
| `fingerprint.ts` · `stack.ts` · `device.ts` | The same bug in every build and session → the same 16-character fingerprint. File names lose their build hash; numbers, ids and quoted text are cleaned out of the title. Only the game's own frames, as a path. Browser / OS as a name + major version (the full user-agent text never travels). Language without region. |
| `report.ts` | The exact shape of a report and its limits (8 KB), shared by the game and the server. |
| `config.ts` | `content/crashes.json`. A bad value → one warning + the default. |
| `settingsRow.ts` | `CRASH_SETTINGS_ROWS`: the "Send crash reports" switch, on, with its privacy line, for the UI kit's Settings. `applyCrashSetting(values)` passes it on. |
| `ui/CrashScreen.tsx` · `ui/crashRoot.tsx` | "Something broke · Reload" (+ "The problem was reported."), from UI kit parts. `createRoot(el, crashRootOptions())` hands React's errors over and shows the screen instead of a blank page. **Only installed when the game has the UI kit.** |
| `crashRoutes.ts` · `crashRows.ts` | **The server's rules** (no Cloudflare in them, so they're tested). It checks every field and stores only what's in the shape. Limits: 8 KB at the door; 30 an hour per address (a salted hash kept in memory, never stored); 15,000 a day; 200 new kinds a day; 20 samples per kind a day and 100 in all; 300 MB of samples; kept 90 days. A kind marked fixed that comes back from that version or newer is flagged. A token of 24+ characters guards the reading side (Authorization header only). |
| `vitePlugin.mjs` | `crashesMaps()` in vite.config. Builds hidden source maps and moves them to `releases/<version>/maps/` (commit that folder), so players never download them. |
| `crash-report.mjs` | `npm run crashes` on the PC. `-- --since=7d` · `-- fixed <fp> 0.3.2`. The summary, each kind with its real lines (from that version's maps), devices, versions, moments. |
| `conformance.mjs` | Its check:framework part (below). |

Given once (then the game's own): `content/crashes.json` · `crashes/worker.ts` + `crashes/wrangler.json` (the server: one SQLite Durable Object `CrashStore`, a daily tidy-up alarm, port **1995** locally, Cloudflare's per-request logs off).

## Install / update
```
node ~/.claude/config/bmuz/scripts/install-module.mjs crashes <game-folder>
```
It prints only the wiring still missing:
- packages (`wrangler`, `source-map`);
- the `crashes`, `crashes:dev` and `crashes:deploy` scripts;
- `.wrangler/` and `.dev.vars` (the local test token) in .gitignore;
- `crashesMaps()`;
- `startCrashes`;
- the Settings switch and `applyCrashSetting`;
- `crashRootOptions()`.

Then come the steps to try it locally and to go live.

**Going live is Muzzy's call**: a token (also saved in `~/.config/bmuz/crashes/<server host>.token` on each machine, never in the repo), `npm run crashes:deploy`, `client.url` in content/crashes.json, `Crashes: <address>` in STATE Key facts (session start reads it), and the privacy paragraph on the game's privacy page.

## What a game must provide (MODULE-CONTRACTS.md "Crashes") — check:framework checks each
- the game catches its errors (`startCrashes` in the game's code + content/crashes.json);
- the player can turn it off (the crashReports switch in Settings, and the value reaches the module);
- React errors reach the module (`createRoot(…, crashRootOptions())`; skipped for a game without React);
- no source map ships (`crashesMaps()` in vite.config; any `.map` in public/ or dist/ fails, named);
- where reports go (a note: "not live yet" while `client.url` is empty; plain http to the internet fails).

## Cost on Cloudflare's free plan
Measured locally:
- ~0.15 ms CPU per report (the limit is 10 ms).
- ~4 rows written per stored report, 2 per counted-only one, 0 when the per-address limit drops it.
- At the 15,000-a-day cap, that is at most ~60k of the 100k rows written a day.

The account's 100k requests a day are shared with online play. An honest crash storm stays far under it. A deliberate flood from many addresses could still use it up: the rate-limit binding is layer 2 (F105).
