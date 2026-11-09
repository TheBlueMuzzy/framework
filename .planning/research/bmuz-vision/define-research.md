# Define: choosing the bricks before the game is designed

Research for F218 (the Define pipeline), task 1. Written 2026-11-09. This builds on `discover-creative-research.md` (§6: Discover collects bricks and never chooses) and `discover-research.md` (H1–H26). It is the research only; nothing in it is built yet.

**How first-hand this is:**
- **(F) Fetched:** the page was downloaded in full (HTTP 200) with curl and its text read in this run. Quotes from these pages are exact.
- **(S) Snippet:** seen only in a web-search excerpt, or the site refused the fetch (Derek Yu's Tumblr returned 403). Claims resting on these are marked **(snippet)**.
- **Second-hand:** Cerny's "Method" comes from an unofficial slide summary on SlideShare (F) plus a designer's write-up (F), not his DICE talk itself. Schell's lenses come from Ted Neward's reading notes (F), not the book.
- **Extrapolated:** my own reasoning, not a source's, is marked that way.
- **Strength marks:** **strong** = a primary source or several agreeing ones; **some** = one practitioner's view or a summary; **weak** = a snippet, or a single blog with no backing.

**What Muzzy has already decided (2026-11-09):**
- Five stages: discover (collect the bricks) · define (choose them, the 3–5 line story, scope) · design (put them together into the complete GDD) · develop · release (VISION V48).
- The 3–5 line story is a GDD section, filled in during Define.
- Keep every on-ice idea. Define should "react with whichever ones are useful at the time".
- Existing material (rulebooks, notes) goes through an intake first, then hands to Define (F225 — Start from what you have).

---

## 1. What designers and studios do between "we've collected ideas" and "we're designing the game"

### The design world's Define (Double Diamond)
- **The output of Define is a brief.** The Design Council's history of the Double Diamond says Define is "to make sense of the findings, understanding how user needs and the problem align. The result is to create a design brief which clearly defines the challenge based on these insights." — [Design Council, History of the Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/) (F) · **strong**
- **First diamond = the right thing, second = the thing right.** Quoted on the same page: "the first part of the diamond is about questioning the brief and defining the problem statement … 'designing the right thing'. The second part … exploring possibility, iteration, testing and developing, so 'designing the thing right'." — same (F) · **strong**
- **Define reframes, it doesn't only narrow.** "The insight gathered from the discovery phase can help you to define the challenge in a different way." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) (F) · **strong**
- **It loops.** "It's not linear! … through testing something, you reveal a much deeper issue that requires you to 'go back to the beginning'." — [Design Council, Double Diamond 15 years](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/double-diamond-15-years/) (F) · **strong**
- **d.school's version:** Define turns findings into an "actionable problem statement" (a "point of view"). A good one "provides a narrow focus … inspires your team … informs criteria for evaluating competing ideas" and "preserves emotion and the individual you're designing for." — Stanford d.school Bootcamp Bootleg, via search excerpts of the [Kent copy](https://www.cs.kent.ac.uk/people/staff/saf/patterns/gallery/BootlegBootcamp.pdf) (S, snippet) · **some**
- **What this means for games (extrapolated):** the "brief" for a game is the concept: what experience it is for, who it is for, what it is made of, and what it is not. Two of the d.school's tests carry over well. A good concept "informs criteria for evaluating competing ideas" (that is what pillars do), and it "preserves emotion" (the experience targets).

### Studios: concept → proposal → spec (Tim Ryan, 1999)
Tim Ryan's two-part article is the clearest published account of the documents a studio writes, in order. It maps closely onto BMUZ's Define → Design split.
- **Concept document, 1–2 pages:** "A game-concept document expresses the core idea of the game. It's a one- to two-page document that's necessarily brief and simple in order to encourage a flow of ideas." Its parts: introduction (one sentence with the "edge", meaning what sets it apart), description, key features, genre, platform(s), concept art. — [Ryan, Anatomy of a Design Document part 1](https://www.gamedeveloper.com/design/the-anatomy-of-a-design-document-part-1-documentation-guidelines-for-the-game-concept-and-proposal) (F) · **strong**
- **The description is the player's experience, in "you":** "describe the game to the readers as if they are the players. Use the second-person perspective … an exciting narrative of the player's experience … Hover your detail level right above the GUI interaction." — same (F). This is the closest published match to Muzzy's 3–5 line story found in this run (extrapolated).
- **Too short is a failure too:** "Simply saying, 'It's Command & Conquer meets MechWarrior' … is insufficient. Your description has to explain the actions that the player will perform and make them seem fun." — same (F)
- **The verb check:** "break down all of the player verbs … and envision how player performs each. Then, for each verb, ask yourself if it's fun … If the action that the player takes isn't fun, figure out another action … or drop the verb entirely." — same (F)
- **Key features: not too few, not too many:** "Listing too few features might sell your concept short; listing too many waters down the concepts' strongest features." — same (F)
- **Proposal = concept + honest reality check:** a technical evaluation of "the technical feasibility of the concept", "Experimental features", "Risks" and "Alternatives". Feedback "might force you to scale back the concept." — same (F) · **strong**
- **Then the spec, and only then the tech plan:** "the technical staff waited until the functional specification was approved and signed-off before starting on the technical specification." Function (what it does, from the player's side) and technique (how it's built) are separate documents. — [Ryan, part 2](https://www.gamedeveloper.com/design/the-anatomy-of-a-design-document-part-2-documentation-guidelines-for-the-functional-and-technical-specifications) (F) · **strong**
- **The "functional spec" is what most studios call the design document**: "Many companies still refer to the functional specification as the 'design document'." — same (F)

### Pre-production: prove it before you build it (Cerny's "Method" and after)
- **Two phases:** pre-production is "capturing lightning"; production is "building the game". In pre-production "you are not making a game … you are making a game design." — Cerny's Method slides (unofficial summary), [SlideShare](https://www.slideshare.net/holtt/cerny-method) (F) · **some** (second-hand)
- **No 100-page document up front:** "MYTH #7: … 'I need a 100-page document describing my game.'" Why not: "waste of resources · deceptive and misleading · sets direction prior to verification of fundamentals." Instead a **macro design** of "five pages" is "in hand at start of Production", and the detail ("micro design") is created during production. Its benefits: it "prevents feature creep and feature drop" and "properly circumscribes creativity". — same (F) · **some**
- **Killing a game is a good outcome:** "MYTH #6: KILLING GAMES — 'A cancelled project is a sign of bad management or a bad team.'" Cancel when the first playable "shows game not worth publishing — Your project will not miraculously get better during Production!" — same (F) · **some**
- **The same idea, retold by a free-to-play designer:** "Every project that I've seen fail, the team always says one thing in their Post-Mortem: 'We should've done more Pre-Production!'"; "The goal of Pre-Production is to do everything possible to kill your game … A failed prototype is a celebration."; "To enter Production, you must define your design risks. Create a checklist of these risks." — [Mobile Free To Play, Why Games Fail: Pre-Production](https://mobilefreetoplay.com/why-games-fail-pre-production/) (F) · **some**
- **Schell's risk lens says the same thing:** "Stop thinking positively, and start seriously considering the things that could go horribly wrong with your game. What could keep this game from being great? … focus on the parts of your game that are in danger." — Lens #14 Risk Mitigation, [Neward's notes on Schell](https://research.tedneward.com/gamedev/art-of-game-design.html) (F) · **strong** (two independent sources agree)

### What the data says matters: a shared vision, not a thick document
- **The Game Outcomes Project** surveyed developers about their most recent team project. Its strongest finding: managing design risk correlated with good outcomes "over 0.57". The question "a design document clearly specifying the game" correlated "below 0.2", with no significant link to sales or review scores: "design documents are far less useful than generally realized." "Successful teams have a strong shared vision … and are careful to resolve disagreements about the game's design quickly." — [Game Outcomes Project part 3](https://www.gamedeveloper.com/business/the-game-outcomes-project-part-3-game-development-factors) (F) · **strong** for teams (survey correlations; it says nothing about solo creatives)
- **What this means for BMUZ (extrapolated):** Define's job is a clear, shared vision plus a managed list of design risks, not a long document. For a solo creative, "shared" means shared between the creative and Claude. Muzzy's own words for the GDD say the same: "the communication between you and me".

### Short beats long: one-page designs
- Stone Librande (GDC 2010): "no one" reads longer documentation, and wikis "break the core relationships between elements". His answer: "annotated diagrams or other visuals that fit on one page." — [Game Developer, Video: One-page designs](https://www.gamedeveloper.com/design/video-one-page-designs) (F) · **strong**
- Making it short is itself design work: "to communicate it in a small space, you need to *really* know what you are talking about." Librande: "The goal of design … is to communicate an idea." — [Game Developer, "The goal of design is to efficiently communicate ideas"](https://www.gamedeveloper.com/design/-the-goal-of-design-is-to-efficiently-communicate-ideas-) (F) · **strong**
- This suits Muzzy as an artist (extrapolated): the concept can be a page he would pin on a wall, and BMUZ's planner page (the PPP) can show it.

### Pillars: the filter for every later choice
- **What they are:** "a list of around three 'core statements' created early … each should be phrased as a rule you will follow throughout development." "Make your pillars focus on how your players will feel over the things they will do." — Stuart Maine in Wireframe, via [Raspberry Pi, pillars and triangles](https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/) (F) · **strong**
- **When they're made, and what they're NOT for:** pillars "are a tool for staying on track as you forge ahead, not for coming up with ideas in the first place." You make them before development "to help narrow down the possible game", or after prototyping. — same (F). **This places pillars in Define, not Discover.**
- **How they're used:** ask of every change whether it brings the game "closer to your pillars (great), not really affect them (neutral), or work against them (bad)". "Pillars don't say 'that idea is bad', simply that it doesn't fit this particular game. Write the idea down and maybe build your next game around it." — same (F). That is Muzzy's on-ice rule, in a studio's words.
- **Who makes them:** either the whole team, or "creative vision holders" who present them so "everyone can rally behind a singular vision". — same (F). For BMUZ, the creative is the vision holder (extrapolated).
- **Disagreement, emotions or features:** Game Developer's pillars article uses mostly features (3–5 "main elements/emotions") — [Design Pillars](https://www.gamedeveloper.com/design/design-pillars-the-core-of-your-game) (F). Maine and Keenan (Duskers: pillars "focusing on emotions rather than features", [GDC Vault](https://gdcvault.com/play/1024176/Finding-Duskers-Innovation-Through-Better), session description, F) argue for feelings. Celia Wagar criticises pillars that are "just the names of independent systems" (God of War: combat, father & son, exploration) because each can be "designed by different teams in isolation". — [Game Design Skills, Design Pillars](https://gamedesignskills.com/game-design/design-pillars/) (F) · **some**
- **The case against pillars for a solo creative:** Wagar says pillars "exist to orient large teams of people around common goals". Where "the game's overall vision is concentrated in the hands of a few people" there is "less need" for them. — same (F) · **some**. My read (extrapolated): a solo creative doesn't need pillars to align a team. They still need them to say no to their own ideas, and to brief Claude's helpers, who are a team of a kind.

### Experience targets (what players should feel)
- Already sourced in `discover-creative-research.md` §1: Fullerton's player experience goals ("not features … descriptions of the interesting and unique situations in which you hope players will find themselves") and MDA's eight aesthetics (MDA: Mechanics → Dynamics → Aesthetics, where "aesthetics" means what players feel). Discover collects candidates; Define picks the one or two primaries. BMUZ's `mda-analyze` skill already writes targets with a watchable "we'll know when" sign.
- Schell's **Eight Filters** are judging questions, so they belong in Define: "Artistic Impulse … Does this game feel right?", "Demographics … Will the intended audience like this game well enough?", "Innovation … Is this game novel enough?", "Business and Marketing. Will this game sell?", "Engineering … Is it technically possible?", "Social/Community", "Playtesting". "You can only call your design finished when it can pass through all eight filters without requiring a change." — [Neward's notes on Schell](https://research.tedneward.com/gamedev/art-of-game-design.html) (F) · **strong** (second-hand). Extrapolated: Define can run the first five as questions; Engineering is Claude's call (a size read); Playtesting can't be answered until Design has something to play.
- **Lens #12 Problem Statement**: "How will I be able to tell if the problem is solved?" — same (F). This is the source of "we'll know when …".

### Scope per release
- **MoSCoW** (Must, Should, Could, Won't have this time) comes from DSDM, an agile project method. A Must passes this test: "Ask the question 'what happens if this requirement is not met?' If the answer is 'cancel the project …' then it is a Must Have." Won't-haves are written down so they're not "informally reintroduced at a later date". Keep Musts under "60% Must Have effort", with about 20% Could as slack. One thing can be Must for the project but Should for the first release ("a requirement may have two priorities"). — [Agile Business Consortium, MoSCoW](https://www.agilebusiness.org/dsdm-project-framework/moscow-prioritisation.html) (F) · **strong**
- **The smallest finished thing first:** Derek Yu (Spelunky): "Release one sloppy, fun little game quickly and then make a game that's slightly bigger and slightly less sloppy." — [GameMaker interview](https://gamemaker.io/en/blog/derek-yu-gm25) (F). "If you show off your game and receive a tepid response, it's generally better to try and finish the game *faster* and move on instead of extending the development to try and fix what is probably an issue at the core." — [Game Developer, Yu thread](https://gamedeveloper.com/design/-i-spelunky-i-designer-want-to-be-an-indie-then-learn-how-to-finish-games-reliably) (F) · **some**. The claim that Yu judges scope by "your previously finished games" is **(snippet)**, from quote aggregators; his original "Finishing a Game" post refused the fetch ([makegames.tumblr.com](https://makegames.tumblr.com/post/1136623767/finishing-a-game), S).
- **The iron triangle:** quality, time and cost pull against each other; real limits ("must be released within this time frame") "must be acknowledged or you risk coming up with pillars that set" you up to fail. — Maine, [Raspberry Pi](https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/) (F) · **some**
- **MVP vs vertical slice:** no authoritative definition found. A rough practice: an MVP (minimum viable product) tests whether the core is fun; a vertical slice (one short stretch built to final quality) shows the finished look and feel. Some developers make the MVP first, then a slice. — search excerpts only, mostly vendor blogs ([Unity forum](https://discussions.unity.com/t/mvp-vs-vertical-slice/632748), S) · **weak**. Cerny's "publishable first playable" is the stronger, older version of the vertical slice (above, **some**).

### Tabletop: what a board-game concept has to say
- At Unpub 2025's pitch panel, the most common feedback was to have a sell sheet with "game name, tagline or hook, brief overview, core mechanisms, player information, required components". Second: lead with the **box information**, "player count, duration, and age range", plus game weight (how heavy or light it is). Also: "Who is this game for?", and comparisons ("Ticket to Ride network building combined with the co-op asymmetry of Spirit Island") are welcome. — [Skeleton Code Machine, How to pitch your game](https://www.skeletoncodemachine.com/p/how-to-pitch-your-game) (F) · **some**
- Sell sheets come **after** design and playtesting: "You have completed the design of your game … You've done plenty of playtesting." — [League of Gamemakers, sell sheets](https://leagueofgamemakers.com/how-to-build-a-sell-sheet-for-your-game) (F). So the sell sheet itself is a Release-stage document. Its *questions* (who it's for, how long a game lasts, how many players, the hook) are concept decisions, so they belong in Define (extrapolated).

### Where the sources disagree
- **How much to write up front:** Ryan's era wrote concept → proposal → full spec → tech spec, in sequence. Cerny says five pages of macro design, with detail during production. Game Outcomes finds documents barely matter next to a shared vision. **For BMUZ (extrapolated):** Define writes the short part (about a page); Design writes the full GDD, which keeps being updated (Muzzy: "a blueprint that you regularly update").
- **Pillars as feelings or features:** see above. The pick: feelings, each paired with the argument it settles (BMUZ's GDD template already asks for "the kind of argument it settles").
- **Prove fun before or after committing:** Cerny and Kumar prove it in pre-production with a playable build. In BMUZ that playable proof is Design's job (paper tests, sketches). Define only names the risks and the cheapest test for each.

---

## 2. How they choose from a big pile of ideas

### Converging techniques, as the sources describe them
- **Clustering (affinity diagramming):** "organizing related observations, ideas, concepts, or findings into distinct clusters", then "Prioritize clusters and next steps". It can be done alone ("While it's possible to create an affinity diagram on your own, this artifact is best created as a team"). — [NN/g, Affinity Diagramming](https://www.nngroup.com/articles/affinity-diagram/) (F) · **strong**
- **Dot voting:** each person gets about "a quarter of the total number of options" in votes; "No lobbying". A second round is limited to "the top options (usually 2–4)". Dots of different colours can stand for different criteria, such as impact and feasibility. — [NN/g, Dot Voting](https://www.nngroup.com/articles/dot-voting/) (F) · **strong**. It is a *group* tool: it guards against "persuaded voting" and "group think". For one creative, its useful parts are a **limited number of picks** and **voting per criterion**.
- **"How might we" questions** (from Procter & Gamble in the 1970s, later IDEO): turn the top findings into HMW questions that don't build a solution in ("embed solutions in your HMW … restricts the pool of possibilities"), and that focus on "the desired outcome". — [NN/g, How-Might-We Questions](https://www.nngroup.com/articles/how-might-we-questions/) (F) · **strong**. Discover's H17 already uses HMWs at its hand-off.
- **Must / should / could / won't** (MoSCoW): above · **strong**.
- **Pillars as a filter:** closer to / neutral / against (Maine, above) · **strong**.
- **Schell's Eight Filters:** above · **strong**.
- **Kill criteria:** "rigid checkpoints where a project must prove its value to move forward" — [Mega Cat Studios blog](https://megacatstudios.com/blogs/gaming-news/mega-cat-gaming-news-the-cut-before-launch) (F) · **weak** (a studio blog, no named practice behind it). The stronger version is Cerny's: cancel if the first playable "shows game not worth publishing" (**some**).

### Saying no, and keeping what you said no to
- **Cutting is the stronger move:** "Sometimes you design a game and it just isn't right … The answer is almost always that you need to take something out." "Adding is easy, culling is hard, but culling is usually the more powerful action." — Jake Thornton (board-game designer), [Quirkworthy](https://quirkworthy.com/2026/03/20/how-to-fix-a-design-that-isnt-working/) (F) · **some**
- **Why new designers over-stuff:** they "haven't internalised that they could do another game after this one … and want to cram all their great ideas into their one shot." — same (F). This is the reason a parking lot works: an idea that's cut still has somewhere to go.
- **You often can't tell what to cut without playing:** "How do you know which mechanics to take out? You don't. Not without testing." — same (F). So Define can pick a lead option, but some choices must stay open for Design's tests (extrapolated).
- **Cut against the design goal, not by taste alone:** Salvage Union cut its Stress mechanic because "one of the core design goals … is that it's intended to be a simple and accessible game", and Stress removed player agency, which the game valued. — [Leyline Press, kill your darlings](https://leyline.press/blogs/leyline-press-blog/learning-to-kill-your-darlings-salvage-union-design-blog-11) (F) · **some**. That is a pillar doing its job.
- **A cut idea becomes another game:** a designer cut a water-flow push-your-luck mechanic from an RPG because it was "very boardgame-like", and kept it: "that board game mechanic that worked so well? It's not dead … that is totally going to be a board game." — [Gnome Stew, Design Flow: Kill Your Darlings](https://gnomestew.com/design-flow-kill-your-darlings/) (F) · **some**. Together with Maine's "maybe build your next game around it", this supports Muzzy's "keep every on-ice idea".

### Which suit a solo creative working with Claude
| Technique | Fit | How it changes for one creative + Claude | Source strength |
|---|---|---|---|
| Clustering | **Yes, Claude's job** | Claude groups the shelves before asking anything, so the creative reacts to 5 clusters, not 248 bricks (the F217 live look found 248+ bricks too many to read) | strong |
| Limited picks ("pick up to 3") | **Yes** | The creative picks first, with a cap of about a quarter of the options (NN/g's rule). Claude never pre-votes. | strong |
| Picks per criterion | **Yes** | One question per lens: "which of these is the feeling?", then "which of these are you most excited to make?" (Schell's Artistic Impulse) | strong |
| How might we | **Partly** | Useful for turning an open tension into a question for Design ("HMW make trading feel tense without a timer?"), not for choosing | strong |
| Pillars as a filter | **Yes, central** | Made once in Define, then every later choice (scope, on-ice ideas, Design's mid-milestone ideas, V20) is checked against them | strong |
| MoSCoW per release | **Yes** (BMUZ already uses it) | Keep the cancel test for Musts and the "won't, with why" record | strong |
| Eight Filters | **Yes, as a check** | Claude runs them as a fit-check; only taste filters become questions | strong (second-hand) |
| Dot voting proper | **No** | It solves group problems (lobbying, loud voices) a solo creative doesn't have | strong |
| Kill criteria | **Yes, softened** | One "we'd rethink if…" line per risk, tied to its probe, not a project-cancel rule | weak/some |
| Parking lot | **Yes** | Already exists: DISCOVER.md's On ice shelf + ROADMAP Ideas | some |

The AI-partner twist (extrapolated): the sources assume people choose together. With Claude, the danger runs the other way: Claude ranking first and the creative agreeing. Anthropic found experts went with the agent's lean 86% of the time (VISION V32b). So every taste pick in Define asks the creative first, and Claude's lean comes only when asked ("you pick").

---

## 3. Where Define stops and Design starts

### The pick: Define writes the concept (about one page); Design writes everything else, and the build plan closes Design
- **Define hands Design a concept,** written as the top part of the GDD (no new file): the 3–5 line story, the pitch line and "You are…", 1–2 primary experience targets with "we'll know when" signs, a "not this game" line, 3 pillars, the chosen bricks (core verbs with a lead mechanism and a backup, the things players act on, theme and tone, hook and anchor), who it's for and where it's played (box information for tabletop), scope per release as *what the player can do and feel*, a won't list with reasons, and the risks, each with its cheapest test and a "we'd rethink if…" line.
- **Design makes the game from it:** rules and the core loop, systems, numbers (proto sims), sketches and paper playtests that settle the risks and the lead/backup choices, look and sound, and finally the complete GDD.
- **The TDD and the feature map close Design,** as its last steps ("build plan"), after the GDD is approved. They don't belong in Define.

### Why (with sources)
- It is how the documents fall in studios: the concept (1–2 pages) is written first, the functional spec (the GDD) second, and "the technical staff waited until the functional specification was approved" before the technical spec (Ryan, F, **strong**).
- Cerny: the macro design is "in hand at start of Production", and a long document up front "sets direction prior to verification of fundamentals" (F, **some**). A feature map written in Define would map features nobody has designed yet.
- Muzzy's own V48: define = "choose them, the 3–5 line story, scope"; design = "put them together into the complete GDD".
- Pillars are "not for coming up with ideas" but for "staying on track" (Maine, F): they have to exist before Design starts making dozens of choices.
- Game Outcomes: what predicts success is a shared vision and managed design risk (F, **strong**). Define's output is exactly those two things.

### Weighed
- **Why it's this way now:** today's /define writes the GDD, TDD and ROADMAP feature map in one stage (`stages/define.md` → `design.md` → `build-plan.md`). That made sense with four stages; V48's five stages have since moved "design" out.
- **Long term:** each stage has one meaning (V48). The engine can check each hand-off separately: concept → GDD → build plan.
- **Standards:** big studios use concept → spec → tech spec (Ryan) and macro → micro (Cerny). Indies use short docs and fast proof (Yu, Librande). Both agree the tech plan follows the design.
- **His goals:** an artist gets the creative part (story, pillars, bricks) without engineering in the way. The engineering part is BMUZ's (V1b).
- **The case against:**
  1. Scope without cost is guesswork. A must list made without knowing what's expensive can be unrealistic. **Answer:** Define gets a *size read* from Claude (Ryan's proposal-stage "technical evaluation": small / medium / big, plus the risky or experimental items), never an engineering question.
  2. Some tech choices change the design: online multiplayer, phone versus desktop, real-time versus turn-based. **Answer:** these are product facts the creative states in Define ("played online with friends, on phones"). The TDD records how; Define records what.
  3. More stages mean more ceremony for a small game. **Answer:** fast-track stays (one pass through all three); the pipeline's wrap-up lets a small game finish Define in one sitting.
  4. The feature map is what makes the PPP's milestones show a %. Without it after Define, the planner shows less until Design ends. **Answer:** milestone 0 ("Design decided") holds Define's open risks and probes as items, so the planner still shows progress.

### Where the TDD and feature map go: options
1. **Last steps of the Design pipeline ("build plan"), after the GDD gate. Pick.** The creative's only touch is one gate: "Here's the order we'll build in (N features, tree). OK?"
2. A step at the start of Develop (before the first sprint). This fits less well: develop's sprint loop assumes a map exists, and Develop's gate is per sprint.
3. Kept in Define (today). This is out for the reasons above.
- Inside the build plan, the TDD is a Claude-only flow (no questions: engineering calls are BMUZ's). The feature map is a flow plus a plan-check flow, plus the creative's gate. REBUILD-PLAN R8's "plan-check flow" (GDD, TDD and feature map checked against each other) then belongs to Design's close, not to Define. Define gets its own, smaller concept check (§5d). **This changes R8's wording**, so it's flagged for the main chat.

---
