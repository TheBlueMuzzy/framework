# BMUZ — the Vision (DRAFT for Muzzy to correct, 2026-11-08)

What this is: every expectation Muzzy has stated for BMUZ, written as a checkable statement.
Built from: all 870 of his messages since 2026-10-10 (`mined-1.md`, `mined-2.md`), the written record (`bmuz-record.md`), and the docs survey (`arch-options.md`), all in this folder.
`(×N)` = how many times he said it. Quote sources are in the mined files under the same theme.
Not in this doc: HOW it's built. That's the next doc, scored against this one.

Status: **draft**. Each item is a promise. When it's signed off, a change to the core has to name the item it serves.

## On one screen
- BMUZ lives inside Claude Code and makes Claude act the same expected way, every project, every user.
- Creatives own the creative; BMUZ owns the architecture and delivers.
- A program holds the steps; Claude thinks inside them and logs every deviation.
- It stops only at fixed gates; auto mode runs for hours, never stalls silently.
- You can always see: working / done / waiting on you. Questions come in one list.
- Approved things stay approved; answered questions stay answered.
- Anyone can use it, on several machines; only Muzzy changes it.
- "Done" = the 10 scenarios in section H pass while Muzzy watches.

---

## A. What BMUZ is

- **V1** BMUZ lives inside Claude Code. It is not a separate app that talks to Claude. It guides how Claude acts, like a pipeline Claude carries out, so the user gets highly repeatable, expected behaviour in plain English or /commands, and every project runs the same process. (×3; clarified 2026-11-08: "i don't really want you to talk to an app that talks to claude… i want claude cli to interact with the user in highly repeatable, expected ways that fit the goal of BMUZ")
- **V1b** The user is a creative. The creative calls are theirs, and Claude delivers them. Architecture and engineering are BMUZ's, and the user trusts them blindly unless they choose to give guidance. (2026-11-08: "the creative is up to them, and you have to deliver it. bmuz is the layer between claude cli and the creative user.")
- **V2** Its users are non-engineers, and some may not be experienced designers either. Nothing asks them to read code or edit config. (×2)
- **V2b** All a user needs to start is Claude Code working on their machine. BMUZ gets everything else set up for them (git, npm, adb, Firebase and so on): either in a first-run setup (`/firstsetup`), or as a sidequest at the moment BMUZ first needs it, before going back to what they were doing. (2026-11-08)
- **V3** BMUZ works for anyone, but only Muzzy modifies it. Users don't change it and don't need to. It works out of the box, and improvements arrive as updates from Muzzy. (×3; decided 2026-11-08: "bmuz works for anyone, but only I can modify bmuz")
- **V4** BMUZ is a guide and project manager. It helps the user write the design doc (GDD) and run the project. It offers ideas but doesn't design the game for them. (×2)
- **V5** "BMUZ is how we build it; the framework is what we build it with." BMUZ gets settled first, and the framework is refitted to it later. (×2)
- **V6** Every project feels the same, and each one comes out better than the last because the process keeps improving. (×4)

## B. The core: a smart exe

- **V7** Every process (each stage, the sprint loop, save, release, bug fix) is a fixed list of steps held by a program, not by Claude's memory. The same steps run in the same order every time. (×10+, the most repeated point overall: "always runs because it triggers")
- **V8** Claude is the thinking inside a step. It may change how a step is done or find a shortcut, but every deviation is logged where the user can see it: which step, what it did instead, and why. (×4)
- **V9** BMUZ is the project manager and protects the flow: it says when something should wait. The user is the executive producer and can always override it with a sidequest. When the sidequest is done, BMUZ brings them back to exactly where they were. (×3; 2026-11-08)
- **V10** A stray thought mid-step gets captured and tagged must / should / could. It's parked in the right place (the active milestone if it belongs there, Ideas if not), and BMUZ says when it comes back. (×3)
- **V11** The core is stable. After sign-off, BMUZ changes by adding or fixing pieces, never by rebuilding the core. "Done" for the core is written down (section H). (×2, said with force)
- **V12** A one-page rulebook says where each kind of rule lives (prose, program, alarm, values), and every rule sits in exactly one place. (×1, asked outright)
- **V13** Lean: the set of enforced rules stays small. Something new gets in only if it earns its place or lets something else be removed. No "Kowloon" stacking. (×3)

## C. Stages and planning

- **V14** A new project goes discover → define (GDD, engineering plan, feature map with dependencies, must/should/could/won't per release) → develop in sprints → deliver. Big work gets no code until define is agreed. (×3)
- **V15** A project with existing material gets analysed first, and then BMUZ walks the user through filling the gaps. (×1)
- **V16** A remake keeps everything from the original, improved. Nothing goes missing. (×5)
- **V17** Feature dependencies decide the order of work. (×4)
- **V18** Every project has a home screen, the PPP, which `/ppp` opens in the browser. It shows milestones with a %, a state for every item, and must/should/nice/won't tags. Rejected non-musts move to "maybe laters", so nothing is lost. Ideas are kept apart from milestones. Sketches play in one shared area. The user never has to edit it. (×10)
- **V19** Each problem has ONE standard solution. When a standard changes, everything using the old one is updated. (×5)
- **V20** A new idea raised mid-milestone always gets challenged or checked before it goes in. (×1, firm)
- **V21** At the end of every milestone there's a review. Lessons for this game go in the game. Lessons for BMUZ go to the maintainer (Muzzy) as proposals (see Q1). (×5)

## D. Gates and autonomy

- **V22** A short, fixed list of gates sets the only moments BMUZ stops for the user: approving a plan, approving a sprint, releasing, and taste calls. It asks clearly there and nowhere else. (from ×8 "your pick" + approvals)
- **V23** Auto mode asks no questions and shows no permission prompts. It works through many tasks for hours. Taste questions are logged as "Ask Muzzy" for later. It ends at a gate with a report. (×12)
- **V24** Nothing stalls silently. A hung helper is caught and restarted, or reported, within about 20 minutes. The main chat never just waits. (×3, the sharpest complaint)
- **V25** Anything public or hard to undo always waits for an explicit OK. Releases need no babysitting after that OK. (×2)
- **V26** After a crash, a restart or a context clear, BMUZ picks up exactly where it was and says where that is. It's safe to clear at any time. (×11)
- **V27** Any user can have several machines. Every project, plus BMUZ and the framework, stays up to date and works on all of them, using the same sync function Muzzy uses. Nothing is locked to one machine. (×3; 2026-11-08: "the ability to keep multiple machines up to date… is important")

## E. Status and talking to the user

- **V28** At any moment the user can tell at a glance whether BMUZ is **working**, **done**, or **waiting on them**. (×9, the most repeated pain point)
- **V28b** Questions are gathered into ONE list per hand-off and kept in a project's open-questions list until they're answered. BMUZ never drips questions across several messages, where they scroll away and go unanswered. (2026-11-08: "now i'm answering questions from several sections ago")
- **V29** Every hand-off uses one card: what was done, what you'll see, links, numbered questions, next command. (×3)
- **V30** Style (designed in Muzzy's style FOR everyone — standard, not personal; any purely personal bits get sorted out in a later pass): lists, not paragraphs. Questions are numbered, and a Questions section holds only questions. Features are written "F## – Name". Sprint reports start with the sprint number and goal. Progress lines show the clock time. Jargon and icons are explained the first time. (×15+)
- **V31** "Assess / analyse / tell me / talk it through" means report only, with no edits until the user picks. (×7)
- **V32** The user's ideas are probes, not orders. BMUZ weighs them and pushes back softly when the facts disagree. (×5)
- **V33** "Catch me up" gets a short where-are-we in the big picture. (×3)
- **V34** Process work that's invisible gets shown in a form the user can see. (×2)
- **V34b** Concise: docs and messages BMUZ writes are short enough to be read in full. Bloat makes people skim past the important parts. (2026-11-08)

## F. Quality and trust

- **V35** Nothing is called done until it's been checked first-hand (tests, screenshots, actually used), and the evidence is shown. (×3)
- **V36** Approved behaviour is protected. A later change can't quietly replace something the user approved, such as a feel, a layout or a default. (×6: periscope drag, two-letter words, menu growth…)
- **V37** Values the user saved (Dev Kit, Obsidian, their own file edits) are decisions. They're kept and built on, never overwritten. (×5)
- **V38** A question answered once is never asked again. Answers go in a project decisions list that's checked before asking. (×7: portrait-only said 6 times)
- **V39** A fix carries to every matching place. (×3)
- **V40** Claude leads on the technical side: it recommends the sturdier way unprompted, and weighs it from every side, including the case against. (×5)
- **V41** BMUZ sets up each project so every framework module and tool works in it, with one way per module. (×4)

## G. Things he caught again (each becomes a permanent test)

From the 64 caught-again items, grouped:
1. Helper hung, main waited for hours (5 h, and up to ~10 h in the record) → V24
2. No visible status: "still going?" ×9 → V28
3. A helper's question was never relayed to him → V23/V28
4. Expectations written down, "sounded right", not delivered → V11, H
5. Claude didn't raise the right tool (linter, hooks, Workflows) until steered → V40
6. Asked again after he'd answered (portrait ×6, the cracks question) → V38
7. Approved behaviour replaced (periscope, defaults, menu) → V36
8. A fix not carried to matching screens (scroll, AI-player menu) → V39
9. "Assess" read as act (or feared) → V31
10. Remake lost original features → V16
11. Built against the spec (colours, offsets, fonts) → V35
12. Dev Kit not live / not standard → V41
13. Permission prompts in auto → V23
14. "Done" or "logged" claims that weren't true → V35
15. Hooks crying wolf (about half of 2,180 firings) → V13
16. Bad links: test links opened the wrong state, a link that wouldn't open → V35

## H. Definition of done for the core (draft)

The core is done when all of these pass, watched by Muzzy, not just reported by Claude:
- **S1 New user:** a fresh account and a fresh machine. Install BMUZ, say "I have an idea", and get Discover with no setup questions about BMUZ itself.
- **S2 Overnight:** a 3-feature sprint in auto mode finishes with no questions or prompts. It stops at the approval gate with a report.
- **S3 Hang:** a helper is deliberately frozen mid-run. It's caught and recovered within 20 minutes, and the log shows it.
- **S4 Detour:** mid-sprint, "fix this button first". It gets fixed, and BMUZ returns to the exact step it left.
- **S5 Crash:** the window is killed mid-sprint. A new window resumes at the right step.
- **S6 Assess:** "assess X" gets a report and zero file changes.
- **S7 Memory:** a question answered in project A's decisions list is not asked again.
- **S8 Status:** at random moments, working / done / waiting is clear within one glance.
- **S9 Protection:** a change that would alter an approved behaviour gets stopped or flagged.
- **S10 Real use:** Muzzy runs one small new game from idea to a live link without once correcting the process.
- All 16 groups in G have a test that passes.

---

## Answered (2026-11-08)
- Q1 Only Muzzy modifies BMUZ; it works for anyone → V3.
- Q3 Games for the core, delivered on web or as a phone app. Non-game apps aren't a target.
- Style: Muzzy's style is the standard for everyone. A generated personal profile is welcome later, but every style rule gets listed with an example so Muzzy can label it standard or personal.
- Accounts: Claude Code needs its own login (an Anthropic requirement). BMUZ adds no paid requirement of its own → V2b.
- Phone ping when BMUZ needs a decision: yes, after the core works.
- Sidequests: PM protects the flow, EP overrides → V9.
- Section H: matches how we've been working; Muzzy to check it from a link.
- Files: kept local and backed up to git (the public framework repo is fine for now; private maybe later).
- Architecture: compare **all** options against this doc. Only ones that live inside Claude Code count (V1), so a separate app on the Agent SDK is out.
- This doc becomes BMUZ's own reference vision once approved. Muzzy may want to see versions of it first.

## Open
- Muzzy reads section H and the whole draft, then corrects.
- Later: the style-rule list (each with an example) to label standard or personal.
