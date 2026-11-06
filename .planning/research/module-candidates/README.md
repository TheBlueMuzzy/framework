# Module candidates — Glyphtender + Goops (F189 — Games list module candidates)

2026-11-05 · read-only (Glyphtender 5659b8c, Goops a334977) · judged against the module recipe §2 (`design/module-recipe.md`): structure not rules · named by a player · a second game needs it.
Full lists: `glyphtender.md` · `goops.md` (one helper each). Claude opened every file below before it went on this page.

## The short version
- **No new brick is needed yet.** Most of what the two games share fits as a part of a brick we already have.
- **The biggest win adds nothing:** Goops takes two frozen bricks (Saves, Crashes), so both stop being frozen.
- **One real new brick is possible later:** a tutorial player. Both games built one their own way. A trial comes first.

## 1. The way in — bricks Goops takes (no new framework code)
| # | Brick | Why Goops needs it (checked) | Effect |
|---|---|---|---|
| 1 | **Saves** | `goops/src/progress/save.ts:11` says itself it's a hand-made stand-in for the saves module, same shape | Saves unfrozen (2 games) · Goops gets backups + golden-save checks |
| 2 | **Crashes** | Goops catches no errors at all (no error handler in `src/`) — a crash is a blank page for a live game | Crashes unfrozen · needs a small crash server on Muzzy's Cloudflare for Goops |
| 3 | **Lint** | Goops has no `src/lint` — "settings live in `content/`" is only checked by judgement there | Lint used by 2 games |
| — | Table · Rooms · AI | Not for Goops: real-time, one player, no online play, no opponent | Stay frozen |

## 2. New parts inside bricks we already have (both games already wrote them)
| # | Part | Glyphtender | Goops | Goes into |
|---|---|---|---|---|
| 4 | **Settings the game follows live** (change a Settings row → the screen changes at once) | `src/ui/gameSettings.ts` (62 lines) | written by hand 3× — `src/game/gooStyle.ts`, `wallKick.ts`, `readoutSetting.ts` | UI kit — one small helper |
| 5 | **Phone screen handling** | full screen on phones — `src/ui/fullscreen.ts` (114) | the "turn your phone upright" card — `src/ui/App.tsx` | UI kit — the two halves joined |
| 6 | **A new version on first visit** | the plain line — `src/main.tsx:45` | the fixed one — `src/main.tsx:16-28` (the page could stay on the old version) | Version brick — Goops' fix |
| 7 | **Open a Dev Kit tab in a test** | `e2e/devkit-tabs.mjs` (30) | clicks the tab directly (`e2e/sound.mjs:178`), breaks on a phone-sized window | Dev Kit — a test helper |
| 8 | **Before/after screenshot check** | `e2e/shots.mjs` (366) | nothing like it | BMUZ template (like `check-all.mjs`) |

## 3. A possible new brick — trial first
| # | Part | Glyphtender | Goops | Next step |
|---|---|---|---|---|
| 9 | **Tutorial player** (steps, highlights, hints) | steps written as code — `src/tutorial/railsSteps.ts` (159), `railsDirector.ts` (82), `HelpLayer.tsx`, `nudges.ts`, `tips.ts` | steps as JSON files — `src/game/lessons/runner.ts` (392), `lessonTypes.ts` (124), `content/lessons/*.json`, a Dev Kit Lessons tab | Trial on a throwaway copy: rewrite Glyphtender's first 3 tutorial steps as Goops-style lesson files. Goes well → brick; badly → each keeps its own |

## 4. Maybe — not now
- Slow-phone load-time check (`glyphtender/scripts/perf-audit.mjs`) — only Glyphtender uses it.
- Golden games (replay a whole game to prove nothing changed) — needs proof Goops replays a shift the same way every time.
- Goops' spotlight (a dim with several holes) — an upgrade to the kit's callout, if a second game asks.
- Goops' frame-rate readout as a Dev Kit tab — only Goops needs it.

## 5. Stays in its game
- Glyphtender: Explore mode (the ? button), word rules, board, its online and AI wiring — rules or one game only (17 lines in `glyphtender.md` §C).
- Goops: the ladder (ranks — Glyphtender has none), touch controls (different gestures), goo physics, its progress save (Saves replaces it).

## 6. Small things found on the way (for the games' update milestone)
- Goops' `check:fast` has drifted from the template: four commands one after another, and no "framework (code)" check.
- Glyphtender's `e2e/shots.mjs:3` describes an upright card Glyphtender doesn't have (stale comment).

## Claude's pick for the next milestone
- **Take:** 1–3 (way in), 4–6 (small parts both games already wrote), in that order.
- **Small, if there's room:** 7–8 (test helpers).
- **Trial only:** 9 — the tutorial brick is the only new brick, and the biggest; prove it before building it.
- **Weighed:** the way in first because it adds no framework code and unfreezes two bricks — the cleanup's own rule ("a second game makes it general"). Against: Crashes needs a new server for Goops (a Cloudflare worker on Muzzy's account — its free plan covers it, as Glyphtender's does). The tutorial brick waits because both versions work today; merging them is real work with a real risk of making each game's tutorial worse.
