# Design gaps — evidence from Muzzy's past games (2026-11-09)

What this is: real cases where missing, unclear or late design information caused rework, a wrong build, or a back-and-forth with Muzzy. It feeds the redesign of BMUZ's Discover and Define questions.

Read first-hand (by one helper, read-only):
- **Glyphtender** (web remake of his Unity game, 2026-09-30 → 11-04): STATE, GDD, TDD Decisions, BUGS, sprints 01–33, lookbacks v0.16–v0.18, log.
- **Goops v2** (BMUZ remake, 2026-10-16 → 11-03): STATE log, TDD Decisions, sprints 01–33, lookbacks alpha + beta, research/ladder-30.md.
- **Goops v1** (GSD era, Jan–Mar 2026): through `research/v1-review.md` (written 2026-10-16 from v1's docs, code and 621 commits) + the GSD archive.
- **Roll Better** (GSD era Feb–Mar 2026 + BMUZ sprints 01–05): GSD ROADMAP + MILESTONES, archive/vision.md, TDD, STATE.

Path keys in the Source column: **GT** = `games/glyphtender/.planning/` · **GO** = `games/goops/.planning/` · **RB** = `games/roll-better/.planning/` (all under `~/Documents/dev/`).

Limits:
- Goops v1 rows rest on v1-review.md, itself a summary — second-hand, but written from the code and git history.
- Roll Better's GSD record says WHAT was redone, rarely WHY or in Muzzy's words. Its "why" cells are marked *(inference)*.
- "Cost" is what the files record (sprints, phases, commits, features). Where I size it, it's marked *(inference)*.

## Yardstick
1 core loop in verbs · 2 things in play + their states · 3 rules (incl. how it ends/scores) · 4 decisions and why they're hard · 5 feel target + how we'll know · 6 change over time (variety, progression, randomness) · 7 frame (platform, players, session length, controls, online) · 8 smallest version worth playing + what waits · 9 look and sound direction.

---

## 1. Cases

### Glyphtender (21)
| # | Date | What happened | Missing information | Need | Cost | Source |
|---|---|---|---|---|---|---|
| G1 | 09-30 → 10-30 | Direction was "phone (portrait AND landscape)". A month later: "glyphtender should be a vertical game only"; then, seeing a "Turn your phone upright" screen: "do nothing for browsers. it'll be obvious" | Which way up the phone is held | 7 | Sideways layouts, short-screen bug fixes (B019) and the 844×390 / 768×343 tests, all dropped; a "turn your phone" screen built and removed the same day | GT STATE.md:18 · GT GDD.md:10 · GT TDD.md:209–218 |
| G2 | 10-01 | End screen overhaul: the old table was "confusing, cluttered, cramped, and didn't highlight interesting things". Then a second layout pass: "fix this as I asked before" | What the end of a game shows and celebrates | 3 (+5) | Sprint 07's main features (F24–F28), two full layout passes, 3 rounds of playtest tweaks | GT archive/sprints/sprint-07.md:3, :65, :73 |
| G3 | 10-02 | All 15 awards thrown out for 14 skill awards: "This game is secretly more about positioning and blocking your opponent than it is spelling, so we should have achievements that celebrate those moments" | What the real skill of the game is | 4 | 15 awards rebuilt, new per-turn log facts in the engine, thresholds re-tuned 3 times (D54, D55, D81) | GT GDD.md:72 · GT sprint-07.md:110 · GT TDD.md:622 |
| G4 | 10-03 → 10-04 | Pincer award defined, then redefined the next day: "9 → 5 → 1 moves wasn't clear"; then "% accumulated on one glyphling… this proves aggressive play" | What counts as a clever squeeze (the skill, measured) | 4 | 2 rule versions + sims each time | GT TDD.md:606 (D57), :459 (D68) |
| G5 | 10-01 | "the score from the previous turn remains visible when the next player goes" — a rule from F25 (words stay lit) had to be replaced | When a turn's feedback starts and ends | 5 | Score sequence rebuilt (D52) | GT sprint-07.md:101 · GT TDD.md:661 |
| G6 | 10-01, 10-10 | Arc on casts removed: "they are 'straight line shots'"; later "an arc conveys verticality — your pieces don't jump over anything" | How pieces move physically (look must match the rules) | 9 | Trails + aim line redone twice | GT sprint-07.md:97 · GT GDD.md:51 |
| G7 | 10-01 | "after casting, my seed tray resorts … don't resort" | How the hand (tray) behaves between turns | 2 | Tray rule rebuilt + guards | GT sprint-07.md:100 |
| G8 | 09-30 | Tray seeds "way too small on my desktop… they should be basically real size to how they'll look on the board" | Piece size on screen | 9 | Layout redone | GT GDD.md:55 |
| G9 | 10-04 | 7 AI personalities built overnight (copied from the original). Next day: "we should only have 3" (rock-paper-scissors) | How many opponents, and how they differ | NEW: opponents | A sprint's personalities cut to 3; balance re-done | GT sprint-14.md:1 · GT sprint-15.md:45 |
| G10 | 10-04 | "make sure they are scoring points WHILE performing their personality goal"; a rules change to balance them rejected: "no, that loses some of the strategy and I don't like that" | How an AI still tries to win; which rules are untouchable | NEW: opponents (+4) | Brain re-tuned; sandbox rule thrown away | GT sprint-15.md:36, :44 |
| G11 | 10-07 | Sims showed first player wins 53% → "shuffle the whole order"; 3 players moved to the Small board | Who goes first; board per player count | 3 | Rules + draft + online changed (D82) | GT GDD.md:154–156 · GT sprint-17.md:36 |
| G12 | 10-11 → 10-12 | Word-list policy settled late: slurs, British spelling, vulgar words, "what counts as a word". Switches built in Settings, moved the same day: "it's just like the 2-letter option" | Which words count (a rule) and where players choose it | 3 | A sprint (F68–F71), Muzzy hand-checked 452 words | GT GDD.md:96–99 · GT sprint-25.md:41, :25 |
| G13 | 10-12 | Settings → Difficulty switched off: "doesn't feel like it applies … we handle difficulty per AI opponent at lobby setup" | Where difficulty lives | NEW: screens & options | Small (a row removed) | GT sprint-25.md:39 |
| G14 | 10-13 → 10-14 | "The settings menu feels haphazard… Gameplay first…" — whole menu restructure; a one-picker New Game seat tried and reverted ("If it won't fit on phone, then ignore this") | The list of screens and what goes where | NEW: screens & options | Sprint 28 menus redone; one attempt reverted | GT sprint-28.md:3, :40–41 |
| G15 | 10-12 | "plant" replaces "cast" everywhere (found while writing the tutorial) | The words players see for each action | NEW: names | Rename across text, code and docs | GT GDD.md:112 |
| G16 | 11-02 | Live awards: "two design facts were read late — awards are kept per player … and an online screen has no log mid-game" | Who can see what, and when (secret info) | NEW: hidden info | A new records rule + the server works records out | GT sprint-33.md:67 |
| G17 | 10-04 | Muzzy's catch-up idea (tangles worth more for players behind) runs into "secret Magic means players can't aim for it" | Same: what players can see of the score | NEW: hidden info | Idea parked (no build) | GT sprint-15.md:37 |
| G18 | 10-30 | "the board should be closer to the center so that the ergonomics aren't as bad" — reverses D41 from day 1 | Where the thumb is (hand position on a phone) | 7 | Layout lever added, tutorial bubbles moved | GT TDD.md:202–208 |
| G19 | 10-03 | Reveal's "+3"s just sat there: "If it happens somewhere, and it's the same intention somewhere else, we also have it happen there"; round 2: cards a fixed size from the start | One feedback language across the game | 5 | Reveal rebuilt twice (D56) | GT TDD.md:592–605 |
| G20 | 10-10 | Dragging left "a solid copy" in the tray → drag look styles A–D built in the kit | What a carried piece looks like | 5 | A kit feature (F53) + a sprint | GT sprint-23.md:3 · GT TDD.md:326 |
| G21 | 10-08 | After a live game with a friend: a player who leaves or idles → "a bot should take over until they are active again" | What happens when an online player leaves or goes quiet | 7 | F52 + bug B024 after release | GT GDD.md:109 · GT BUGS.md:27 |

### Goops v1 (11) — from the v1 review
| # | Date | What happened | Missing information | Need | Cost | Source |
|---|---|---|---|---|---|---|
| V1 | Feb 2026 | Tutorial written 3 times, steps 17 → 14 → 19 → 16 → 15 → 13, 11+ test rounds, never finished: "Written as code before the design was settled" | Settled rules before teaching them | 3 (+8) | ~90 commits, unfinished | GO research/v1-review.md:92, :47 |
| V2 | Feb 2026 | How a crack gets sealed flipped 3 times (cover + pop → automatic on landing → plug-on-land + seal-on-pop) | The goal rule, exactly | 3 | Tutorial + engine churn | GO v1-review.md:33, :139 |
| V3 | Jan–Feb 2026 | Soft-body goop: 9 prototypes, a failed attempt, phases deferred; at phone size it "reads as soft rounded squares more than living jelly" | The look, proved cheaply, at phone size | 9 (+5) | ~85 commits + 15,000 lines of prototypes | GO v1-review.md:93, :64 |
| V4 | Jan–Feb 2026 | Tank drawn curved, flattened for soft-body, then wrap re-added | Flat or curved — decided up front | 9 | ~15 commits + a 170-line transform | GO v1-review.md:95 |
| V5 | Jan 2026 | Lights redesigned twice; the three breakdowns each punish a core verb ("the joy and the penalty sit on the same button") | What a good player should be doing, and what each system pushes them to do | 4 | ~80 commits on breakdowns + mini-games; cut/rethink in the remake | GO v1-review.md:74, :79–80, :96 |
| V6 | Jan 23–25 2026 | 20 upgrades built in 3 days, "never balanced: no sim, no playtests past early ranks"; many "tiny percentage tweaks … a player can't feel" | How the climb should feel and pace | 6 (+8) | ~85 commits; rebuilt in v2 | GO v1-review.md:97, :104 |
| V7 | Jan 2026 | Whole milestones renaming 50+ terms across 62 files "because names … weren't fixed at the start" | The names of things | NEW: names | ~42 rename commits | GO v1-review.md:98 |
| V8 | Feb 2026 | Pressure is a countdown clock though the fantasy is a tank filling; Muzzy's own "SlowMode" note | What the main pressure in the game IS | 1 (+3) | Left unsettled → remake | GO v1-review.md:81, :140 · GO archive/gsd/PROJECT.md:220–237 |
| V9 | Jan–Feb 2026 | The Veteran, fines, rank titles "written as story beats, never designed as mechanics"; none shipped | What each story beat changes in play | NEW: story as mechanics | Story = 0 lines of code in v1 | GO v1-review.md:82, :145 |
| V10 | — | "is a shift meant to be a snack or a sit-down?" (75 s vs 115 s) | Session length | 7 | Open question carried into the remake | GO v1-review.md:150 |
| V11 | — | Tank stops ~80% down the phone, a dead band under it | Phone-first screen shape | 7 | Layout redone in v2 | GO v1-review.md:162 |

### Goops v2 (14)
| # | Date | What happened | Missing information | Need | Cost | Source |
|---|---|---|---|---|---|---|
| P1 | 10-17 | A blocked spawn during a rupture ended the shift at once — "my brief's rule, not Muzzy's" | How a shift ends in an edge case | 3 | Found in review, fixed | GO archive/sprints/sprint-02.md:48 |
| P2 | 10-17 → 10-19 | HUD: "My focus is so heavily on the bottom of the tank, that the top UI is vanishing… the message … didn't show up in a place that matched my focus". 3 test layouts built, then removed for Muzzy's own mock-up; the next-piece window "too small… the HUD only felt wrong after Muzzy played it" | Where the player's eyes are, and what they must see there | NEW: what the player must see | HUD parked (S02), 3 layouts built + thrown away (S05), re-laid again (S09) | GO sprint-02.md:52 · GO sprint-05.md:7, :71–73 · GO sprint-09.md:43 |
| P3 | 10-19 | "landscape kept coming back in checks and questions though he had said portrait only (3 times)" | Which way up — written where every step reads it | 7 | Repeated briefs/shots/questions | GO sprint-08.md:43 · GO archive/lookbacks/alpha.md:19 |
| P4 | 10-18 → 10-19 | Cracks too low; then "the visual of the tank with an actual obvious band with zero cracks above feels aesthetically incorrect" → band → halfway → hill | Where goals appear, and how that should feel | 3 (+5) | 3 crack-placement rules | GO sprint-05.md:46, :53, :57 |
| P5 | 10-19 | First lessons: notes a–n from Muzzy's first try, more from his second; "the screen look took a lot longer than Muzzy expected" | How the game teaches (look + voice) | NEW: teaching | 2 rebuild rounds | GO sprint-08.md:30, :36, :43 |
| P6 | 10-19 | Sprint planned code-made sounds though Muzzy had called them "horrible" twice | Sound direction | 9 | Caught before he heard them | GO sprint-07.md:12 · GO lookbacks/alpha.md:25 |
| P7 | 10-24 | The new shift report didn't fit a phone; "two layout ideas before Muzzy's scrolling idea solved it" | How much a screen must hold, at phone size | 7 (+NEW: what the player must see) | 2 layouts thrown away | GO sprint-14.md:32 |
| P8 | 10-29 → 10-30 | The rank lock (quota = the key to rank up) arrives at beta: "XP goal met = allowed to rank up IF you've met quota during this rank". Retro: "Claude tuned around problems the rules caused … when a number can't fix it, bring Muzzy the rule question sooner" | What gates progress | 6 (+3) | Sprint 25 re-balance; careers 42 → 70 shifts | GO sprint-25.md:3, :32–33 · GO TDD.md:314–315 |
| P9 | 10-30 | Final shift (approved 10-27) rewritten: "I'd rather be working directly with him, not slightly against him" · "all upgrades should have some sort of an impact on the final level" | The finale's relationship to the story; what the player's choice is | 4 (+NEW: story as mechanics) | Sprint 26 (rules, both endings) | GO TDD.md:295–296 · GO sprint-26.md:20 |
| P10 | 11-02 | 51 ranks → 31: "cut the levels in half — offer twice the rewards … this would help the game not feel so impossibly long" | How long the whole climb is, and that each step brings something | 6 (+7) | Sprints 31 + 32 + a balance feature (F82) | GO research/ladder-30.md:3, :8–11 |
| P11 | 11-02 | Growing cracks: timer → "when a new crack would form, there is an X% chance that instead, it extends a crack" | The rule for a late-game twist | 3 | Rule replaced (D37) | GO TDD.md:210–211 · GO sprint-32.md:3 |
| P12 | 11-02 | Muzzy asked to hunt 40 sounds "before anyone checked whether the stand-ins were good enough — he closed F53 with them" | How good sound needs to be for this release | 9 (+8) | His time on a shopping list not needed yet | GO sprint-30.md:45 |
| P13 | 10-20 | Phone session: two thumbs, tap on goop vs rotate (C-1, C-2); Muzzy overruled "most recent finger wins" | What each finger does on a phone | 7 | 47 gesture checks, rebuilt touch | GO sprint-10.md:41 · GO TDD.md:545 |
| P14 | 10-19 | Held piece removed — it's "basically just the 'next piece' now"; swap trades with the next piece | Which pieces exist and their states | 2 | Every seeded test order changed | GO TDD.md:572–583 · GO sprint-09.md:35 |

### Roll Better (5)
| # | Date | What happened | Missing information | Need | Cost | Source |
|---|---|---|---|---|---|---|
| R1 | Mar 2026 | MVP shipped "mobile-first" portrait; v1.4 switched to landscape-only: "Every screen, the 3D scene, and all UI redesigned for phones held sideways". The planned Collapsible Goal Area was dropped ("landscape solved the space problem") | Which way up | 7 | A 5-phase milestone (35–39) | RB archive/gsd/ROADMAP.md:79 · RB archive/vision.md:9–10 |
| R2 | Mar 2026 | Tap-to-roll → hold-to-gather-roll (v1.5); tap-to-select + UNLOCK button → drag-to-unlock (v1.6, "a major system change") | How the core actions feel in the hand | 5 (+7) | Two milestones (phases 40–48) | RB archive/gsd/ROADMAP.md:147, :191 · RB archive/vision.md:23 |
| R3 | Mar 6–12 2026 | After online shipped: drop-in/drop-out, AFK bots, mid-game join, host migration, Play Again rework | What happens when people leave, idle, rejoin or join late | 7 | An 8-phase milestone (27–34) | RB archive/gsd/ROADMAP.md:66–73 |
| R4 | Mar 5–6 2026 | v1.2 removed shake-to-roll and the difficulty selector, restructured the menu, merged the lobby into the main menu | The list of screens and options | NEW: screens & options | 5 phases (22–26) | RB archive/gsd/MILESTONES.md:5 · RB archive/gsd/ROADMAP.md:55–59 |
| R5 | — | "Current tip system is loose but functional… Needs a full design pass" | How the game teaches | NEW: teaching | Still open (shelved) | RB archive/vision.md:31–33 |

---

## 2. Counts

**Per need (primary need only; 51 cases)**
| Need | Cases | Count |
|---|---|---|
| 7 frame | G1 G18 G21 V10 V11 P3 P7 P13 R1 R3 | **10** |
| 3 rules | G2 G11 G12 V1 V2 P1 P4 P11 | **8** |
| 9 look + sound | G6 G8 V3 V4 P6 P12 | **6** |
| 4 decisions | G3 G4 V5 P9 | 4 |
| 5 feel | G5 G19 G20 R2 | 4 |
| 6 change over time | V6 P8 P10 | 3 |
| 2 things + states | G7 P14 | 2 |
| 1 core loop | V8 | 1 |
| 8 smallest version | — (secondary in V1 V6 P12) | 0 |
| NEW (7 needs) | see §3 | 13 |

**Per project:** Glyphtender 21 · Goops 25 (v1 11, v2 14) · Roll Better 5.

**Needs that caused the most rework** *(my sizing from the recorded costs — inference)*:
1. **7 frame** — orientation alone was redone in all three games (R1 a 5-phase milestone, G1 a month of sideways work dropped, P3 repeated), plus online leave/rejoin (R3 an 8-phase milestone, G21).
2. **3 rules** — V1 is the single costliest case on record (~90 commits, never finished), because the goal rule kept moving (V2).
3. **6 change over time** — v1's 20 upgrades (~85 commits, rebuilt), then v2's rank lock and 51 → 31 ranks (3 sprints + a balance feature).
4. **9 look** — v1's soft-body goop (~85 commits + 15,000 lines of prototypes).
5. **4 decisions / the real skill** — G3's awards rebuilt and re-tuned 3 times; v1's breakdowns that punished the core verbs.

**Top 5 costliest single gaps** *(inference from recorded costs)*:
1. **V1 + V2** — Goops v1 tutorial rewritten 3 times around a goal rule that flipped 3 times: ~90 commits, unfinished (need 3).
2. **V3** — Goops v1 soft-body look built before it was proved at phone size: ~85 commits + 15,000 lines (need 9/5).
3. **R1 + G1 + P3** — which way up the phone is held: a 5-phase redesign in Roll Better, a month of dropped sideways work in Glyphtender, repeated drift in Goops (need 7).
4. **V6 + P8 + P10** — how long the climb is and what gates it: v1's unbalanced shop, then v2's rank lock and halved ladder across 3 sprints (need 6).
5. **R3 (+ G21)** — what happens when online players leave, idle or join late: an 8-phase milestone after online shipped (need 7).

Runner-up: **G2 + G3** — Glyphtender's end screen + awards: a sprint, two layout passes, 15 awards thrown out, thresholds re-tuned 3 times.

---

## 3. NEW needs the list of 9 misses

| NEW need | What it is | Cases |
|---|---|---|
| **Opponents (AI)** | How many kinds, how they differ, how they still try to win, what rules they must never bend | G9, G10 |
| **Who sees what (hidden information)** | What's secret, from whom, until when — it shapes rules, awards, online and ideas | G16, G17 |
| **Screens and options map** | Every screen; what's a before-the-game choice (table option) vs a device setting; where difficulty lives | G13, G14, R4 (+ G12's switches) |
| **Names** | The word players see for each thing and action, fixed early | G15, V7 |
| **Story as mechanics** | What each story beat changes in play (not just text) | V9, P9 |
| **What the player must see, and where** | Where the eyes are during play; what must be readable there; how much a screen must hold at phone size | P2, P7 (+ G2) |
| **Teaching** | How the game teaches: voice, look, when — and only after the rules settle | P5, R5 (+ V1) |

Close to an existing need but worth a line of its own *(my read)*:
- **The real skill** ("secretly more about positioning and blocking") sits under need 4 but was never written in Glyphtender until sprint 07. It drove awards (G3, G4), AI (G10) and rule vetoes ("loses some of the strategy").
- **Online people problems** (leave, idle, rejoin, join late, play again) sit under need 7 but cost the most there (R3, G21). "Online: yes/no" is not enough.
- **One feedback language** ("same intention, same motion", G19) sits under need 5. Muzzy states it as a rule for every feature.

---

## 4. Questions to ask BEFORE building

In plain words a designer would answer. Each shows its need and the cases it would have prevented.

| # | Question | Need | Prevents |
|---|---|---|---|
| Q1 | How is it held and played: phone upright, sideways, either? Desktop too? Where does the thumb rest? | 7 | G1, G18, P3, R1, V11 |
| Q2 | Write the rules like a rulebook: how a turn/shift goes, how you score, how it ends — and the odd cases (a piece can't spawn, a wrong colour lands on a goal) | 3 | V1, V2, P1, P11, G11 |
| Q3 | What does a good player do that a new player doesn't? What's the skill, really? | 4 | G3, G4, V5, G10 |
| Q4 | Does any system punish the thing you most want players to do? | 4 | V5 |
| Q5 | How long is one game, and how long is the whole journey (games/shifts to finish)? Does every step bring something new? | 6 / 7 | P10, P8, V6, V10 |
| Q6 | What decides when you move up — points alone, or a goal you must meet? | 6 | P8 |
| Q7 | Online: when someone leaves, goes quiet, comes back or joins late — what happens? Can the room play again? | 7 | R3, G21 |
| Q8 | During play, where are the player's eyes, and what must they see there at a glance? | NEW: what the player must see | P2, P7 |
| Q9 | What does the end of a game show — and what moments does it celebrate? | 3 / 5 | G2, G3 |
| Q10 | How do the pieces move — slide, fly, jump? How big are they on a phone? | 9 | G6, G8, V4 |
| Q11 | The look in one picture — and how will we know it works at phone size? (sketch it first) | 9 / 5 | V3 |
| Q12 | What's secret, from whom, until when? | NEW: hidden info | G16, G17 |
| Q13 | Opponents: how many kinds, how do they differ, and how do they still try to win? | NEW: opponents | G9, G10 |
| Q14 | What does each story beat change in play? Is the player working with or against the characters? | NEW: story as mechanics | V9, P9 |
| Q15 | What do players call each thing and each action? | NEW: names | V7, G15 |
| Q16 | What do players choose before a game, and what's a device setting? List the screens. | NEW: screens & options | G13, G14, R4, G12 |
| Q17 | What does each finger, gesture and key do? Two thumbs at once? | 7 | P13, R2 |
| Q18 | How will the game teach itself — and are the rules settled enough to teach? | NEW: teaching | V1, P5, R5 |
| Q19 | What does the sound need to be like — and is a stand-in good enough for this release? | 9 / 8 | P6, P12 |

---

## 5. When to ask — what the evidence says

- **Frame first (exploring).** Orientation, online leave/rejoin and session length got more expensive with every screen built on top. R1 cost a 5-phase milestone *after* the MVP; G1 a month later; P3 kept drifting even after being said. Ask in Discover, then write it where every step reads it (Goops' fix: STATE Key facts `Orientation:`).
- **Rules and the real skill before code (choosing).**
  - v1's tutorial ate ~90 commits because the goal rule moved under it (V1).
  - v2's retro: "when a number can't fix it, bring Muzzy the rule question sooner" (sprint-25.md:33).
  - Glyphtender's skill ("positioning and blocking") surfaced only at the end screen (G3) and then shaped awards and AI.
- **Look, HUD and feel can't be settled in words — design them with a sketch or mock-up, before the full build (designing).**
  - Goops: "a quick layout mock-up (or a 30-second play) before building a HUD change" (sprint-09.md:44); "check a new screen at phone size … before building all of it" (sprint-14.md:33).
  - Glyphtender: "the sketch settled the look before any code" (sprint-33.md:66).
  - A sketch with fake parts can mislead: "a sketch with fake goo can't be judged" (sprint-05.md:10). Test it in the real game behind a setting.
- **Numbers late; rule shapes early.** Award thresholds stayed provisional until real players / real AI existed. Muzzy: balance "only after proper AI have been implemented" (GT sprint-17.md:37). But the *shape* of the rule (quota as the key, P8) should come early — tuning around a missing rule wasted a sprint.
- **Teaching last.** Build the tutorial after the rules freeze (v1 lesson, GO research/discovery.md:21). Glyphtender's tutorial came at v0.14, after the rules were stable, and wasn't rebuilt.
- **Polish: show the stand-in first.** "play the cheap stand-in version first and ask 'good enough?' before planning work that needs Muzzy's time" (GO sprint-30.md:46).
- **Changing an existing system: read how it really works first** — who holds what, what each screen can see (GT sprint-33.md:68). That's a Define step for any later feature, not just a new game.
- *(Inference)* Glyphtender was a remake, so its rules were known. Almost all its gaps were frame, presentation, AI and "the real skill" — not rules. Goops v1, built from an open idea, lost the most to rules and look. So a remake's Discover can skip rules and dig into frame, skill and presentation; an open idea needs rules settled before anything is taught or polished.
