# BMUZ — the written record (what it is, how it got here)
Compiled 2026-11-08 from the files only (no proposals). Paths: `~` = `C:/Users/Muzzy`. `cfg` = `~/.claude/config/bmuz`. `fw` = `~/Documents/dev/framework/.planning`.
Everything below is first-hand from the files unless marked *(from a doc, not re-measured)*.

---

## 1. INVENTORY

### 1a. Always-loaded prose
| Part | Size | Where | Notes |
|---|---|---|---|
| Global CLAUDE.md | 99 lines (slimmed 2026-11-04 in F185 from 163 lines / 20 KB) | `~/.claude/CLAUDE.md` | One line per rule, each marked ①②③. Holds the command table, About Me, Working Style, Autonomous Mode, Skeptical Self-Review. |
| claude-md-why.md | 166 lines | `~/.claude/references/claude-md-why.md` | Word-for-word copy of the pre-slim CLAUDE.md with dated Muzzy quotes (line 2: "Saved word for word on 2026-11-04 when CLAUDE.md was slimmed (F185)"). |
| Skill descriptions | ~13 KB for all skills *(audit rules.md §3c)* | each SKILL.md frontmatter | Read every session. |
| Session-start output | 2–48 KB per project before the fix; target <2 KB *(rules.md §3e)* | `cfg/session-start.sh` (156 lines) + `hooks/producer-notes.mjs` (111), `live-ping.mjs` (45), `crash-news.mjs` (71), `scripts/templates-check.mjs` (109) | Prints sync result, branch, machine to-do, checkup due, Ask Muzzy lines, RESUME HERE, producer notes, live-down, crash news, stale templates, framework updates. |

### 1b. Skills (`~/.claude/skills/`) — 41 folders
**BMUZ command skills (16)** — chars of SKILL.md + stage files:
| Skill | Size | What it does |
|---|---|---|
| bmuz | 2.8 KB | Prints the 13-command menu + one suggested next command. |
| discover | 4.7 KB (+1 stage file) | Stage 1: explore wide, start project if missing. |
| define | 12.7 KB (+4 stage files: define, design, build-plan, fast-track) | Stage 2: gap walk, GDD/TDD/ROADMAP feature map. Audit called it "the model to copy" (rules.md §3c). |
| develop | **35.5 KB, 107 lines** | Stage 3: line up, do tasks, prove, hand off. ~45 bullets of accumulated lessons (e2e craft, helper briefs, ports, fonts, Linux paths…). Audit: 17 ① / 35 ② / 63 ③ marks; "shrink ~30%" proposed (rules.md §3c). |
| deliver | 12.1 KB | Stage 4: release kind, records, merge.mjs, release.mjs, platform recipe, live-check, look-back. |
| sprint | 10.4 KB | Show sprint / plan next one. |
| save | 4.5 KB | STATE update + `save.mjs`. |
| ppp | 2.6 KB | Rebuild + republish planner artifact. |
| roadmap 3.5 KB · gdd 2.7 KB · tdd 3.1 KB | views | |
| play 3.9 KB · sketch 6.2 KB · bug 5.6 KB | tools | |
| checkup | 6.9 KB | Monthly BMUZ health check; `checkup.sh --done`. |
| sync | 2.5 KB | `config-sync.sh status/push`, machine to-do. |
- Evals: develop, deliver, sprint, save, bug each have `evals/` with case.yaml + graders + 2026-10-19 results (F71; "~$1.40 a run", needs WSL2 — `fw/ROADMAP.md` v0.9 F71; recipe `cfg/evals/README.md`).

**Specialist/reference skills (Muzzy-authored or adapted):** accessibility-check, ai-opponent, audio-setup, externalize-text, game-economy, game-feel, game-ui (126 lines), live-playtest, localize, mda-analyze, multiplayer-setup, optimize, organize-assets, proto, save-system, tuning-setup, pds (Muzzy's work slide decks — not games).
**Borrowed (copied/adapted, tracked in `cfg/sources.json`):** vite, vitest, verification-before-completion, systematic-debugging (obra/superpowers), web-design-guidelines (vercel-labs), r3f-best-practices, three-best-practices (upstream unknown), game-feel/audio-setup/optimize adapted from gamedev-skills.
**`skills/synced/`** — 230 files / 5.4k lines under one UUID-named folder (not examined further).

### 1c. Hooks (`cfg/hooks/`) — 15 hook groups, **97 rule ids** in 97 rule files (+10 `_` helper files, 15 `_hook.mjs` order files)
Architecture since F184 (2026-11-04): each `settings.json`-registered hook file is a 4-line starter → `runner.mjs` (210 lines) → loads `rules/<hook>/<ID>.<name>.mjs`; shared `lib.mjs` (623 lines); `fallback/broken.mjs` answers if lib/runner break (refuses before tool calls) (`cfg/HOOKS.md` lines 7–23). Every answer logged to `~/.claude/logs/bmuz-hooks.jsonl` (F181). Tests: `test-hooks.mjs` (2,166 lines, "~830 cases", HOOKS.md line 13).
| Group (event) | Rules | Examples |
|---|---|---|
| guard-git (PreToolUse shell) | 17 | GG1 no reset --hard, GG2 no force-push, GG5 main only via /deliver, GG8–GG11 `F08: done` gates, GG14 no --no-verify, GG15 `Replaces:` line |
| guard-edits (PreToolUse shell+edit) | 12 | GE1 no editing a module copy, GE2 auto-adds pipefail, GE3 no backslash code via heredoc, GE10 report-only mode, GE11 three-strikes note |
| commit-typecheck | 2 | CT1 tsc before commit, CT2 `Fix B…` needs green suite |
| live-push | 4 | LP1 smoke-pass before anything live, LP2 no open P0 |
| plan-lint (PostToolUse on plan files) | 31 | PL1 log trim, PL3 3–8 tasks, PL6 needs-first, PL17 feature-name format, PL31 rebuild planner |
| check-ui-edit · lint-edit · rule-kind · sketch-lint | 1 · 3 · 2 · 1 | CU1 kit rules, LE1 lint syntax, RK1 new rule line needs ①②③ |
| session-moments (UserPromptSubmit + after commits) | 5 | SM2 context checkpoint, SM3 decision brief, SM4 report-only flag, SM5 wording slips next turn |
| handoff-check (Stop) | 15 | HC1 hand-off card, HC2 F## with name, HC9 Weighed block, HC10 wake-up armed, HC14 paragraphs (log-only) |
| stop-plan-check (Stop) | 10 | SP1 sprint line, SP2 republish planner, SP3 look-back, SP5 archive sprint |
| stop-check-fast · stop-unsaved · stop-cleanup (Stop) | 2 · 1 · 1 | SC1 check:fast green, SU1 save before leaving, CL1 delete .playwright-mcp |
- Modes in rule files: 84 block · 8 warn · 4 action · 1 log. 17 marked `rare: true`. 0 switched off.
- Also: git's own `commit-msg` hook (`cfg/git-hooks/`, 15 files) set per BMUZ project via `core.hooksPath` (HOOKS.md lines 25–29); PreCompact backs up STATE.md; 7 hand-written session-start items S1–S7 (HOOKS.md "Not rule files").
- **Count discrepancy:** `fw/research/2026-11-08-exe-process.md` finding 3 says "BMUZ has **102** hook rule files (none off)"; counting `id:` lines today gives 97 (104 table rows in HOOKS.md incl. S1–S7).

### 1d. Scripts (`cfg/scripts/`, ①, "a whole multi-step job the same way every time — or refuses before changing anything", HOOKS.md "Scripts")
| Script | Lines | Does |
|---|---|---|
| release.mjs | 369 | All /deliver gates at once, version bump, notes, commit + tag (never pushes) |
| merge.mjs | 75 | Push branch → GitHub green → merge --no-ff into main |
| live-check.mjs | 171 | Waits for deploy, fetches live page, writes `.planning/live-pass` |
| rollback.mjs | 59 | Revert to a tag as one new commit |
| save.mjs | 221 | cleanup, gitignore lines, build+1, log trim, commit, push, "safe" only once GitHub has it |
| archive-sprint.mjs | 51 | Files sprint, refuses without 3-line retro |
| install-module.mjs | 163 | Install/update a framework module + its checks in a game |
| extract.mjs | 356 | Extraction queue add/list/status/fix/swap (--rehearse) |
| musts-check 20 · checks-gate 16 · release-check 126 · deps-check 221 · crash-maps 50 · notes 121 | | release-side helpers |
| stop-servers.mjs | 71 | Kill a server's whole process tree |
| removal-pass.mjs | 97 | Monthly cut proposals from firing log |
| hook-history.mjs 145 · hooks-doc.mjs 46 | | Rebuild firing history from transcripts; regenerate HOOKS.md table |
| templates-check.mjs | 109 | Names a game's stale template copies |
| test-scripts.mjs 1,895 · test-skills.mjs 75 · test-config-sync.sh 93 | | Test suites |
| lib.mjs | 525 | Shared (incl. `guardCommit` so script commits get commit rules) |
- Root-level bash: `session-start.sh` 156, `config-sync.sh` 110, `checkup.sh` 139, `cleanup.sh` 108; `~/.claude-config/setup.sh` 136.

### 1e. Templates (`cfg/templates/`)
GDD.md 46 · TDD.md 90 · handoff.md 37 (source of truth for HC1 labels) · lookback.md 49 · release-check.md 18 · TEMPLATES.md 40 (version list) · check-all.mjs 175 · ports.mjs 151 · shots.mjs 256 · slow-tests.mjs 34 · checks.yml 128 · check-permissions.sh 20 · `ppp/` (build-ppp.mjs 429, plan-reader.mjs 128, framework-words.mjs 121) · `sketch/sketch-starter.html`. Game copies carry a `template: <name> <N>` line (F203).

### 1f. Rules/spec files (`cfg/`)
BMUZ-PLAN.md 83 lines/26 KB (mission, framework decisions, vision, open threads, Roll Better lessons list) · PROJECT-FILES.md 199 lines (plan-file layout + planning model + checks tiers + PPP + extraction queue) · HOOKS.md 207 lines (mostly generated) · MODULE-CONTRACTS.md 103 · DEVKIT.md 59 · OBSIDIAN.md 34 · SETUP-AND-CONVERT.md 40 · `release/` (README, github-pages.md, itch.md) · `reviews/` (10 dated research/audit folders, 2026-09-28 → 2026-10-19) · `version.json` → `"BMUZ" 0.3.1, "Game dev toolkit for non-coders…", "author": "MuzzyMade", "license": "MIT", "repository": "https://github.com/MuzzyMade/BMUZ"` (last touched 2026-10-04 — not tracking current releases; framework is at 0.43.0).

### 1g. Per-project plan files (in every game)
`.planning/` GDD, TDD, ROADMAP, SPRINT, BUGS, STATE (+ design/ research/ bugs/ archive/), `version.json`, `content/`, `CHANGELOG.md`, `.planning/smoke-pass`, `live-pass`, `ppp.html` (PROJECT-FILES "Layout"). Plan-lint enforces the shapes.

### 1h. Sync
`~/.claude-config` git repo (285 commits; first 2026-03-08) mirrors `~/.claude` (CLAUDE.md, skills, config/bmuz, references, settings.json, HUB.md, statusline). `config-sync.sh status/push`; `setup.sh` copies repo → `~/.claude` and keeps locally changed files (F176). Projects sync via session-start pull + save.mjs push. Auto-memory not synced (CLAUDE.md).

### 1i. The framework (bricks BMUZ lays down) — `~/Documents/dev/framework`
12 modules at STATE: rooms 0.15.0 · table 0.8.2 · UI kit 0.43.1 · Dev Kit 0.31.0 · crashes 0.3.0 · audio 0.5.0 · saves 0.9.0 · version 0.3.0 · ai 0.9.0 · lint 0.4.1 · tutorial 0.1.1 (+ emotes, proposed archive) and `starters/turn-based` (`fw/STATE.md` "Where we are"). ~46k code + ~29k test lines; only Glyphtender (10 bricks) and Goops (4) use it *(fw/research/audit-2026-11/framework.md §1, 2026-11-04)*. BMUZ work is planned in the framework's ROADMAP ("One session for BMUZ + the framework", `fw/STATE.md` Key facts).

### 1j. Personal to Muzzy vs generic
**Hard-wired to Muzzy (would break or not make sense for another user):**
- Name "Muzzy" throughout: 39 times in PROJECT-FILES + CLAUDE.md; 147 across the 16 BMUZ skills (develop 25, sprint 21, define 18, deliver 16…). Hook messages and rule `why:` fields quote him by date.
- Machines/users: PC = `Muzzy`, laptop = `joebr` parsed by session-start.sh line 26 and HUB.md "📌 Machine to-do" sections; `C:\Users\Muzzy\Desktop\PC-Help\` in CLAUDE.md.
- Accounts: GitHub `TheBlueMuzzy` (SETUP-AND-CONVERT step 6 `gh repo create TheBlueMuzzy/<folder>`), gws accounts joebrogno/muzzymade (references/gws.md), his Cloudflare (crash servers, rooms), the claude.ai artifact planner links, "Gmail stays fully blocked".
- Paths: `~/Documents/dev/{games,apps,framework,research,collabs}` layout, `dev/.scratch`, `dev/HUB.md`, Obsidian vault = `Documents/dev`. Files with these strings: BMUZ-PLAN, config-sync.sh, evals/README, test-hooks.mjs, OBSIDIAN, release/github-pages + itch, session-start.sh, SETUP-AND-CONVERT.
- Preferences encoded as hard rules: hand-off card shape (HC1), "never 'your game'" (HC8), F## with name (HC2), posted clock time (HC4), numbered questions (HC12), Weighed block (HC9), report-only words (SM4/GE10), "Lists not paragraphs" (HC14), Windows/PowerShell specifics (GE4, GE6, GE9), Glyphtender/Goops-derived lessons in develop.
- Tech stack assumptions: React + TS + Vite + R3F web games, GitHub Pages, PartyServer/Cloudflare, Playwright e2e, npm scripts `check:fast/check:full/check:framework/smoke`.
- Framework-coupled: extraction queue is "Muzzy only" (PROJECT-FILES); install-module assumes the framework checkout at `dev/framework`; session start compares game VERSION files to that checkout.
**Mostly generic:** Double Diamond stage/verbs structure; plan-file model (release → milestone → feature → task, states, needs, scope); release gates (smoke pass, no P0, musts, patch notes, licences); git safety rules (GG1–GG3, GG6, GG7); hook runner + firing log; checks tiers; module contracts concept.

---

## 2. DETERMINISTIC VS JUDGEMENT TODAY

The system's own marking: ① a script or hook does it · ② Claude's judgement, refused/sent back until on record · ③ judgement only (PROJECT-FILES line 3; F80).

**Run by programs (①, Claude only invokes):**
- Releasing: release.mjs (all gates checked first, version, notes, CHANGELOG, tag), merge.mjs, live-check.mjs, rollback.mjs, release-check.mjs, deps-check.mjs, crash maps.
- Saving: save.mjs (commit, push, "safe" only after GitHub has it); archive-sprint.mjs (refuses without retro).
- Installs/extraction: install-module.mjs, extract.mjs.
- Session start: sync pull, banner, producer notes, live ping, crash news, stale templates, framework updates.
- Hook "actions" that do the work themselves: PL1 log trim, PL31 planner rebuild, GE2 pipefail rewrite, CL1 cleanup.
- Check templates in games (check-all.mjs locks + port pre-flight), GitHub checks.yml on every push.

**Left to Claude reading prose (③), with the step order itself in skill text:**
- The ORDER of every stage — which step comes next in /discover → /define → /develop → /deliver — lives in SKILL.md prose. exe-process.md finding 2: "in BMUZ, Claude holds it (skill text) and hooks only catch slips afterwards."
- Routing plain English to a command; deciding to start a helper; writing helper briefs (develop §2 lines 46–58 are all ③ "brief content"); task order; diverge/variants; MDA diagnosis; test craft (develop §3, ~15 ③ e2e lessons); "is it really complete?" (develop §3 line 91: "③ (that IS the judgement)"); asking good questions; tone rules (jargon, one step at a time, plain-English errors).
- Audit counted in develop alone 63 ③ marks vs 17 ① (rules.md §3c).

**Policed after the fact by hooks (②):**
- Before an action: commits (`F08: done` needs ROADMAP ✅, STATE changed, Reviewed through + Last full check, Checked: line; stage commits need STATE; no feature code on main; typecheck; secrets), merges into main only in /deliver, going live needs a smoke pass and no P0, edits to module copies refused, report-only turns.
- After an edit: plan-file shape (31 plan-lint rules), lint, UI kit rules, rule-kind marks.
- At turn end (Stop, send-back up to 3×): hand-off card format, links answer, screenshot for visual change, feel question, Weighed block, feature names, numbered questions, wake-up armed, lessons/ideas actually landed, sprint line, planner republished, look-back, done→saved, sprint archived, check:fast green, nothing unpushed when leaving.
- Wording slips are no longer sent back, only passed to the next turn (SM5, 2026-11-06).

---

## 3. TIMELINE OF DIRECTION SHIFTS

| When | Version / sprint | Shift | Why (cite) |
|---|---|---|---|
| 2026-03-08 → 03-15 | pre-BMUZ (claude-config) | Global config + sync; CLAUDE.md slimmed 160 → 70 lines once already (2026-03-12 "Slim CLAUDE.md from 160 to 70 lines"); 3-strike + Skeptical Self-Review rules added; BMAD archived | `~/.claude-config` git log |
| 2026-09-27/28 | **BMUZ-2** | "Double Diamond workflow replaces BMUZ 1 + GSD"; GSD retired ("npm package is dead; its job is now /roadmap + /sprint + /develop"); 13 skills + game-designer agent retired; VISION folded into ROADMAP Ideas | claude-config log 2026-09-28; `~/.claude-config/RETIRED.txt` lines 1–5 |
| 2026-09-28 | BMUZ-PLAN vision | The long-term heart becomes a **Game Framework** of modules; skill library review; first module = UI kit, built in the framework repo, not in a game | BMUZ-PLAN "The vision" + "Order of work" 1, 1b |
| 2026-10-03 | Standards + process review | Top problem: "Muzzy repeated UI rules he'd already given"; fix was "mostly more checklist lines, which kept growing" | `cfg/reviews/2026-10-18-reliability/PLAN.md` lines 4–6 (describing the 10-03 review) |
| 2026-10-04 | BMUZ 0.3.1, framework v0.4 | Mission/framework decisions: structure modules not mechanics modules; Table foundation; "rebuild Glyphtender, then Roll Better, underneath" as the proving plan; check tiers Fast/Area/Full | BMUZ-PLAN lines 14–22; claude-config log 2026-10-04 "BMUZ 0.3.1: check tiers" |
| **2026-10-18** | framework v0.9, sprint 05 (F68–F73) | **Prose → hooks.** Reliability review: "make BMUZ behave like an editable EXE"; verdict "Direction right… mechanism wrong: almost every 'must' is prose. An EXE = the ORDER of steps and the GATES are code". Before: "2 hooks… neither can block anything; ~40 lesson lines in /develop". Plan item 3 already named "saved Workflows for multi-agent steps". Hand-off card made mandatory (F73) | `reviews/2026-10-18-reliability/PLAN.md` lines 1–3, 17–21, 29–34; ROADMAP v0.9 goal line 140; BMUZ-PLAN line 8 "Consistency comes from code, not prose" (Muzzy 2026-10-18) |
| 2026-10-18/19 | sprint 06–07 (F67, F69, F74) | Lesson audit → ~45 hook candidates; fragile jobs → scripts ("the skills shrink to 'run it; if it fails, read the message'"); self-improving look-back loop at each milestone | ROADMAP v0.9 F67, F69, F74 |
| **2026-10-19** | sprint 12 (F80) | **"Everything triggers"**: every skill line sorted ① / ② / ③ / ✗; "only runs when it remembers is a bad thing" | ROADMAP v0.9 F80; `reviews/2026-10-19-triggers/AUDIT.md`; PROJECT-FILES line 3 |
| 2026-10-19 | v0.10 (F81–F108) | **"A whole studio around one designer"**: producer, QA, release-engineer routines by trigger; Saves module built from a research list | BMUZ-PLAN line 9; ROADMAP v0.10 goal line 185 |
| 2026-10-19 | sprint 13 retro | "Claude leads on the technical side… be critical, not just obedient" | sprint-13.md retro; claude-md-why.md line 210 |
| 2026-10-20 | framework policy | "build the framework as solid as possible BEFORE putting it into a game" — later flagged as letting "the framework run far ahead of the games" (being revisited by F183) | `fw/STATE.md` Key facts |
| 2026-10-23/24 | v0.13 (F114) | Game ↔ framework sessions message each other; extraction queue (later found "used once: X01 queued and withdrawn the same day") | PROJECT-FILES "Game ↔ framework sessions"; framework.md §3 |
| 2026-10-24 → 11-03 | v0.14–v0.36 (~23 milestones in 10 days) | Rapid small milestones, many about checks/sync/release reliability: "Checks you can trust", "Steadier checks", "Releases that don't need babysitting", "Checks that don't cry wolf", "A sync that knows its own work" | ROADMAP headings lines 264–522 |
| **2026-11-04** | v0.37 "A lean, measured BMUZ" (F181–F189), sprints 55–59 | **Measure, then cut.** Muzzy: "this can't happen. we definitely need to avoid the inner-platform effect"; feature freeze + games paused; firing log; rule + framework audits; hook rule runner (one file per rule); CLAUDE.md 20 KB → slim; ~52k framework lines removed (F186); bloat test both ways (`Replaces:` line); module recipe | ROADMAP v0.37 lines 530–561; `fw/STATE.md` "Freeze LIFTED 2026-11-06"; security note "F186 — Slimmed framework: ~52k lines removed" |
| 2026-11-04 | decision rules | "Every decision from every side" → Weighed block (HC9/SM3); "Engineering calls are Claude's"; "One session for BMUZ + the framework" | claude-md-why.md line 205; `fw/STATE.md` Key facts |
| 2026-11-06 → 11-07 | v0.38–v0.42 | Freeze lifted; back to modules games share (tutorial, test helpers) and check stability | ROADMAP lines 562–643 |
| **2026-11-08** | after sprint 66 | **Open question: BMUZ as "a smart, flexible exe"** — who holds the step list. Findings: industry = program holds the list and calls the AI; BMUZ = Claude holds it in prose; "Hooks are alarms, not drivers — keep them few" (Claude Code docs: "if you ever find yourself at forty of them, most are probably preferences"); Claude Code Workflows as a candidate. Recommendation (not decided): deliver v0.42 → F211 hooks tested before push → Workflow trial for auto mode → hook diet. "Nothing decided yet." | `fw/research/2026-11-08-exe-process.md`; `fw/STATE.md` RESUME HERE |

Note: the 2026-10-18 PLAN already named the same target ("An EXE = the ORDER of steps and the GATES are code") that the 2026-11-08 research says is still unmet for the ORDER half ("the step list stayed in skill text (Workflows weren't in the toolbox)", exe-process.md "Weighed").

---

## 4. RECURRING FAILURES

| Problem | Occurrences / fixes | Cite |
|---|---|---|
| **The "consistency" conversation itself** | 2026-10-03 review (fix: more checklist lines) → 2026-10-18 ("I feel like I've had this consistency conversation with you before") → 2026-10-19 F80 → 2026-11-04 v0.37 → 2026-11-08 exe research | reliability PLAN.md lines 3–6; exe-process.md |
| **Rules added as prose, then needing to become code** | BMUZ-PLAN: "The same mistake twice = it must move up the list"; CLAUDE.md slimmed twice (2026-03-12 160→70 lines; 2026-11-04 163 lines/20 KB → 99 lines); develop skill grew to 35.5 KB with lessons; audit found the hand-off card rule stated in 5 places, screenshots rule in ~20 places | claude-config log; rules.md §4 |
| **Helpers / main chat going silent or waiting with nothing to wake them** | Sprint 26: helper 80 min no commit · Glyphtender helper idle 2 h (2026-10-29) · Goops sprint 31: 45+ min silent · sprint 56: helper idle ~10 h (→ HC10) · sprint 66: helper hung, main sat ~5 h ("the wake-up rule only fired on the word 'waiting'") → HC10 tightened + 20-min cap | sprint-26/56/66 retros; develop SKILL.md line 52; exe-process.md "Trigger" |
| **Muzzy typing /develop repeatedly** because "Next:" showed a command while helpers worked | 5 times during F168 (2026-10-30) | handoff.md "Never put one there while helpers are still working"; sprint-50 retro |
| **Hooks crying wolf / loops** | Audit: ~1,100 of 2,180 firings false or noise in 17 days; ~1 M tokens "about half for nothing"; then fixes for GE2, GE3, LE1, SP1, SP2, PL2, GG8, GG13, HC1, HC3, SC1 in F185; still SM5 added 2026-11-06 because wording send-backs showed Muzzy duplicates ("it's been happening forever") | rules.md §1–§2, §6; HOOKS.md SM5 |
| **Hook rules that couldn't fire** | SM2 context checkpoint at 80/90% never reached (compact ~60%); HC7 feel question never fired | rules.md §1, §3a |
| **Hooks silently off** | 2026-11-04: one typo in lib.mjs turned off every hook ~20 min (37 crashes) → fallback/broken.mjs | rules.md §1, §3a "Crashes"; sprint-55 retro |
| **Hook set pushed red to both machines** | sprint 66: "a helper pushed while 9 tests were red"; `config-sync.sh push` runs no hook tests (→ proposed F211) | exe-process.md finding 6 |
| **Sync wiping/blocking local work** | F176 setup.sh wiped an unpushed hook fix (sprint 51); F180 status mistook own pushes for incoming | ROADMAP v0.33 F176, v0.36 F180; sprint-51 retro |
| **Waiting on tests** | Muzzy 2026-11-08: "i feel like i'm mostly just waiting on tests" (three full ~830-case runs for a one-rule change); earlier Goops sprint 32 helper's serial e2e list "going for 1h 3m" | HOOKS.md line 13–14; develop SKILL.md line 51 |
| **Checks red on a busy PC / two runs at once** | Goops 2026-10-19 two check:fast runs broke each other; F79 check lock; sprint 50 every run red under another chat's sims; F171 busy-PC rerun; F178 check:fast lock; sprint 51/52 own background runs turned check:fast red; SC1 ~40% timeouts | HOOKS.md SC1; ROADMAP v0.34/v0.35; sprint-50/51/52 retros |
| **Fixed-time waits / flaky e2e** | Goops wall-clock flake "in 5 sprints (18, 20, 21, 23, B004)"; sprint 31, 53 fixed-timing tests; F170 starter online race seen 4×, F207 again in sprint 66 | ROADMAP Ideas 2026-10-29; sprint-31/53 retros; v0.34 F170; v0.42 F207 |
| **Windows-vs-Linux (GitHub) differences** | Sprint 32 path rules; sprint 40 fonts twice; sprint 41 pixel rounding at 2 AM | retros 32, 40, 41 |
| **A fix not covering every copy** | Sprint 28 selector in 3 places; sprint 37 "a missed copy of the sprint-31 fix" ("the rule exists; this copy slipped past it") | retros 28, 37 |
| **Planning from stale ideas / old notes** | Sprint 35 offered a feature F110 already built; sprint 36 old note out of date; sprint 65 F206 re-planned F190's finished work | retros 35, 36, 65 |
| **Claiming something is true without checking** | Sprint 22/23 "logged in Ideas" but never was (→ HC11); Glyphtender sprint 29 Select lists "complete" (14 wrong + ~40 missing); sprint 63 "Text tab is live" — wasn't | retros 23, 63; develop SKILL.md line 91 |
| **Reviews finding real holes after "done"** | Sprints 17, 19 (4 holes), 20 (3), 21, 22, 24, 25, 30, 47 | retros |
| **Code review tool returning empty in seconds** | Goops sprint 25; framework sprints 63–64 | develop SKILL.md line 112; sprint-64 retro |
| **Module installed but not wired** | Goops got the Dev Kit "with none of its hooks although DEVKIT.md said how" (2026-10-18) → MODULE-CONTRACTS + conformance pack | BMUZ-PLAN line 8; MODULE-CONTRACTS lines 6–7 |
| **Games falling behind the framework** | Roll Better 2 kit versions behind (2026-09-29); Glyphtender jumped UI kit 0.20.1 → 0.38.0; UI kit 114 version bumps in 37 days; F77 update notice; F203 stale templates | BMUZ-PLAN line 68; framework.md §1 |
| **Framework running ahead of games** | Saves built from a research list, not a game; Emotes used by no game; extraction queue used once | framework.md §1–§3; `fw/STATE.md` F183 note |
| **Same-line edit + commit fooling gates** | GG8 96% false, GG13 95% false; earlier sprint 16 "refused an edit + commit on one line a third time" → moved into git's commit-msg hook | rules.md §3a; sprint-16 retro |
| **Plan-file edits missing their anchor (CRLF)** | sprint 23 idea lost → HC11 | claude-md-why.md line 148 |

---

## 5. STATED VISION (quotes)

- **Mission (BMUZ-PLAN line 4, agreed 2026-10-04):** "BMUZ lets anyone make good games fast with Claude: the person designs, Claude builds — filling the knowledge gaps, keeping the process invisible, asking only real design choices, and laying down proven modules as foundation bricks so every game starts further ahead. Muzzy builds it and improves it; one day he shares it with friends."
- **BMUZ vs framework (line 5–6):** "BMUZ = the AI-builder guide (process): knows what to do when the designer doesn't, and makes sure architecture, testing, release and quality happen without being asked." · "Framework = the bricks BMUZ lays down… Like PlayTable's platform: modules made it easy for others to build games on it."
- **What it is not (line 7):** "a rulebook the designer must remember · a home for every lesson… · a speculative library (one game proves a module, a second makes it general) · game-specific design · Claude's internal hygiene · meetings."
- **Consistency (line 8, Muzzy 2026-10-18):** "consistency seems to be the issue" → "Consistency comes from code, not prose… A non-engineer can't judge architecture, so BMUZ must verify itself."
- **Studio (line 9, Muzzy 2026-10-19):** "If a real indie studio would do something, we should too… simulate having a full team of checks and SOPs… as automated as possible because the people who use BMUZ (me) won't KNOW what to do… guides the designer as if they are part of a bigger team that fills all the gaps…"
- **Triggers (PROJECT-FILES line 3):** "'only runs when it remembers' is a bad thing. 'always runs because it triggers' is much more solid."
- **Bloat test (line 10, Muzzy 2026-11-04):** "sometimes we add things that facilitate removing other things. Removing things has to happen for a reason — we're improving and consolidating, and targeting efficiencies."
- **Flexible guide (line 11, 2026-10-09):** BMUZ "suggests the ideal order… but never walls the designer in… How strict depends on the designer's goal (just prototyping vs. heading to a real release) — ask it."
- **The vision (line 31–32):** "BMUZ is Muzzy's way to build games fast as a designer/artist who's only somewhat technical: he designs, Claude builds, and the process stays mostly invisible. The long-term heart of it is a Game Framework… Starting a new game, Claude reads the GDD, infers the modules it needs… Muzzy is only asked about genuine choices."
- **EXE (reliability PLAN.md line 3, 2026-10-18):** "I need to believe you'll do the right things at the right times. I want you to work like an EXE in some regards — except editable and malleable."
- **Launcher, not OS (claude-md-why.md line 205):** "BMUZ is a layer on top of Claude (Muzzy: 'like a phone's launcher vs the base OS') — so this runs as hooks, not memory."
- **Hand-off (handoff.md line 2, 2026-10-18):** "I never want to see it any other way going forward! BMUZ standardizes the experience of designing as a non-technical person."
- **v0.37 goal (ROADMAP line 531, 2026-11-04):** "this can't happen. we definitely need to avoid the inner-platform effect" — "every BMUZ rule earns its place and is enforced by code where it can be (a 'smart exe' — Muzzy)".
- **2026-11-08 question (exe-process.md line 3):** "when I ask you to manage a process, that process is, at its core, an explicitly repeatable list of things + a critical thinking layer that deviates/improves/performs efficiencies when applicable… how are these huge companies using AI to code so much and produce a repeatable process?" — weighed goal phrase: "the program is the exe, Claude is the flexible part inside it."
- **Packaging signal:** `cfg/version.json` names BMUZ "Game dev toolkit for non-coders. Design, build, and ship games with AI.", MIT, `github.com/MuzzyMade/BMUZ` (not current: 0.3.1, 2026-10-04). Parked: "META PROJECT for much later: a multi-game shell" (BMUZ-PLAN line 27).
- **Not found in the record:** any written requirement for other users who cannot modify BMUZ (the brief's "core usable by people who can't modify it"); the closest are "one day he shares it with friends" (line 4) and "anyone" in the mission. Every current rule assumes the user can edit `~/.claude` and that Claude self-edits BMUZ (lesson loop, RK1, look-backs).
