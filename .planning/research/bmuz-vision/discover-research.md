# Double Diamond — Discover, and how BMUZ's discover pipeline should mimic it

Research for F217 (the discover pipeline's research flow). 2026-11-09.

**How first-hand this is:** every claim below carries a URL. Most quotes came from web-search excerpts of the named pages (Design Council, NN/g, IDEO.org, Strategyzer, SAFe, the MDA paper), not from reading each page top to bottom. Full-page fetches were attempted but their reports did not come back in time. Treat exact wording as "quoted in search excerpts of that page"; the facts are consistent across several sources each.

---

## 1. What Discover is for — and what it is not

### What it is for
- The first diamond "helps people understand, rather than simply assume, what the problem is." — Design Council, [The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/), same wording on [Framework for Innovation](https://www.designcouncil.org.uk/resources/framework-for-innovation/)
- It "involves speaking to and spending time with people who are affected by the issues." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- The Council's one-line version: "Discover: A problem is explored through desk and user research. Early ideas are captured." — [Double Diamond turns 20, press release, 2023](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)
- It is the divergent half of the problem diamond: widen first, narrow in Define. Define then uses "the insight gathered from the discovery phase" to "define the challenge in a different way." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- NN/g's equivalent: discovery is "a preliminary phase … that involves researching the problem space, framing the problem(s) to be solved, and gathering enough evidence and initial direction on what to do next." — [NN/g, Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)

### Its principles
- **Understand, don't assume** — above.
- **Question the brief / be ready to be wrong** — "a discovery mindset means that a team is open to learning that their assumptions are wrong, whether those assumptions are about users' problems, needs, or the best solution." — [NN/g, Getting into the Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- **Look for unknown unknowns** — things the team "hadn't expected to learn." — [NN/g, Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- **Non-linear** — "This is not a linear process as the arrows on the diagram show. Many of the organisations we support learn something more about the underlying problems which can send them back to the beginning." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- **The Council's four principles** (whole process, not only Discover) — [Framework for Innovation](https://www.designcouncil.org.uk/resources/framework-for-innovation/):
  1. Put people first — "Start with an understanding of the people using a service, their needs, strengths and aspirations."
  2. Communicate visually and inclusively — "Help people gain a shared understanding of the problem and ideas."
  3. Collaborate and co-create — "Work together and get inspired by what others are doing."
  4. Iterate, iterate, iterate — "spot errors early, avoid risk and build confidence in your ideas."
- Evidence it pays: in NN/g's 2019 survey of 436 practitioners, 83% of projects with a discovery were rated successful vs 52% without; 58% of discoveries lasted 2 weeks or less, which NN/g calls too short unless the problem is small. — [NN/g, How Well Discovery Phases Are Performed](https://www.nngroup.com/articles/discoveries-in-industry-revealed/)

### What Discover does NOT do (Define's or later)
- **No solution testing.** Discovery "does not (typically) involve testing a hypothesis or evaluating a potential solution." — [NN/g, Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)
- **No solution-shaped goals.** Goals that name a solution invite "anchoring and confirmation bias"; NN/g's fix: ask what problem the preferred solution solves, or write the solution ideas down and put them "on ice" until the research is done. — [NN/g, Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- **No final problem statement.** Synthesis into a problem definition is Define: "research is analysed and ideas are synthesised." — [Design Council press release 2023](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)
- **No "How might we" yet.** NN/g puts HMW questions at the hand-off: written from the top findings "at the end of discovery … before ideation." — [NN/g, Using "How Might We" Questions](https://www.nngroup.com/articles/how-might-we-questions/)
- **No visual direction lock.** Mood boards that "gather consensus on the style" belong to "the Define or Ideate phases." — [NN/g, Mood Boards in UX](https://www.nngroup.com/articles/mood-boards/)

### Where sources disagree
- **Is the problem statement Discover's output or Define's?** NN/g says discovery's main product is a problem statement ([Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/); [Problem Statements](https://www.nngroup.com/articles/problem-statements/)). The Design Council puts that synthesis in Define ([press release](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)). NN/g's "discovery" covers both halves of the first diamond. For BMUZ (which has a /define stage) the Council's split is the one to follow: Discover hands over findings and candidate framings, Define picks.
- **Early ideas in Discover?** The Council says "early ideas are captured" ([press release](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)); NN/g says park them "on ice" ([Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)). Both agree: capture them, don't pursue them.
- **Is the model still right?** Richard Eisermann (ex-Design Council, credited with the model) says it is "linear and still largely describes an idea funnel" and probably not fit for complex systems work; the Council has moved to a Systemic Design Framework. — [Design Council on Medium, still fit for purpose?](https://medium.com/design-council/the-double-diamond-design-process-still-fit-for-purpose-fc619bbd2ad3). The Council's own page still presents it as a description of any design project "irrespective of methods and tools used." — [Design Council](https://www.designcouncil.org.uk/resources/the-double-diamond/). For one designer making games, the linearity criticism matters less than the non-linear loop the Council itself draws (findings can send you back).
- **Dates:** created 2003, shared from 2004, often dated 2005. — [History of the Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/history-of-the-double-diamond/), [press release](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)

---

## 2. Methods — what each is, what it yields, who can do it

Who: **AI** = a helper can do it alone · **AI + D** = helper drafts, designer must answer/judge · **D** = needs the designer (or players); AI can't stand in.

| Method | What it is | Output | Who | Source |
|---|---|---|---|---|
| Desk (secondary) research | Read what already exists: news, articles, books, data, docs | Sourced facts, context, "the right questions to ask" | **AI** | [Design Council press release](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf); [IDEO.org Secondary Research](https://www.designkit.org/methods/secondary-research.html) |
| Precedent / competitor analysis | Study existing solutions and who already does this | Map of what exists, how, what's missing | **AI** (games: AI can read about games; can't play them) | [NN/g Discovery](https://www.nngroup.com/articles/discovery-phase/) |
| Analogous inspiration | Look at a different setting with the same activity or feeling | Transferable patterns from outside the field | **AI** for finding them; **D** for judging which resonate | [IDEO.org Analogous Inspiration](https://www.designkit.org/methods/analogous-inspiration.html) |
| Expert interview | Ask someone with a systems view, incl. recent failures | Expert view of the field, pitfalls | **AI** can stand in only via published expert writing (talks, post-mortems) — flag it as such | [IDEO.org Expert Interview](https://www.designkit.org/methods/expert-interview.html) |
| User interview / spending time with people | Talk to and observe the people affected | Needs, behaviours, surprises | **D** (and real players). AI cannot interview players | [Design Council](https://www.designcouncil.org.uk/resources/the-double-diamond/) |
| Diaries / journaling | People record their own lives over days/weeks | Behaviour patterns over time | **D** (playtest diaries) | [DC Community Design Toolkit](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Case_Studies_Documents/Transform_Ageing_DC_Community_Design_Toolkit-compressed.pdf) |
| Assumption listing / mapping | Write down what we assume; plot each by importance vs evidence; test high-importance/low-evidence first. Strategyzer splits them desirability / feasibility / viability | Ranked list of risky unknowns | **AI + D** — AI drafts from the brief, designer marks importance | [Strategyzer, Assumptions Mapping](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter); [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/) |
| Mapping (ecosystem / process) | Diagram the problem space | Shared picture of the space | **AI** drafts | [NN/g, Mapping in Discovery](https://www.nngroup.com/articles/mapping-in-discovery/) |
| Spike (tech) | Time-boxed research or throwaway code to answer one technical question; from XP | An answer + evidence, not shippable code | **AI** (it can write and run code) | [SAFe, Spikes](https://framework.scaledagile.com/spikes); [Microsoft feasibility spikes](https://playbook.microsoft.com/code-with-engineering/design/design-reviews/recipes/engineering-feasibility-spikes/) |
| Reference / mood collection | Collect images, clips, sounds that carry a feeling | A reference set (not yet a chosen direction) | **AI + D** — AI gathers, only the designer can say "that's the feel" | [NN/g Mood Boards](https://www.nngroup.com/articles/mood-boards/) |
| Sketch / quick probe | A throwaway playable to feel something out | A felt answer | **AI + D** — AI builds, designer plays | Council: "Early ideas are captured" ([press release](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)); Fullerton on prototyping before production ([Game Design Workshop excerpt](https://gamedeveloper.com/design/book-excerpt-game-design-workshop)) |
| Insight synthesis / HMW | Turn findings into insight statements and "How might we…" | Framed challenges | **Define**, not Discover | [NN/g HMW](https://www.nngroup.com/articles/how-might-we-questions/) |

The Council warns methods "shouldn't be used in isolation" — explore with a series together. — [DC Community Design Toolkit](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Case_Studies_Documents/Transform_Ageing_DC_Community_Design_Toolkit-compressed.pdf). Its methods bank groups methods as **Explore** (challenges, needs, opportunities), **Shape**, **Build**. — [Framework for Innovation](https://www.designcouncil.org.uk/resources/framework-for-innovation/)

**The AI gap, plainly:** the heart of Council-style Discover is people ("speaking to and spending time with people who are affected"). An AI helper can't do that. In BMUZ the designer *is* the main affected person, so the talk steps carry that part; real-player research becomes a "needs Muzzy" item, never invented by a helper.

---

## 3. What Discover hands to Define

- **Insight / findings with evidence** — "The insight gathered from the discovery phase can help you to define the challenge in a different way." — [Design Council](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- **Enough evidence + initial direction** to decide what to do next. — [NN/g Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)
- **Top findings, agreed**, from which HMWs are written at the hand-off. — [NN/g HMW](https://www.nngroup.com/articles/how-might-we-questions/)
- **Assumptions with their evidence level** (what's now known, what's still a guess). — [Strategyzer](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter)
- **Parked ideas** ("on ice"). — [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- NN/g stresses discovery isn't valued for its deliverables but for the decision it enables. — [NN/g Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)

---

## 4. Adapting Discover per topic type

### MDA as the map of discovery targets
- Mechanics = "the particular components of the game, at the level of data representation and algorithms"; Dynamics = "the run-time behavior of the mechanics acting on player inputs and each others' outputs over time"; Aesthetics = "the desirable emotional responses evoked in the player." — [Hunicke, LeBlanc, Zubek 2004, MDA](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)
- Designer works M→D→A; the player meets the game A→D→M. — [MDA paper](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)
- The 8 aesthetics: Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission. — [MDA paper](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)
- Note: MDA's "Aesthetics" means *feelings*, while Muzzy's "aesthetics" topic means look/feel/sound/juice. Those are mostly Swink's **polish** and MDA's **Sensation**. Keep the words apart in the pipeline or the helpers will mix them.

| Topic type | Discover question (the problem, not the answer) | Angles the research should pick | MDA layer | Typical outputs |
|---|---|---|---|---|
| **Tech** (engine feature, library, platform) | "What do we need it to do, what are the options, what are the risks?" | Prior art (how others built it) · options compared on our constraints (stack, phone, licence, size, upkeep) · known failure stories · a spike when reading can't answer it | Mechanics (the machinery under them) | Option table with evidence, risks, spike result, open questions |
| **Aesthetic** (look, feel, sound, juice) | "What feeling are we after, and what makes that feeling in things that already have it?" | References that carry the feeling (games and non-games — analogous inspiration) · breakdowns of how they produce it (Swink: input, response, context, polish, metaphor, rules — [Game Developer](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)) · craft techniques · tool/tech limits | Aesthetics (Sensation) via Mechanics (the polish knobs) | Reference set with "why it works", technique list, candidate sketches to try |
| **Design** (mechanic, loop, rules) | "What experience do we want, what behaviour would make it, what's been tried?" | Experience goals ("situations … players will find themselves", not features — [Fullerton excerpt](https://gamedeveloper.com/design/book-excerpt-game-design-workshop)) · precedents that create that dynamic · player/audience evidence · known failure modes | All three: A target → D wanted → M candidates | Experience goals, precedent dynamics, risky assumptions, sim/sketch candidates |

**Why angles must come from the topic, not a fixed list:** "reference games / players / what's fun" only fits design topics. A library comparison has no "players" angle; a juice study has no "what's fun" angle. The Council's own advice is to pick a series of methods that fit the challenge, not a fixed set. — [DC Community Design Toolkit](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Case_Studies_Documents/Transform_Ageing_DC_Community_Design_Toolkit-compressed.pdf)

**Spike timing:** a spike is time-boxed, answers one question, and its output is knowledge, not product. — [SAFe Spikes](https://framework.scaledagile.com/spikes). Microsoft runs feasibility spikes after envisioning and before build sprints — [Microsoft playbook](https://playbook.microsoft.com/code-with-engineering/design/design-reviews/recipes/engineering-feasibility-spikes/) — the same slot as Discover.

---

## 5. Proposed shape for the BMUZ discover pipeline

Principle: **the designer supplies the "people" part, helpers do desk research, the merge separates fact from guess, Define does the choosing.**

### Talk steps (few — three, maybe four)
1. **What are we discovering?** One sentence in Muzzy's words + the engine's classification: *tech / aesthetic / design* (Claude proposes, Muzzy confirms). Also: which MDA layer it lives in.
2. **What do you already believe or want?** His hunches, references he already loves, the feeling he's after. These are recorded as **assumptions**, not facts (NN/g discovery mindset; Strategyzer). Any solution he arrives with is written down and put "on ice".
3. **What must it work within?** Constraints only he knows: platform, the game it's for, must-keep things, deal-breakers. (Tech topics lean on this.)
4. *(Optional, after the report)* **What surprised you / what's missing?** One reaction pass — the Council's loop back, not a new phase.

### How the research flow picks its angles
- An **angle-planner** step (one helper) reads talk steps 1–3 and writes 3 angles + the question each answers + why that angle, from the menu for the topic type (section 4). Always:
  - one angle on **what already exists** (prior art / references / precedents),
  - one angle on **how it works or fails** (techniques, breakdowns, failure stories, constraints),
  - one **wildcard/analogous** angle outside the obvious field (IDEO analogous inspiration) — the unknown-unknowns slot.
- Angles are shown to Muzzy in one line each before running (cheap, catches "that's the wrong question").
- A helper may flag "this can only be answered by a spike / sketch / Muzzy playing" — that becomes a next step, not a guess.

### What the merged report contains
- **The question** (talk step 1) and the type/MDA layer.
- **Findings** — each with source URL; unsourced claims dropped (already F217's rule).
- **Options / references** found, side by side, each with "why it's relevant" and evidence.
- **Assumptions check** — each of Muzzy's step-2 beliefs marked *supported / contradicted / no evidence*.
- **Surprises** — things nobody asked about (unknown unknowns).
- **Open questions** — what desk research couldn't answer, with the method that could (spike, sketch, playtest, ask Muzzy).
- **Parked ideas** — solutions that came up, on ice for Define.
- **Disagreements** — where sources or helpers disagreed.
- No recommendation of one answer, no HMW, no scope.

### The hand-off card
- One line: what was discovered (the question).
- Top 3–5 findings (one line each, sources in the report).
- Assumptions: N supported · N contradicted · N unknown.
- Open questions + the suggested probe for each (spike / sketch / playtest).
- Numbered questions for Muzzy: "Anything surprising or missing?" and "Ready to lock this in?"
- Next command: `/sketch` when an open question is about feel, else `/define`.

### What belongs to Define (not the discover pipeline)
- Picking the option / direction / visual style (mood board *consensus* — NN/g).
- The problem statement and "How might we" questions (DC: synthesis is Define; NN/g: HMW at the hand-off).
- Scope (must/should/could/won't), GDD/TDD entries, feature map, dependencies.
- Experience *targets* as commitments (Discover lists candidates; Define fixes them).

---

## Sources
- Design Council — The Double Diamond: https://www.designcouncil.org.uk/resources/the-double-diamond/
- Design Council — Framework for Innovation: https://www.designcouncil.org.uk/resources/framework-for-innovation/
- Design Council — History of the Double Diamond: https://www.designcouncil.org.uk/resources/the-double-diamond/history-of-the-double-diamond/
- Design Council — The Double Diamond turns 20 (press release, 2023): https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf
- Design Council — Community Design Toolkit: https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Case_Studies_Documents/Transform_Ageing_DC_Community_Design_Toolkit-compressed.pdf
- Design Council (Medium) — The Double Diamond design process: still fit for purpose?: https://medium.com/design-council/the-double-diamond-design-process-still-fit-for-purpose-fc619bbd2ad3
- NN/g — Discovery: Definition: https://www.nngroup.com/articles/discovery-phase/
- NN/g — How Well Discovery Phases Are Performed in UX Projects: https://www.nngroup.com/articles/discoveries-in-industry-revealed/
- NN/g — Getting into the Discovery Mindset: https://www.nngroup.com/articles/discovery-mindset/
- NN/g — Problem Statements in UX Discovery: https://www.nngroup.com/articles/problem-statements/
- NN/g — Why Map in Discovery: https://www.nngroup.com/articles/mapping-in-discovery/
- NN/g — Using "How Might We" Questions: https://www.nngroup.com/articles/how-might-we-questions/
- NN/g — Mood Boards in UX: https://www.nngroup.com/articles/mood-boards/
- IDEO.org Design Kit — Secondary Research: https://www.designkit.org/methods/secondary-research.html
- IDEO.org Design Kit — Analogous Inspiration: https://www.designkit.org/methods/analogous-inspiration.html
- IDEO.org Design Kit — Expert Interview: https://www.designkit.org/methods/expert-interview.html
- Strategyzer — Assumptions Mapping: https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter
- SAFe — Spikes: https://framework.scaledagile.com/spikes
- Microsoft Engineering Playbook — Engineering Feasibility Spikes: https://playbook.microsoft.com/code-with-engineering/design/design-reviews/recipes/engineering-feasibility-spikes/
- Hunicke, LeBlanc, Zubek (2004) — MDA: https://users.cs.northwestern.edu/~hunicke/MDA.pdf
- Swink — Game Feel: The Secret Ingredient (Game Developer): https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient
- Fullerton — Game Design Workshop excerpt (Game Developer): https://gamedeveloper.com/design/book-excerpt-game-design-workshop

Not found / not used: d.school Bootcamp Bootleg (only unofficial copies surfaced); the Council's 2007 "Eleven lessons" study; game-industry writing that applies the Double Diamond by name (searches returned only UX/product sources — so the game adaptation in section 4 is this report's synthesis, built on MDA, Swink and Fullerton, not a cited practice).
