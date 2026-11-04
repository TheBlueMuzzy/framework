# Audit 2026-11 — every BMUZ rule, how often it fires, and what to do with it

F182 — Rule inventory + verdicts · sprint 55 · written 2026-11-04 by a helper while Muzzy slept.
**Every verdict here is PROPOSED — Muzzy approves.** Nothing was changed: no hook, config, skill or plan file. Only this page and four helper scripts in `tools/` are new.

Words used below:
- **Hook** = a small script Claude Code runs by itself before/after Claude acts. It can refuse an action or send Claude back.
- **Firing** = one time a hook spoke (refused, sent back, or added a note).
- **Real catch** = it stopped a real mistake. **False alarm** = it fired on something that was fine. **Noise** = right by the letter, but it cost Claude a retry ("a loop") and nothing bad would have happened.
- **①** a hook/script does it · **②** Claude's judgement, a hook checks it · **③** judgement only.

---

## 1. Summary

- **2,180 firings in 17 days** (Oct 18 – Nov 4): 53 sessions with Muzzy + 176 helper sessions. 736 refusals, 1,370 send-backs, 26 notes, 37 crashes.
- **4 rules make 70 % of all firings:** lint-on-edit 724 · "no backslash code through a heredoc" 369 · "end with the hand-off card" 220 · "don't pipe a check" 215.
- **About half of all firings (~1,100) were false alarms or noise.** Biggest: the pipe rule (96 % noise), the heredoc rule (~70 % false or noise), lint-on-edit (~45 % fired mid-edit, before Claude's next edit fixed it), and two commit gates that are ~95 % false because they read files *before* the same command line edits them.
- **Six fixes would remove ~1,000 needless loops** (§6). Top 3: let the pipe hook add `set -o pipefail` itself instead of refusing; let quoted `cat <<'EOF'` and sed patterns through; lint unused-variable errors at the end of the turn, not after every edit.
- **Two rules are broken and never fire:** the 80 % / 90 % context checkpoint (sessions auto-compact at ~60 % of the 1M window, so 80 % is never reached), and session start prints Goops' whole "Earlier notes" section (a bug — the heading contains the words "RESUME HERE").
- **Tonight one typo in hooks/lib.mjs turned off every hook for ~20 minutes, silently** (37 crashes logged). The new runner must fail loudly and keep the other rules running.
- **Prose read every session ≈ 38 KB (~9,500 tokens):** CLAUDE.md 20 KB + skill descriptions 13 KB + session start 2–48 KB. Proposed: CLAUDE.md → ~7.5 KB, session start → under 2 KB.
- **Speed:** most hooks take ~65 ms (mostly Node starting up). Slow ones: lint-on-edit ~1.9 s per code edit; guard-git ~0.7–0.9 s on a commit line; stop-plan-check 1.4 s on a long (42 MB) transcript.

---

## 2. The loudest rules (top 10 by firings)

Sample = firings I read in their transcripts (what Claude was actually doing). "Replay" = I re-fed every past refused command to today's hook.

| # | Rule (hook) | Fired / sessions | Real | False | Noise | How judged |
|---|---|---|---|---|---|---|
| 1 | **LE1** ESLint errors after an edit (lint-edit) | 724 / 124 | ~55 % | — | ~45 % | All 724: 326 were followed by another firing on the same file within 2 min (an import added before its use, "unused" until the next edit). Live tonight: 4 such firings on my own scripts, each fixed by the very next edit. |
| 2 | **GE3** no code with a backslash through heredoc / `python -c` / `sed -i` (guard-edits) | 369 / 174 | ~25 % | ~30 % | ~45 % | Replay of 365 (13 already allowed today) + auto-judge + 14 read by hand. False: 52 were `cat > file <<'EOF'` (a quoted heredoc keeps every byte — nothing can be mangled) or wrote a .md/.json. Noise: 135 were `sed` regex escapes like `\[` that were meant; 155 wrote throwaway files in the scratch folders. Real: Python/node string literals with backslashes writing real code (~90). |
| 3 | **HC1** end with the hand-off card (handoff-check) | 220 / 45 | ~55 % | 7 % | ~38 % | All 220 checked for "did the turn really work": 16 had only scratchpad writes or the word "commit" in a grep. 16 read by hand. ~97 had no card at all (Claude forgot — real); most others were format nits (heading used ":" not " — ", "Done" without colon). 38 were a 2nd/3rd send-back within 5 min. |
| 4 | **GE2** don't pipe a check into tail/grep (guard-edits) | 215 / 161 | 4 % | 0 | 96 % | Replay of 214 + auto-judge. Only 9 had `check \| tail && <next step>` (where a hidden failure matters). The other 204 piped a test to `tail` at the end of the step, so Claude read the pass/fail summary anyway. |
| 5 | **SP2** planner page rebuilt → republish it (stop-plan-check) | 90 / 26 | ~50 % | ~10 % | ~40 % | 12 read. Noise = mid-run progress turns republishing on every tick; false = the "published from a copy" case (fixed by F172). |
| 6 | **SP1** committed mid-sprint but SPRINT.md untouched (stop-plan-check) | 54 / 21 | ~30 % | ~50 % | ~20 % | 10 read (1 was a test). False: the commit belonged to a task already ticked, or was a `Fnn: done` / save commit — Claude explained "no new task line needed" each time. Also clashes with CLAUDE.md "small tweaks don't need a task". |
| 7 | **PL2** sprint feature not 🔨 in ROADMAP (plan-lint) | 48 / 22 | ~25 % | — | ~75 % | 8 read. Fires when SPRINT.md is written a moment before the ROADMAP edit (often on the same command line). A cross-file rule checked mid-edit. |
| 8 | **HC2** feature number without its name (handoff-check) | 42 / 20 | ~90 % | — | ~10 % | Read 5: real bare "F151"s. Cheap and wanted. |
| 9 | **GG13** stage commit without STATE.md (guard-git) | 39 / 20 | ~5 % | ~95 % | — | All 39: 37 edited STATE **on the same command line** before `git commit`; the hook reads the files before the line runs. |
| 10 | **HC3** sprint archived → report opens with "Sprint NN — goal" (handoff-check) | 28 / 17 | ~40 % | — | ~60 % | 10 read. Mostly turns whose news was something else (a release, the next sprint's plan) forced to lead with the old sprint's header. |

Next down: **GG8** "`F08: done` but ROADMAP isn't ✅" 24 (23 of 24 = same-line edit → false) · **SC1** check:fast red 23 (8 read: 4 real bugs, 3 timeouts while a screenshot run loaded the PC, 1 wrong folder — fixed tonight) · **PL3** task count 21 (real) · **SP4** done but not saved 19 (real) · **PL4** sprint feature not in ROADMAP 18 (mostly order-of-edits noise) · **CT1** type check failed 17 (real) · **PL1** Log trimmed 17 (an action, not a complaint).

**Rough cost:** each firing ≈ 100–150 tokens of message + 300–800 tokens of retry, and it then sits in the context for the rest of the session. ~2,180 × ~500 ≈ **1 M tokens over 17 days, about half for nothing.** (Rough — I didn't count tokens per firing.)

---

## 3. Full inventory

### 3a. Hooks — every rule inside them

Fired = count / sessions (history + tonight's live log). "—" = not sampled.

**guard-edits** (before every edit and shell command)

| ID | Rule | ① | Fired | False/noise | PROPOSED verdict |
|---|---|---|---|---|---|
| GE1 | Don't edit a game's copy of a framework module | ① | 2 / 2 | real | **keep** |
| GE2 | Don't pipe a check into tail/grep | ① | 215 / 161 | 96 % noise | **fix** — add `set -o pipefail;` to the command itself (PreToolUse can rewrite the input; check it works in this Claude Code version), refuse only `check \| x && commit/push` |
| GE3 | No backslash code through heredoc / `-c` / `sed -i` | ① | 369 / 174 | ~75 % | **fix** — let quoted `cat`/`tee <<'EOF'` through; sed only when the *replacement* has `\\`/`\n`; throwaway folders pass |
| GE4 | Stop servers with stop-servers.mjs | ① | 11 / 10 | real | **keep** |
| GE5 | No new folder/file straight in the home folder | ① | 0 | never fired | **keep** — cheap guard, the 1 GB pile-up hasn't come back |
| GE6 | Python writes code with `newline=''` | ① | 26 / 26 | mostly real (8 read) | **keep** |
| GE7 | Frozen file in the extraction queue → warning | ① | 1 / 1 | real | **keep** |
| GE8 | No backtick inside `node -e "…"` | ① | 1 / 1 | real (new) | **keep** |
| GE9 | No `npm install` while a server uses the folder | ① | 4 / 3 | real | **keep** (only hook that's slow here: 1.2 s, only on installs) |

**guard-git** (before shell commands) — commit rules marked ✎ should move into git's own commit hook (§6 fix 4)

| ID | Rule | Fired | False/noise | PROPOSED verdict |
|---|---|---|---|---|
| GG1 | Never `git reset --hard` | 1 / 1 | real | **keep** (rare = a good guard) |
| GG2 | Never force-push | 2 / 2 | real (1 was a test) | **keep** |
| GG3 | Don't delete an unmerged branch | 5 / 4 | 2 false (`origin/$b` — a shell loop variable read as a branch name) | **keep + fix** variable names |
| GG4 ✎ | No `F08:` code commit on main | 3 / 3 | 1 doubtful (".planning" called code) | **keep**, move to commit hook |
| GG5 | Only /deliver merges into main | 0 | never fired | **keep** (good guard, never needed) |
| GG6 ✎ | No secrets in a commit | 0 | never fired | **keep** (one leak = forever) |
| GG7 | No checkout/restore over uncommitted work | 5 / 5 | real | **keep** |
| GG8 ✎ | `F08: done` needs ✅ in ROADMAP | 24 / 16 | 96 % false (same-line edit) | **fix** → commit hook |
| GG9 ✎ | `F08: done` needs STATE changed | 1 | real | → commit hook |
| GG10 ✎ | `F08: done` needs Reviewed through / Last full check | 1 | real | → commit hook |
| GG11 ✎ | `F08: done` needs a `Checked:` line | 3 / 3 | real | → commit hook |
| GG12 ✎ | No `.claude/worktrees/` in a commit | 0 | never fired (save.mjs adds the ignore line first — ① already) | **keep** cheap |
| GG13 ✎ | Stage commit carries STATE.md | 39 / 20 | 95 % false (same-line edit) | **fix** → commit hook |

**commit-typecheck · live-push**

| ID | Rule | Fired | Verdict |
|---|---|---|---|
| CT1 | Type check before a commit with TS | 17 / 15 · real | **keep** → commit hook (sees the staged files) |
| CT2 | `Fix B014:` needs green check:fast | 0 | **keep** → commit hook |
| LP1 | Nothing goes live without a smoke pass | 11 / 8 · real (not sampled one by one; every message names a deploy) | **keep** |
| LP2 | No release with an open P0 | 0 | **keep** (good guard) |

**After an edit** (lint-edit, check-ui-edit, rule-kind, sketch-lint, plan-lint)

| ID | Rule | Fired | False/noise | Verdict |
|---|---|---|---|---|
| LE1 | ESLint errors in the edited file | 724 / 124 | ~45 % mid-edit noise | **fix** — at edit time only syntax errors + undefined names; the rest (unused, prefer-const…) once at the end of the turn for the turn's files |
| LE2 | No ESLint here → say `npm install` once | 2 / 2 | real | **keep** |
| CU1 | UI kit rules in the edited UI file | 15 / 7 | — (likely real) | **keep** |
| RK1 | A new rule line needs its ①②③ mark | 14 / 10 | real (all BMUZ sessions) | **keep** — the runner makes it a rule-file check (§8) |
| SL1 | Sketch keeps its kit parts | 0 | never fired | **keep** cheap; sketches came from the starter |
| PL1 | STATE Log past 10 → moved to archive | 17 / 10 | an action | **keep** |
| PL2 | Sprint feature not 🔨 in ROADMAP | 48 / 22 | ~75 % order-of-edits | **fix** — cross-file → end of turn |
| PL3 | 3–8 tasks per feature | 21 / 12 | real | **keep** |
| PL4 | Sprint feature not in ROADMAP | 18 / 9 | mostly order-of-edits | **fix** — end of turn |
| PL5 | ⏳ but all needs done → set 🟢 | 7 / 3 | real | **keep** (end of turn) |
| PL6 | Never build before what it needs | 6 / 2 | real | **keep** (end of turn) |
| PL7 | Log too long | 5 / 1 | before PL1 existed | **delete** (PL1 trims it) |
| PL8 | RESUME HERE length | 2 / 2 | real | **keep + widen** to Reviewed through (§7) |
| PL9 | Sprint feature has a `Check:` line | 1 | real | keep |
| PL10–16 | bug count · unique ids · task owner · Carried · graph · needs unreadable · tasks under a bug | 1–3 each | real | keep |
| PL17 | `F## <type> Name — description` | 0 | never fired (new 10-26) | keep |
| PL18 | Open feature inside a released milestone | 0 | never fired | keep |
| PL19 | Stray files in `.planning/` | 0 | never fired | keep |

**Turn end** (handoff-check, stop-plan-check, stop-check-fast, stop-unsaved, stop-cleanup)

| ID | Rule | Fired | False/noise | Verdict |
|---|---|---|---|---|
| HC1 | Hand-off card or progress line | 220 / 45 | 7 % false, ~38 % noise | **fix** — "work" = a real edit (not scratchpad/memory) or a real `git commit` command (lib's `commands()` parser, not a word search); split the format nits (say all at once, once) |
| HC2 | F## with its name | 42 / 20 | real | **keep** |
| HC3 | Sprint header first | 28 / 17 | ~60 % noise | **fix** — header must be present, not first; or only when the hand-off IS the sprint wrap-up |
| HC4 | "posted" time matches the clock | 6 / 6 | real | **keep** |
| HC5 | Try-it links answer | 1 | real | **keep** |
| HC6 | Screenshot for a visual change | 1 | real | **keep** |
| HC7 | Feel question for a built feature with a why | 0 | never fired | **keep** — check it can fire (needs a `why:` on the ROADMAP line; few have one) |
| HC8 | Never "your game" | 0 | never fired | **keep** cheap. Note: 11 non-BMUZ skills say "your game" in their own text ("Audit your game…"), which pulls the other way |
| HC9 | Decision answer has a Weighed block | 0 | new tonight | keep |
| SP1 | Mid-sprint commit → SPRINT line | 54 / 21 | ~50 % false | **fix** — count SPRINT.md as touched by any commit this turn (helpers' merges too); skip `done`/save/STATE commits and commits naming an already-ticked task; settle the "small tweaks need no task" clash |
| SP2 | Republish the planner | 90 / 26 | ~50 % | **fix** — only on hand-off-card turns, not progress turns |
| SP3 | Milestone → look-back with homes | 11 / 7 | real | **keep** |
| SP4 | `done` but not saved/pushed | 19 / 10 | real | **keep** |
| SP5 | Every sprint feature ✅ → archive | 9 / 5 | real | **keep** |
| SP6 | New content/ file → TDD mentions it | 0 | never fired | keep |
| SP7 | Sketch changed → publish it with the planner | 7 / 3 | real | keep |
| SP8 | Release tag → live-pass | 8 / 2 | real | keep |
| SC1 | check:fast green before hand-back | 23 / 13 | ~40 % timeouts on a busy PC | **fix** — skip/wait while a full check or screenshot run holds its lock |
| SC2 | check:fast too slow | 1 | real | keep |
| SU1 | Muzzy leaving → nothing unpushed | 0 | never fired | **keep** (the guard is why) |
| CL1 | Delete `.playwright-mcp/` (stop-cleanup) | silent | an action | keep |

**When Muzzy types / after commits** (session-moments)

| ID | Rule | Fired | Verdict |
|---|---|---|---|
| SM1 | Muzzy is stopping → /save | 2 / 2 | **keep** (stop-unsaved backs it) |
| SM2 | Context 80 % / 90 % → write it down, save | **0 — can't fire** | **fix** — sessions compact at ~600 K tokens = ~60 % on the status line (13 compactions seen, max status file 60 %). Use ~45 % / 55 %, or Claude Code's PreCompact event |
| SM3 | Decision question → the decision brief | 1 (new) | keep |

**Session start** (session-start.sh + producer-notes, live-ping, crash-news) — see §3e.

**Crashes:** 37 times a hook crashed. 30 were tonight 06:2x when `lib.mjs` had a syntax error (every hook imports it → every guard off, and Claude Code treats a crash as "allow"). 3 earlier ones in guard-edits (a typo, a missing function). **Verdict: fix in the runner** — a crashing rule is reported loudly and every other rule still runs.

### 3b. CLAUDE.md (global, read every session — 163 lines, 3,104 words, 20 KB ≈ 5,000 tokens)

12 dated Muzzy quotes (~2.2 KB of quoted text). Marks in the file: ① 4 · ② 12 · ③ 17.

| Section (words) | Rule | Mark | Also in | PROPOSED verdict |
|---|---|---|---|---|
| About Me (110) | artist, logic, readable code, minimal changes | ③ | — | **keep**, one line each |
| | Explain jargon the first time | ③ | — | keep (drop the date) |
| | Commands ready to copy/paste | ③ | — | keep |
| | Walkthroughs one step at a time | ③ | — | keep |
| Tech stack (25) | stacks | — | — | keep |
| Projects (51+) | project list | — | HUB.md | **merge** → pointer to HUB.md (the list goes stale) |
| | One project = one folder = one repo | ③ | HUB.md | keep one line |
| | `cd <project>` fuzzy | ③ | — | keep |
| BMUZ (657) | Command table | — | bmuz skill | keep (it's the menu; ~1.4 KB) |
| | Hands-off partner, next command | ③ | handoff.md | keep one line |
| | Time in discover/define well spent | ③ | define | **merge** → define skill |
| | Respect dependencies | ② | plan-lint PL6 | **delete** (hook says it) |
| | MDA co-designer | ③ | mda-analyze | keep one line |
| | Same intention → same motion | ③ | — | keep (move quote to a rule file) |
| | Breathing room in cards | ③ until F88 | develop, HOOKS | keep until F88's quality bars, then delete |
| | Keep Muzzy focused, log mid-feature bugs | ②③ | develop, bug, SP1 | keep one line |
| | Tweakables in content/ | ②/③ | PROJECT-FILES ×3, develop ×6, game-ui, tuning-setup, lint module | **make it ①** — install the lint module in every game, then delete |
| | Look/feel calls: default + Dev Kit tool | ③ | develop | keep |
| | Muzzy's engineering ideas, credit them | ③ | tdd | keep |
| | Obsidian edits: don't overwrite | ③ | OBSIDIAN.md | **make it a hook** (§5 #5) |
| | Specialist skills are yours | ③ | bmuz | keep |
| | Ideas → ROADMAP Ideas, read it back | ③ | 6 skills | **make it a hook** (§5 #2) |
| | Small tweaks don't need a task | ③ | — | **clash with SP1** — decide which wins |
| | Old GSD projects get converted | ③ | PROJECT-FILES, SETUP-AND-CONVERT | **delete** (pointer is there) |
| | Undo: rewind / git revert / never reset | ① | guard-git, HOOKS | **shrink** to "show what will be undone first" |
| Sync (130) | Machine to-do first | ① | session start | **shrink** — session start prints it |
| | Session start pull / SYNC FAILED | ① | session start | **delete** (the output says it) |
| | Session end → /save | ① | stop-unsaved, session-moments | **delete** |
| | Clone missing project | ③ | — | keep |
| | Auto-memory isn't synced | ③ | — | keep |
| Working style (541) | Delegate exploration | ③ | — | keep |
| | One branch per delivery | ② | guard-git, develop | **delete** |
| | Save early | ③ | save | merge |
| | A value Muzzy saved is a decision | ③ | — | keep (hook candidate §5 #8) |
| | "the game you played on <date>" | ② | HC8 | **delete** (hook) |
| | Questions numbered | ② | handoff.md, hook, develop, sprint, define, PROJECT-FILES | **shrink** to one pointer line |
| | Feature number with its name | ② | HC2, PL17, PROJECT-FILES, HOOKS | **shrink** to one pointer line |
| | Lists, not paragraphs | ③ | — | keep (hook candidate §5 #4) |
| | Hand-off card | ② | handoff.md, HC1, develop, lookback | **shrink** to one pointer line (it fires 220× — prevention is cheaper than a loop) |
| | Sprint report header | ② | HC3, PROJECT-FILES, develop | **delete** (hook + develop) |
| | Progress bar format | ② | handoff.md, HC1/HC4 | **shrink** to a pointer (format lives in the template) |
| Code quality (157) | Verify your work, screenshots | ② | HC6, develop ×7, game-ui ×7 | keep one line |
| | Finish for real | ③ | develop | keep |
| | Root causes | ③ | systematic-debugging | keep |
| | Check logic exists | ③ | — | keep |
| | R3F: no React state per frame | ②/③ | develop, r3f skill, lint rule | **make it ①** (lint module in every R3F game) |
| Plain English errors | ③ | many skills | keep |
| Autonomous mode (206) | Don't ask; Ask Muzzy lines | ③ | develop, sprint | keep |
| | One fresh helper per feature | ③ | develop | **merge** → develop |
| | Stuck after 3 tries → BLOCKED | ③ | 3-strike rule | **merge** with 3-strike; hook candidate §5 #6 |
| | Context checkpoint 80/90 % "auto-compact ~97 %" | ① | session-moments | **fix** — stale numbers, the hook can't fire (§3a SM2) |
| | Stop before public / hard-to-undo | ① partly | guard-git, live-push | keep one line |
| Problem-solving (30+) | 3-strike rule | ③ | — | keep short; hook candidate |
| | Reflection on mistakes → hook/check/line | ③ | lookback.md, SP3 | keep short; hook candidate §5 #7 |
| Self-review (411) | Why does it work this way | ③ | — | keep |
| | Every decision from every side | ①② | session-moments SM3, HC9 | **shrink** — the hooks carry the brief |
| | Real vs aesthetic problem | ③ | — | keep |
| | First-hand analysis | ③ | develop | keep |
| | Assess = report only | ③ | — | **make it a hook** (§5 #1) |
| | Push back softly | ③ | — | keep |
| | Lead on the technical side | ③ | — | keep |
| Versioning, gws (83+code), References, PC help | pointers | — | — | **move** the gws block to `references/gws.md`, keep 2 lines |

### 3c. BMUZ skills (read only when the skill runs)

Marks = how many ①/②/③ marks the file holds (marks, not lines).

| Skill | Size | ① | ② | ③ | PROPOSED verdict |
|---|---|---|---|---|---|
| develop | **111 lines, 36 KB** | 17 | 35 | 63 | **shrink ~30 %**: ~9 lines restate hooks (lines 32, 34, 35, 65, 66, 78, 80, 81, 111 — worktrees, cleanup, scratch, "enforced by hooks", lint, checks tiers, stop-servers, one check at a time, main via /deliver) → one pointer to HOOKS; split into stage files like /define |
| deliver | 69 lines, 12 KB | 11 | 13 | 15 | shrink the ① lines release.mjs already checks |
| sprint | 43 lines, 10 KB | 9 | 5 | 18 | ok; one-feature lines duplicate plan-lint |
| checkup | 55 lines, 6 KB | 9 | 3 | 12 | ok |
| bug | 55 lines, 6 KB | 3 | 5 | 9 | ok |
| define (+4 stages) | 39 + 71 lines | 1 | 8 | 11 | ok (the model to copy) |
| sketch | 39 lines, 6 KB | 3 | 5 | 6 | ok |
| play · roadmap · save · sync · ppp · tdd · gdd · discover · bmuz | 18–40 lines each | 0–6 | 0–5 | 1–9 | ok |
| game-ui · game-feel · mda-analyze | 126 / 177 / 56 lines | ~0 | 0 | ~1 | reference skills — fine |
| **Skill descriptions** (all skills, read every session) | **13 KB** | | | | trim the longest (game-ui 703 chars, game-feel 616, mda-analyze 525, sketch 515, bug 505) to ~300 |

### 3d. PROJECT-FILES, HOOKS, templates (read on demand)

| File | Size | ① ② ③ | PROPOSED verdict |
|---|---|---|---|
| PROJECT-FILES.md | 197 lines, 23.5 KB | 29 · 10 · 18 | keep as the plan-files spec; the ① lines that describe hooks become generated from the rule files (F184) |
| HOOKS.md | 101 lines, 27.8 KB | 54 · 1 · 1 | **generate it** from the rule files (id · what · why) — today it's a hand-kept copy of the code and already lags it |
| MODULE-CONTRACTS.md | 100 lines, 16 KB | 3 · 22 · 9 | keep (conformance checks are the ② backing) |
| DEVKIT.md · OBSIDIAN.md · SETUP-AND-CONVERT.md | 59 / 34 / 40 lines | ~0 | keep |
| templates/handoff.md | 31 lines | 1 · 1 · 1 | **keep — it is the source** (handoff-check reads its labels) |
| templates/lookback.md | 49 lines | 2 · 4 · 3 | keep (SP3 checks it) |
| BMUZ-PLAN.md | 83 lines, 26 KB | — | keep (read only in BMUZ sessions); the "Lessons from Roll Better" list is all "→ applied" — **archive it** |

### 3e. Session start (read every session)

Measured with `source=compact` (no pull): **framework 16.9 KB · Goops 47.8 KB · Glyphtender 2.1 KB.**

| Part | Size now | PROPOSED verdict |
|---|---|---|
| Checkup due · global setup behind · machine to-do · sync / SYNC FAILED / newer branch · branch + dirty | ~1 line each | **keep** (all ①, all short) |
| Framework updates available | 1 line | keep |
| RESUME HERE — framework | 4 KB entry + **12.5 KB "Reviewed through:" line** (a growing "· before: …" chain back through sprint 53, 54…) | **cut** — Reviewed through / Last full check / Security reviewed are gate data for guard-git, not reading; keep only the latest commit (≤ 200 chars) and move history to archive/log.md; plan-lint caps it |
| RESUME HERE — Goops | **~45 KB "Earlier notes" printed by mistake** — the awk stops at the next `## ` heading *unless* it contains "RESUME HERE", and Goops' heading is "Earlier notes (moved out of RESUME HERE 2026-10-23…)" | **fix the bug** (match `^## ▶ RESUME HERE` exactly), and plan-lint caps each RESUME entry |
| Where we are | 3 lines | keep |
| Producer notes · live down · crash news · Ask Muzzy | 0–4 lines | keep |
| Target | | **under 2 KB** in every project |

---

## 4. Duplicates — rules stated in several places

The one home each should keep is **bold**.

| Rule | Stated in | Keep in |
|---|---|---|
| Hand-off card | CLAUDE.md ×2, HOOKS #7, develop §4, lookback.md | **templates/handoff.md + HC1**; CLAUDE.md one pointer |
| Progress line + posted time | CLAUDE.md, handoff.md, HOOKS | **handoff.md + HC1/HC4** |
| Questions numbered | CLAUDE.md, handoff.md, HOOKS, develop, sprint, define/design, PROJECT-FILES | **handoff.md + hook** |
| F## with its name | CLAUDE.md, PROJECT-FILES, HOOKS ×2, plan-lint, handoff-check | **hook rules HC2 + PL17** |
| Sprint report header | CLAUDE.md, PROJECT-FILES, develop, handoff-check | **HC3** |
| Undo / git "never" | CLAUDE.md, HOOKS #1/#17, guard-git | **guard-git** |
| Screenshot for visual work | CLAUDE.md ×4, PROJECT-FILES ×2, HOOKS, handoff.md, develop ×7, game-ui ×7 | **HC6 + game-ui** |
| Tweakables in content/ | CLAUDE.md ×2, PROJECT-FILES ×3, develop ×6, game-ui ×11, tuning-setup, lint module | **lint module** (installed everywhere) |
| No React state per frame | CLAUDE.md, develop, r3f-best-practices, lint rule | **lint rule** |
| Ideas → ROADMAP Ideas | CLAUDE.md, define, develop, discover, gdd, save, sprint | **one rule file** (§5 #2) |
| Context checkpoint | CLAUDE.md (stale numbers), session-moments | **SM2** |
| Machine to-do / sync at start / save at end | CLAUDE.md, HUB.md, session-start, stop-unsaved | **the hooks** |
| One branch per delivery, main via /deliver | CLAUDE.md, develop, deliver, guard-git | **guard-git** |
| Approved → ✅ in ROADMAP | develop, PROJECT-FILES, guard-git GG8 | **GG8** (in the commit hook) |
| Hook rules restated as prose | develop ~9 lines, deliver, HOOKS.md (all 31 rows) | **the rule files**; HOOKS.md generated |
| Project list | CLAUDE.md, HUB.md | **HUB.md** |
| One helper per feature | CLAUDE.md, develop | **develop** |

**Clash, not a duplicate:** CLAUDE.md "small tweaks and fixes don't need a task" vs SP1 "every commit mid-sprint needs a SPRINT line". One of them must give.

---

## 5. ③ rules that could become hooks (ranked by value)

| # | Rule today (③) | Hook sketch (trigger → check) | Value |
|---|---|---|---|
| 1 | "Assess / analyze / tell me what's going on" = report only | UserPromptSubmit spots the words → sets a flag for this turn; PreToolUse refuses Edit/Write outside the scratch folders, `git commit` and publishing until Muzzy's next message | High — Muzzy had to correct it (2026-11-01) |
| 2 | Ideas → ROADMAP Ideas, read the line back | PostToolUse on a ROADMAP edit: a new line under "## Ideas" has a date and is really in the file (re-read; CRLF-safe). Stop: the message says "Noted in the roadmap's Ideas" but no such line landed this turn → send back | High — an idea was lost (sprint 23) |
| 3 | Questions numbered — outside hand-off cards too | Stop: two or more lines ending in "?" in a list, not numbered → send back | Medium |
| 4 | Lists, not paragraphs | Stop: a paragraph over ~80 words outside code → **log-only first** (measure false alarms before it ever sends back) | Medium (Muzzy's "I blindly trust you" risk); test first |
| 5 | Don't overwrite Muzzy's Obsidian edits | PreToolUse Write (whole-file) on a .md with uncommitted changes Claude didn't make this session → refuse, use Edit | Medium — losing his words is bad |
| 6 | 3-strike rule / "stuck after 3 tries" | PostToolUse: the same refusal or the same failing command 3× in a row in one session → note "This approach isn't working. Reassessing." | Medium, cheap |
| 7 | Lesson → its home in the same session | Stop: the message says "Lesson → <file>" but that file didn't change this turn → send back | Medium, cheap |
| 8 | A value Muzzy saved is a decision | PreToolUse Edit on content/*.json lines Muzzy changed (Dev Kit save / his commit) in the last N days → warning, not refusal | Low-medium |
| 9 | Tweakables in content/ · no React state per frame (games without the lint module) | Not a new hook: **make the lint module part of every game** (installer default) → ① | High — removes a ③ and 2 duplicates |
| 10 | Breathing room / fixed-size cards | Already planned: F88 quality bars in check:framework | (planned) |

Stays ③ (no hook can judge it): explain jargon · one step at a time · MDA thinking · same intention → same motion (until a motion catalog exists) · first-hand analysis · real vs aesthetic · push back softly · lead on the technical side · plain-English errors · delegate exploration · root causes · look/feel defaults.

---

## 6. Fixes for false alarms (ranked by loops saved)

| # | Fix | Loops saved (of 17 days) |
|---|---|---|
| 1 | **LE1 lint-on-edit:** at edit time report only syntax errors and undefined names; unused / prefer-const etc. once at turn end for the files edited this turn. Also saves ~1.9 s per edit on most edits | ~330 |
| 2 | **GE3 heredoc:** let quoted `cat`/`tee … <<'EOF'` through (the shell keeps every byte); sed only when the replacement holds `\\` or `\n`; writes into `.scratch`/scratchpad/Temp pass | ~260 |
| 3 | **GE2 pipe:** instead of refusing, add `set -o pipefail;` to the command (PreToolUse `updatedInput` — verify on this Claude Code version first); keep refusing `check \| tail && git commit/push` | ~205 |
| 4 | **Commit gates → git's own `commit-msg` hook** (one global `core.hooksPath` running the same rule files): GG4, GG6, GG8–GG13, CT1, CT2 see the real staged files at the real moment, so "edit then commit on one line" works, and save.mjs/release.mjs commits are covered without the `guardCommit` copy. guard-git then also refuses `--no-verify` | ~63 (+ removes a whole special case) |
| 5 | **plan-lint cross-file rules** (PL2, PL4, PL5, PL6, graph) → checked at turn end; same-file format rules stay at edit time | ~50 |
| 6 | **SP2 republish:** only on hand-off-card turns, not progress turns | ~40 |
| 7 | **SP1 sprint line:** SPRINT.md counts as touched by any commit this turn (helpers' merges too); skip done / save / STATE-only commits | ~38 |
| 8 | **HC3 sprint header:** present anywhere near the top, not necessarily first | ~17 |
| 9 | **HC1 "did work":** ignore scratchpad / .scratch / memory writes; "commit" = a real git commit command (lib `commands()`), not the word in a grep | ~16 |
| 10 | **SC1 check:fast:** wait or skip while a full check / screenshot run holds its lock | ~10 |
| 11 | **SM2 context checkpoint:** thresholds where sessions really compact (~45 % / 55 % of the 1M window), or PreCompact | makes a dead rule work |
| 12 | **Session start awk bug** (Goops) and **Reviewed through** chain (framework) | −45 KB / −12 KB per session |
| 13 | **GG3:** don't read a shell variable (`origin/$b`) as a branch name | 2 |
| 14 | **Crash = loud:** a hook that crashes is reported and the others still run (the runner, §8) | tonight's 20 silent minutes |

---

## 7. Slim CLAUDE.md + session start (outline, not a rewrite)

**CLAUDE.md — before ~20 KB (163 lines, ~5,000 tokens) → after ~7.5 KB (~70 lines, ~1,900 tokens), −60 %.**
- Keep: About Me (short) · tech stack · "projects: see HUB.md" + cd rule · the BMUZ command table · ~20 ③ judgement rules, **one line each, no dates or quotes** · pointer lines for the ② rules that fire most (hand-off card + progress line → `templates/handoff.md`; F## with names; numbered questions) · References.
- Move out: every dated quote and "why" → the rule's own file (F184 — Hook rule runner: each rule file holds id · what · why/quote) · gws details → `references/gws.md` · GSD conversion, sync mechanics, undo mechanics, sprint header, "your game", branch rules → their hooks/skills.
- Rule of thumb for what stays: a CLAUDE.md line costs ~40 tokens in *every* session; a firing costs ~500. A line that prevents more than one firing every ~12 sessions earns its place — so frequent ② rules keep a one-line pointer, rare ones live only in their hook.

**Session start — before 2–48 KB → after under 2 KB.**
- Must stay: sync result (and SYNC FAILED / NEWER WORK) · branch + uncommitted count · machine to-do · checkup due / setup behind · framework updates · RESUME HERE (capped) · Where we are · producer notes · live down · crash news · Ask Muzzy.
- Cut: the Goops "Earlier notes" (awk bug) · the "Reviewed through · before: …" chain · Last full check / Security reviewed details (gate data — guard-git reads them; Claude doesn't need them at start).
- New plan-lint caps: RESUME HERE ≤ ~1,500 chars per entry, Reviewed through ≤ 200 chars (one commit), older history → archive/log.md (the PL1 mechanism already exists).

---

## 8. Proposed rule list for F184 — Hook rule runner

One runner per event (`runner.mjs <event>`) loads every `rules/<id>.mjs`; each file = `{ id, event, matcher, what, why (quote + date), on, mode: block | warn | log-only, check(), tests: { fires: [...], passes: [...] } }`. One Node start per event instead of 4–5. A rule that throws is reported and skipped; the rest still run. HOOKS.md and the /checkup firing table are generated from these files. The false-alarm commands found here (in the scratch replay files) become each rule's "passes" tests.

**PreToolUse — Bash / PowerShell**
- `git.no-reset-hard` · `git.no-force-push` · `git.no-delete-unmerged` · `git.no-discard-uncommitted` · `git.main-via-deliver` (merge, merge.mjs, rollback.mjs) · `git.no-verify-refused` (new — protects the commit hook)
- `shell.pipefail` (rewrite, not refuse) · `shell.no-backslash-code` (narrowed) · `shell.no-backtick-dq` · `shell.python-newline` · `shell.stop-servers-script` · `shell.no-home-clutter` · `shell.npm-install-busy`
- `live.smoke-pass` · `live.no-open-p0`
- `mode.report-only` (new, §5 #1)

**PreToolUse — Edit / Write**
- `edit.no-kit-copy` · `edit.frozen-warn` (warn) · `edit.no-home-clutter` · `edit.no-overwrite-human-changes` (new, §5 #5) · `edit.muzzy-value-warn` (new, warn, §5 #8) · `mode.report-only`

**git commit-msg / pre-commit** (new home, same runner via `core.hooksPath`)
- `commit.typecheck` · `commit.fix-needs-green` · `commit.no-secrets` · `commit.no-worktrees` · `commit.no-feature-code-on-main` · `commit.done-roadmap` · `commit.done-state` · `commit.done-reviewed-fullcheck` · `commit.done-checked-line` · `commit.stage-has-state`

**PostToolUse — Edit / Write**
- `lint.syntax-now` (split from lint-edit) · `ui.check-ui` · `sketch.kit-parts` · `rules.kind-marked` · `plan.same-file` (task count, owner, Check: line, unique ids, name format, bug count, RESUME + Reviewed-through length, stray files) · `plan.log-trim` (action) · `plan.rebuild-ppp` (action) · `roadmap.idea-landed` (new, §5 #2)

**PostToolUse — Bash**
- `moments.context-checkpoint` (on commits) · `moments.three-strikes` (new, §5 #6)

**Stop**
- `card.format` · `card.links-answer` · `card.screenshot` · `card.feel-question` · `card.sprint-header` · `card.posted-time` · `card.weighed` · `text.no-your-game` · `text.feature-names` · `text.questions-numbered` (new, §5 #3) · `text.lists-not-paragraphs` (new, log-only)
- `lint.turn-files` (moved from edit time) · `plan.cross-file` (moved) · `plan.sprint-line` (narrowed) · `plan.ppp-published` (card turns only) · `plan.lookback` · `plan.done-saved` · `plan.sprint-archive` · `plan.tdd-content` · `plan.sketch-published` · `release.live-pass` · `check.fast-green` · `save.before-leaving` · `lesson.landed` (new, §5 #7) · `cleanup.playwright` (action)

**UserPromptSubmit**
- `moments.stopping` · `moments.decision-brief` · `moments.context-checkpoint` · `mode.report-only-flag` (new)

**SessionStart**
- `start.checkup-due` · `start.setup-behind` · `start.machine-todo` · `start.sync` · `start.branch` · `start.framework-updates` · `start.resume-here` (capped, bug fixed) · `start.producer` · `start.live-down` · `start.crash-news` · `start.ask-muzzy`

---

## 9. How I measured, and the limits

**Helper scripts** (`.planning/research/audit-2026-11/tools/`, re-runnable):
- `rules-fired.mjs` — maps each firing's words to a rule ID (the `RULES` table), prints count / sessions / dates; `sample <id> [n] [seed]` shows what Claude was doing (refused command, or the turn's prompt, tools, last words, next step); `turnwork <id>` checks whether a Stop firing's turn really did work; `unmatched` lists firings no pattern caught.
- `rules-replay.mjs <id> <hook.mjs>` — re-feeds every past refused command to today's hook; still refused / allowed now / time per call. Writes the cases to `~/Documents/dev/.scratch/framework-audit-rules/` (past commands are transcript data; the framework repo is public, so they stay out of it).
- `rules-judge.mjs pipe|heredoc` — rough auto-judging of those replays (heuristics written in its header).
- `rules-speed.mjs [runs] [transcript]` — times each hook with ordinary inputs (BMUZ_FIRE_LOG pointed away from the real log).

**Commands run:** `node rules-fired.mjs` · `node rules-fired.mjs sample <id> 8–16` for GE2, GE3, GE6, HC1, HC3, SP1, SP2, PL2, GG8, GG13, SC1 · `node rules-fired.mjs turnwork HC1.card-missing` · `node rules-replay.mjs GE2.pipe-check guard-edits.mjs` (and GE3, GG8, GG13 with guard-git.mjs) · `node rules-judge.mjs pipe|heredoc` · `node rules-speed.mjs 3 <42 MB and 2.5 MB transcript copies>` · session start run in 3 projects with `{"source":"compact"}` and `BMUZ_NO_PULL=1`, measured with `wc`.

**Limits — read before trusting a number:**
- The history (hook-history.mjs) only sees transcripts still on disk, keeps only the first 300 characters of each answer, can't see "ask" answers, and tells some PreToolUse hooks apart by their wording. A Stop answer listing several problems counts once per rule that shows in those 300 characters.
- **Sample sizes are small:** 8–16 read by hand per noisy rule; GE2 and GE3 judged on all ~570 replays by heuristics that I spot-checked on 14 each; LE1 judged only by "another firing on the same file within 2 min". Treat real / false / noise as ±15 %.
- Replays run today's hook against today's files, so a rule that also reads the repo (guard-git) can't be replayed fairly — for GG8/GG13 I judged from the command text (edit on the same line before the commit).
- "Sessions" counts transcript files, so a helper is its own session. Test sessions from the hook "real tries" (projects named spike, push, force, bed, main, stop) are in the counts — about a dozen firings.
- Hooks for one event run side by side, so a turn waits for the slowest, not the sum. Times are from this PC with other work running; stop-check-fast wasn't timed (it runs check:fast, minutes, by design).
- Running session-start.sh to measure it added 2 producer-notes lines to the live firing log (`~/.claude/logs/bmuz-hooks.jsonl`, 06:58 UTC). They're mine, not a real session.
- Firing counts are not prevention counts: a rule that never fired may be a good guard that is never needed (force-push, secrets, merge into main) — I judged those case by case.

---

## 10. Claude's review of this report (main session, 2026-11-04)
Checked first-hand: the session-start awk line (it matches any heading containing "RESUME HERE") and Goops' STATE heading "Earlier notes (moved out of RESUME HERE…)" · the 12.5 KB "Reviewed through" line in the framework STATE · session-moments' `LEVELS = [90, 80]`. All match.
- **Already fixed tonight (a bug, allowed in the freeze):** session start prints only a heading that *starts* with RESUME HERE — Goops' banner went from ~48 KB to ~1.7 KB, RESUME HERE and Where we are still shown (~/.claude-config 1c149d7).
- **Fix 4 (commit gates in git's own hook): careful with "global".** `core.hooksPath` set globally would also run in repos that aren't Muzzy's (collabs/joust-because is Sherman Meredith's). Proposed: set it per BMUZ project (the installer / save.mjs adds it), never globally.
- **Fix 3 (pipefail by rewriting the command):** depends on Claude Code letting a hook change the command (`updatedInput`). F184 — Hook rule runner's first task proves it on this version; if it can't, the rule narrows to `check | x && commit/push` instead.
- **CLAUDE.md shrink:** every line there was asked for by Muzzy. Nothing is lost — the quotes move into the rule files beside the code that enforces them — but which lines leave CLAUDE.md is his call (F185 — Slimmed rule set).
- **One decision only Muzzy can make:** "small tweaks don't need a task" (CLAUDE.md) vs SP1 "every mid-sprint commit needs a SPRINT line". My pick: the tweak rule wins — SP1 only asks when the commit names a sprint feature (Fnn) — because a sprint line for a typo fix is ceremony, and the firing log showed SP1 ~50 % false.
- **Order for the rebuild:** the runner (F184 — Hook rule runner) first, with the fail-loudly rule, then the false-alarm fixes as its first rules — they remove ~1,000 loops, the biggest win on this page.

**Muzzy decided (2026-11-04):** (1) "your pick" — the tweak rule wins: SP1 only asks for a SPRINT line when a commit names a sprint feature (Fnn) → F185 — Slimmed rule set. (2) "yes" — the commit checks move into git's own commit hook, set per BMUZ project, never globally → F184 — Hook rule runner.
