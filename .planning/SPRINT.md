# Sprint 47 — Clocks you can trust
Started 2026-10-27 · Milestone v0.29 Clocks you can trust · Features: F157
Muzzy 2026-10-27 (/deliver v0.28): picked "clock lint rule" as the next milestone.
What changes: code that takes a clock option (`now`) and also reads the real clock (`Date.now()`) in some other spot becomes a lint error, in the framework's own modules and in games that take lint 0.3.0. What stays the same: how every game plays; a default value (`now = () => Date.now()`) or a fallback (`options.now?.() ?? Date.now()`) is fine. Not in this sprint: games installing it (hand-offs go to ROADMAP Ideas).

## F157 🔧 Clock lint rule
Done when: bmuz/own-clock in lint/kit/rules.mjs refuses a bare `Date.now()` in code that takes a `now` clock option (default values and `??` fallbacks pass; `// clock-ok: <why>` for real ones), with a RuleTester test red on bad code — and red on saves' old loadLinkCode; the framework's root lint runs it on every module, finds fixed or marked; install-module adds it to a game (lint 0.3.0) and the starter has it with check:full green.
- [ ] 🤖 1. Measure first: a draft rule run read-only over every framework module (ai, audio, emotes, saves… — the ones taking `now`) and over Roll Better, Goops and Glyphtender; list the finds in Notes, and decide the rule's reach (same function, or the whole file) from them — lint/kit/rules.mjs
- [ ] 🤖 2. The rule: bmuz/own-clock, `// clock-ok: <why>`, RuleTester cases (bad code red; defaults and `??` fallbacks green; saves' pre-bbb0988 loadLinkCode red) — lint/kit/rules.mjs
- [ ] 🤖 3. The framework's own lint uses it on every module; fix or mark each find from task 1 — eslint.config.js
- [ ] 🤖 4. The installer adds it for games (as strict as their own finds allow, like the other rules), lint conformance checks it; the starter takes lint 0.3.0, its check:full green — lint/scripts/install-lint.mjs
- [ ] 🤖 5. README + VERSION (lint 0.3.0); the other games' finds go to ROADMAP Ideas as hand-offs; root check:fast green — lint/README.md
Check: the rule's tests red on bad code (and on saves' old loadLinkCode), then green; root `npm run lint` green with the rule on; the starter's check:full green; root check:fast green; the task-1 find list accounted for.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Starting point (2026-10-27, grep): framework modules taking a `now` option — ai/kit/tune.ts, audio/kit/engine.ts, emotes/kit/emotes.ts, saves/kit/cloud.ts, saves/kit/nudge.ts, saves/kit/platform.ts. The root eslint.config.js doesn't load the lint module's rules today (games get them through install-lint).
