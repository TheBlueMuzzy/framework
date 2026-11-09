# Five-stage audit — 2026-11-09

A read-only sweep (helper) of everywhere the old four-stage picture still lives, after Muzzy's stage meanings (VISION V48: discover gathers material · define makes the blocks · design assembles them + the build plan · develop the production model · release the public) and the entry point (F225 — Where are you starting?). ~90 conflicts. Paths: `~` = C:\Users\Muzzy\.claude · `fw` = framework\.planning · `eng` = dev\bmuz.

**How it's sorted into the plan:** (a) → F226 — Five stages, one meaning each · (b) → F226 for the daily skills' routing, F225 for the engine side · (c) → F227 — Design pipeline · (d) fixed 2026-11-09 · (e) left as dated history. Until F226 and F227 land, today's daily skills keep working exactly as they are (the old /define still writes the design and build plan; /deliver keeps its name) — nothing is renamed halfway.

## The three that matter most
1. **Renaming /deliver breaks the main-branch guard.** `~/config/bmuz/hooks/rules/guard-git/_shared.mjs:74-84` (`deliverRan`) only lets a merge into main through when it sees `/deliver` or the `deliver` skill. The rename must change this in the same commit (and `~/settings.json:9,187,219` permissions on `skills/deliver/**`).
2. **VISION contradicted itself** (V14 vs V48) — fixed 2026-11-09.
3. **GG13's build-plan commit check never matches its own commit names** (`guard-git/GG13.stage-state.mjs:17` matches `GDD: build plan` / `GDD + roadmap: …`; the skills commit `TDD + roadmap: build plan` and `GDD + TDD + roadmap: fast-track`). Broken before today; fix it when the build plan moves to Design (F227).

## (a) F226 — names, commands, meanings (50 rows)
- `~/CLAUDE.md:14` "Design: Double Diamond" · `:26-29` the 4-row stage table (no /design, /deliver not /release) · `:42` "Time in /discover and /define" (Design missing) · `:62`, `:80` /deliver.
- `~/references/claude-md-why.md:18,33,37-40,53,78,108` (mirror of CLAUDE.md) · `~/references/versioning.md:9-14`.
- `~/skills/bmuz/SKILL.md:3,15,39,41,43` (13 commands, Double Diamond, /deliver row, specialists mapped to old stages).
- `~/skills/discover/SKILL.md:3,13,19` + `stages/discover.md:8,10,17` (stage 1 framing; Discover creates GDD.md — it should only gather material; "2–4 rough takes" edges into choosing); `mda-analyze/SKILL.md:26`.
- `~/skills/define/SKILL.md:3,6`; `stages/define.md:5-15` (Part 1 lacks the 3–5 line story and core verbs).
- `~/skills/develop/SKILL.md:3,16,63,93,97,108`; `evals/task-then-card/graders/no-main-commit.md:8`.
- `~/skills/deliver/SKILL.md:2-6,15,35` (name, framing, "stage" means two things, Stage = deliver); `evals/musts-first/prompt.md:3,10`.
- `~/skills/play/SKILL.md:18,23` · `~/skills/bug/SKILL.md:13,35,55`.
- `~/config/bmuz/PROJECT-FILES.md:122,175,177,180,181,191` (Stage values never listed; "stage" shared with release stages).
- `~/config/bmuz/SETUP-AND-CONVERT.md:11,13,18,19,34` · `DEVKIT.md:20` · `HOOKS.md:53,61,156,157,159,176` · `MODULE-CONTRACTS.md:10` · `BMUZ-PLAN.md:54` (PPP states: no Design, says Deliver).
- `~/config/bmuz/templates/TDD.md:55,61` · `templates/lookback.md:6` · `templates/checks.yml:10` · `release/README.md:4`, `github-pages.md:18`, `itch.md:27`.
- PPP: `templates/ppp/plan-reader.mjs:8-18` (no design state; 'deliver' label), `build-ppp.mjs:102,231,237,241,278-279` (no design colour).
- Scripts: `release.mjs:1,5,34,110,177,369` · `merge.mjs:1,8,12-13,75` · `checks-gate.mjs:1` · `live-check.mjs:1` · `musts-check.mjs:1` · `lib.mjs:102,171` · `save.mjs:183`.
- Hooks: `guard-git/_shared.mjs:74-84` (**deliverRan**), `GG5.merge-main.mjs:6-41`, `GG4.feature-on-main.mjs:7,8,24`, `GG3.branch-unmerged.mjs:39`, `plan-lint/PL6.needs-order.mjs:20` (state key 'deliver').
- `~/config/bmuz/checkup.sh:57` · `cleanup.sh:3` · `~/settings.json:9,187,219` · `evals/README.md:9-22`, `hooks/test-hooks.mjs` (10), `scripts/test-scripts.mjs` (9).
- `eng/README.md:3`, `eng/plugin/README.md:3` (4 stages) · `eng/plugin/pipelines/discover.json:4,168,177` ("bricks" — the F225 builder's wording pass).
- `fw/ROADMAP.md:724` (/deliver in an open Idea).

## (b) Entry and hand-over (8 rows) — daily skills → F226; engine → F225
- `~/skills/bmuz/SKILL.md:10` "STAGES (in order)" · `~/skills/discover/SKILL.md:25-26` hand-over promises the build plan in Define · `~/skills/define/SKILL.md:15,16-17,37-38` (explore-first / fast-track question; routing; hands to /sprint not Design) · `~/skills/gdd/SKILL.md:8` · `~/config/bmuz/SETUP-AND-CONVERT.md:10` · `templates/ppp/build-ppp.mjs:368` ("No GDD yet: /discover starts it").

## (c) F227 — Design and the build plan (24 rows)
- `~/CLAUDE.md:27` · `~/skills/bmuz/SKILL.md:13` · `~/skills/define/SKILL.md:12,26-30,33-35` · **`~/skills/define/stages/design.md` and `build-plan.md` (whole files → the Design stage)** · `stages/fast-track.md:11,14`.
- `~/skills/roadmap/SKILL.md:8,28` · `sprint/SKILL.md:10` · `gdd/SKILL.md:23,32` · `tdd/SKILL.md:35` · `proto/SKILL.md:221` · `multiplayer-setup/SKILL.md:71`.
- `~/config/bmuz/PROJECT-FILES.md:12-14` (owners: GDD = define + design, TDD + ROADMAP = design) · `MODULE-CONTRACTS.md:3,68` · `BMUZ-PLAN.md:48,69` · `templates/TDD.md:4` · **`templates/GDD.md:3` + layout (no Part 1 / Part 2 split; the engine writes "GDD Part 1")** · `HOOKS.md:59` + `GG13.stage-state.mjs:17` · `build-ppp.mjs:373` · `musts-check.mjs:10`.
- `fw/research/bmuz-vision/ARCHITECTURE.md:26,50` (fixed 2026-11-09) · `fw/ROADMAP.md:697` (💤 F64 starter choice → Design).

## (d) Fixed 2026-11-09
- `fw/research/bmuz-vision/VISION.md:45` V14 · `REBUILD-PLAN.md:8` ("four stages" of rollout reworded) and `:36` (/gdd /tdd /sketch → R8b) · R-row for F226 added · ARCHITECTURE Define/Design rows · `eng/plugin/hooks/engine.js:19` (the F225 builder: Design = F227, Release = F219).

## (e) Left as dated history
- `fw/ROADMAP.md:645` (Muzzy's quote) and ✅ items; `fw/STATE.md` log lines; `ARCHITECTURE.md:124`; `BMUZ-PLAN.md:59`; `~/config/bmuz/reviews/**`; `~/references/gmtk/*` (their define/build-plan ideas #6, #8, #10, #12 now map to Design); `~/skills/deliver/evals/results/**`; HUB.md has none.

## Remove (when the replacements exist)
1. `~/skills/define/stages/design.md` + `build-plan.md` → Design (F227).
2. `stages/fast-track.md` + define §1's "explore first or fast-track?" → the F225 opening.
3. Define §2 parts 2–3, §3's feature breakdown, §4's hand-off to /sprint.
4. "Double Diamond stage N" / diverge-converge headings in discover, define, develop, deliver.
5. Discover creating GDD.md.
6. `~/skills/deliver/` folder + skill name + eval prompts, once /release exists.

## Missing
1. `/design` and `/release` skills. 2. `design.json` / `release.json` pipelines and `craft/design-*`. 3. GDD template Part 1 / Part 2. 4. A Design state in ROADMAP states, the PPP (plan-reader, build-ppp hues) and BMUZ-PLAN:54 (📐 is Define's). 5. PROJECT-FILES' allowed STATE Stage values (discover/define/design/develop/release), kept apart from release stages (prototype/alpha/beta/1.0). 6. A route to the F225 opening in ~/.claude (CLAUDE.md line, a skill). 7. An R-row for F226 (added 2026-11-09). 8. ARCHITECTURE's Design row (added 2026-11-09). 9. Command counts ("13 BMUZ commands", checkup.sh list).
