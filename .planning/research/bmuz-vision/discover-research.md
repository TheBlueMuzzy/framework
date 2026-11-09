# Double Diamond — Discover, and how BMUZ's discover pipeline should mimic it

Research for F217 (the discover pipeline's research flow). 2026-11-09.

**How first-hand this is:** every claim carries a URL. Two levels of evidence:
- **Verified (page fetched in full, HTTP 200):** Design Council [Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/), [History of the Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/), [Double Diamond 15 years (Cat Drew)](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/double-diamond-15-years/), [Design methods step 1: Discover](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/), [step 2: Define](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-2-define/); NN/g [Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/), [Problem Statements](https://www.nngroup.com/articles/problem-statements/), [UX Research Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/), [Mapping in Discovery](https://www.nngroup.com/articles/mapping-in-discovery/), [Mood Boards](https://www.nngroup.com/articles/mood-boards/); [Strategyzer Assumptions Mapping](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter); [IxDF Empathise](https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users); [SAFe Spikes](https://framework.scaledagile.com/spikes); the Game Developer Swink summary.
- **Snippet:** every other source was seen only through web-search excerpts. In section 6 these are marked **(snippet)**; in sections 1–4, any URL not in the verified list above is snippet-level.
- **Fetch failed — treat as unverified:** designkit.org (403), the Design Council Medium post (403), playbook.microsoft.com (DNS), the MDA PDF and the d.school Bootleg (unreadable). Claims resting only on these are unverified.
- Two Design Council URL paths exist for the same pages (`/resources/…` and `/our-resources/…`); the `/our-resources/` ones were fetched.

---

## 1. What Discover is for — and what it is not

### What it is for
- The first diamond "helps people understand, rather than simply assume, what the problem is." — Design Council, [The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/), same wording on [Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/)
- It "involves speaking to and spending time with people who are affected by the issues." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- The Council's one-line version: "Discover: A problem is explored through desk and user research. Early ideas are captured." — [Double Diamond turns 20, press release, 2023](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Press_Releases/The_Double_Diamond_turns_20_-_9_May_2023_Final.pdf)
- It is the divergent half of the problem diamond: widen first, narrow in Define. Define then uses "the insight gathered from the discovery phase" to "define the challenge in a different way." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- NN/g's equivalent: discovery is "a preliminary phase … that involves researching the problem space, framing the problem(s) to be solved, and gathering enough evidence and initial direction on what to do next." — [NN/g, Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)

### Its principles
- **Understand, don't assume** — above.
- **Question the brief / be ready to be wrong** — "a discovery mindset means that a team is open to learning that their assumptions are wrong, whether those assumptions are about users' problems, needs, or the best solution." — [NN/g, Getting into the Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- **Look for unknown unknowns** — things the team "hadn't expected to learn." — [NN/g, Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/)
- **Non-linear** — "This is not a linear process as the arrows on the diagram show. Many of the organisations we support learn something more about the underlying problems which can send them back to the beginning." — [Design Council, The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/)
- **The Council's four principles** (whole process, not only Discover) — [Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/):
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

The Council warns methods "shouldn't be used in isolation" — explore with a series together. — [DC Community Design Toolkit](https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Case_Studies_Documents/Transform_Ageing_DC_Community_Design_Toolkit-compressed.pdf). Its methods bank groups methods as **Explore** (challenges, needs, opportunities), **Shape**, **Build**. — [Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/)

The Council's own Discover method list (verified): creating a project space, observation, user diaries, being your users, brainstorming ("Generating ideas quickly in response to a problem"), choosing a sample ("six to nine people will be enough"), quantitative surveys, fast visualisation, secondary research, hopes and fears. Its Define list: focus groups, assessment criteria, comparing notes, drivers and hurdles, customer journey mapping. — [DC Design methods step 1: Discover](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/), [step 2: Define](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-2-define/). Note brainstorming sits in the Council's *Discover* list — idea generation is allowed there; what's deferred is choosing.

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

## 5. Proposed shape for the BMUZ discover pipeline — built from the heuristics

Each step names the heuristics from section 6 (H1–H26) it puts into practice. **The topic type (tech / aesthetic / design) does not pick the angles.** The heuristics pick the *lenses*; the topic only changes *where the evidence lives* (see "Topic only changes the sources", below). That's the fix for "reference games / players / what's fun", which was a topic list wearing a process costume.

Where this section applies a heuristic beyond its source's own setting (e.g. a human brainstorming finding applied to AI helpers), it says so — that part is this report's reasoning, not a cited fact.

### Stage A — Frame (talk steps, 3 questions)
Purpose: question the brief before anyone searches (H6), and turn Muzzy's hunches into testable assumptions (H9) and research questions (H10).

1. **"What's this about, in your words — and what would having it give you?"**
   - The second half is a short "why" chain (H7, 2–3 whys at most, stop when the answer is a feeling or a goal, not a thing). It gets from the thing asked for to the goal behind it, the reframe move in H6 (Wedell-Wedellsborg's window example: "open the window" was really "fresh air").
   - Claude reflects back one line: *the brief as said* and *the goal underneath*. Muzzy confirms or corrects.
2. **"What do you hope this gives you, and what do you fear could go wrong?"** plus **"What do you already believe, love, or suspect?"** (H25 hopes and fears)
   - Everything said is written as an **assumption**, not a fact (H8 discovery mindset, H9).
   - Any ready-made solution is written down and put **on ice** (H2) — kept, credited, not pursued.
   - Hopes feed the goal (H6); fears become important assumptions straight away (H25 → H9).
   - Muzzy marks each assumption *important / not* (only he can judge importance; the evidence column is filled by research — H9). Each is tagged desirable / feasible / viable (H9).
3. **"What must it fit, and what's off the table?"** Platform, the game it serves, deal-breakers. These bound the search (H10: goals and constraints choose the method).

Then Claude writes **3–5 research questions** (H10), each tied to an important assumption or an open part of the goal, and shows them as one line each. Muzzy can veto or add one (H21 collaborate, H19 communicate visually). Few questions on purpose: overloading a study with goals lowers the quality per goal (NN/g, H10).

### Stage B — Diverge (the research flow)
Purpose: widen, independently, with evidence.

- **Independent helpers, merged after** (H5). Each helper works alone on its lens, never seeing the others' notes until the merge. Basis: groups that generate together produce fewer and less varied ideas than the same number working alone, mostly from "production blocking" (Diehl & Stroebe); NN/g's diverge-converge has people analyse independently first "to limit bias". Applying this to AI helpers is an analogy, not a tested result.
- **Lenses are fixed by heuristic, not by topic.** Every run uses these four; the research questions are split across them:
  1. **Mainstream** — how this is usually done / what most examples share (H12 mainstreams).
  2. **Extremes and failures** — the most extreme cases, edge cases, and documented failures or post-mortems (H12 extremes; failures are where assumptions break).
  3. **Outside the field** — the same activity or feeling in an unrelated domain (H11 analogous inspiration; H24 unknown-unknowns slot).
  4. **Disconfirm** — look specifically for evidence *against* Muzzy's important assumptions (H9 + H14; counters the confirmation bias NN/g warns of — H8). This lens is this report's proposal; the sources support the aim, not this exact role.
- **Rules every helper follows:**
  - Quantity before judgement: collect widely, don't rank or recommend (H3, H2).
  - Two columns: *what the source says / shows* vs *what I think it means* (H13).
  - Every claim carries its source; unsourced claims are dropped (F217's rule; H14 needs it).
  - Stop at saturation: when the last few sources added nothing new, stop and say so; a hard cap keeps the run bounded (H15 — the "nothing new" signal is the cited part; the cap is a practical addition).
  - Flag what reading can't answer and name the probe that could — a timeboxed spike for tech, a sketch for feel, a playtest, or ask Muzzy — with the one question it answers (H26, H22, H20).

### Stage C — Converge-lite (the merge)
Purpose: organise, check strength, keep disagreements — **not** choose (choosing is Define).

- **Cluster** findings into themes (affinity grouping, H13's partner — NN/g) under each research question.
- **Strength by triangulation** (H14): each claim marked *several independent sources / one source / helper's interpretation only*.
- **Contradictions kept, not averaged** (H23): show both, note whether the sources were looking at different contexts.
- **Assumption scoreboard** (H9): each of Muzzy's important assumptions → *supported / contradicted / no evidence*, with the evidence.
- **Surprises** (H24): findings that answer a question nobody asked.
- **Open questions → probes** (H22, H26): each with the method that would answer it and a timebox.
- **On ice** (H2): solutions and ideas that came up, kept for Define.
- **"So what" lines** per theme (H16) marked *draft for Define* — an observation plus why it might matter. Not insight statements yet; IDEO puts those in the next phase.

### Stage D — Hand-off card
Purpose: a shared picture Muzzy can react to in a minute (H19), and the decision to loop back or move on (H22).
- The brief as said → the goal underneath (from A1).
- Top 3–5 findings, each with its strength mark.
- Assumption scoreboard: N supported · N contradicted · N unknown — contradicted ones listed by name.
- 1–2 surprises.
- Open questions with their probe.
- Numbered questions: "1. Anything surprising or missing? 2. Loop back on one question, or lock it in?"
- Next command: `/sketch` if an open question is about feel; another discover pass if a contradicted assumption changes the goal; else `/define`.

### What belongs to Define (not here)
- Choosing an option, direction, or visual style.
- Insight statements, the problem statement, and "How might we" questions (H16–H18). The merge may list draft HMWs at the hand-off (NN/g's timing), but Define picks and rewrites them.
- Scope, GDD/TDD entries, feature map, experience targets as commitments.

### Topic only changes the sources
The lenses stay the same; where each lens looks changes:

| Lens | Tech | Aesthetic (look/feel/sound/juice) | Design |
|---|---|---|---|
| Mainstream | Official docs, common libraries, usual architecture | Common treatments in games of that kind | Standard mechanics for that experience |
| Extremes & failures | Issue trackers, post-mortems, limits/benchmarks | The most extreme examples of the feeling; where it tips into "too much" | Edge players, degenerate strategies, failed designs |
| Outside the field | Other industries solving the same technical problem | Film, animation, product design, music with the same feeling | Sports, toys, social rituals with the same dynamic |
| Disconfirm | Evidence the favoured option won't fit our constraints | Evidence the favoured reference doesn't produce the target feeling | Evidence the favoured mechanic doesn't create the wanted behaviour |

MDA's "Aesthetics" (player feelings) is a different word from Muzzy's "aesthetic" topics (mostly MDA Sensation + Swink's polish). Keep them apart in prompts (see section 4).

---

## 6. Heuristics catalogue

General mechanisms that make Discover work, for any topic. "Apply" = how a talk step (T) or an AI research/merge step (R) uses it.

### Shape of the process
**H1 — Diverge, then converge; understand before solving**
- What: open the problem up widely before narrowing. Divergent = "exploring an issue more widely or deeply"; convergent = "taking focused action". — [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/)
- Why: "The first diamond helps people understand, rather than simply assume, what the problem is. It involves speaking to and spending time with people who are affected by the issues." — [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/). NN/g: Discover's job is to "illuminate what you don't know". — [NN/g UX Research Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/)
- Apply: R — the research flow only widens; the merge organises but does not pick.

**H2 — Defer judgement; no early convergence**
- What: no criticism or ranking while generating. IDEO's first brainstorming rule is "Defer judgment." — [IDEO U, 7 Simple Rules of Brainstorming](https://ideou.com/blogs/inspiration/7-simple-rules-of-brainstorming) (snippet); rules go back to Osborn's *Applied Imagination* ([Sage encyclopedia summary](https://sk.sagepub.com/ency/edvol/embed/giftedness/chpt/brainstorming)) (snippet). In research: solution-first goals cause "anchoring and confirmation bias"; write solution ideas down and put them "on ice". — [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/) (snippet). Exploratory research "does not (typically) involve testing a hypothesis or evaluating a potential solution." — [NN/g Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)
- Why: judging early narrows the field before it's been seen.
- Apply: T — solutions Muzzy brings are logged "on ice". R — helpers don't rank or recommend.

**H3 — Go for quantity**
- What: more ideas/sources raise the odds of a strong one. IDEO rule "Go for quantity." — [IDEO U](https://ideou.com/blogs/inspiration/7-simple-rules-of-brainstorming) (snippet). The Design Council lists brainstorming — "Generating ideas quickly in response to a problem" — among its Discover methods. — [DC Design methods step 1](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/)
- Why: quality comes from choosing among many, and choosing is the next phase.
- Apply: R — each helper gathers widely before it summarises (bounded by H15).

**H4 — Build on others**
- What: use one idea as the base for the next ("and", not "but"). IDEO rule. — [IDEO U](https://ideou.com/blogs/inspiration/7-simple-rules-of-brainstorming) (snippet)
- Why: combinations find what no single line of thought does.
- Apply: R — the merge combines helpers' findings into themes; T — Claude extends Muzzy's ideas rather than replacing them.

**H5 — Work independently first, combine after**
- What: in Diehl & Stroebe's experiments, people brainstorming alone ("nominal groups") out-produced the same number in a live group; "production blocking accounted for most of the productivity loss." — [Diehl & Stroebe 1987, JPSP](https://www.uni-muenster.de/imperia/md/content/psyifp/aeechterhoff/wintersemester2011-12/seminarthemenfelderdersozialpsychologie/08_diehl_stoebe_productivityloss-brainstorming_jpsp1987.pdf) (snippet). NN/g's diverge-converge: analyse independently first, then share and combine. — [NN/g, Diverge-and-Converge](https://www.nngroup.com/articles/diverge-converge/) (snippet)
- Why: independent work avoids blocking and groupthink, and gives more varied results.
- Apply: R — parallel helpers that can't see each other until the merge. (Applying it to AI helpers is an analogy.)
- Disagreement: a later meta-analysis (Mullen, Johnson & Salas) argued blocking isn't the main cause; the nominal-group advantage itself is not disputed. — [Productivity Loss in Brainstorming, summary/commentary](https://homepages.se.edu/cvonbergen/files/2013/01/Productivity-Loss-In-Brainstorming_Toward-the-Solution-of-a-Riddle.pdf) (snippet)

### Framing the question
**H6 — Question the brief / reframe the problem**
- What: before solving, ask whether this is the right problem. The Council's own description: "The process starts by questioning the challenge and quickly leads to research to identify user needs." — [DC History of the Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/). Wedell-Wedellsborg: organisations are good at solving problems and weak at choosing which ones; practices include "questioning the objective" and "analyzing positive exceptions". — [HBR 2017, "Are You Solving the Right Problems?" (PDF)](https://www.aspeninstitute.org/wp-content/uploads/2026/06/Are-You-Solving-the-Right-Problems_-Thomas-Wedell-Wedellsborg.pdf) (snippet). DC: "The insight gathered from the discovery phase can help you to define the challenge in a different way." — [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/). NN/g: ask what problem a preferred solution is meant to solve. — [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/) (snippet)
- Why: the brief as first stated often names a means, not the goal.
- Apply: T — talk step A1 asks "what would having it give you?" and reflects back *brief as said → goal underneath*.

**H7 — The 5 Whys**
- What: "asking why repeatedly whenever a problem is encountered in order to get beyond the obvious symptoms to discover the root cause." — [Lean Enterprise Institute, 5 Whys](https://www.lean.org/lexicon-terms/5-whys/) (snippet)
- Why: each why moves a level down from symptom/means toward cause/goal.
- Caveats: LEI itself says "the specific number five is not the point" — keep asking until the root cause is reached ([LEI](https://www.lean.org/lexicon-terms/5-whys/)); an LEI coach notes two whys work best in some cases ([LEI, How Many Whys Should I Ask?](https://www.lean.org/the-lean-post/articles/how-many-whys-should-i-ask/)); Ohno's own example unpacks to seven ([Lean Blog 2026](https://www.leanblog.org/2026/04/ohno-5-whys-actually-seven/)). All (snippet).
- Apply: T — 2–3 whys in A1, stopping at a feeling or a goal. Don't interrogate an artist with five.

**H8 — Beginner's mind / discovery mindset**
- What: set aside what you think you know. IxDF lists "Assuming a Beginner's Mindset" as an Empathise method, and calls the stages "modes… rather than sequential steps". — [IxDF, Empathise](https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users). d.school: designers "carry baggage" about problems — [d.school Bootleg](https://dschool.stanford.edu/resources/design-thinking-bootleg) (snippet; fetch failed, unverified). NN/g: be "open to learning that [your] assumptions are wrong." — [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/) (snippet)
- Why: expertise and hunches filter what you notice.
- Apply: R — helpers are told the brief and the assumptions, and told to treat the assumptions as things to test.

**H9 — Surface assumptions; map importance × evidence**
- What: list beliefs as hypotheses that are "testable, precise and discrete"; sort them into desirability, feasibility, viability; plot each on an importance × evidence 2×2 and "Focus on the top right quadrant for experimentation" (important, little evidence). — [Strategyzer, Assumptions Mapping](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter). NN/g: Discover should "validate and discard assumptions" ([UX Research Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/)); discovery workshops include assumption mapping and research-question generation ([Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)).
- For BMUZ the three kinds map well: desirability ≈ "will it feel/play the way Muzzy wants", feasibility ≈ "can we build it on this stack/phone", viability ≈ "is it worth the time for this release" (this report's mapping).
- Why: aims research at the beliefs that would hurt most if wrong.
- Apply: T — Muzzy's beliefs logged as assumptions, he marks importance. R — research fills the evidence; merge shows the scoreboard.

**H10 — Research questions before searching**
- What: write goals/questions first; they pick the method. NN/g discovery workshops include research-question generation before the research ([Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/)). The following are (snippet): research plans list "research questions, goals, or hypotheses" ([Research Plans](https://www.nngroup.com/articles/pm-research-plan/)); compose goals before the interview guide and don't change them mid-study ([User Interviews 101](https://www.nngroup.com/articles/user-interviews/)); too many goals lowers insight per goal, and goals determine method ([Checklist for Planning Usability Studies](https://www.nngroup.com/articles/usability-test-checklist/)). With AI: draft many questions, then group, dedupe and reword. — [NN/g, Planning Research with Generative AI](https://www.nngroup.com/articles/plan-research-ai/)
- Why: without questions, desk research drifts to whatever is easy to find.
- Apply: T→R — 3–5 questions written after the talk steps, shown to Muzzy, then split across helpers.

### Where to look
**H11 — Look outside the field (analogous inspiration)**
- What: study the same activity, behaviour or emotion in a different setting. IxDF lists "Analogous Empathy" as an Empathise method — [IxDF](https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users). IDEO.org calls it analogous inspiration, for "a fresh perspective" — [IDEO.org](https://www.designkit.org/methods/analogous-inspiration.html) (snippet; fetch 403, unverified). DC principle "Collaborate and co-create" — "get inspired by what others are doing" — [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/) (the gloss: snippet)
- Why: the obvious field shares the same blind spots.
- Apply: R — one lens always looks outside games/the tech's own domain.

**H12 — Extremes and mainstreams**
- What: research both the middle of the audience and its extremes. IxDF lists "Engaging with Extreme Users" as an Empathise method — [IxDF](https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users). IDEO pairs users "squarely in the middle of your target audience" with extreme users — [IDEO, Extremes and Mainstreams](https://designthinking.ideo.com/resources/extremes-and-mainstreams-design-toolkit-by-ideo-org) (snippet)
- Why: the middle shows the norm; extremes exaggerate needs and failures the middle hides.
- Apply: R — one lens for the mainstream, one for extremes and failures. For desk research, "extreme users" become extreme cases, edge cases and failure reports (this report's adaptation).

**H13 — Separate observation from interpretation**
- What: record what was seen apart from what it's taken to mean. IxDF's Empathise methods include "Ask What? How? Why?" — what is happening, how, and only then why (the interpretation) — [IxDF](https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users). Example (snippet): "a stuffed animal on the sofa" vs "a child lives here". — [National Louis University, Observation, Interpretation and Analysis](https://nl.edu/ctle/managing-your-course/teaching-your-course/best-practices-for-educators/instructor-resources-to-support-student-writing/writing-across-disciplines/observation-interpretation-and-analysis/). Keep notes and interpretations in separate columns. — [LibreTexts, Interpretation and Evaluation](https://socialsci.libretexts.org/Courses/Pittsburg_State_University/The_Developing_Child/05%3A_Observation/5.07%3A_Interpretation_and_Evaluation). Committing to a view before researching tends to blur the two (same NLU page). (NLU and LibreTexts: snippet.) NN/g lists affinity diagramming as a discovery activity for clustering observations into themes — [NN/g Discovery: Definition](https://www.nngroup.com/articles/discovery-phase/); [Affinity Diagramming](https://www.nngroup.com/articles/affinity-diagram/) (snippet)
- Why: lets the reader (and Define) re-interpret; stops a helper's opinion posing as a finding.
- Apply: R — two columns per helper; the merge's strength mark distinguishes "source says" from "helper thinks".

### Knowing it's true, knowing when to stop
**H14 — Triangulation**
- What: "using multiple sources of data or multiple approaches to analyzing data, to enhance the credibility of a research study"; all methods are limited, so combine them. — [NN/g Triangulation](https://www.nngroup.com/articles/triangulation-better-research-results-using-multiple-ux-methods/) (snippet)
- Why: agreement across independent sources is stronger than any one source.
- Apply: R — merge marks each claim by how many independent sources back it.

**H15 — Saturation (when to stop)**
- What: stop when new data adds no new themes. Guest, Bunce & Johnson found saturation "within the first twelve interviews", with basic themes present at six. — [Guest et al. 2006, Field Methods](https://studysites.sagepub.com/green_thorogood3e/study/Further%20reading/Field%20Methods-2006-Guest-59-82.pdf) (snippet). The Design Council's own Discover guidance on choosing a sample: "six to nine people will be enough." — [DC Design methods step 1](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/)
- Caveat: the 12 came from a homogeneous sample and a focused question; don't use it as a universal minimum. — [FHI 360, How many interviews are enough?](https://researchforevidence.fhi360.org/riddle-me-this-how-many-interviews-or-focus-groups-are-enough) (snippet)
- Apply: R — a helper stops when its last few sources added nothing new and reports that, plus a hard cap. Applying an interview finding to desk sources is an analogy.

**H23 — Keep contradictions; check the contexts**
- What: when findings conflict, check whether the studies looked at different people or settings before choosing; use mixed methods. — [NN/g, Interpreting Contradictory UX Research Findings](https://www.nngroup.com/articles/interpreting-research-findings/) (snippet)
- Why: contradictions often mark exactly where the answer depends on context.
- Apply: R — the merge shows both sides and the context of each; it never averages them away.

**H24 — Leave room for unknown unknowns**
- What: discovery should turn up things the team "hadn't expected to learn" — [NN/g Discovery Mindset](https://www.nngroup.com/articles/discovery-mindset/) (snippet); Discover is to "illuminate what you don't know" — [NN/g Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/). NN/g also calls discovery "messy" and starts it with ecosystem maps of the whole space — [NN/g Mapping in Discovery](https://www.nngroup.com/articles/mapping-in-discovery/)
- Why: research only on the questions you thought to ask confirms your frame.
- Apply: R — the outside-the-field lens and a "Surprises" section in the merge.

### Turning findings into a hand-off
**H16 — Insight = observation + why it matters**
- What: insight statements are "succinct sentences that will point the way forward", plucked from "the huge body of information you've gathered"; IDEO places this in the Ideation phase. — [IDEO.org, Create Insight Statements](https://designkit.org/methods/create-insight-statements.html) (snippet; fetch 403, unverified). A course guide citing Design Kit says a good one mixes context, motivations, tension and impact. — [BYU-I Design Thinking, Define](https://byuidesignthinking.github.io/course_guide/slides/define.html) (snippet). The Council puts it in Define: "create a design brief which clearly defines the challenge based on these insights." — [DC History](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/)
- Apply: R — merge writes a draft "so what" line per theme, marked for Define.

**H17 — "How might we" at the hand-off**
- What: HMWs are written from the top research findings at the end of discovery, before ideation; they shouldn't embed a solution. — [NN/g, Using "How Might We" Questions](https://www.nngroup.com/articles/how-might-we-questions/) (snippet). IDEO's field guide turns insight statements into HMWs. — [IDEO.org](https://designkit.org/methods/create-insight-statements.html) (snippet; unverified)
- Apply: hand-off may list drafts; Define owns them.

**H18 — Problem statements with no solution in them**
- What: a problem statement should "Not contain a solution" and cover one problem, not "a laundry list". — [NN/g, Problem Statements](https://www.nngroup.com/articles/problem-statements/)
- Apply: T — A1's reflected "goal underneath" must not name a solution. The formal problem statement is Define's.

### The Design Council's principles, as working rules
— principle names verified on [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/); the one-line glosses after each name are (snippet)

**H19 — Communicate visually and inclusively** — "Help people gain a shared understanding of the problem and ideas." Apply: the card, one-line question lists, reference images/clips, sketches instead of paragraphs.

**H20 — Put people first** — "Start with an understanding of the people using a service, their needs, strengths and aspirations." Apply: Muzzy's own goal and feelings are first-class input; real players are a "needs Muzzy" probe, never simulated by a helper.

**H21 — Collaborate and co-create** — "Work together and get inspired by what others are doing." Apply: Muzzy sees and can edit the research questions before the flow runs; the card asks what's missing.

**H22 — Iterate, iterate, iterate** — "spot errors early, avoid risk and build confidence in your ideas" (snippet); "This is not a linear process as the arrows on the diagram show." — [DC Framework for Innovation](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/). Cat Drew: "each project will have its own set of feedback loops", and "following a toolkit does not equal designing a good solution to the right problem." — [DC, Double Diamond 15 years](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/double-diamond-15-years/). Apply: the card offers "loop back on one question" as a normal choice; open questions route to a spike/sketch/playtest; the pipeline is a scaffold, not a guarantee (Drew's warning).

### Two more mechanisms
**H25 — Hopes and fears**
- What: a Design Council Discover method — people say what they hope the project achieves and what they fear could go wrong. — [DC Design methods step 1: Discover](https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/) (the method name is verified; the gloss is this report's summary)
- Why: hopes expose the goal and the feeling wanted; fears expose the riskiest assumptions and deal-breakers — in the designer's own words, without asking him to "list assumptions".
- Apply: T — talk step A2 asks for hopes and fears; hopes feed the goal (H6) and desirability assumptions; fears become important assumptions for the disconfirm lens (H9).

**H26 — Timeboxed spike for a technical unknown**
- What: spikes "gain the knowledge necessary to reduce the risk of a technical approach, better understand a requirement, or increase the reliability of a story estimate." — [SAFe Spikes](https://framework.scaledagile.com/spikes). They come from XP, are time-boxed, and produce knowledge, not product (same page; timebox detail: snippet).
- Why: some questions can't be answered by reading; a small throwaway test answers one question cheaply and stops before it becomes the build.
- Apply: R — a helper that hits "reading can't settle this" names a spike (tech) or a sketch (feel) as the probe, with the one question it answers and a timebox. The aesthetic twin is the sketch: Swink's "constraints define sensation" — feel shows up only when played ([Game Developer, Swink](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)).

### Not found / weakly sourced
- d.school's official Bootleg page is cited by URL; its exact wording was seen only via unofficial copies.
- The "disconfirm" lens, the four-lens set, and treating extreme *cases* as extreme *users* are this report's design, built from H9, H12, H14 and H8 — not a named method in any source.

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
- Design Council — Systemic Design Framework: https://www.designcouncil.org.uk/resources/systemic-design-framework/
- IDEO U — 7 Simple Rules of Brainstorming: https://ideou.com/blogs/inspiration/7-simple-rules-of-brainstorming
- Sage Encyclopedia — Brainstorming (Osborn's rules): https://sk.sagepub.com/ency/edvol/embed/giftedness/chpt/brainstorming
- Diehl & Stroebe (1987), Productivity Loss in Brainstorming Groups, JPSP 53: https://www.uni-muenster.de/imperia/md/content/psyifp/aeechterhoff/wintersemester2011-12/seminarthemenfelderdersozialpsychologie/08_diehl_stoebe_productivityloss-brainstorming_jpsp1987.pdf
- Commentary on brainstorming productivity loss (Mullen et al. debate): https://homepages.se.edu/cvonbergen/files/2013/01/Productivity-Loss-In-Brainstorming_Toward-the-Solution-of-a-Riddle.pdf
- NN/g — The Diverge-and-Converge Technique: https://www.nngroup.com/articles/diverge-converge/
- Wedell-Wedellsborg (2017), Are You Solving the Right Problems? (HBR, PDF): https://www.aspeninstitute.org/wp-content/uploads/2026/06/Are-You-Solving-the-Right-Problems_-Thomas-Wedell-Wedellsborg.pdf
- Lean Enterprise Institute — 5 Whys: https://www.lean.org/lexicon-terms/5-whys/
- Lean Enterprise Institute — How Many Whys Should I Ask?: https://www.lean.org/the-lean-post/articles/how-many-whys-should-i-ask/
- Lean Blog — Ohno's 5 Whys is actually seven: https://www.leanblog.org/2026/04/ohno-5-whys-actually-seven/
- d.school — Design Thinking Bootleg: https://dschool.stanford.edu/resources/design-thinking-bootleg
- NN/g — Research Plans: https://www.nngroup.com/articles/pm-research-plan/
- NN/g — User Interviews 101: https://www.nngroup.com/articles/user-interviews/
- NN/g — Checklist for Planning Usability Studies: https://www.nngroup.com/articles/usability-test-checklist/
- NN/g — Planning Research with Generative AI: https://www.nngroup.com/articles/plan-research-ai/
- IDEO — Extremes and Mainstreams: https://designthinking.ideo.com/resources/extremes-and-mainstreams-design-toolkit-by-ideo-org
- National Louis University — Observation, Interpretation and Analysis: https://nl.edu/ctle/managing-your-course/teaching-your-course/best-practices-for-educators/instructor-resources-to-support-student-writing/writing-across-disciplines/observation-interpretation-and-analysis/
- LibreTexts — Interpretation and Evaluation: https://socialsci.libretexts.org/Courses/Pittsburg_State_University/The_Developing_Child/05%3A_Observation/5.07%3A_Interpretation_and_Evaluation
- NN/g — Affinity Diagramming: https://www.nngroup.com/articles/affinity-diagram/
- NN/g — Triangulation: https://www.nngroup.com/articles/triangulation-better-research-results-using-multiple-ux-methods/
- NN/g — Interpreting Contradictory UX Research Findings: https://www.nngroup.com/articles/interpreting-research-findings/
- Guest, Bunce & Johnson (2006), How Many Interviews Are Enough?, Field Methods 18(1): https://studysites.sagepub.com/green_thorogood3e/study/Further%20reading/Field%20Methods-2006-Guest-59-82.pdf
- FHI 360 — How many interviews are enough?: https://researchforevidence.fhi360.org/riddle-me-this-how-many-interviews-or-focus-groups-are-enough
- IDEO.org Design Kit — Create Insight Statements: https://designkit.org/methods/create-insight-statements.html
- BYU-I Design Thinking — Define slides: https://byuidesignthinking.github.io/course_guide/slides/define.html

- Design Council — History of the Double Diamond (fetched path): https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/
- Design Council — The Double Diamond, 15 years on (Cat Drew): https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/double-diamond-15-years/
- Design Council — Design methods step 1: Discover: https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-1-discover/
- Design Council — Design methods step 2: Define: https://www.designcouncil.org.uk/our-work/projects-programmes/archive/article/design-methods-step-2-define/
- NN/g — UX Research Cheat Sheet: https://www.nngroup.com/articles/ux-research-cheat-sheet/
- IxDF — Stage 1: Empathise with your users: https://ixdf.org/literature/article/stage-1-in-the-design-thinking-process-empathise-with-your-users
Not found / not used: d.school Bootcamp Bootleg (only unofficial copies surfaced); the Council's 2007 "Eleven lessons" study; game-industry writing that applies the Double Diamond by name (searches returned only UX/product sources — so the game adaptation in section 4 is this report's synthesis, built on MDA, Swink and Fullerton, not a cited practice).
