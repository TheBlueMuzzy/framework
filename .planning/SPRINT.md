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
- [ ] 🤖 7. Prove it — `scripts/test-scripts.mjs` (throwaway repos) + one real use each; list in HOOKS.md
Check: `node ~/.claude/config/bmuz/scripts/test-scripts.mjs` all green + the real uses quoted in Notes.
Ask Muzzy: —

Notes:
- Decided (technical): scripts wrap the existing installers rather than replace them; they never push anything live.
