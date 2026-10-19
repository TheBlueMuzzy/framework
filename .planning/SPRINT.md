# Sprint 08 — BMUZ tests its own skills, and every game's planner shows whether its framework pieces are healthy
Started 2026-10-19 · Milestone v0.9 · Features: F71, F66
Skill tests live with the skills in `~/.claude/` (→ laptop via /sync); the health row is `templates/ppp/build-ppp.mjs` + the Dev Kit's `check-framework.mjs` (framework code → `dev/conformance`).

## F71 🔧 Skill tests (evals)
Done when: a small suite of cases runs the key BMUZ skills in a throwaway game and scores what they did; a deliberately broken skill makes its case fail; /checkup offers the run after skill edits or a model update (Muzzy's call A).
- [x] 🤖 1. Spike — `claude plugin eval` against the BMUZ skills (skills dir in place, or a thin plugin wrapper): case + grader format, sandbox, what one case costs → Notes
- [ ] 🤖 2. Fixture game — a tiny throwaway game the cases copy fresh (plan files, SPRINT, version.json, a git remote, room for the Dev Kit)
- [ ] 🤖 3. Cases (~2 per key skill): /save safe only after a real push · /sprint 3–8 tasks per feature with real files · /develop ends with the card · Dev Kit install runs install-module + wires main.tsx · /bug writes a P0–P3 report · /deliver reads the musts
- [ ] 🤖 4. Graders — script checks first (file changed, commit made, card present); a Claude-judged grader only where needed
- [ ] 🤖 5. Runner + when — /checkup offers "test the skills" after skill edits or a model update, Muzzy says yes (A); results page linked
- [ ] 🤖 6. Prove it — a full run; one skill broken on purpose → its case fails
Check: the suite's report all green, and red for the broken skill.
Ask Muzzy: —

## F66 🔧 Framework health row on the planner
Done when: every game's planner page has a "Framework" row — each module's version vs the framework's newest, and the last check:framework result with its date.
- [x] 🤖 1. `check-framework.mjs` writes `e2e-shots/framework.json` (per module pass/fail, date, commit) — Dev Kit on dev/conformance
- [ ] 🤖 2. `build-ppp.mjs` draws the Framework row (versions vs newest, last results, how long ago)
- [ ] 🤖 3. Prove it on copies of Goops + Glyphtender (games untouched), shots at phone + desktop
- [ ] 🙋 4. Muzzy looks at the row on a planner
Check: the row shows on both copies at 390 and 1440 wide, versions match the VERSION files.
Ask Muzzy: —

Notes:
- F71 spike (2026-10-19, Claude Code 2.1.303): cases live in each skill's folder (`~/.claude/skills/<skill>/evals/<case>/` — prompt.md + case.yaml + setup.sh + graders/*.md); run `claude plugin eval ~/.claude/skills/<skill> --runs 1 --ablation none --scaffold --trust-plugin --allow-tools Write Edit --max-cost-usd 2`. Graders: regex (on a file or the last message), tool_used, tool_order, file_exists — free; llm costs. No "run a script" grader. **One case ≈ $0.17–0.27, 37–76 s.** The setup script runs under Git Bash fine. **But Bash/PowerShell inside a case is refused on plain Windows (needs a WSL2 Linux — the PC has WSL2 switched on but no Linux installed)** → git commit/push cases (/save, /develop, installs) can't run here yet. Each run is sealed: no CLAUDE.md, no hooks, no ~/.claude/config — so a skill must state the formats it writes itself. FIRST FINDING: /sprint wrote tasks "🤖 1 Spike" (no dot — it copied the chat view's example, since PROJECT-FILES.md isn't in the sandbox) → the sprint skill now spells the file's task line; the case went 0.75 → 1.00. Results folders stay out of the laptop sync (config-sync NOISE).
- Muzzy 2026-10-19 (cost of skill tests): **A** — run only when skills change or the model updates, and only when he says yes in /checkup.
