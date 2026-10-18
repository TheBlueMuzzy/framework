# Sprint 05 — the computer enforces Muzzy's "never" rules and the checks (not Claude's memory)
Started 2026-10-18 · Milestone v0.9 · Features: F68
Plan: ~/.claude/config/bmuz/reviews/2026-10-18-reliability/PLAN.md (step 1). Everything lives in ~/.claude (scripts in
`~/.claude/config/bmuz/hooks/`, wiring in `~/.claude/settings.json` + skill frontmatter) → synced to the laptop by /sync.

## F68 🔧 BMUZ hooks
Done when: each hook blocks its "never" case and lets the normal case through — proven by a test script and one real try
each; Muzzy has read every hook in plain words (HOOKS.md) and OK'd it; the laptop has them after /sync.
- [x] 🤖 1. Spike: this Claude Code version can block a Bash/PowerShell command (PreToolUse deny) and a skill's frontmatter can register a Stop hook while it runs (`stop_hook_active` guard) — throwaway test, findings in Notes
- [ ] 🤖 2. Never-rules — `hooks/guard-git.sh` (PreToolUse, Bash + PowerShell): block `reset --hard`, force-push (`--force`, `-f`, `+ref`), deleting a branch that isn't fully merged (local `-D`, remote `--delete` / `:branch`); Claude in Chrome tools → `ask` rule; Gmail stays denied — `~/.claude/settings.json`
- [ ] 🤖 3. Commit gate — `hooks/commit-typecheck.sh`: `git commit` in a repo with tsconfig + staged .ts/.tsx → `npx tsc -b` (time limit); fails → blocked, errors in plain words
- [ ] 🤖 4. Live-branch gate — `hooks/live-push.sh`: push to the branch that deploys (deploy workflow's `on: push` branch) or `npm run deploy` / gh-pages → blocked when code changed since the commit in `.planning/smoke-pass` (docs / .planning only → allowed); /deliver writes the file after its smoke test — `skills/deliver/SKILL.md`, `config/bmuz/release/github-pages.md`
- [ ] 🤖 5. Stop gate in /develop — `hooks/stop-check-fast.sh` in `skills/develop/SKILL.md` frontmatter: runs `npm run check:fast` when code changed since the last green run (commit + diff hash kept in `.git/`), time limit, `stop_hook_active` guard, skips repos without check:fast
- [ ] 🤖 6. check-ui after edits — `hooks/check-ui-edit.sh` (PostToolUse Edit|Write on `src/ui/**`): `node src/ui/kit/check-ui.mjs <file>`, result fed back to Claude; quiet when the game has no kit
- [ ] 🤖 7. Prove it — `hooks/test-hooks.sh`: a block + an allow case per hook from fake tool JSON; one real try each in a scratch repo; write `config/bmuz/HOOKS.md` (each hook in plain words, how to switch one off); one line in CLAUDE.md "Undo" + PROJECT-FILES pointing at it
- [ ] 🙋 8. Read HOOKS.md and OK it → /sync so the laptop gets them
Check: `bash ~/.claude/config/bmuz/hooks/test-hooks.sh` all green + the real tries quoted in Notes.
Ask Muzzy: —
Notes:
- Muzzy's calls 2026-10-18: branch deletes → allowed only when already fully merged (nothing lost; /deliver's cleanup keeps working) · his Chrome → ask each time (not fully blocked) · live push → smoke pass first even for tiny code fixes on main; doc-only saves pass freely.
- Don't touch dev/framework/devkit/ or Goops — the Goops session's helper is building F59/F60 there (uncommitted devkit/kit/tuning/* files are its work). F61 starts when the Goops session says that work has landed.
- Spike (2026-10-18, Claude Code 2.1.303, headless `claude -p` in a scratch repo): a PreToolUse hook answering `permissionDecision: "deny"` stopped `git reset --hard` in **auto mode** (Claude saw "PreToolUse:Bash hook error: <reason>"); a skill's frontmatter `hooks: Stop:` ran at turn end after `/tstop` (lives for the rest of the session); `claude -p --settings <file>` loads that file's hooks → task 7 can prove each hook for real headlessly. Stdin has `cwd`, `tool_name`, `tool_input.command`, `permission_mode`. Stop: `stop_hook_active` guard, `{"decision":"block","reason"}`; Claude Code overrides after 8 blocks in a row.
