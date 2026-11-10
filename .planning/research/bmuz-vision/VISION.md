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
- "Done" = a creative's whole life with BMUZ works end to end: first idea → shipped → second game, plus an update from Muzzy (section H).

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

- **V14** A project goes through the five stages of V48 — discover (material) → define (the blocks: the one-page concept, must/should/could/won't per release) → design (assembled into the full GDD, closed by the engineering plan and a feature map with dependencies) → develop in sprints → release — entering at whichever stage fits what already exists (F225 — Where are you starting?). Big work gets no code until the design is agreed. (×3; updated 2026-11-09 for V48)
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
- **V32b** A taste question (how it looks, feels or plays) asks for the creative's view first, then gives the best case for each option. BMUZ's own pick comes only when asked ("you pick"). Engineering questions aren't asked at all: those are BMUZ's call. (Muzzy 2026-11-08: "your pick"; Anthropic 2026-10-27: experts went with the agent's lean 86% of the time.)
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

## F2. Security and safety

- **V42** Secrets are never committed or published: API keys, passwords, account files. A check runs before every push. (Firebase, Cloudflare and the stores all have keys.)
- **V43** Before anything goes to a public place (a public repo, a live site, a store), BMUZ checks it holds nothing private: personal chats, emails, names, private files. (Real case, 2026-11-08: these vision files quote private chats, and a safety check stopped the push to the public repo.)
- **V44** Auto mode is free to work but walled in. It never deletes data, rewrites history, force-pushes or publishes without the explicit OK. It never touches files outside the project and BMUZ. (V25; today's guard-git does part of this.)
- **V45** Anything downloaded (packages, assets, other people's code) is treated as untrusted. Packages come from known sources and get a security check.
- **V46** Games keep players safe: saves and crash reports store no more than they need, multiplayer servers can't be abused, and store rules on privacy and age are met before release.
- **V47** A BMUZ update can't harm a user's machine or projects, and only Muzzy can publish updates.
- **V48** Five stages, one meaning each: discover (gather the material) · define (make the blocks from it: the 3–5 line story, the concept, scope) · design (assemble the blocks into the complete GDD, then the build plan) · develop (the production model, built in code and refined) · release (the public experiences it). The GDD is the north star: "a source of truth… the communication between you and me… a blueprint that you regularly update to be more and more reflective of the final product" (Muzzy, 2026-11-09). A project can start from what it already has (F225 — Where are you starting?).
  - **Replaced 2026-11-10 (Muzzy): six stages — Ideate > Define > Design > Develop > Deliver > Release, with research callable anywhere; see stages.md.** Earlier, sharpened 2026-11-09 (Muzzy): discover = collecting the **material** for building blocks (before any blocks exist) · define = using that material to **make the blocks** · design = **assembling the blocks** in whatever way feels right, cutting some, tweaking others · develop = taking those blueprints and making the **production model** · release = where the **public** finally starts experiencing it. One vocabulary across intros, cards and documents: material → blocks → assembled design → production model → players.

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

## H. Definition of done for the core (draft 2)

Done is not "the recent bugs are fixed". Done is a creative's whole life with BMUZ working, end to end, with **every V item covered by at least one step below**. The caught-again list (G) is extra regression tests on top.

The test: someone who isn't Muzzy (or Muzzy acting as a new user on a fresh machine) lives through all of these, watched, with zero process corrections:
- **J1 First contact.** Install, then "I have an idea". Setup sidequests cover whatever's missing, then the short "where's your game right now?" opening puts them in at the stage that fits (F225; a blank page starts in Discover). (V1, V2, V2b, V4, V48)
- **J2 Shaping the game.** Discover → Define → Design: the material, the blocks (the one-page concept, scope per release), then the assembled design (the full GDD), closed by an engineering plan and a feature map with dependencies. Sketches prove a feel. Taste calls are asked; engineering calls aren't. Entering at a later stage asks only the gaps. (V1b, V14, V15, V17, V40, V48)
- **J3 Building it.** Sprints with approvals at the gates. The PPP stays true. Tuning happens in the Dev Kit, and saved values hold. Approved things stay approved. Status is always clear. (V7, V8, V18, V22, V28, V35–V39, V41)
- **J4 Real life in the middle.** Every interruption in the catalogue below is handled, and the work comes back to the exact step. (V9, V10, V23–V27, V31)
- **J5 Shipping.** Release to the web and as a phone app, with the explicit OK and the security checks, then a live link. (V25, V42–V46, Q3)
- **J6 Learning.** A milestone review. Game lessons go in the game. Studio lessons go to Muzzy as proposals. (V21, V19)
- **J7 The update.** Muzzy changes BMUZ and ships an update. The user's next session gets it, and their projects don't break. (V3, V11, V13, V47)
- **J8 The second game.** It feels the same as the first and starts further ahead. (V6, V5)

**Rule for every journey:** its list is a **catalogue**, not a few examples. It's built from everything in the record, and anything new we hit gets added to it. A journey passes only when every case in its catalogue passes.

**J4 catalogue (from the record so far):**
- the user's side: a sidequest ("fix this first"), a stray idea, a new feature hijacking the active milestone, a bug found mid-feature, a design pivot, "assess / talk it through / just a comment" (no action, and running work isn't cut short), "catch me up", "where were we?", an answer to an old question
- the user's own edits: Dev Kit saves, Obsidian edits, file changes between sessions
- sessions: a context clear, compaction, a crash or a frozen window, a restart, a switch to the other machine, a sync failure, two windows open at once (another window changing BMUZ while this one works)
- running alone: an overnight auto run, a hung or silent helper, a helper's question, a permission prompt, a usage limit
- the world: a service shuts down or changes (e.g. PartyKit), checks going red because the PC is busy, checks passing on Windows but failing on GitHub's Linux machines, flaky tests

Every V item gets a ✔ beside the journey step that proves it. Any V item with no step means this list is still too narrow.

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
