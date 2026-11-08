# BMUZ as "a smart, flexible exe" — research (2026-11-08)

Muzzy's question: "when I ask you to manage a process, that process is, at its core, an explicitly repeatable list of things + a critical thinking layer that deviates/improves/performs efficiencies when applicable… how are these huge companies using AI to code so much and produce a repeatable process?"
Trigger: sprint 66's auto-mode run — the F210 helper hung and the main chat sat ~5 h (HC10 only fired on the word "waiting"; fixed + 20-min cap, config e3acdc2).

## Findings (two researchers, official docs read 2026-11-08)
1. **The model is the industry standard:** a fixed list of steps + AI judgement where needed.
   - Anthropic, *Building effective agents*: "workflows" = "predefined code paths" for predictable work; "agents" steer themselves. https://www.anthropic.com/engineering/building-effective-agents
   - Stripe "Minions": a "blueprint" (code) mixes fixed steps (lint, push) with agent steps; "putting LLMs into contained boxes"; CI capped at 2 rounds, then a human. https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2
   - Thoughtworks (Böckeler): "guides" before, cheap code "sensors" after on every change; model-judged checks are slow/costly so not on every commit. https://martinfowler.com/articles/harness-engineering.html
2. **Who holds the list is the difference.** There, a program holds it and calls the AI; in BMUZ, Claude holds it (skill text) and hooks only catch slips afterwards. BMUZ's most reliable parts are already programs (release.mjs, merge.mjs, save.mjs, archive-sprint.mjs).
3. **Hooks are alarms, not drivers — keep them few.** Claude Code best practices: "If something has to happen every time, make it a hook… keep the enforced set small… if you ever find yourself at forty of them, most are probably preferences." Also: more emphasis on a written rule doesn't fix it — it belongs in code. https://code.claude.com/docs/en/best-practices — BMUZ has **102** hook rule files (none off).
4. **Claude Code Workflows** = saved scripts (`~/.claude/workflows/`, run as `/name`) that run the steps and call AI helpers for the thinking; replayable, resumable; a stalled helper restarts (up to 5×, `stallMs`). Limits: no questions to Muzzy mid-run; the script itself can't touch files (helpers can). https://code.claude.com/docs/en/workflows
5. Other levers: Stop hook input has `background_tasks` (waiting vs done); `claude -p` + `--max-turns` / `--max-budget-usd`; subagent `maxTurns`; hooks: exit 2 = block, `onFailure: "block"` for policy hooks. https://code.claude.com/docs/en/hooks
6. **Gap found:** `config-sync.sh push` runs no hook tests — a red hook set can reach both machines (sprint 66: a helper pushed while 9 tests were red).

## Gemini's answer (Muzzy asked it once; weighed)
- Right: put deterministic work in scripts. Worth taking: a visible **deviation log** when a rule is broken on purpose (which rule, why).
- Wrong where it matters: keeps the list in a SKILL.md with stronger wording ("Zero-Deviation Mandate") — what the docs say doesn't work; nothing about hangs or forcing the next step.

## Claude's recommendation (not yet decided by Muzzy)
1. `/deliver` v0.42 (approved, waiting).
2. F211 — Hooks tested before every push: config-sync push runs the whole hooks suite and refuses red; working runs narrowed to the changed rules' groups (each rule's `tests:` line).
3. Trial: the auto-mode sprint run as a saved Workflow, with the deviation log.
4. Hook diet: firing log → propose cutting preference/wording rules toward a small enforced set; Muzzy approves each.

Weighed: why now — v0.37 moved rules into hooks but the step list stayed in skill text (Workflows weren't in the toolbox) · long term — less drift on every game, less noise · standards — Stripe/Anthropic/Thoughtworks · goals — "the program is the exe, Claude is the flexible part inside it" · against — Workflows are new, can't ask mid-run, real work; so a trial on one process, not a rewrite.
