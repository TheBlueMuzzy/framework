# Mined from said-part2.md: what Muzzy expects from BMUZ

Source: all 2507 lines of said-part2.md, read in full. The file is NOT in time order: it is grouped by project folder (goops, dev/games, dev).
Teammate reports pasted into his messages were skipped. They are only used where they show that Claude did not reply to him or did not relay something.
Pure game-design messages (Goops/Glyphtender rules, story, tuning numbers) were skipped unless they say something about process, the framework, or how Claude works.
(xN) = how many separate times he said it.

---

## 1. EXPECTATIONS

### A. Why BMUZ exists: consistency, trust, works like an exe

- **BMUZ makes every game in a consistent, repeatable way, so that each game is better than the last.** (x4)
  - "I'm all for reproduceability and efficiency when making games. that's kind of the whole point of BMUZ - i know I can trust that it's going to make every game better than the last because it's improving the process" (2026-10-18T22:46)
  - "standardizing game creation for me and anyone else who uses it (making it easier for non-engineers to make great games because the skill makes you smarter and more organized and more consistent... consistency seems to be the issu)" (2026-10-18T22:46)
- **BMUZ behaves like an exe: Claude does the right thing at the right time, every time. It can still be edited and changed.** (x1, but stated as the core aim)
  - "I need to believe you'll do the right things at the right times. I want you to work like an EXE in some regards - except editable and malleable. are we approaching this correctly?" (2026-10-18T22:54)
- **Consistency comes from hooks and built-in standards, so Muzzy can trust that the same flow happens each time at the same quality.** (x2)
  - "The more hooks and standardization that we structure into this, the more I can trust you'll be able to reproduce the same flow each time at the same quality." (2026-10-23T03:30)
  - "okay, but should lessons be hooks?" (2026-10-19T13:54)
- **BMUZ sets up each game's architecture so that every framework module and tool works in it without regressions.** (x2)
  - "BMUZ architects games in a consistent way that allows for the Framework and all of our tools to function without regression?" (2026-10-18T22:37)
  - "you need to update BMUZ so that it knows how to create architecture that supports each of the modules that we make - the devkit is a module available in every game. the architecture builder knows that it needs to create live hooks and both pause buttons" (2026-10-18T22:29)
- **There is ONE way to do each thing. Each game follows the module's rules and does not invent its own version.** (x3)
  - "there should be ONE way we do it and this module, and the extra steps that come with it per game should follow that module's mandates. that way we keep it consistent." (2026-10-19T02:41)
  - "the devkit doesn't have the ? mode that glyphtender has. devkit needs to be standardized" (2026-10-19T01:08)
- **BMUZ improves itself. Lessons from each game flow back into BMUZ and the framework.** (x5)
  - "I DO want us to use this game tutorial building and notes as a way to bolster the tutorial framework" (2026-10-19T17:00)
  - "let's finish these and then we can start talking about bmuz recursive improvement processes" (2026-11-04T02:35)
  - "what's the retro change to the framework?" (2026-10-23T13:05)
- **New games will stress-test BMUZ and the framework, and both are expected to keep changing.** (x2)
  - "I plan on making more games and testing BMUZ flow from scratch as well as the framework. Happy it's getting bolstered now, because new games will challenge it and it will continue to change." (2026-10-23T03:30)
  - "When we finish goops, we'll be working on a new game that will have the foundation born from these 3 games." (2026-10-19T02:41)

### B. Process and stages

- **When a project already has material, BMUZ looks at what exists and then walks Muzzy through filling the gaps.** (x1)
  - "I want BMUZ to walk me through the steps to fill in the gaps after analyzing what you do have." (2026-10-16T21:56)
- **A remake keeps everything from the original, improved. Nothing from the original goes missing.** (x5; the misses are in Caught Again)
  - "the remake should really keep everything, but I want it more optimized, and better overall. I want it using all of the things we learned from the updating the framework and BMUZ" (2026-10-16T21:45)
  - "there should have already been notes about the story and progression in the old one." (2026-10-16T21:52)
  - "make sure you look at the original version of upgrades and flows. analyze them and understand the patterns that I was following." (2026-10-21T05:59)
- **For a new project the order is GDD, then PPP, then the work. The GDD is built through the Double Diamond stages.** (x1)
  - "in a new project it will probably be like a GDD > Project Planner Page (PPP) > actually working through things. And I think the DDDD process is likekly how you build the GDD." (2026-10-16T23:40)
- **New ideas raised mid-milestone always get challenged or checked.** (x1, a firm rule)
  - "yes, always challenge/check new ideas mid-milestone" (2026-10-17T00:17)
- **Dependencies between features are tracked, and they drive the order of work.** (x4)
  - "does that system need to be made in order for the AI banter system to tie into it? i ask because dependencies for featuers feel like they are important." (2026-10-23T03:30)
  - "Okay, so select is dependent on explore being created first. that's a dependency chain." (2026-10-19T02:41)
  - "after, i suppose. if you think that's best for some dependency reason." (2026-10-30T02:48)
- **A tutorial or feature that can be removed by a simpler design gets cut instead of built.** (x1)
  - "just lock the view to portrait... you can probably remove this task entirely if you lock the ability to have phone orientation affect the visual layout." (2026-10-30T16:34, glyphtender)
- **Sketches are the way to prove a feel. A sketch offers 2–3 options with knobs.** (x3)
  - "would love to see a sketch with 2-3 options and knobs. go auto" (2026-10-25T21:38)
  - "this idea is brand new and would require a decent rework... I'd like to explore it, but not sure its' fun yet. so a sketch would need to prove it out." (2026-10-17T01:23)
- **Things that work stay working. A rework does not quietly replace behaviour he already approved.** (x2; see Caught Again)
  - "you completely changed the ability of the periscope to follow the click/tap drag like an actual object, now you're just running an animation or something. it's horrible.." (2026-11-02T00:05)
- **Mid-feature notes get triaged, and Muzzy can see where they went in the plan.** (x2)
  - "I know this is a lot of mid-milestone notes. how are you handling them with regards to updating the ppp?" (2026-10-18T20:03)
  - "I want to continue to the next step, and I can write up bugs later... your call how important this is to fix now (maybe because of dependencies? or something, idk)" (2026-10-18T02:48)
- **Claude uses the right method for the question, e.g. math instead of a simulation when math will do.** (x1)
  - "don't do a simulation, do the math this time. figure out the right arc managing all those variables we've set." (2026-10-19T00:38)
- **Releases are batched. Nothing goes out publicly until several games are done and the framework/BMUZ updates have been brought back into the games.** (x1)
  - "I haven't and likely won't release to itch yet. I want to do that in a big release once we get through ahandful of games and the framework and bmuz are sufficiently updated, and those changes are brought back into the games themselves." (2026-11-01T23:58)
- **Before framework updates are put into a game, Claude checks whether the game is at a good point, and rehearses on the lightest game first.** (x3)
  - "Can you check first to see if Goops project is at a good point to inject the new framework? or will it take a logn time" (2026-10-30T00:30)
  - "do it for glyphtender. b. it's a lighter game, and I'm not currently working on it. so it's in a good place to figure out how to implement the updated framework" (2026-10-30T00:49)

### C. Autonomy, not stalling, and showing status

- **In auto mode Claude keeps going without him, and logs open questions for later.** (x9 "go auto" / "auto mode" messages)
  - "go auto - i'm travelling to work, so you need to just continue" (2026-10-29T13:04)
  - "auto mode. just keep track of what you couldn't answer with new questions and we can tackle those tomorrow.." (2026-10-17T05:16)
- **Claude may refuse to go auto if it judges that a bad idea, and may audit the process first.** (x1)
  - "if you think going straight ahead is a bad idea, then don't do it. I'll leave that call up to you. you can audit the process befor eyou go auto and decide not to - just tonight. that is not normal or standard procedure." (2026-10-17T05:16)
- **Muzzy can always tell whether Claude is working, finished, or waiting on him.** (x9: the most repeated pain point in this file)
  - "I can't tell very easily when you're finished. I thought it was that if in a recent menssage the progress bar wasn't at 100^, then you were doing things. and I should just wait. but then the 'NEXT" felt like you were puasing for me to give you some input or permission." (2026-10-30T06:00)
  - "is this still going? the last post was 15% at 8:58pm. it's now 10:48pm" (2026-10-30T02:48)
  - Others: 2026-10-30T02:01, 2026-10-18T23:15, 2026-10-19T19:23, 2026-10-26T03:55, 2026-10-30T03:24, 2026-11-01T17:33, 2026-10-30T01:56
- **"Waiting on me" never means a build is left unfinished.** (x1)
  - "it sais you're waiting on me. does that mean you're not going to finish the last 12% of that 12/14 build?" (2026-10-18T23:15)
- **The "agents running" indicator stays visible and does not vanish when he starts typing.** (x1)
  - "i see 2 agents are still working, but when I start typing that goes away... probably a hook. you can sendt hat note to BMUZ documentation" (2026-10-30T01:56–01:57)
- **Engineering calls are Claude's ("your pick"). Taste calls are his.** (x8+ "your pick" / "your call" / "do what you think is best")
  - "do what you think is best for the visual and experience" (2026-10-25T02:57)
  - "i don't know enough tech to think about what is a good fit for the framework vs specifically coded in game." (2026-10-23T03:36)
- **Claude can cd to the right project itself, without him pasting a command.** (x1)
  - "you are allowed to cd to get to the right project without having me copy/paste the command" (2026-10-25T04:53)
- **After a crash or reopen, Claude picks up exactly where it left off.** (x5)
  - "i had to close and reopen. let's pick up where we left off." (2026-11-04T02:31)
  - "you were working on something, but my comptuer crashed" / "no, i'm galking about your progress on Goops" (2026-10-21T05:33–05:35)
  - Others: 2026-10-29T12:57, 2026-10-21T05:33 (dev), 2026-10-19T01:04 ("clear and then continue from a clean state")

### D. "Assess" means report only

- **When he says assess, analyze or tell me, Claude reports in simple bullets and changes nothing until he picks.** (x3)
  - "assess first, and tell me what's going on in bullet point form - simple. and then we'll discuss solutions" (2026-11-02T04:38)
  - "don't make changes when my language is obviously asking to assess or analyze." (2026-11-02T04:43)
  - "analyze this... tell me what the differences you see are" (2026-10-18T20:20)
- **When his criticism is wrong, Claude pushes back softly instead of agreeing.** (x1)
  - "i just bullied you about something you didn't do. you DID correctly investigate and not act. I called you on something you didn't do - you should have pushed back softly." (2026-11-02T04:44)
- **Claude really looks at screenshots and sees what is in them.** (x2)
  - "incorrect. there is a periscope AND an orange border in the top right. look at the image again and assess." (2026-11-02T04:52)
  - "[Image #5] i zoomed out so you could see what I meant was the issue, because you didn't fix it." (2026-10-30T02:44)

### E. Communication style

- **Answers are lists, checklists and short explicit bullets, not paragraphs. Paragraphs make him rubber-stamp things.** (x2)
  - "I like lists. I like checklists. I like bullet pointed piece of concise, yet explicit information. reading paragraphs makes me more likely to just approve somethign so it moves forward" (2026-10-23T03:30)
- **When he's lost, Claude gives a short catch-up on where the work stands in the big picture.** (x3)
  - "I feel liek this claude window has gotten away from me. I'm not sure where this is in the big picture of things, or if you sort of went off the rails or not." (2026-10-23T03:19)
  - "simply catch me up a bit." (2026-10-23T03:23)
  - "I'm not exactly sure what this psrint is really for." (2026-10-21T05:39)
- **Feature numbers always come with their names.** (x1)
  - "what is f130?" (2026-10-25T01:17)
- **A "Questions:" section holds only questions, not information.** (x1, but "I've seen it a few times")
  - "this didn't seem like a question. it felt like information. this section is called Questions: i'm confused by that. i've seen it a few times." (2026-10-24T02:29)
- **Jargon, coined phrases and status icons get explained, along with where they came from.** (x4)
  - "what does "goo never decides a rule' mean? and where di that come from?" (2026-10-16T23:05)
  - "how do I read the above purple text? i don't know what those icons mean. i forgot" (2026-10-24T22:40)
  - "idk what this means really. taller 'chips'?" (2026-10-30T13:22)
- **Claude's wording about who owns an idea is clear, and attribution beyond that isn't needed.** (x2)
  - "'yours'? meaning the original? because the band is my idea too... your wording references aren't clear." (2026-10-19T00:38)
  - "i don't know I need the 'whose idea it was' and stuff" (2026-10-23T03:30)
- **Big decisions come with a pitch, so he understands why Claude set it up that way.** (x3)
  - "sell me on why you set things up the way you did. I'm okay with you wanting to do it a dfiferent way. i just need to understand." (2026-10-16T23:54)
  - "you'll have to come up with something and sell me on the strengths of it and how well it fits the tenants of BMUZ" (2026-10-16T23:40)
- **When a flow is complicated, he gets a visual walkthrough.** (x1)
  - "I think I need a visual walkthrough of how you plan on handling the credits and fines flow." (2026-10-23T14:28)
- **Claude's facts about project history are right.** (x1)
  - "3 years of changes? what? We just reworked it recently, so it shouldn't be that old." (2026-10-19T02:41)
- **When Claude suggests a change, it explains what was there before and what it thinks it should become.** (x1)
  - "explain what it was, and what you think it should be if you think it should change" (2026-10-25T21:27)
- **Framework and BMUZ work is mostly invisible to him, so it needs to be made visible.** (x2)
  - "a lot of the things with the framework and BMUZ I can't really 'see' them because they are about process and only really visible when applied to something." (2026-10-23T03:30)
  - "I'm looking at the UI kit and I don't see "notifications" references at all. I looked at the Gallery... still no visual here" (2026-10-25T19:32)

### F. Planning files and views (PPP, sketches)

- **Every project has a home screen (the PPP): a project planning page that Claude updates as things finish.** (x1, the origin of the PPP)
  - "I think each game project should have a 'home screen' like this. essentially a project planning screen that you update when you complete things. It is not editable by the designer, but there are collapsible/expandable sections." (2026-10-16T23:40)
- **The PPP is robust yet simple, and flexible enough to fit different projects.** (x1)
  - "It has to be flexible, as you've seen from the process of glyphtender... Maybe we start here and see how robust, yet simple we can make this project plan center." (2026-10-16T23:40)
- **Milestones (the top-level nodes) show a %. Sub-tasks show states. Items carry must/should/nice/won't.** (x2)
  - "I like having things flagged with the must, should, nice, won't... I was thinking the collapsible top tier node was what had the % on it(milestones). And the sub tasks had states." (2026-10-16T23:54)
- **The % may drop when a feature is added. Once the musts are done, he decides on the rest, and rejected non-musts move out of the milestone to "maybe laters" so nothing gets lost.** (x1)
  - "i'm totally okay with the % complete dropping if we add a new feature to the milestone... if we say no to a non-must, then it should be moved OUT of the milestone to a list of 'maybe laters'... i don't want possible things to get hidden/lost in the completed milestones." (2026-10-17T00:17)
- **Ideas are kept apart from milestones. Requests he makes mid-milestone that relate to the active work go into that milestone as features.** (x1)
  - "agreed on ideas being separated, however, I defienitely (and others will too) hijack milestones and ask for things that are pertinent to the active tasks. those are not 'ideas' i guess. instead they are just new features that go into that milestone." (2026-10-17T00:11)
- **/ppp opens the page in the browser instead of handing him a link.** (x1)
  - "i think /ppp is a command that brings up this page. can it just launch the browser page instead of giving a link?" (2026-10-17T00:24)
- **The PPP's "the game" section is not dense or boring.** (x1)
  - "'the game' section is boring and dense looking. you did a better job on the previous version for that section." (2026-10-17T00:24)
- **The PPP has a Sketches section with one tab per sketch, so he can click through and play with them.** (x1)
  - "Maybe the PPP can have a 'sketches' section with each sketch in a tab so I can click through them and 'play around' with them." (2026-10-17T01:08)
- **The Sketches panel shows ONE sketch area. Tab buttons load the chosen sketch into it.** (x2; see Caught Again)
  - "one area for the sketch. the buttons load the specific on that's pressed intot hat one area." (2026-10-30T02:40)
- **Sketch tabs come in a findable order.** (x1)
  - "the sketch tabs should all be alphabetical... or maybe most recent is the last one? something. It's a pain to find what I need as there are more and more." (2026-11-01T17:40)
- **Sketch knobs sit to the right of the sketch on desktop, so the sketch stays full size.** (x2)
  - "can you put the 'knobs menu' off to the side? i can't see very well what the changes are doing" (2026-10-17T03:01)
  - "since all my dev happens on the computer and not on the phone, can we put the knobs menu to the right of the sketch" (2026-10-17T04:08)
- **Sketches can save, add and switch presets.** (x1)
  - "Can you update the sketch knobs menu so that I can save 3 presets and switch between them? + Preset creates a new preset." (2026-10-17T04:08)
- **Each knob's range is wide enough to see a change, its value can be typed in, and its name says what it does.** (x3)
  - "I'm not convinced the range is enough to see something actually change" (2026-10-17T04:53)
  - "maybe the sliders are great, but the value display should be an editable text box so i can type in the value I want?" (2026-10-23T20:10)
  - "I have no idea what tension or merge is even doing... define them for me in this sketch" (2026-10-17T04:35)

### G. Framework modules and the Dev Kit

- **Dev Kit changes take effect live in the running game.** (x1, stated as "I thought that was clear")
  - "the purpose of the devkit is to affect things live. I thought that was clear. maybe it was and you just hadn't fully implemented that yet." (2026-10-18T22:29)
- **Game hotkeys are off while the Dev Kit has focus.** (x1)
  - "while the devkit was open. hotkeys in game were still working... devkit module should be updated" (2026-10-18T21:58)
- **The Dev Kit has a pause button, and maybe a half-pause (state paused, animations running) if that makes sense for every game.** (x2)
  - "the Dev Kit needs a Pause button || to the left of DEV-KIT... full pause and half-pause... can this logically be applied to other games that we've made? ... If it doesnt' make sense for all games, then full pause is the only button" (2026-10-18T22:08)
- **Values he saves in the Dev Kit are treated as decisions.** (x1)
  - "fonts were picked and I saved them in the devkit" (2026-10-19T04:53)
- **The Dev Kit can preview fonts (title, header, body), and the UI kit can reach the fonts installed on his machine.** (x3)
  - "I'd like to be able to (in the dev kit) choose the fonts. Generally there's like a title font, a header font, and a body font" (2026-10-18T19:48)
  - "the ask for the UI kit was to gain access to all the fonts installed on the users machine (with permissions)" (2026-10-23T02:47)
- **Every game shows its version number (main menu, maybe settings) through a framework version module.** (x2)
  - "I think the version number visibility is important in all games... This should be a built in process, possibly a 'version' framework module that gets added to every game" (2026-10-20T15:42)
  - "(which should be using the frameworks version module so it's up to date when I open it)" (2026-10-24T16:26)
- **Test links and rank selectors drop him at the state he is meant to test.** (x2)
  - "you had me open ?rank=6, and I have 4,101 xp at operator rank 13. there's a big disconnect here." (2026-10-19T16:19)
  - "i don't know that I'm getting 'fresh play' - when i click on the links above i'm lvl 18. maybe we need the v1's rank selector back" (2026-10-24T16:26)
- **The UI kit's checks catch on-screen overlap and off-screen UI.** (x1)
  - "If your UI kit can see the overlapping, then it should have caught this!" (2026-10-18T02:48)
- **Reusable look pieces become framework categories: render shaders, tutorial toaster types, speaker bubbles, profile/avatar.** (x5)
  - "that render shader should be accessible to apply to things in the future, and should feel pretty simple/fast to apply." (2026-10-19T20:39)
  - "i think 'render shaders' (looks like the crt look that's reusable) should be a category of component we want to get better at." (2026-10-19T23:01)
  - "this is probably going to be part of teh framework." (speaker bubble, 2026-10-23T15:57)
  - "we don't have a module for a profile or avatar system yet. maybe we get that in Goops." (2026-10-24T02:17)
- **Lessons he passes on to the framework get reorganised into their clean, non-redundant form before they are stored.** (x2)
  - "let's make sure this information is in the most helpful format and isn't redundant in any way... look at this information and reorganize it properly before committing it to the notes." (2026-10-19T17:00)
- **Claude decides whether a request belongs in the framework or in the game, and tells him which.** (x3)
  - "is this a UI Kit update? or is it just for this game? how are you looking at this?" (2026-10-23T03:04)
  - "there are some things that are best IN the framework, and others that should be in the game speciically... should it just be, the ability to highlight borders in the framework...?" (2026-10-23T03:36)
- **Things already solved in one game get reused in the next, not rebuilt.** (x2)
  - "we did it in Glyphtender with the UI kit. no scroll bar, just obviously hangs off screen." (2026-10-24T03:21)
  - "is what you're proposing the same as how you implemented it in glyphlings? if not, there should be ONE way" (2026-10-19T02:41)

### H. Parallel sessions and windows

- **Sessions can see and message each other, and work together like helper agents.** (x3)
  - "I didn't know you could directly see other claude sessions running... that seems incredibly useful for parallelizing the process." (2026-10-23T03:14)
  - "send a message to the other claude session to continue and offer an explanation... when you're done, you'll send it a message... trying to get you to talk to each other, so you both don't get tripped up." (2026-10-23T03:42)
- **One window does framework/BMUZ work and another does the game, each with a clear purpose.** (x4)
  - "I have 2 windows open. one (this one) was to continue development on BMUZ and the Framework modules, and the other is to work directly on Goops." (2026-10-23T03:23)
  - "would it be smart to open anothe rclaude to do framework/bmuz stuff in parallel with goops progress? or ... goops progress requires the result" (2026-10-18T22:43)
- **Finished game pieces can be extracted into modules by another window and later merged back. This is for Muzzy's own framework development, not for other users.** (x1)
  - "can we send module extraction to the other window or something?... This might be a really nice function moving forward - just for me though. not for other people... then obviously there needs to be some form of re-integration once complete?" (2026-10-24T02:17)
- **Hook updates running in another window don't break work in progress here.** (x2)
  - "i've got another client updating a lot of hooks, so I wonder if those are being noticed in your current process, or if it's messing it up that it's running in parallel?" (2026-10-19T19:14)

### I. Platform and device

- **Phone games are portrait-only. Turning the phone never changes the layout, and Claude never asks about landscape again.** (x6 across games; see Caught Again)
  - "NO PHONE SIDEWAYS EXPECTATION. I've said it 3 times now." (2026-10-19T20:39)
- **On phone games, all UI fits inside the phone-width view.** (x3)
  - "this is a phone game - all elements should be visible and cohesive with the other UI in the main view." (2026-10-18T02:14)
  - "you have information showing up outside of the actual viewable area since this is made for phones." (2026-10-19T16:40)
- **Development and testing happen mainly on the PC, with phone checks later.** (x2)
  - "i'm developing fully on PC for now. I know it's phone focused, but I'll check phone later." (2026-10-19T06:02)

### J. Other users and distribution

- **BMUZ is for him "and anyone else who uses it", meaning non-engineers.** (x1 in this file)
  - "standardizing game creation for me and anyone else who uses it (making it easier for non-engineers to make great games..." (2026-10-18T22:46)
- **Other people will use it the same way he does, e.g. "hijacking" milestones.** (x1)
  - "I defienitely (and others will too) hijack milestones" (2026-10-17T00:11)
- **The framework repo can be public.** (x1)
  - "well.. why don't i make it public?" (2026-10-23T22:06), then ran `gh repo edit ... --visibility public`

### K. Context and session hygiene

- **He clears at about 40–50% context and expects his answers to be captured before the clear.** (x4)
  - "we're at 42% and i want to clear before developing, but you can capture my answers,a nd answer my 2 answer before I clear." (2026-10-30T13:22)
  - "i need to clear, and then you can help me setup the crash server online." (2026-11-01T04:50)
- **Idle compaction is off.** (x1)
  - "i think it would be good if idle compaction was turned off. yes." (2026-10-26T01:02)

---

## 2. CAUGHT AGAIN (regression-test candidates)

1. **Sketches panel showed one block per sketch instead of one shared area. He reported it, it was "fixed", and it came back.**
   - "why are there sooo many blank areas below it?... that's now how the sketches panel should work." (2026-10-30T02:40)
   - "i zoomed out so you could see what I meant was the issue, because you didn't fix it. these black sectiosn go on and on" (2026-10-30T02:44)
2. **A rework silently replaced approved behaviour (periscope drag turned into a canned animation).**
   - "i don't know why, but you completely changed the ability of the periscope to follow the click/tap drag like an actual object... it's horrible.." (2026-11-02T00:05)
3. **Claude asked about landscape/portrait again after he had already ruled on it.**
   - "the phone shouldn't ever go on it's side in this game. it's a vertical (portrait only) game." (2026-10-19T03:53)
   - "a phone held sideways should never affect the orientation of the game." (2026-10-19T18:46)
   - "NO PHONE SIDEWAYS EXPECTATION. I've said it 3 times now." (2026-10-19T20:39)
   - It came up again for Glyphtender: 2026-10-30T13:22, 16:34, 18:11 ("sideways shouldn't matter... there is only 1 portrait view.")
4. **Claude asked a question he had already answered.**
   - "cracks sealed during the post-rupture drain should count towards your quote. i already answered this before." (2026-10-19T04:53; first answered at 2026-10-19T00:38)
5. **"Assess" led to actions, or he believed it did.**
   - "wtf? i told you to assess and report. not to act. i thought that language was clear." (2026-11-02T04:43)
   - In this case Claude had not acted, and he wanted soft pushback (2026-11-02T04:44).
6. **Claude misread a screenshot.**
   - "incorrect. there is a periscope AND an orange border in the top right. look at the image again" (2026-11-02T04:52)
7. **Things from the original game went missing in the remake.**
   - "one big missing issue are the 'cracks off screen' indicators... it was in the original. you must not have done it yet." (2026-10-18T02:14)
   - "a lot of teh original tutorial touches are missing, like clicking on the wrong goop should do the jiggle thing that we implemented." (2026-10-24T06:35)
   - "i think the first version had little droplets that 'sprayed' when a goop was zapped. I think those need to return." (2026-10-24T06:35)
8. **A feature he had asked for didn't show up, or didn't trigger, when he tested it.**
   - "i didn't see the jiggle when clicking a not-finished-priming locked goop cluster" (2026-10-19T03:53)
   - "the visor meter isn't at 0 yet, but the screen is already glitched. i talked about the screen no starting it's glitch cycle until the meter reaches 0." (2026-10-19T03:33)
   - "the visor tutorial never loaded for me... it wouldn't trigger" (2026-10-19T18:46)
   - "tutorial zap didn't have any goop in it" (2026-10-24T16:26)
9. **Built against the spec he gave.**
   - "veteran is a light colored bubble with dark text. but you have it as a dark colored bubble with white text." (2026-10-24T07:07)
   - "so the 6.5 unit on average above goop that is already there thing you did was wrong" (2026-10-19T05:03)
   - "the ask for the UI kit was to gain access to all the fonts installed on the users machine" (2026-10-23T02:47)
10. **The Dev Kit didn't work live, though that is its whole purpose.**
    - "i tried changing these settings... but they didn't do anything." (2026-10-18T22:08)
    - "the purpose of the devkit is to affect things live. I thought that was clear." (2026-10-18T22:29)
11. **The Dev Kit didn't follow the standard across games.**
    - "the devkit doesn't have the ? mode that glyphtender has. devkit needs to be standardized" (2026-10-19T01:08)
12. **The UI kit check missed an overlap he could see.**
    - "If your UI kit can see the overlapping, then it should have caught this!" (2026-10-18T02:48)
13. **UI drawn outside the phone view, repeatedly within one review.**
    - "again, i worry that the tutorial toaster is showing up outside of teh phone visible area" / "again, the tutorial toaster says something unhelpful, and is off screen." (2026-10-19T16:40)
14. **Test links opened the wrong state.**
    - "you had me open ?rank=6, and I have 4,101 xp at operator rank 13." (2026-10-19T16:19)
    - "when i click on the links above i'm lvl 18." (2026-10-24T16:26)
15. **He couldn't tell whether Claude was working, done, or waiting on him.**
    - 2026-10-18T23:15, 2026-10-19T19:23 ("did it stall?"), 2026-10-26T03:55–03:56 ("f40 confirming worktree is clean after commits running for 42 minutes"), 2026-10-30T02:01, 2026-10-30T02:48 (two hours with no update), 2026-10-30T03:24, 2026-10-30T06:00, 2026-11-01T17:33
    - Related: a helper reported "You never replied to my mid-task message, so I left it as an Ask Muzzy" (f52-pace, 2026-10-30T07:30). Its question was not relayed or answered in time.
16. **The window drifted. He lost track of what it was working on and why.**
    - "I feel liek this claude window has gotten away from me... or if you sort of went off the rails or not." (2026-10-23T03:19)
    - "I've just been passing, sprinting, and developing whatever you've put in front of me because it all sounded kind of technical" (2026-10-23T03:23)
    - "f24 22. yeah... that's a little off the rails" (2026-10-23T03:30)
17. **He feels he has already had the "consistency conversation".**
    - "i feel like I've had this consistency conversation with you before." (2026-10-18T22:54)
18. **A "Questions:" section held information.**
    - "this section is called Questions: i'm confused by that. i've seen it a few times." (2026-10-24T02:29)
19. **Claude used coined phrases or icons without explaining them.**
    - 2026-10-16T23:05 ("goo never decides a rule"), 2026-10-24T22:40 (purple icons), 2026-10-30T13:22 ("taller chips")
20. **Claude got a fact about the project wrong.**
    - "3 years of changes? what?" (2026-10-19T02:41)
21. **Tutorial messages appeared in two steps or doubled up, after he had asked for one at a time.**
    - "those shouldn't happen separately. they should happen together." / "there are two messages... it should just be one message." / "the new tutorial toaster pops up, showing 2 different texts. no." (2026-10-19T16:40)
22. **A shader job took much longer than expected for what it was.**
    - "you did great with the scan lines in the text, but it took a lot longer than I thought it would take." (2026-10-19T20:39)

---

## 3. DIRECTION SHIFTS

1. **Goops remake becomes a BMUZ test case.** From: the old Goops. To: "let's rebuild it but with BMUZ 2", using everything learned from the framework and BMUZ. (2026-10-16T21:38, 21:45)
2. **The PPP is born.** From: plan files only. To: a per-project home screen, the Project Planner Page, that Claude updates and the designer doesn't edit. (2026-10-16T23:40)
3. **Ideas are split from milestones.** From: "I feel like ideas belong in milestones?" (2026-10-16T23:54). To: "agreed on ideas being separated", with mid-milestone requests becoming features of that milestone (2026-10-17T00:11).
4. **Sketches move into the PPP.** From: standalone sketches. To: a Sketches section with tabs (2026-10-17T01:08). Then: one shared area loaded by the tab buttons (2026-10-30T02:40).
5. **BMUZ's job becomes architecture, not just process.** From: modules added per game. To: "BMUZ architects games in a consistent way that allows for the Framework and all of our tools to function without regression" (2026-10-18T22:29, 22:37).
6. **BMUZ should work like an exe.** From: Claude following instructions. To: "work like an EXE in some regards - except editable and malleable", with research into how senior engineers get reliably consistent results from Claude (2026-10-18T22:54).
7. **Enforcement moves to hooks.** From: lessons written down. To: "should lessons be hooks?" (2026-10-19T13:54), then "The more hooks and standardization... the more I can trust you" (2026-10-23T03:30).
8. **Two windows.** From: one session. To: one window for framework/BMUZ and one for the game (2026-10-18T22:43, 2026-10-23T03:23), with sessions messaging each other (2026-10-23T03:42).
9. **An extraction pipeline (his use only).** To: finished game pieces are extracted into modules by another window and merged back (2026-10-24T02:17).
10. **Back to linear.** From: enthusiasm for parallel windows and helpers (2026-10-18T22:43, 2026-10-23T03:14). To: "while i love parallel processes, I think I'd like to keep these linear for now." (2026-10-30T03:25)
11. **Framework catch-up rehearsed on Glyphtender, not Goops.** From: putting the new framework into Goops (2026-10-30T00:30). To: "do it for glyphtender... it's a lighter game" (2026-10-30T00:49).
12. **Release strategy becomes one big batch.** To: no itch release until "a handful of games" are done and framework/BMUZ changes are back in the games (2026-11-01T23:58).
13. **BMUZ improving itself becomes the next topic.** "then we can start talking about bmuz recursive improvement processes" (2026-11-04T02:35). Also "doing a lot of work with the framework and bmuz audits in another CLI, so I just want to get this to a stable place asap." (2026-11-04T06:10)
14. **Portrait-only phone games as a rule.** Ruled for Goops (2026-10-19), then for Glyphtender ("glyphtender should be a vertical game only", 2026-10-30T13:22).

---

## 4. CONTRADICTIONS / OPEN

1. **Parallel vs linear.** He loved sessions talking to each other and parallel windows (2026-10-23T03:14, 03:42; 2026-10-24T02:17), then said "keep these linear for now" (2026-10-30T03:25). It was never settled when parallel is OK.
2. **For everyone vs just for him.** BMUZ is for "me and anyone else who uses it" (2026-10-18T22:46), but the extraction pipeline is "just for me though. not for other people" (2026-10-24T02:17). Which parts are Muzzy-only was never drawn.
3. **"Your call" vs "don't act."** He often hands over judgement ("your call how important this is to fix now", 2026-10-18T02:48; "your pick"), but assess/analyze means no action (2026-11-02T04:43). The line between "decide and do" and "report only" relies on reading his wording.
4. **Trusting blindly vs wanting to follow along.** "I'm sloppy because I'm trusting you... blindly trust you're doing the right thing. that's because it's where I want this flow to get to" (2026-10-23T03:30), yet he is upset when the window drifts "off the rails" (2026-10-23T03:19). How much oversight he wants was not pinned down.
5. **PPP states.** Whether states are Double Diamond stages, project-management states, or both was left to Claude to "sell me on" (2026-10-16T23:40). How ideas move into milestones (a staging area vs straight into a themed milestone such as Audio) is an open question in his own words (2026-10-17T00:11).
6. **PPP not editable vs live editing.** The PPP "is not editable by the designer" (2026-10-16T23:40), while the Dev Kit must "affect things live" (2026-10-18T22:29). No conflict inside this file, but how he changes plans other than through chat was not stated here.
7. **Half-pause.** He wanted it only "if it makes sense for all games" (2026-10-18T22:08), later said "half-pause, idk. can i click things while in half pause? if not, then no" (2026-10-19T04:53). Unresolved.
8. **Sketch tab order.** "alphabetical... or maybe most recent is the last one? something." (2026-11-01T17:40). Unresolved.
9. **Phone-first vs PC-first.** The games are phone-focused and portrait-only, but "all my dev happens on the computer" (2026-10-17T04:08) and "I'll check phone later" (2026-10-19T06:02). When phone checks are required was not pinned down.
10. **Framework vs game boundary.** He says he can't judge it ("i don't know enough tech", 2026-10-23T03:36) and asks each time (2026-10-23T03:04). No standing rule was stated.
11. **What makes a framework category.** He named render shaders, tutorial types, speaker bubbles and profile/avatar as framework candidates (2026-10-19T23:01; 2026-10-23T15:57; 2026-10-24T02:17). There is no stated rule for when something game-made becomes framework.
12. **Consistency is the stated core goal, but how to reach it is still a question.** "are we approaching this correctly?" (2026-10-18T22:54). He asked for research on how senior engineers do it, and the answer was not settled in this file.
13. **Simulation vs math.** He told Claude to "do the math this time", not a simulation (2026-10-19T00:38), but approved bot simulations for tuning elsewhere (2026-10-30, 2026-11-04). When each is right was not stated.
14. **Visibility of BMUZ/framework work.** He "can't really 'see'" process work (2026-10-23T03:30) and says "that's also okay", yet complains "still no visual here" about the UI kit (2026-10-25T19:32). How framework work should be shown to him is open.
