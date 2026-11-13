# Bringing a finished tabletop game to digital — what stays fixed, what gets decided fresh

F233 — Finished games come in as fixed, task 1. Read 2026-11-13 by Claude (pages read first-hand; quotes are the pages' own words).
Why: in the Sirius Smugglers live look (2026-11-13) BMUZ treated a finished, played board game like a raw idea. Muzzy: "do I need to do that? the game is already figured out." · "if you read the rules, you'd already know the answer… this makes you look dumb."
Scope: only what changes how Ideate and Define talk to a creative who brings a finished game. Not a survey of the market.

## 1. What studios keep fixed: the rules and the "pillars" of the physical game
- Asmodee Digital starts from the board game as a finished design: "when we consider a board game for adaptation, we are already in front of an experience with a flawless game design." [3]
- They name the physical game's pillars first and carry them over: "we first identify the pillars of the game… These pillars are the one we will use also in the digital adaptation, insuring that we will be faithful". [3]
- Playdek: with existing games "the rules and gameplay mechanics are well honed. Instead, it's aspects such as user interface and graphics that are key". [4]
- Auroch Digital (Ogre): "One of the key briefs [was] that it had to be true to the original board game"; players "have been playing [Ogre] every weekend for the past 40 years… if the slightest thing is wrong, they'll be down on you". [5]
- The counter-case is a deliberate choice, not a default: Mighty Box chose "adaptation" over re-creation for Posthuman: Sanctuary, but only after saying "We had tested the board game extensively. It was a system people loved", and kept the board game's identity ("fly the board game flag proudly"). [1]

**So:** a played game's rules are decided. The creative confirms them; they aren't asked again. The feelings and pillars are read *from* the game, not invented.

## 2. What only changes because the table is gone (rules that assumed people sitting together)
- Ogre's rules had to bend where they leaned on the players at the table: "When you've got a rule on the board that says 'decide between yourself what's going to happen next', you can't really do that in a computer game". [5]
- Some games don't adapt well at all: "games requiring lots of verbal interactions between players can be hard to translate… board games that use real-time gameplay or interruptions can be tough to adapt for online gaming." [3]
- Board Game Arena's guidelines: every failed action must explain itself ("Silence is never acceptable. Every failed action must say why."), because nobody at the table is there to say "you can't do that". [6]

**So:** the questions worth asking are the ones the rules can't answer because they were written for a table: who settles a "decide between yourselves", interrupts, talking, what the screen says when a move isn't allowed.

## 3. What gets decided fresh for digital
- **The computer does the bookkeeping.** "there is absolutely nothing to help the players [in a physical game]: no automatic points counting, no preset set up, no verification of players' actions, no interactive tutorial, etc. All of these things are performed by technology in a video game." [3] Soren Johnson: "digital board games require no set-up time or record-keeping, which means that games can be played much faster". [2]
- **Playing alone, against the computer.** Playdek: "this audience wants to play multiplayer, but we also want to enable solo play". [4] Asmodee calls the AI one of the two hard parts ("developing an AI that plays the game very well - our AIs are not allowed to cheat!") and lists "creating a solo mode" among the conversion challenges. [3]
- **Online, live or by turns (async).** "Another advantage of digital board games is asynchronous play… the program simply waits for the next player to make her move", but "Not every board game is ideal for asynchronous play (each turn needs to feature a significant number of decisions)". [2] Playdek built its own "server infrastructure, which is designed for asynchronous play". [4] With 3–4 players, fixed turn order made async waits worse ("with three or four players the waiting is magnified"); Conclave dropped turn order. [7]
- **Pass-and-play is not a release on its own** for most games: "you can't exactly base a game release on pass and play", and online play with many short turns "would require large, simultaneously active communities". [1]
- **Timers and players who leave.** BGA: "you are playing "live" (real time) or "turn-based" (asynchronously). In both cases, you have an allotted delay to play your moves", and a clock exists so "if your opponent left the game… it won't take long before you can expel them". [8] An online game needs a decision about how long a turn may take and what happens when someone goes quiet; a table never needed one.
- **Screens and hidden information.** The UI is the other hard part: "squeezing the user interface into the small screen of a phone or tablet". [3] BGA: "Panels = private resources", "Do not hide game components behind popups — you should see everything you'd see on a real table". [6] A hand of cards that was hidden by holding it needs a decided place on screen, and a pass-the-device or online rule for who sees it.
- **Teaching.** The physical game relied on someone explaining it; digital needs a tutorial ("no interactive tutorial" in the physical game, [3]). BGA reserves automatic popups "for tutorials only". [6] Teaching stays last in BMUZ's order (stages.md), but the conversion should name it as a digital-only need.
- **The rules must be exact.** "Players should never wonder 'what do I click?'" [6]; the computer can't play a rule that's vague. Edge cases a table settled by agreement need an answer.

## 4. Common pitfalls
- **Re-asking the design.** The studios above take the rules as the brief; questions about feelings and "ideas for it, even half-formed" are for games that don't exist yet. (BMUZ live look, and [3], [4], [5].)
- **Treating the rulebook's intro/flavour text as the creative's ideas.** (BMUZ live look: the setting text "This system is as corrupt as dark matter is dark…" was filed under "Your ideas".) Flavour is part of the fixed game (its tone), not an idea to choose between.
- **Adding to the rules without asking.** Ogre: "if we added an extra movement or anything too significantly different, we would have had our heads chopped off." [5]
- **A UI harder than the table.** "The UI should never make the gameplay more difficult than the physical experience." [3]
- **Async on a game that doesn't suit it.** Few decisions per turn, or many players in a fixed order, make async waits painful. [2], [7]
- **A balance flaw found fast.** Many quick digital plays find a dominant strategy sooner than years of table play (A Few Acres of Snow's "Halifax Hammer"). [2] A risk to list, not a reason to reopen the rules.

## What this means for Ideate and Define
1. **Ideate decides the path from what it read, never by asking:** written rules that cover setup, a turn and how it ends, plus "played it" (or art made for a physical version) = a finished game. Its rules go into the GDD as **fixed**, each with the file it came from.
2. **"The game so far" says the rules are fixed**, never "Nothing here is decided yet". Rulebook intro and flavour text count as the game's tone (fixed), never as "your ideas".
3. **Ideate asks only what the rules leave open**, found by reading them, each question saying what the rules do say first ("Your rules say a tie for least Evidence… They don't say who wins it."). Plus the table-only rules that break on a screen (anything "between yourselves", interrupts, talking).
4. **Ideate asks the digital-only questions, short:** where it's played, online (live or by turns), playing against the computer, and what the computer now does for them (setup, scoring, checking moves, teaching).
5. **Define drafts the feelings, pillars, pitch and core loop from the rules** (as Asmodee reads a game's pillars from the physical game) and asks for one confirm-or-correct, then only Platform & Play, scope per release, the smallest playable version and the risks (AI, async, screen space, hidden hands, fast-found balance flaws).

## Sources
1. Gordon Calleja (Mighty Box), "Posthuman: Sanctuary - From tabletop to desktop", Game Developer — https://www.gamedeveloper.com/design/posthuman-sanctuary-from-tabletop-to-desktop
2. Soren Johnson, "When digital versions of board games surpass the originals", Game Developer, 25 Oct 2012 (from Game Developer magazine, August 2012; its examples are old iPad-era apps) — https://www.gamedeveloper.com/design/when-digital-versions-of-board-games-surpass-the-originals
3. Philippe Dao (Asmodee Digital), "Translating Tabletop for Digital - Best Practices for Best of Show", Game Developer blog, 13 Jun 2018 — https://www.gamedeveloper.com/business/translating-tabletop-for-digital---best-practices-for-best-of-show
4. Jon Jordan, "Playdek's Joel Goodman on the challenges of bringing physical card and board games to mobile", Pocket Gamer, 23 Mar 2012 — https://www.pocketgamer.com/interviews/playdeks-joel-goodman-on-the-challenges-of-bringing-physical-card-and-board-game/
5. "Faithfully adapting the tabletop classic Ogre" (Auroch Digital: Nina Adams, Peter Willington), Game Developer Staff, 5 Oct 2017 — https://www.gamedeveloper.com/design/faithfully-adapting-the-tabletop-classic-i-ogre-i-
6. Board Game Arena, "BGA Studio Guidelines" (UX guidelines for games on BGA) — https://en.doc.boardgamearena.com/BGA_Studio_Guidelines
7. Derek Bruneau, "Adding Asynchronicity" (Conclave), Game Developer — https://www.gamedeveloper.com/design/adding-asynchronicity
8. Board Game Arena, "Game clock" (the page marks itself deprecated in favour of the site's FAQ) — https://be.doc.boardgamearena.com/Game_clock

Tried and not used: The Games Precipice "Electronic adaptations" (didn't load), GamePur's The Captain is Dead interview (refused automated reading), FinalBoss's Twilight Imperium piece (page gone). Search-result summaries of them aren't quoted here.
