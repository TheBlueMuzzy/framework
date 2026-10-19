# Sprint 07 — fragile jobs become one command: scripts that refuse instead of half-finishing
Started 2026-10-18 · Milestone v0.9 · Features: F69
Scripts live in `~/.claude/config/bmuz/scripts/` (plain Node, like the hooks) → laptop via /sync. Plan reader shared from `templates/ppp/plan-reader.mjs`.

## F69 🔧 Scripts for fragile procedures
Done when: installing a module, releasing, saving, archiving a sprint, the musts check and stopping servers are each one command that refuses with a plain-words reason instead of half-finishing; the skills say "run it; if it fails, read the message"; each script proven in throwaway repos + one real use.
- [x] 🤖 1. `scripts/install-module.mjs <module> <game>` — refuses when the module's own tests/checks are red in the framework; dry run, then the module's installer; then `check:framework --static --only <module>` in the game; prints the steps left
- [x] 🤖 2. `scripts/release.mjs <update|milestone|stage|major> [--dry-run]` — version bump per `references/versioning.md`, version.json history, package.json sync, commit `Release vX.Y.Z: …` + tag (no push — /deliver pushes after the smoke pass)
- [x] 🤖 3. `scripts/save.mjs "<summary>"` — build bump, STATE Log ≤10 (older → archive/log.md), commit, push; "safe to switch machines" only when the push really landed
- [x] 🤖 4. `scripts/archive-sprint.mjs` + `scripts/musts-check.mjs <stage>` (plan reader) — archive only a finished sprint; list open `must:<stage>` features
- [x] 🤖 5. `scripts/stop-servers.mjs [port|name]` (Windows: whole process tree) + a lock in `templates/check-all.mjs` (no second check run at once)
- [x] 🤖 6. Shrink /save, /deliver, /develop, /sprint, /play: "run it; if it fails, read the message"
- [x] 🤖 7. Prove it — `scripts/test-scripts.mjs` (throwaway repos) + one real use each; list in HOOKS.md
Check: `node ~/.claude/config/bmuz/scripts/test-scripts.mjs` all green + the real uses quoted in Notes.
Ask Muzzy: —

Notes:
- Decided (technical): scripts wrap the existing installers rather than replace them; they never push anything live.
- Decided: release.mjs lets uncommitted `.planning/` + `*.md` changes ride in the release commit (/deliver §5 is "one commit" with ROADMAP/STATE), refuses uncommitted code.
- Proof: test-scripts 49/49. Real uses: install-module ui-kit → Roll Better `--dry-run` (kit tests + check-ui green, 0.2.2 → 0.17.1 listed, Roll Better untouched) · release milestone `--dry-run` on the framework (0.10.0.0 → 0.11.0.0) · musts-check on Glyphtender (beta 18/18) · stop-servers on the UI kit's real Vite server — FIRST TRY MISSED IT (Windows `netstat -p TCP` lists IPv4 only; Vite listens on [::1]) → fixed, then it stopped the npm tree and the port went quiet; test now uses an IPv6-only server · this save went through save.mjs.
- Review (helper, 8 findings, all fixed): IPv6 ports (same as the real try) · archive-sprint half-finished on a never-committed SPRINT.md · save/release changed files before a step that could refuse (now put back; a refused commit no longer double-counts the build) · stop-servers could climb into an unrelated tree through a reused parent ID (parents must be older; cycle guard), a bare "node" matched MCP servers (refused; mcp/chrome protected), a port held by a non-server (refused) · install-module dropped installer flags · non-X.Y.Z versions · odd stage names. Found on the way: `git()` trims its output, so the first `git status` line lost a letter → `changedFiles()` reads `-z`. Hook false blocks found in use and fixed: `git add .planning` (the folder) counted as code; `sed -i` on a .md whose new text names a .mjs.
