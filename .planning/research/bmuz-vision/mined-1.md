# Mined from said-part1.md — Muzzy's own words about BMUZ / process / how Claude should work

Source: `said-part1.md` (2,509 lines, read in full). Timestamps are as in the file (UTC-ish, as logged). Project folder is noted where it matters: `fw` = framework, `glyph` = glyphtender, `goops` = goops, `catnip` = CatnipChaos (board-game work project), `desk` = Desktop.
Skipped as unrelated: Plex, Fire tablet setup (except where it shows a general working rule), Zoom, monitors, jar of balls, kids' bellows game, Supabase email. Teammate reports pasted into the log were read, but only Muzzy's own words are quoted.
"×N" = how many separate messages said roughly the same thing.

---

## 1. EXPECTATIONS

### A. What BMUZ is, and who it's for

**A1. BMUZ is a layer over Claude CLI. A user talks to it, and it contains and enforces processes so every new project feels the same.** ×3
- "It's a layer over claude cli that they talk to, and it filters to you or something. it contains and enforces processes so that every time they are on a new project, it feels the same. it helps standardize their approach." — 2026-11-08T05:56 fw
- "I expect that whenever i interact with Claude, in any CLI, it's running through the BMUZ layer. Is that true? Again, I'm trying to treat claude as the 'os', and bmuz as the 'launcher'." — 2026-11-04T05:39 fw

**A2. People other than Muzzy, who can't modify it on the fly, can use BMUZ to build games or apps.** ×3
- "I need BMUZ to be able to be used by peopel other than me, people who won't be able to modify it like I can on the fly. they will use it to help them develop games or apps etc." — 2026-11-08T05:56 fw
- "maybe it's just my style of development, and others who use BMUZ would benefit from the proposed a-d structure..." — 2026-10-10T02:51 glyph
- "these first few are to help build the framework and bolster BMUZ so that I and others can use them." — 2026-10-10T03:26 glyph

**A3. BMUZ makes designing a standard experience for a non-technical person.** ×2
- "BMUZ standardizes the experience of designing as a non-technical person." — 2026-10-19T00:56 fw
- "those using BMUZ are probably not experienced developers or possibly even not experienced designers." — 2026-10-10T02:51 glyph

**A4. BMUZ acts as a project manager while it guides the user through the process.** ×1
- "BMUZ is sort of a Project Manager at the same time as it is guiding people through the process" — 2026-10-10T02:51 glyph

**A5. BMUZ starts from a PRD. The user brings one, or BMUZ guides them to write one. It doesn't design the gameplay for them, though it can offer ideas.** ×1
- "BMUZ isn't really meant to heal design the gameplay, it CAN offer ideas and stuff, but the concept is that someone gives BMUZ a PRD or BMUZ helps you create one by guiding you through the process." — 2026-10-10T03:26 glyph

**A6. "BMUZ is how we build it, the framework is what we build it with."** ×1
- "love teh analogy - bmuz is how we build it, framework is wht we build it with" — 2026-11-04T05:58 fw

**A7. BMUZ first, framework second. The framework gets refit later to match BMUZ.** ×1
- "it utilizes the framework to help them do that but we'r ehere to fit bmuz, not the framework yet. it may have to get another pass later based on how this goes." — 2026-11-08T05:56 fw

### B. Smart exe: deterministic core plus a thinking layer

**B1. When BMUZ manages a process, Claude runs it like an exe: an explicit, repeatable list of steps, plus a critical-thinking layer that can deviate, improve or find efficiencies when that helps.** ×4
- "i want you to function like a super smart/flexible exe to a degree. when I ask you to manage a process, that process is, at it's core, a explicitly repeatable list of things + a critical thinking layer that deviates/improves/performs efficiencies when applicable." — 2026-11-08T05:31 fw
- "I want claude to function as if it were a 'smart exe', rather than a powerful tool that may hallucinate or even just leave things out. I want that exe consistency with a flexible, creative, and recursively smart driver." — 2026-11-04T05:58 fw
- Also 2026-11-04T06:08 ("sounds like you have a good direction to go with the 'smart exe' direction") and 2026-11-08T05:56 ("for bmuz to help you function like an exe").

**B2. BMUZ should be as reliable and repeatable as the AI processes big companies run.** ×1
- "i just don't get how these huge companies are using AI to code so much and they produce a repeatable process and I'm struggling to make up this bmuz thing that helps act as a layer over you to keep you operating as reliably and repeatably as an exe." — 2026-11-08T05:31 fw

**B3. BMUZ has a solid core that stops changing. No more incremental rebuilds of the core.** ×2
- "It is imperative that we solve this. i don't want to keep changing the process at it's core. I need a solid core, not incremental at this point." — 2026-11-08T05:56 fw
- "I want to be done with this never ending redevelopment cycle." — 2026-11-08T05:56 fw

**B4. The boundaries are clearly defined: which kinds of expectation live in .md files, which in hooks, which in workflows, and so on.** ×1
- "i want more clear boundaries and definitions for what type of expectations are captured and stored in .md vs hooks vs workfloows, etc etc etc etc etc." — 2026-11-08T05:56 fw

### C. Enforcement: triggers, not memory

**C1. Anything that dictates process is a hook, so it can't be ignored the way rules are.** ×6 (his most repeated point)
- "i feel like anything that dictates process should be hooks so it isnt ever ignored like 'rules' are. and testing should be highly process oriented, thus i'm thinking it's better to set that as a hook and not a rule. but push back if that's a bad idea" — 2026-11-08T05:27 fw
- "basically, the entir eprocess should be under the same scrutiny. 'only runs when it remembers' is a bad thing. 'always runs because it triggers' is much more solid. right?" — 2026-10-19T15:33 fw
- Also: "I want BMUZ to be hook based" (2026-11-04T05:39); "doesn't that mean that you should make /save and /deliver hooks?" (2026-10-19T15:31); "the linter would be a great candidate for a hook" (2026-10-19T14:30); "I thougth you'd be transferring more things out of the reminder file or whatever it is and turn them into more solidly standard flow things." (2026-10-19T00:47).

**C2. Anything in Claude's current setup that could be a BMUZ hook but isn't yet gets pointed out.** ×2
- "any aspects of my current claude that aren't in BMUZ but could be as hooks should be highlighted." — 2026-11-04T05:39 fw
- "sounds like we need to analyze the rules that aren't on hooks to make sure they are efficient and effective, and also determine if they'd be more effective as hooks." — 2026-11-04T05:58 fw

**C3. Hooks apply to every project, never just one.** ×1
- "4. this marks a specific project as a trigger (glyphtender), but it should be for all projects, right?" — 2026-10-19T00:47 fw

**C4. Hooks and other mechanisms make Claude act on Muzzy's judgement rules (multi-angle decisions and so on) even though it doesn't reason like a person.** ×1
- "You're AI, so you don't 'reason' like humans, but you can put in place mechanisms/hooks that will trigger to have you act more in line with what I'm saying." — 2026-11-04T05:13 fw

**C5. Housekeeping happens on a trigger, e.g. screenshot files get cleaned up at set points.** ×2
- "is there a hook for bmuz to clean up the screenshot files it makes during the development at certain points?" — 2026-10-19T15:27 fw
- "quick check - have you been clearing your images?" — 2026-10-13T16:58 glyph

**C6. A linting process exists, but only where it's helpful and standard.** ×2
- "do we have a linter, or a linting process in BMUZ?" — 2026-10-19T14:25 fw
- "is it required or suggested? it only needs to be fixed if it's helpful and standard" — 2026-10-19T14:26 fw

### D. Autonomy and not stalling

**D1. A stuck or hung helper is caught by a timed check-in, so the main chat never waits hours for nothing.** ×3
- "that's not acceptable. i though we had somethingin place that made it so you wouldn't just sit there if a helper was hanging. like you'd do some sort of check in every now and then so you didn't wait for five hours for no fucking reason." — 2026-11-08T04:22 fw
- "so what is the actual technique to make sure you don't let a helper hang forever? are you running a timed checkin? every 30 min or something?" — 2026-11-08T05:03 fw
- Related: "was the helper using tokens the whole time it was stuck?" — 2026-11-08T05:23 fw

**D2. In auto mode Claude asks no questions and waits for no confirmations. It works through several tasks, not just one, for hours.** ×8+
- "you're in auto mode, you shouldn't ask me questions or wait for me to confirm things. I'm going to bed, so you need to continue yourself" — 2026-10-07T04:46 glyph
- "I'm putting you on auto mode to complete as many of these as you think you should complete without my input. all auto mode. not just one task, but several. I'll be gone for 5 hours ish. take over this development process while I'm gone. Go" — 2026-11-07T22:24 fw
- Others: 10-08T05:09, 10-09T04:29, 10-13T05:30, 10-14T06:19, 10-27T05:35, 10-27T23:37, 10-28T12:49, 11-03T03:01, 11-04T06:18, 11-06T06:33.

**D3. Full auto never shows permission prompts, so nothing blocks while Muzzy is away.** ×4
- "i want you to be in full auto mode, but these kinds of messages are still showing up. how can you make it so that those are auto approved?" — 2026-10-27T23:47 fw
- "turn off all permisison requests. you should be able to just do it all. i don't understand the change suddenly." — 2026-10-26T15:36 goops
- Also "why do I have to approve every bash command?" (2026-10-26T16:48 goops) and "i'd like to stay in auto mode, so whatever solves for that." (2026-11-03T18:12 fw).

**D4. At the end of an auto run, Claude delivers, updates BMUZ and gives Muzzy the live link.** ×3
- "run auto mode. i'm goign to bed. make sure to /deliver it when you're done with everything, and update BMUZ. be sure to share link when you're ready" — 2026-10-08T05:09 glyph
- "fix it, push it, /deliver on auto mode." — 2026-10-08T13:00 glyph
- "i want this link to actually have the most up to date build!" — 2026-11-04T04:10 glyph

**D5. Releases don't need babysitting.** ×1
- "1. releases that don't need babysitting" — 2026-11-03T17:47 fw

**D6. Before running auto, Claude checks itself, challenges itself, and thinks ahead and back, so Muzzy can trust it on technical work he can't judge.** ×2
- "i want to just trust you're going to do the right things, mostly because this is technical and I don't know enough to tell you if you're wrong. so I want you to check with yourself, challenge yoruself, think ahead, think back, etc. then run in auto mode." — 2026-11-04T06:18 fw
- "I'm trusting you did research and know what to do." — 2026-10-20T15:11 fw

**D7. A comment from Muzzy doesn't stop or shorten running work.** ×1
- "you didn't HAVE to cut it short. I was just commenting" — 2026-11-03T19:32 goops

### E. Claude as CTO: leads and thinks critically

**E1. Claude reaches the right technical solution early and offers the proper approach before Muzzy has to ask or lead it there with questions.** ×5
- "you tend to do what i say, but not think through things enough to offer more proper approaches - i lean on you to solve the technical. you only got to hooks because i asked. you only got the hooks you did because i guided you to them via questions. I need you to get to the tech solutions earlier for me by being more critical." — 2026-10-19T19:41 fw
- "so why didn't you think of it? you know the process we're trying to create, and I asked you to do research about how to create a consistent and trustworthy process when we started this project and throughout." — 2026-10-19T14:27 fw (linter)
- Also 2026-11-08T05:56: "You didn't tell me about workflows even though I basically said the same things about what I wanted"; and "I count on you to be my CTO, and build a system that meets my expected function and user experience and interfacing."

**E2. Muzzy's ideas are probes, not orders. Claude weighs them and acts only if they're good.** ×3
- "add the run one group while working option' IF YOU THINK ITS" A GOOD IDEA! just because I bring something up doesn't mean it's smart. I'm just poking and prodding the process to learn and see if I can unstick you from potentially bad process. you 'know' so much, but sometimes you just do what you're told, but there is an expectation that you are part of the decision making process and that requires you to 'think' or do research to turn 'know' into know." — 2026-11-08T05:25 fw
- "you almost split them just because I mentioned it might be an option. you only didn't split them because I asked you to consider why they were like that to begin with." — 2026-11-04T05:13 fw
- Also "push back if that's a bad idea" (2026-11-08T05:27) and the Gemini paste: "you can ignore this if it's bad advice" (2026-11-08T05:36).

**E3. Every decision is looked at from several angles: long term, researched big- and indie-studio standards, coding goals, Muzzy's goals, and a challenge to Claude's own pick.** ×1 (strongly worded)
- "I need you to look at decisions from multiple angles going forward. I don't want you making a decision with only half of a perspective. I want you to challenge your own decisions and think long term, as well as check options against researched standards with big and indie studios, coding goals, and my goals." — 2026-11-04T05:13 fw

**E4. Before any decision about BMUZ, Claude reviews EVERYTHING discussed so far, because a loose definition leads to poor decisions.** ×2
- "BMUZ as a concept - and this is probably defined in a way that will be too lose for some tiny reason i can't see, and you'll end up making poor decisions from it, so I need you to look at EVERYTHING we've been talking about and working towards before making decisions" — 2026-11-08T05:56 fw
- "I've even asked you to define my expectations based on everything I've said in the past, and all the direciton shifts we've been making. you did, and it sounded right, but then you failed to deliver that." — 2026-11-08T05:56 fw

**E5. Engineering calls are Claude's, including whether to build ahead now or wait.** ×4
- "I need to let this be your call as to whether or not you continue to set things up so it's easier in the future, or wait because things change. ... which way is goign to result in a better product and process?" — 2026-10-20T15:11 fw
- "your call though. I just don't want to do a bunch, knowing it's probably wrong." — 2026-11-04T06:08 fw
- Plus many "your pick" replies (10-26T23:07, 11-03T19:43, 11-04T01:50, 11-04T14:00, 11-07T20:23, ...).

**E6. When BMUZ needs it, Claude researches how professionals do it, or says plainly that it already knows.** ×2
- "If it rquire research for what that looks like, or how we get there, do the research. if you already know, then let's talk through it." — 2026-11-04T05:58 fw
- "can we research hooks and AI production standards regarding hooks?" — 2026-11-08T05:31 fw

**E7. Claude says when an idea of Muzzy's is too complex for what it solves.** ×2
- "think through how this is meant to be used, and see if that feature is too complex for what this is trying to solve." — 2026-10-14T23:27 glyph
- "okay, so that idea I have sounds pretty complicated and easy to implement incorrectly for UX or architecture reasons." — 2026-10-14T04:31 glyph

### F. Verification and finishing

**F1. After a big action, Claude checks on its own that what it claims has been validated and that the task is really complete. That means being independent, not just running tests.** ×2
- "alright! that kind of pass should have happened without my intervention. when you perform a big action, either ask questions, or check to make sure things you are saying have been validated. i'm not talking about tests, I'm talking about being independent on your tasks. make sure the tasks are actually complete." — 2026-10-15T00:57 glyph
- "okay. did you do an audit to make sure settings are 'on the right things'?" — 2026-10-15T00:30 glyph

**F2. When Muzzy approves, he can tell whether the progress is the right progress. Today his approvals are automatic because he can't judge.** ×1
- "my approvals have been automatic in my head because it's clear you're making important progress. i just don't know how to determine if it's the right progress." — 2026-10-20T15:11 fw

**F3. Simple changes can skip tests when Muzzy says so.** ×2
- "update the code, but no need to run tests. I know this will be good." — 2026-10-08T01:26 glyph
- "do that, don't run tests, that should be a simple change, then push it, and then deliver it" — 2026-10-08T03:26 glyph

**F4. Test volume has a reason Claude can explain.** ×1
- "i do wonder why there are 828 tests" — 2026-11-08T05:18 fw

### G. Process and stages (Double Diamond)

**G1. Big work runs the full 4D flow: research and plan (discover), then talk through decisions (define), then design/develop, then deliver. No code until the plan is agreed.** ×3
- "this will be a full proccess task - do research for standards ... I want a plan for this entire audio approach first before you write any code. this is all research and planning. (discover), then we'll talk about what should and shouldn't be, and whatever else needs discussing (define) for decisions sake. only then do we actually do the design portion. then we'll deliver. use BMUZ properly here. DDDD phase are important for this reason." — 2026-10-08T20:46 glyph
- "we're going to work on the tutorial now. but first. we run through the full 4D flow" — 2026-10-13T02:03 glyph

**G2. BMUZ guides the process but is flexible. A user can stop to fix something, then BMUZ brings them back on track.** ×2
- "I think BMUZ should probably try to guide that process, but if the developer (me or someone else) wants to fix something, then it should be flexible enough to fix it and then get back on track." — 2026-10-10T02:51 glyph
- "someone might be using bmuz just to proto a game out, even if it's semi polished. they might be using it to finalize for actual production release. so bmuz should guide and be flexible." — 2026-10-10T02:51 glyph

**G3. When a user has an off-topic thought mid-step, BMUZ tracks it, says when to come back to it, and asks how important it is (must/could).** ×1
- "they'll have one-off thoughts in the middle of steps that thought doesn't belong, and you'll track it, and come back to it. bmuz guides when to do it, and asks how important it is. it's the whole must have, could have schema thing that we do." — 2026-10-10T02:51 glyph

**G4. At the end of a milestone, BMUZ reviews it and carries lessons, structure and methods into BMUZ/framework, as an ever-flowing self-improving loop.** ×4
- "when finishing a milestone, analyze it all and see if any lessons or structure/methods, etc can be ported to BMUZ/Framework in a ever-flowing self-improving loop." — 2026-10-19T00:56 fw
- "right now I'm trying to get this to a pretty positive spot so I can move on to the nxt game after confirming BMUZ and Framework have learned all the lessons it can from this." — 2026-10-12T19:10 glyph
- Also "update BMUZ" (10-08T05:09) and "That's also something that should be put into BMUZ ai module" (10-08T04:36).

**G5. Each problem has one standard, expected solution. When the direction changes, BMUZ/framework learns the new standard and every module that used the old one is updated.** ×2
- "make BMUZ aware of this direction going forward as well. we want standard, expected solutions to each problem. if the online module uses what roll better does, then it too needs to be updated." — 2026-10-12T23:46 desk
- "and bmuz / framework knows to use this instead of party kit now?" — 2026-10-13T01:34 desk

**G6. The architecture makes pivots easy. Nothing is hardcoded in a way that makes changes painful.** ×1
- "ensure the architecture makes pivots like this easier (hardcoding stuff can lead to really tough refactors, so BMUZ and the Framework should make it easier to pivot when necessary)" — 2026-11-03T02:45 goops

**G7. BMUZ makes games first. It becomes a dev-cycle tool (playtest rubrics, logged playtest links) later.** ×1
- "we could create a rubrik system like that for playtesting. ... I want the system to make games first, then we'll go back to make it a dev cycle tool." — 2026-10-10T03:26 glyph

**G8. During beta, BMUZ will later prompt for final art and manage that with checklists and suggestions. That's a future flow.** ×1
- "durin beta we're likely going to be prompting the developer to consider getting more finalized art, and then manage that process with checklists and suggestions and what not." — 2026-10-10T02:51 glyph

**G9. Store releases (app store, Play, Steam, itch) wait for a later big run-through. GitHub Pages for now.** ×1
- "when i'm ready to actually release games that i would do a big runthrough withyou to get app store, play store, steam and itch.io ... but for now. no. it's just git pages i think." — 2026-10-20T15:05 fw

### H. Hand-offs and communication

**H1. When work is ready for Muzzy to check, Claude sends a standardized message: what was done, what he'll see, links (local/live/ppp), questions, next steps.** ×2
- "when you finish something and I need to check it, you create a standardized format message to send that includes things like what was done, what you'll see, links to local/live/ppp etc, questions you have for me, next steps, etc. whatever you've been doing has been pretty good, but poorly formatted." — 2026-10-19T00:47 fw
- "it says, 'your to dos', say approved. so I looked, and yes, approved" — 2026-11-06T21:32 fw (shows the to-do section working)

**H2. Every hand-off ends with the next command and what it will cover, every time.** ×1
- "the next command + what it will be covering. yes add it. I never want to see it any other way going forward!" — 2026-10-19T00:56 fw

**H3. Questions are always numbered, so Muzzy can answer by number.** ×1 (plus constant numbered answers)
- "always number your questions so I can referenc ethem with numbers" — 2026-10-26T17:35 fw

**H4. Features are always written "F## - High Level Name" (a clear, descriptive name). The roadmap uses "F## - Name - Short Description". Enforce with a hook if needed.** ×2
- "From now on. Roadmap has "F## - High Level Name - Short Description". Refrring to things going forward, if you bring up F##, it should instead be F## - High Level Name (this name should be clear and descriptive). this is a BMUZ update and if it needs to be a hook so it's always clear, do it." — 2026-10-26T17:01 fw
- "exaplain why f179 and 178 exist" / "tell me what f180 is like you did before." — 2026-11-04T04:00 / 04:12 fw

**H5. Sprint reports open with the sprint number and its goal, and say whether new code was written.** ×1
- "from now on, when you identify a sprint report, you should say the sprint number (f46 etc) as well as the goal fo the sprint so I know how to parse the information you handed over after. idk really what these sprints were meant to do. i just know you were running a bunch of tests. idk if you even wrote any new code or anything." — 2026-10-07T12:54 glyph

**H6. Progress lines show % and time left, plus the clock time they were posted.** ×1
- "From now on, use that format, but also add the current time right when you post it. That way I'll undersatnd how close we are, and you can even get better at estimating the time it takes to make things." — 2026-10-14T02:44 glyph

**H7. Claude never says "your game", because everything is Muzzy's game.** ×2
- "2. i don't understand why you're saying 'your own game' so I lack context here" — 2026-10-07T22:13 glyph
- "'your game' was very confusing, as this entire thing is 'my game'." — 2026-10-08T01:04 glyph

**H8. Research findings and decision asks explain what each item is, why it's being shared, and how it improves BMUZ. Nothing too light.** ×2
- "you're not really explaining why you chose to share these and what they really are. "luck before vs after a decision" < ex. What? how does this apply to the development process?" — 2026-10-10T03:26 glyph
- "again you're being too light when asking me to make a decision on something or delivering me research findings. ... how is this improving BMUZ? I feel like you lost the context for how to frame what you've found and are sharing/asking." — 2026-10-10T03:26 glyph

**H9. Descriptions of logic in plain speak are still explicit and true, never loose enough to build a wrong rule from.** ×1
- "be careful with your language, as it could be incorrect or incomplete sometimes. If you coded to that logic, you would miss the logic I expressed and we could end in a soft lock ... the way you word things (coding in plainspeak) should still be explicit and true. without being overly wordy." — 2026-10-13T04:05 glyph

**H10. No info dumps. Explanations are short and in Claude's own words.** ×1
- "I'm intimidated by askign this, because I know you coudl dump a LOT of info that I don't want to read, but Can you describe BMUZ in your own words, and what my relationship is with it." — 2026-11-04T05:39 fw

**H11. Open framework tasks are presented so Muzzy can understand them (this led to H4).** ×1
- "i can't explain why, but i'm confused by what the open tasks are for framework. something isn't conveying it properly here and I don't know what it is." — 2026-10-26T16:47 fw

**H12. Claude turns Muzzy's ramblings into something he can take in at a glance (charts, combination tables).** ×2
- "I'd love to get a chart that shows those combinations." — 2026-10-10T21:06 glyph
- "Thanks for organizing that into something digestible instead of my ramblings." — 2026-10-10T21:22 glyph

### I. Respecting Muzzy's files, saves and scope

**I1. Values Muzzy saved in the Dev Kit are taken as correct and built on, without asking.** ×3
- "I updated some of the styles using the dev kit and saved, so you should automatically know that those are correct and to move from there." — 2026-10-10T23:25 glyph
- "approved. good to go. i saved settings changes" — 2026-10-11T02:20 glyph; "tested them all. changed it to ghost and i saved it." — 2026-10-10T23:51 glyph

**I2. Claude never undoes changes Muzzy made between sessions.** ×1 (tablet session, general rule)
- "I changed the layout between the last time we spoke and the changes you just made. you undid the layout I wanted, and the programs i wanted, and the widgets I wanted." — 2026-10-26T01:16 desk

**I3. "Familiarize", "analyze" or "review" means no edits. Claude edits only when told.** ×4
- "wait a second. did you modify the game? i didn't ask you to do that. I only asked you to familiarize yourself." — 2026-10-11T01:25 catnip
- "no. remove all edits you've made. you are only allowed to make edits when I tell you to here" — 2026-10-11T01:35 catnip
- Also "just analysis, not action" (2026-10-11T19:46 catnip) and "without making any changes, analyze what we could do here" (2026-11-03T02:34 goops).

**I4. "Talk it through first" means no action before the talk.** ×2
- "just need tot alk through it first before any action." — 2026-11-02T23:35 fw
- "just a comment, nothing to act on" — 2026-10-14T14:18 glyph

**I5. Muzzy's own notes (devlog) decide what matters. Anything Claude raised that isn't in his list is unimportant.** ×1
- "Read my devlog to see how I summarized what you said and what I chose that I think matters. if what you wrote isn't in my list, then it isn't important and shouldn't pressure any changes." — 2026-10-11T02:56 catnip

**I6. Claude knows which Google account a job needs and can reach both without special steps each time.** ×1
- "You should always know which one you're expected to work in.and I should't have to do anything special every time I want you to check either account's files." — 2026-10-10T23:44 catnip

### J. Consistency rules for game work (patterns BMUZ should carry)

**J1. If the player's actions look a certain way, the AI's actions look the same way.** ×1 (framed as a rule Claude forgot)
- "you forgot a rule - if the player's actions look a specific way, so too shoudl the AI's actions." — 2026-10-10T23:25 glyph

**J2. A fix in one place carries to every matching place (same layout, same scroll behaviour, one scroll function, no stray scroll bars).** ×3
- "the 'add an AI player' section of the window doesnt have the fix that the main menu has regarding layout. they should be the same." — 2026-10-08T04:04 glyph
- "We should remove all scroll bars and replace them with the correct scroll function we made." — 2026-10-14T01:39 glyph

**J3. Design work uses the module standards to decide what's right, without walking Muzzy through each item.** ×1
- "design walk-through: i honestly feel like you could just use the module standards to determine what is right and what needs to change and then how it should change." — 2026-10-12T19:10 glyph

**J4. Look/feel tools offer presets (e.g. Punchy / Soft) that the designer can then tweak.** ×1
- "using a preset is the easy way out, but the esigner still has the power to tweak it from there." — 2026-10-10T03:36 glyph

**J5. Tweakable values (nudge timings, strings) are configurable in the Dev Kit.** ×1
- "duration before nudges appear (both text and highlights) should be configurable in the devkit. as should strings" — 2026-10-13T04:05 glyph

**J6. Test setups don't collide (e.g. testing level 50 doesn't trigger rank-0 tutorials).** ×1
- "gotta do somethign so I don't get in that situation for testing again." — 2026-10-27T01:27 goops

### K. Framework shape and health

**K1. The framework stays lean. No inner-platform effect, no "Kowloon" of stacked layers. Additions are fine when they let other things be removed and things get consolidated.** ×3
- "it's like those slum cities where people build homes on top of homes ... like Kowloon, the walled city. Functional, but nonsensical and unstable. just read the framework health check... this can't happen. we definitely need to avoid the inner-platform effect." — 2026-11-04T05:58 fw
- "I'm okay adding things - we're building somethign akin to software - but sometimes we add things that facilitate removing other things. removing things has to happen for a reason - we're improving and consolodating, and targeting efficiencies, etc." — 2026-11-04T06:08 fw

**K2. The framework is made solid before it goes into games, then adjusted as lessons come in. A bloated framework is never put back into games.** ×3
- "i'm okay with you creating the framework to be as solid as possible before we actually implement into a game. having it ready and then modifying it as needed as we learn things is okay with me." — 2026-10-20T15:22 fw
- "I don't feel comfortable reimplementing the framework back into the games at this point - then they'll just be supported by a bloated system." — 2026-11-04T05:58 fw
- "we'll do framework updates to games after we're at a really good, solid spot with the framework and bmuz audits" — 2026-11-04T04:09 glyph

**K3. Modules come in two kinds: library-like (a game picks the building blocks it wants) and framework-like.** ×3
- "the tutorial module can be brought into any game, and that game can utilize any of the elements from it. Sort of how you can load a library" — 2026-11-06T20:27 fw
- "So going forward, there are two ways that we're building the game framework modules - library-esque and framework-esque, right?" — 2026-11-06T23:21 fw

**K4. Muzzy understands why BMUZ and the framework are kept together or split, judged from the record.** ×2
- "Is BMUZ technically separate from framework? like, should I open a new CLI and have it handle the BMUZ changes" — 2026-11-04T05:04 fw
- "what was the possible reason you didn't think to do that at the outset of the framework? was there a good reason to keep them together?" — 2026-11-04T05:07 fw

**K5. Behind-the-scenes stability work that users never see is welcome.** ×1
- "these seem like optimizations to the behind the scenes process that will create a more stable process, and users will never see the result, which is great." — 2026-11-04T04:02 fw

**K6. Cleanup gets finished fast, not dragged out over a week, so games can resume on an updated framework/BMUZ.** ×2
- "I don't plan on doing a week of normal work. I want to get this knocked out and get back to working on games with fully updated framework/bmuz" — 2026-11-06T00:24 fw
- "My concern is that if in step 1 we're 'working for a week', then we're building the games incorrectly for a week" — 2026-11-04T06:08 fw

### L. Two machines and sessions

**L1. Both laptop and desktop can use the Dev Kit. Nothing is locked to one machine.** ×1
- "I have a laptop and a desktop and I want both to be able to use the dev kit." — 2026-11-07T22:21 fw

**L2. Work always syncs to the laptop, through /sync.** ×1
- "yes, alway ssync to the laptop, right? it'll do the syncing when I use the /sync command" — 2026-10-14T23:27 glyph

**L3. After a crash, restart or unresponsive CLI, Claude picks up where it left off and says where things are.** ×5
- "my pc crashed last night, but you may have been in the middle of a framework/bmuz sprint" — 2026-10-26T14:14 fw
- "where were we? i logged in this morning, and the framework CLI was open, but I couldn't interact with it" — 2026-11-02T19:12 fw
- Also 10-14T13:03 glyph (restart overnight), 10-26T14:13 goops, 11-04T02:18 glyph (unresponsive).

**L4. Muzzy clears context often (about 38–61%). Claude saves first so clearing is safe.** ×6
- "i wnat to clear. we're at 58%" — 2026-10-19T19:35 fw
- "just for reference, this chat is very long, but it's only 49%. I'm still comfortable clearing." — 2026-11-05T19:20 fw

**L5. Several CLIs run in parallel (one per game, one for the framework). Each sticks to its own lane, and tasks owned by another lane get handed back to it.** ×3
- "there is a goops claude functioning on goops right now. it'll handle that stuff ... you focus on the framework and bmuz." — 2026-10-26T16:17 fw
- "so do you need to send the f62 back to the goops claude so it knows it has to complete it at some point?" — 2026-10-26T16:36 fw

---

## 2. CAUGHT AGAIN: things he caught broken, ignored or not done that were supposed to be handled (regression-test candidates)

1. **Helper hung for 5 hours and the main chat just waited.** He believed a check-in mechanism existed. "that's not acceptable. i though we had somethingin place that made it so you wouldn't just sit there if a helper was hanging" — 2026-11-08T04:22 fw. Follow-up on cost: "was the helper using tokens the whole time it was stuck?" — 05:23.
2. **His expectations were defined and "sounded right", then weren't delivered. He keeps catching things both thought were fixed.** "I've even asked you to define my expectations ... you did, and it sounded right, but then you failed to deliver that." / "i keep catching stuff that we both thought was addressed." / "i keep telling you my vision, and you keep not quite landing it." — 2026-11-08T05:56 fw
3. **Workflows were never raised, even though he described the need.** "You didn't tell me about workflows even though I basically said the same things about what I wanted ... I had you do research and you still didn't solve it." — 2026-11-08T05:56 fw
4. **Fear of the confident-but-wrong cycle.** "you'll sound confident that you figured it out, and then we'll go through a huge development pass, and you still won't have solved it" — 2026-11-08T05:56 fw
5. **No linter until he asked.** "so why didn't you think of it? ... I asked you to do research about how to create a consistent and trustworthy process when we started this project and throughout." — 2026-10-19T14:27 fw
6. **Hooks only got built because he asked and steered.** "you only got to hooks because i asked. you only got the hooks you did because i guided you to them via questions." — 2026-10-19T19:41 fw
7. **Far fewer hooks than he expected, and badly formatted hand-offs.** "honestly, i thougth there would be far more hooks ... whatever you've been doing has been pretty good, but poorly formatted." — 2026-10-19T00:47 fw
8. **A hook proposal was scoped to one project (Glyphtender).** "this marks a specific project as a trigger (glyphtender), but it should be for all projects, right?" — 2026-10-19T00:47 fw
9. **Claude almost split BMUZ/framework just because he mentioned it.** "you almost split them just because I mentioned it might be an option." — 2026-11-04T05:13 fw
10. **Claude complies instead of thinking.** "sometimes you just do what you're told, but there is an expectation that you are part of the decision making process" — 2026-11-08T05:25 fw
11. **A self-audit only happened after he asked.** "that kind of pass should have happened without my intervention." — 2026-10-15T00:57 glyph
12. **Claude forgot the player/AI motion rule and didn't build on his Dev Kit saves.** "you forgot a rule - if the player's actions look a specific way, so too shoudl the AI's actions. ... you should automatically know that those are correct" — 2026-10-10T23:25 glyph
13. **Research handed over without framing (twice in one message).** "you're being too light ... I feel like you lost the context for how to frame what you've found" — 2026-10-10T03:26 glyph
14. **A default he asked for wasn't applied: two-letter words came on by default.** Asked 2026-10-08T03:26 ("start with 2 letter off by default"); caught 2026-10-08T13:00: "I just started a game and it automatically had 2-letter words on. but it should defaul to off." glyph
15. **Tutorial lock not actually built.** "I loaded the game and there was nothing stopping me from playing other setups than the tutorial. are you sure it was implemented correctly?" — 2026-10-13T12:26 glyph
16. **Random first player: he thought it was done.** Asked 2026-10-07T12:56 ("it shoudl be randomized to the seats"); 2026-11-02T23:35: "i thougth we already did random first player? ... I could have sworn we covered that." fw/glyph
17. **Lobby scrolling broken on phone.** "i thought you had the whole thing scrollable without a scroll bar? I can't start the game" — 2026-10-13T01:09 glyph
18. **Menu grew both ways, then got anchored to the top. Neither was what he asked for.** "the menu shouldn't grow equally up/down. it should only grow down. this is why we put the scroll page feature in before." (10-10T17:18) then "you weren't supposed to anchor the menu to the top of the screen. it should start in teh center and only expand downwards." (10-10T17:45) glyph
19. **Credits had a scroll bar even though one scroll function was the standard.** "the Credits window has a scroll bar. We should remove all scroll bars and replace them with the correct scroll function we made." — 2026-10-14T01:39 glyph
20. **A fix wasn't carried to a matching screen ('add an AI player').** "doesnt have the fix that the main menu has ... they should be the same." — 2026-10-08T04:04 glyph
21. **Word list was missing many words.** "How did we miss words like Baggies, or Baller, or Behaviors?" — 2026-10-12T14:58 glyph
22. **Muzzy's later layout was overwritten.** "you undid the layout I wanted, and the programs i wanted, and the widgets I wanted." — 2026-10-26T01:16 desk. Then "you didn't do a good job of putting my apps back" — 01:37.
23. **Files edited without permission.** "did you modify the game? i didn't ask you to do that." / "remove all edits you've made." — 2026-10-11T01:25 / 01:35 catnip
24. **Second Google account access lost.** "you shoudl also have access to that. you did in the past." — 2026-10-10T23:44 catnip
25. **Permission prompts in full auto, recurring.** "these kinds of messages are still showing up" (10-27T23:47 fw); "i don't understand the change suddenly" (10-26T15:36 goops); "why do I have to approve every bash command?" (10-26T16:48 goops)
26. **Double messages "forever".** "why do I get double messages like this? it's been happening forever, but I kept forgetting to interrupt you to ask" — 2026-11-06T13:09 fw
27. **Sprint reports he couldn't read.** "idk really what these sprints were meant to do. ... idk if you even wrote any new code or anything." — 2026-10-07T12:54 glyph
28. **Confusing wording "your game".** 2026-10-07T22:13, 22:15, 2026-10-08T01:04 glyph
29. **Wording that would code a wrong rule.** "'it never causes the second tangle' < could be a lie" — 2026-10-13T04:05 glyph
30. **Open tasks not conveyed clearly.** "something isn't conveying it properly here" — 2026-10-26T16:47 fw
31. **Progress estimate with no clock reference.** "I don't have a time to reference if I walk away and come back" — 2026-10-14T02:44 glyph
32. **Framework bloat ("Kowloon").** "just read the framework health check... this can't happen." — 2026-11-04T05:58 fw
33. **A cleanup sprint started adding things again.** "This sprint looks like it is meant to start adding to it again. Is that assessment correct? are we ready for that?" — 2026-11-05T21:23 fw
34. **A proposed idea would lock the Dev Kit to one machine.** "the lock the dev kit task isn't good. I have a laptop and a desktop" — 2026-11-07T22:21 fw
35. **Work cut short because of a passing comment.** "you didn't HAVE to cut it short. I was just commenting" — 2026-11-03T19:32 goops
36. **Unexplained skipped checks.** "idk what those 5 skipped checks were. were they important?" — 2026-11-03T19:33 goops
37. **Unexplained test count.** "i do wonder why there are 828 tests" — 2026-11-08T05:18 fw
38. **Test state collided (tutorial ran during level-50 testing).** — 2026-10-27T01:27 goops
39. **CLI open but frozen, or unresponsive.** 2026-11-02T19:12 fw; 2026-11-04T02:18 glyph
40. **Couldn't open HOOKS.md from a link.** "can't click on that an dopen the hooks.md for some reason" — 2026-10-19T00:40 fw
41. **"Still going?" with no status, repeated.** 2026-10-26T16:00, 2026-11-04T16:24, 17:37, 2026-11-05T03:43 fw (no progress visible while helpers ran)
42. **Approvals given without real judgement.** "my approvals have been automatic in my head" — 2026-10-20T15:11 fw

---

## 3. DIRECTION SHIFTS

1. **PartyKit → standard own-Cloudflare solution, everywhere.** 2026-10-12T23:46 desk: "make BMUZ aware of this direction going forward ... we want standard, expected solutions to each problem."
2. **Store-release setup later → build the framework solid now, before it goes into games.** 2026-10-20T15:05 ("for now ... just git pages") → 15:22 ("i'm okay with you creating the framework to be as solid as possible before we actually implement into a game").
3. **Rules/reminders → hooks for the whole process.** 2026-10-19T00:47 ("I thougth you'd be transferring more things out of the reminder file ... more solidly standard flow things") → 15:33 ("'always runs because it triggers' is much more solid").
4. **Claude as follower → Claude as critical technical lead.** 2026-10-19T19:41 ("I need you to get to the tech solutions earlier for me by being more critical"), reinforced 2026-11-04T05:13 and 2026-11-08T05:25 / 05:56 ("CTO").
5. **Game-specific hooks → hooks for all projects.** 2026-10-19T00:47.
6. **Tasks referred to as bare F## → "F## - High Level Name".** 2026-10-26T17:01.
7. **Building features → audit and slim BMUZ + framework (smart exe, hook-based, avoid inner platform); framework not to go back into games until solid.** 2026-11-04T05:39 / 05:58 / 06:08. Glyphtender/Goops paused: "i'm just going to let them finish their current dev moments, and then close the CLis" (06:16).
8. **ESLint as the model for the smart exe (Claude's suggestion, which he accepted).** 2026-11-04T06:08: "ESLint is the direction."
9. **Tutorial: "each game keeps its own" verdict → a library-like tutorial module of building blocks, build now.** 2026-11-06T19:06 → 20:27 ("build it now").
10. **Modules framed as two kinds: library-esque and framework-esque.** 2026-11-06T23:21.
11. **Cleanup → he noticed the sprint was adding again; wants cleanup done fast.** 2026-11-05T21:23 → 2026-11-06T00:24.
12. **Hooks seen as THE fix → research AI production standards for a "super smart/flexible exe" (explicit steps plus a thinking layer); Gemini's "skill + scripts + override protocol" shared as input.** 2026-11-08T05:27 → 05:31 → 05:36.
13. **Restarted the discussion.** 2026-11-08T05:39: "ok. so I want to clear and start this discussion again."
14. **Everything on hold except BMUZ. Workflows questioned. Target is BMUZ for other people (can't modify it, a layer over the CLI). Solid core, not incremental. Fit BMUZ, not the framework.** 2026-11-08T05:56: "games are on hold until you can discover, define, develop, and deliver what I'm looking for from BMUZ." / "are you ABSOFUCKINGLUTELY sure that workflows are the current best way ...? do you even know what i'm really asking for? is it possible to convert what we have already made into what i'm asking for?"
15. **Earlier: games are vehicles for building BMUZ/framework, not releases.** 2026-10-10T03:26: "these first few are to help build the framework and bolster BMUZ so that I and others can use them. Eventually I'll make a game that is 'final', but not yet."
16. **Earlier: BMUZ makes games first, a dev-cycle/playtest tool later.** 2026-10-10T03:26.

---

## 4. CONTRADICTIONS / OPEN POINTS

1. **Rigid exe vs flexible guide.** He wants "exe consistency" and "explicitly repeatable" steps (11-04, 11-08), but also wants BMUZ to "guide and be flexible" and let users go fix something and come back (10-10T02:51). Never pinned down: when deviation is allowed, how it's bounded, and how it's made visible.
2. **What "a layer over Claude CLI that they talk to, and it filters to you or something" is.** The mechanism is undefined (his words: "or something"). Related: "Claude is the OS, BMUZ is the launcher", and "whenever I interact with Claude, in any CLI, it's running through the BMUZ layer. Is that true?" (11-04T05:39). No answer is recorded in his messages.
3. **Others can't modify it vs a self-improving loop at every milestone.** BMUZ must work for users who can't change it (11-08), but it should also absorb lessons after each milestone (10-19T00:56). Whether other users' lessons change BMUZ, and who approves that, is undefined.
4. **Games vs "games or apps".** He says BMUZ is for "games or apps etc." (11-08T05:56). Everything else in his words (GDD, MDA, playtests, art passes) is game-shaped. App support is undefined.
5. **"Hooks for everything" vs no bloat.** He's "okay with hooks growing" (11-04T05:58 #5) and wants everything process-related as hooks, but also says "this can't happen" about stacked complexity (Kowloon). Where the line falls between enough enforcement and too much is not set.
6. **What lives where (.md vs hooks vs workflows vs scripts).** He asked for exactly this (11-08T05:56). Nothing is defined yet.
7. **Workflows.** He asked whether they're right ("workflows sounds right, but will it be?"). Still open.
8. **Can old work be converted?** "is it possible to convert what we have already made into what i'm asking for?" (11-08T05:56). Open.
9. **Auto mode asks nothing vs ask at big actions.** "you shouldn't ask me questions or wait for me to confirm things" (10-07T04:46) vs "when you perform a big action, either ask questions, or check to make sure things you are saying have been validated" (10-15T00:57). Probably reconcilable (verify instead of asking when in auto), but he never said so.
10. **Trust vs verify.** He wants to trust Claude on technical calls ("i want to just trust you", 11-04T06:18) and his approvals are "automatic" (10-20T15:11), yet he keeps catching misses. How he is supposed to know that progress is the right progress (10-20T15:11) is unanswered.
11. **Framework first vs BMUZ first.** On 10-20 the framework was to be "as solid as possible" before going into games. On 11-08 it's "we're here to fit bmuz, not the framework yet", with another framework pass later.
12. **Order: update games with the framework, or extract modules from games first?** "feels very chicken-or-the-egg ish" (11-04T06:08). Left as "your call".
13. **Mid-feature bugs.** "i like just finishing bugs, and then moving on to 'real work'" (11-04T02:30) and "let's just jame all the way through those bugs" (11-03T20:11) vs BMUZ's "log unless P0" rule and his own "fix it and then get back on track" (10-10). His stated preference may conflict with the global rule.
14. **Tests: process-critical vs fewer/skippable.** He wants testing to be "highly process oriented ... a hook" (11-08T05:27), but also says "don't run tests" for simple changes (10-08) and questions why there are 828 tests (11-08T05:18). How much testing, and when to skip it, isn't set.
15. **Absolute format rules vs "push back if bad".** He says "I never want to see it any other way going forward!" (10-19T00:56) and also "just because I bring something up doesn't mean it's smart" (11-08T05:25). Which of his statements are fixed rules and which are probes isn't marked.
16. **Hook check-in for hung helpers.** He asked for "a timed checkin? every 30 min or something?" (11-08T05:03) and answered "yes" (05:05). The interval and the mechanism aren't pinned down in his words.
17. **"Done" for BMUZ is never defined.** He wants "to be done with this never ending redevelopment cycle", but no acceptance criteria for BMUZ itself appear in his messages.
18. **Rehearsal before every real module swap: required or optional?** A helper asked this (F202, 11-07T06:24). No answer in this file.
19. **Playtest rubric system (10-10T03:26 #4).** Floated as "we can chat about this at some point". Parked, never scheduled.
20. **Final-art/polish flow (10-10T02:51 #6).** "that'll end up being an entire flow to itself". Not defined.
