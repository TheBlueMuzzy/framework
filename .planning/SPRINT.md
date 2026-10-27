# Sprint 47 — Clocks you can trust
Started 2026-10-27 · Milestone v0.29 Clocks you can trust · Features: F157
Muzzy 2026-10-27 (/deliver v0.28): picked "clock lint rule" as the next milestone.
What changes: code that takes a clock option (`now`) and also reads the real clock (`Date.now()`) in some other spot becomes a lint error, in the framework's own modules and in games that take lint 0.3.0. What stays the same: how every game plays; a default value (`now = () => Date.now()`) or a fallback (`options.now?.() ?? Date.now()`) is fine. Not in this sprint: games installing it (hand-offs go to ROADMAP Ideas).

## F157 🔧 Clock lint rule
Done when: bmuz/own-clock in lint/kit/rules.mjs refuses a bare `Date.now()` in code that takes a `now` clock option (default values and `??` fallbacks pass; `// clock-ok: <why>` for real ones), with a RuleTester test red on bad code — and red on saves' old loadLinkCode; the framework's root lint runs it on every module, finds fixed or marked; install-module adds it to a game (lint 0.3.0) and the starter has it with check:full green.
- [x] 🤖 1. Measure first: a draft rule run read-only over every framework module (ai, audio, emotes, saves… — the ones taking `now`) and over Roll Better, Goops and Glyphtender; list the finds in Notes, and decide the rule's reach (same function, or the whole file) from them — lint/kit/rules.mjs
- [x] 🤖 2. The rule: bmuz/own-clock, `// clock-ok: <why>`, RuleTester cases (bad code red; defaults and `??` fallbacks green; saves' pre-bbb0988 loadLinkCode red) — lint/kit/rules.mjs
- [x] 🤖 3. The framework's own lint uses it on every module; fix or mark each find from task 1 — eslint.config.js
- [ ] 🤖 4. The installer adds it for games (as strict as their own finds allow, like the other rules), lint conformance checks it; the starter takes lint 0.3.0, its check:full green — lint/scripts/install-lint.mjs
- [ ] 🤖 5. README + VERSION (lint 0.3.0); the other games' finds go to ROADMAP Ideas as hand-offs; root check:fast green — lint/README.md
Check: the rule's tests red on bad code (and on saves' old loadLinkCode), then green; root `npm run lint` green with the rule on; the starter's check:full green; root check:fast green; the task-1 find list accounted for.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Starting point (2026-10-27, grep): framework modules taking a `now` option — ai/kit/tune.ts, audio/kit/engine.ts, emotes/kit/emotes.ts, saves/kit/cloud.ts, saves/kit/nudge.ts, saves/kit/platform.ts. The root eslint.config.js doesn't load the lint module's rules today (games get them through install-lint).
- F157 — task 1 (2026-10-27, read-only, dev/.scratch/framework-f157/measure.mjs over every framework module + Roll Better / Goops / Glyphtender src):
  - Reach decided: the whole FILE, not the function — saves' bug was a function that never touched `now` (it just called Date.now()) in a file whose other functions take it; a same-function rule would have missed it.
  - First draft: framework 7, Goops 1, Glyphtender 2 — none real: the clock's own definitions (ai pace.ts `now: () => … Date.now()`, devkit gameClock.ts `realNow`, ai tune.ts `clockNow`), the cloud worker's alarm handing the real time to `tidy(now)`, and the gallery's countdown in a file where `(now) => now.map(…)` names a list.
  - Refined: "takes a clock" = a `{ now }` option or a read of `x.now` (a plain parameter named now is a time handed in); a function named now / …Now / …clock is the clock's definition. Re-measured: 0 everywhere — and saves' pre-fix cloud.ts (bbb0988~1) is caught at exactly line 153, the bug.
- F157 — task 2: bmuz/own-clock in lint/kit/rules.mjs + 15 RuleTester cases (rules.test.mjs, 73/73): the saves bug red at its line; defaults, ?? fallbacks, clock definitions, a handed-in time, the fix itself, and `// clock-ok: <why>` green; a clock-ok without its why still red.
