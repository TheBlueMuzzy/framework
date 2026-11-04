# Sprint 54 — A sync that knows its own work
Started 2026-11-03 · Milestone v0.36 · Features: F180

## F180 🔧 Sync knows its own pushes
Done when: config-sync status / push don't call this machine's own commits (made straight in ~/.claude-config) "incoming", while a commit the laptop made still blocks the push — proven on two fake machines.
- [x] 🤖 1. Measure today: a fake machine commits straight in its repo → status says INCOMING, push refused — ~/.claude/config/bmuz/scripts/test-config-sync.sh
- [x] 🤖 2. Tests red first: own direct commit → not incoming + push works; the laptop's real change → still incoming — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [x] 🤖 3. unapplied() counts a commit as this machine's own when git's reflog says it was made here AND its synced files match here (line endings aside) — ~/.claude/config/bmuz/config-sync.sh
- [x] 🤖 4. The real sync quiet on this PC; push to ~/.claude-config — ~/.claude/config/bmuz/config-sync.sh
Check: the sync suite red then green; the real status on this PC lists no false INCOMING.
Checked: 2026-11-03 — on the old script the fake PC's own direct commit → INCOMING + push refused; fixed: config-sync suite 16/16 (the 3 new F180 cases + every older "never push over the laptop" case). The real status on this PC: only this machine's 3 changed files, no INCOMING; pushed (a9178f4), status quiet after. Fresh reviewer: no bugs — the laptop's commits are never in this machine's reflog as "commit", so they always stay incoming; rebases / cherry-picks stay incoming too (safe, just not auto-cleared).

## Notes
- Review note (F180, not a bug): NOISE's `/skills/synced/` has a leading slash, so it never matches a repo path — harmless while those files aren't in the repo (it could only block a push, never skip a change).
- Open bugs: none open in the framework.
- F180 measured 2026-11-03: on the old script a fake PC's own direct commit ("pc direct") → "INCOMING … 9fe954c pc direct" and the push → NOT-APPLIED. (A first run looked green on that line only because the harness was cut off at 120 s before printing it — the suite took ~112 s alone; its limit is now 300 s, with the reason.)
- Claude's call (F180): "made here" comes from git's own reflog ("commit" entries) — a pull's fast-forward isn't one, so the laptop's commits never count as ours. Its files must also match this machine's copies; a repo-only file (setup.sh, README) only needs "made here".
