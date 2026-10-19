# Game Framework — State

## ▶ RESUME HERE
2026-10-18 — **Sprint 05 (F68 + F61) built, autonomous run.**
- **F68 BMUZ hooks ✔ built** (all in ~/.claude, not this repo): never-rules (reset --hard, force-push, unmerged branch deletes refused; Chrome asks) · commit gate (type check) · live gate (no push to a deploying branch / deploy command without `.planning/smoke-pass`) · /develop Stop gate (check:fast) · check-ui after UI edits. Proof: `node ~/.claude/config/bmuz/hooks/test-hooks.mjs` 94/94 + a real headless try of each. Plain words: `~/.claude/config/bmuz/HOOKS.md`. **Muzzy: read HOOKS.md and OK it → then /sync** (the laptop doesn't have the hooks yet).
- **F61 Conformance pack** lives on branch `dev/conformance` (pushed; its SPRINT.md is the current one): `npm run check:framework` (Dev Kit 0.19.0, UI kit 0.18.0, Audio 0.3.0, AI 0.2.0, Rooms 0.7.0, Table 0.8.0) proven on a copy of Goops (PASS + 5 deliberate breaks caught). Reviewed + 7 review fixes (Dev Kit 0.19.1, UI kit 0.18.1, Audio 0.3.1, AI 0.2.1) — checked first-hand: 6 suites green, Goops copy PASS 14/14, a raw-timer break caught. Merges to main at /deliver. PAUSED pill fix is on main already (Dev Kit 0.18.1, b6854bd) — **tell the Goops session it can update.**
- **F73 hand-off card ✔ built** (Muzzy: "I never want to see it any other way going forward!"): `~/.claude/config/bmuz/templates/handoff.md` + a Stop hook. F67 first pass: `~/.claude/config/bmuz/reviews/2026-10-18-reliability/HOOK-CANDIDATES.md` (~45 candidates, ⭐ best). F74 self-improving loop added (Muzzy's milestone-retro idea).
- Next: F61 review fixes → show Muzzy → F62 (Goops passes — the Goops session adds `conformance: { startPlay, query }` to its adapter) / F63 (Glyphtender: bots on setTimeout, check:ui red today, no `smoke` script).

## Where we are
Stage: develop   Milestone: v0.9 — Every game wired the same   Sprint: 05
Doing: F68 done (Muzzy OK pending) · F61 review fixes   Branch: main + dev/conformance   Version: 0.10.0 (Dev Kit 0.16.1)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.2.0

## Key facts
**What this is**
- The Game Framework (BMUZ-PLAN step 2): reusable modules that games copy in with a version stamp; improvements get harvested back. Plan: `~/.claude/config/bmuz/BMUZ-PLAN.md`.
- Modules are copied into games (a framework change never breaks a finished game). UI kit copy goes to a game's `src/ui/kit/`.
**Rules (UI kit)**
- Parts and screens contain no colours, px sizes or fonts — only style names. The style file paints everything.
- All presets have identical setting names + pass contrast (tested). Accessibility floor lives outside presets.
- Web: plain React + plain CSS variables. No Tailwind, no component library (design §6).
- Size budget: core ≤ ~1,000 lines; built screens ≈ 60 lines each (~1,500).
**Run/deploy**
- Default branch `main`. Remote: private GitHub TheBlueMuzzy/framework.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-15 — Released v0.10.0: Dev Kit Select Mode (0.14.0–0.16.1) — proven by Glyphtender v0.11.0; review fix: Color tab keeps glow / panel texture.
- 2026-09-29 — Sprint 04 built autonomously: F08 Dev Kit module, F09 Roll Better on it, F10 kit 0.2 (7 gaps), F11 Roll Better on kit 0.2.2 (+2 gaps found in the move). Reviews clean; 2 small save-endpoint hardenings (Dev Kit 0.1.1).
- 2026-09-28 — Pre-release reviews: security (1 low fixed: installer never deletes outside src/ui/kit) + code review (6 bugs fixed: replace focus, per-game settings slot, React 18 inert, room-code clearing, confirm cancel, Esc with tooltip); shoot now flags clipped controls. Kit 0.1.5, 115 tests.
- 2026-09-28 — Sprint 03 done: F06 game-ui skill (+ catalog, install-kit, shipped checker, pick sheet, BMUZ wiring); F07 Roll Better Settings rebuilt in Cartoon (408 hand-made lines gone), kit 0.1.0 → 0.1.3 from the try-out. Muzzy approved.
- 2026-09-28 — Sprint 02 done: F04 built screens (~36, blocks 959 lines), F05 gallery menu + 116 screenshots; Pixel body font → VT323; focus rings keyboard-only. Muzzy approved.
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
