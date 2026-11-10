# Discover live review — Xong run, 2026-11-09

Run: `dev/.scratch/bmuz-live` (start stage + Discover, then handed to Define). Sources: session transcript `63e3e914-…jsonl` (every AskUserQuestion + answer), `.bmuz/stages/1-start` and `2-discover` journals, `.planning/DISCOVER.md`, the three research reports, `plugin/craft/discover-*.md`.
All analysis below is first-hand from those files. Quotes are exact (typos kept); "…" = cut for length.

Yardstick (what the builder needs): 1 core loop · 2 things + states · 3 rules (incl. end/score) · 4 decisions + why hard · 5 feel target + how we'll know · 6 change over time · 7 frame (platform, players, session, controls, online) · 8 smallest version worth playing · 9 look + sound.

Verdicts: **kept** = kept its place · **Define's** = asked him to choose or commit · **no use** = no need fed · **too early** · nav = navigation (not judged).

## 1. Every question asked, in order

### Start stage (before Discover)

| # | Step | Question (exact) | Muzzy's answer (exact, short) | Need | Verdict | Why |
|---|---|---|---|---|---|---|
| S1 | opening | "Where's your game right now?" | "A concept" | none (routing) | kept | routing; cheap and clear |
| S2 | opening | "What do you want from this pass?" (Open it up / Pin it down / Work it out / Build it) | "I have a .unity file and a psd and some ideas that I can't quite remember" | none | no use | he answered a different question: "where's my material", which wasn't asked |
| S3 | opening | (plain text, no box) "Tell me the concept in your own words: what the game is, plus any bits of the ideas you can remember…" | no answer; turn ended open, watchdog fired 18 min later | none | no use | a plain-text question stalls the engine |
| S4 | opening (retry) | "Your .unity file and .psd aren't in this folder, and I can't read those kinds of file anyway. What's the concept? Type it in your own words in 'Other'…" | "https://drive.google.com/drive/folders/1mGT… the stuff is in here" | none | no use | his real material (incl. the forgotten ideas) sat in Drive; never read |
| S5 | propose | "Start there?" (Discover — spark) | "Start there: Discover — spark" | none (routing) | kept | routing |

### Discover

| # | Step | Question (exact) | Muzzy's answer (exact, short) | Need | Verdict | Why |
|---|---|---|---|---|---|---|
| 1 | spark | "In one breath: what's the idea, in your own words? Even a rough half-memory is fine." | "Basically, standard pong, but xong has some weird things that happen based on each players score. since the scores are on the screen, they become interactive. 0s are portals, when you have a 1, you move both your 1 and your paddle (they move in opposite directions). 2-10 all have other abilities. … the middle line changes (the greater the delta between the scores, the closer the middle line gets to the player with the higher score). also the entire screen starts to rotate as the score passes a certain total…" | 1, 2, 3, 6 | kept | the richest answer of the whole run; most later "material" restates it |
| 2 | spark | "Finish this: "You are a…" Who or what is the player?" (A person / A creature or thing / A force or a god / Not sure yet) | "just a pong player" | none | no use | assumes a fiction; abstract game |
| 3 | spark | "What about this gets you excited? What's the bit you keep thinking about?" | "How it plays" | none | no use | already said in #1 ("scores … become interactive") |
| 4 | spark | "What do you hope Xong becomes?" | "A finished small release" | 8 (weak) | kept | says "small"; options mixed identity (party / competitive) with outcome |
| 5 | spark | "What would disappoint you? What could go wrong?" | "Too chaotic" | 5 | kept | became the run's best-tested assumption (see #20) |
| 6 | spark | "What must it fit, and what's off the table? (where it's played, how long a match takes, two players on one screen or online, deal-breakers)" | "these should have been able to select several of them. also, your question represents both sides (in and out), but the options are only in. i want this local against AI and also online against friend. no local" | 7 | kept | real frame facts; but single-select + "in"-only options; he had to fix the form |
| — | spark | "Keep going … or wrap up now …?" | "Keep going" | — | nav | |
| 7 | experience | "Describe a moment you hope a player has in Xong. Not a feature: a situation…" (4 Claude-written moments) | "Desperate comeback, Score as a weapon, Sideways rally, Score turns on them" | 5, 4 (weak) | kept | usable feel targets; weak signal: he ticked all four, none his own |
| 8 | experience | "After a match, what story would a player tell a friend?" | ""The screen was upside down"" | 5 | kept | names the memorable moment; single-select forced one |
| 9 | experience | "Which feelings is Xong about? In your own words first: type it in Other, or pick a starter." | "Surprised and delighted" | 5 | kept | "own words first" wasn't really offered; starters shown up front |
| 10 | experience | "You said "surprised and delighted". MDA … has eight kinds of fun. Mark any that your answer touches." | "Challenge" | 5 (weak) | kept | added Challenge; but jargon, and 4 of 8 hidden in a description |
| 11 | experience | "What dream does Xong fulfil? "I want to ___"" | "…break a classic" | none | no use | restates #1 ("standard pong, but…") |
| 12 | experience | "What questions should be in a player's head while they play?" | ""What does my 3 do?"" | 4, 6 (weak) | kept | says the number powers are something to discover |
| 13 | experience | "Is Xong fun to play with even with no goal? What's the toy in it…?" | "no toy. this is a video game" | none | no use | "toy" is jargon with no context |
| 14 | experience | "What kind of player do you picture, and how do they see themselves as a player?" | "Retro fan, Competitor, Explorer" | none | no use | 3 of 4 ticked; audience isn't a builder need |
| — | experience | "Keep going …?" | "Keep going" | — | nav | |
| 15 | theme | "From your first answer, I filed "some ideas that I can't quite remember" under "what everyone already knows about the subject". It doesn't really fit there. Keep it, or change it?" | "don't care?" | none | no use | BMUZ bookkeeping shown to the designer |
| 16 | theme | "When you picture Xong, what do you see, hear and touch?" | "Classic black and white, Chunky score digits" | 9 | kept | real look direction |
| 17 | theme | "What's the tone?" | "Cool and slick" | 9, 5 | kept | real tone word |
| 18 | theme | "What does everyone already know about Pong that Xong can use for free?" | "The rules, The look, The sound" | 3, 9 (repeat) | no use | "standard pong" (#1) already said it |
| 19 | theme | "Outside games, where does this feeling show up: a film, a sport, a magic trick?" | ""no clue what you're talking about ''this feeling'' means nothing, there is no context."" | none | no use | no referent for "this feeling" |
| 20a | theme | "Is there an experience from your own life in Xong?" | "this doesn't matter" | none | no use | personal-story question for a Pong variant |
| 20b | theme | "Those 5 research questions: keep them all, drop one, edit one, or add one?" | "i don't see 5 research questions that you're referring to, so I can't answer this" | none | no use | the list was plain text, hidden behind the box |
| 20c | theme | "Research questions for Xong: (1) What made the original Pong feel good … (5) How do 1-v-1 games stop the leader running away with it…? Keep, drop, edit or add?" | "Keep them" | none directly | kept | rubber stamp, but the research it steered fed #20 / #22 |
| — | theme | "Keep going …?" | "Keep going" | — | nav | |
| 21 | simulation | "In Xong, what does the player DO? Pick any that fit, and add your own words in Other…" | "Move the paddle, Hit the ball, Steer your score digit, Shoot through portals, plenty more things. this question feels pretty broad and limiting since there are possibly lots of other things that a player COULD do depending on the design we go with. weak question. doesn't help much" | 1 (repeat) | too early | options were #1 read back; the rest of the verbs depend on design not done yet |
| 22 | simulation | "What THINGS are in Xong's court? Pick any, add your own in Other." | "…"similar to the last question, this feels useless. of course all of these are selected. weak question"" | 2 (repeat) | no use | #1 read back to him |
| 23 | simulation | "Fair. Sharper one: when your score gives you a power …, how does it switch on? …" (Always on / Player fires it / On the hit / Depends on the number) | "Depends on the number" | 3 (none gained) | Define's | asks him to set a rule; he deferred |
| 24 | simulation | "The research found two failure patterns: random modifiers turned Pong unreadable, and catch-up rules like Mario Kart's blue shell made good play stop mattering. You picked 'Too chaotic' as your fear. Which is closer to what you mean?" | "Can't read the ball, Chaos is the point" | 5 | kept | best sharpening of the run: fear → "chaos wanted, ball must stay readable" |
| 25 | simulation | "When a score digit is on the court, what can the ball do to it? (The research found no game that has done this, so it's new ground.)" | "Depends on the number" | 3 (none gained) | Define's | asks for a rule; deferred again |
| 26 | simulation | "Some combinations nobody has tried yet, which might spark a number's ability: (a) the ball hits your OWN digit; (b) … Do any spark something?" | ""useless question. this is research, but I would epxect a question similar to this (but better) during the define phase"" | none | Define's | his words: "during the define phase" |
| 27 | simulation | "Any games Xong already reminds you of? What do you love or hate in them?" | ""it's just pong, but with some extra things that happen. any other game that seems similar to this is really just a copy of pong... like xong is. "" | none | no use | #1 already said it |
| — | simulation | "Keep going …?" | "Keep going" | — | nav | |
| 28 | mechanism-shelf | "Steering your digit (linked to your paddle): which of these feel like Xong, and which feel pasted on?" (Foosball rod / Cue-ball control / Locked ring / Two staggered blockers) | (left unanswered) | none | no use | research analogies he didn't engage with |
| 29 | mechanism-shelf | "Portals (your 0s) and the rally: which fit Xong?" (Portals keep direction / Speed climbs per hit / Freeze on big hits / Bunt) | ""you ask about portals, then give me non portal options. hallucinating … portals should function like you'd expect. ball goes in at an angle, comes out of somewhere else at the same angle and speed. etc. bad question"" | 3 | Define's | asked him to pick mechanisms; 3 of 4 options weren't portals; the rule came from his rebuttal |
| 30 | mechanism-shelf | "Score-driven change and blockers: which fit Xong?" (Earned comeback / Neutral bumpers / Unreachable edge / Power-up pickups) | ""i feel like you're wasting my time. you seem to think you HAVE to ask questions. … doesn't make sense to anyone. I've had several people read it and the options and they can't see the connection. feels like a hallucination…"" | none | no use | two unrelated research groups glued into one heading |
| 31 | twists | "One question this step. The research found no game that ties the weirdness to each player's own score digit, and no Pong variant with online play. … Any worth keeping for later?" (Frenzy mode / Match point flip / Snap, don't spin / None) | ""None, move on"" | none | no use | the lead-in finding was good; the question itself got nothing |
| — | bricks → Define | "On to Define" offer | "On to Define" | — | nav | |

(Rows 20a–20c are numbered that way to keep #20 free as a cross-reference; they count as 3 questions.)

## 2. Counts

**Questions asked**
- Start stage: 5 (incl. 1 plain-text question that stalled) — kept 2 (routing) · no use 3
- Discover: 33 judged + 5 nav
- Discover verdicts: **kept 13** · **Define's 4** · **no use 15** · **too early 1**

**Per Discover step**

| Step | Asked | Kept | Define's | No use | Too early |
|---|---|---|---|---|---|
| spark | 6 | 4 | 0 | 2 | 0 |
| experience | 8 | 5 | 0 | 3 | 0 |
| theme | 8 | 3 | 0 | 5 | 0 |
| simulation | 7 | 1 | 3 | 2 | 1 |
| mechanism-shelf | 3 | 0 | 1 | 2 | 0 |
| twists | 1 | 0 | 0 | 1 | 0 |
| **total** | **33** | **13** | **4** | **15** | **1** |

- 4 of the 13 "kept" are weak (#4, #7, #10, #12).
- He typed a complaint into 9 answers (#6, #19, #20b, #21, #22, #26, #29, #30, plus "don't care?" #15). 7 of those 9 came after the first research round.

**Time per step (journal timestamps)**

| Step | Kind | Time |
|---|---|---|
| opening (start) | talk | 37.4 min total: 18.6 min of it a stall (plain-text question, no box, watchdog at 20 min); 17 min his wait before the Drive link |
| propose (start) | talk | 0.7 min |
| spark | talk | 8.8 min |
| experience | talk | 9.8 min |
| theme | talk | 8.1 min |
| theme-dig | research | 6.3 min |
| simulation | talk | 6.1 min |
| mechanisms | research | 5.6 min |
| mechanism-shelf | talk | 9.8 min (his ~9.5 min on 3 questions — the angriest answers) |
| prior-art | research | 5.3 min |
| twists | talk | 1.7 min |
| save + bricks | script + talk | 0.3 min |
| **Discover total** | | **62.7 min** (talk 44.7 · research 17.2) |
| **Whole run to Define** | | **~100 min** |

**What landed on the shelves:** DISCOVER.md shelves = 317 lines; 15 in his own words, 31 options he ticked, ~271 from research or Claude. The card advertised "84 on ice, 36 open questions".

## 3. What worked

- **#1 the one-breath idea (free text).** Fed needs 1, 2, 3 and 6 in one answer: 0 = portal, 1 moves opposite the paddle, 2–10 abilities, middle line slides by score gap, screen rotates past a total. Nearly every later "fact" about Xong traces to it.
- **#5 → #24 fear, then sharpened with research.** "Too chaotic" became "Can't read the ball, Chaos is the point". A real feel target plus a test (is the ball readable?). The only place research changed his thinking; the question named the research, his fear, and two concrete failure patterns in one box.
- **#6 must-fit.** Got the frame (vs AI locally, online vs a friend, "no local") despite the broken form. Needed question; needs multi-select and an "off the table" side.
- **#8 story + #16/#17 look/tone.** "The screen was upside down", "Classic black and white, Chunky score digits", "Cool and slick" — short, concrete, usable by an artist and a builder.
- **#29 portal rule (by accident).** "ball goes in at an angle, comes out of somewhere else at the same angle and speed" — a buildable rule, but drawn out by a bad question he corrected.
- **#31's lead-in (the prior-art find).** "no game that ties the weirdness to each player's own score digit, and no Pong variant with online play" — the run's clearest hook statement, stated, not asked.

## 4. Gaps — needs with no material from him

- **4 decisions + why hard: none.** #23 and #25 got "Depends on the number". The Decisions shelf holds only Claude's or research's guesses.
- **8 smallest version: none** beyond "A finished small release". Nothing on which numbers, which twists, first.
- Partial only:
  - 3 rules: nothing on how a match ends or scores (first to 10? 11?), what 2–10 do, what the ball does to a digit.
  - 7 frame: no platform, controls, match length.
  - 6 change over time: only from #1 (rotation and line escalate); no question asked about it.
  - 5 "how we'll know it works": only "can read the ball".
  - 9: no references beyond "classic Pong".

## 5. Clearer picture? The game so far, from his answers only

> Xong is classic Pong — two paddles, one ball, black and white, blip sound, big chunky score digits — cool and slick in tone.
> The score digits live on the court and play: a 0 is a portal (the ball exits elsewhere at the same angle and speed); while you have a 1 it moves opposite your paddle; 2–10 each have their own ability.
> The middle line slides toward the leader, further the bigger the lead; past a total score the whole screen starts rotating, more or faster as it climbs.
> One player vs the computer, or online vs a friend (no same-screen); wild is wanted as long as the ball stays readable — the story players tell is "the screen was upside down."

What it can't say yet:
- what 2–10 do (the forgotten ideas are in his Drive folder, never read)
- per number: always-on or fired; what the ball does when it hits a digit
- how a match ends; match length
- the player's real decisions (when to score? when to use a power?)
- whether the middle line shrinks the leader's court (implied, not said)
- controls, platform
- the first playable slice

Verdict: the picture is clearer **on paper** — but almost all of it was in #1, minute 3 of the spark. The other 32 questions added the frame, the readability rule, the portal rule, look and tone. He didn't learn anything new about his own game; the run mostly read his answer back to him.

## 6. Patterns

- **His first answer, read back as options.** #3, #11, #18, #21, #22, #27 offered what #1 already said; his reply to #22: "of course all of these are selected. weak question".
- **Plain text hidden behind the box.** Start S3 (18.6 min stall) and #20b ("i don't see 5 research questions").
- **His existing material never read.** The .unity, the .psd and "ideas that I can't quite remember" were in the Drive link (S4). The run went on without them; 2–10 stayed blank.
- **Fiction questions for an abstract game.** #2 (person / creature / god), #13 "toy", #19 "this feeling", #20a "your own life". The craft notes ask these for every game.
- **Choosing in Discover.** #23, #25, #26, #29 asked him to set rules or pick mechanisms. The simulation craft note asks for this: Q25 "where does the player have to choose", and the verb × noun grid's "ask if any spark something".
- **Research turned into multiple-choice menus.** #28–#30 grouped research findings under headings that didn't match the options ("Portals … which fit?" → speed / freeze / bunt). He never reacted to research except #24 (good) and #29–#30 (rejected).
- **Research volume vs use.** 3 rounds, 17.2 min, 62 sources, 137 bricks, plus 84 on ice and 36 open questions. Only one research finding reached a question that worked (#24). Nothing shows he opened the reports.
- **Single-select where several fit.** #6 (he called it out), #8, #9.
- **Picks with no signal.** #7 (all 4), #14 (3 of 4), #21 and #22 (all 4). Ticked options count as "picked by the creative" on the shelves, the same weight as a real choice.
- **Bookkeeping shown to the designer.** #15 ("I filed … under 'what everyone already knows'").
- **Never asked:** how a match ends, what the first playable is, controls or platform, or "what do 2–10 do — anything you remember?" — the open question his own #1 pointed straight at.
