# The Table — design (framework v0.4, proven in Glyphtender v0.6)

Decided with Muzzy 2026-10-04. Sources: `~/.claude/config/bmuz/BMUZ-PLAN.md` (Mission · Framework decisions · Table foundation · Proving plan) and research in `~/.claude/config/bmuz/reviews/2026-10-04-{modules,table-foundation,ui-rules,oink-games}/RESEARCH.md`. Model: Muzzy's BlokParty/PlayTable framework (Zones, Components, PlaySpace, Snapshots, States, Tags).

## The idea
Modules are a **lattice the rules are built on** — foundational, not mechanic-specific. The game's rules do the specific work and may touch several modules at once ("draw when you pass" = Turns + Deck + Hand). Modules use each other only through public parts; two shared languages connect them: **zones & pieces** and the **event stream**. Every module ships **presets** on top of its flexibility (guard against the inner-platform effect). Build only from proven games: Glyphtender proves each slice; Roll Better is the second game that makes it general.

## The pieces of the Table
| Concept | What it is | Notes |
|---|---|---|
| **Game core** | state (plain JSON) + actions + rules contract `{ setup, legalActions, check, apply → { state, events }, isOver, viewFor }` | Pure: no screen, no network. The ONLY way state changes is an action. Rules stay in code (never JSON). |
| **Seeded random** | the random position lives in the state | Same seed + same actions = same game, always. Online the server keeps the seed secret. |
| **Move record** | the list of actions (+ seed) — replayable | Not the summary log (that stays for the end screen). Enables replays, golden-game tests, bug reports, AI training data. |
| **Event stream** | every action returns events (`placed`, `moved`, `cast`, `scored`, `drew`, `refreshed`, `tangled`, `turnStarted`, `gameOver`…) each tagged with who may see it | Animations, sound, achievements, stats, camera and online replays listen to events — no diffing states, no timers guessing. |
| **Turns & flow** | a stack of named levels (Glyphtender: Draft → Play → Over; a refresh step inside a turn); each level: who may act (one · some/all · everyone), an order list the rules provide, ends-when; interruptions push a response window | Presets: "clockwise, one at a time", "snake", "simultaneous". Gives: who may act now, "your turn", undo limits per level, timers per level. |
| **Zones** | places that hold pieces: board cells, hands, bag, discard… zones hold zones; children inherit owner + visibility, can override ("more public than the parent" must be explicit) | Kinds = presets of a few properties: who can see inside · ordered or not · has positions · what may enter (accepts). |
| **Pieces** | the things, each with a **stable id**, its tags, owner, shared states | Stable ids fix the tray-order ↔ hand-index coupling. Never reuse an id in a way that leaks (see visibility). |
| **Tags = nouns** | what a piece/zone is or can do (`seed`, `glyphling`; later `card.spell`, flippable) | Minimal in v0.4 (accepts by kind). Full dotted hierarchy + `content/tags.json` when a second game needs it. |
| **States = adjectives right now** | shared game states (face-down, locked, tangled) vs local screen states (held, selected, planned) | Never mixed: local states never reach other players. |
| **Owner = possessive** | one field: which seat owns it | Not a tag. What visibility and security check against. |
| **Drag referee** | ONE answer: may this piece go to this zone, for this seat, now? (accepts + a live rules check) | Zone glow, piece reaction, nope shake, cursor all read it. Phones: show every valid zone on pick-up. The server re-checks every action. |
| **Views (layouts)** | how a zone is drawn + touched: Hand view presets (rack, fan…), Board view (fit, later zoom) | Glyphtender's tray = Hand view "rack" preset, pixel-identical to today. |
| **Seats** | the chair: owner of pieces, the camera, the secrets. Seat ≠ the person or bot in it | One model for local human · online human · local bot · online bot · reconnecting player. Pass-and-play switches the **viewer seat** at the handoff. |
| **Per-seat views** | what each seat is sent / shown | Tags declare visibility; **the server enforces it** by cutting secrets from each seat's copy (and from events). Local play hides by drawing + handoff. |

## Built for online play and AI from the start (Muzzy: "online play and AI play, online and local")
- **Server is the referee online:** clients send actions; the server checks them with the same rules contract and sends each seat its view + its events. The client never decides an outcome.
- **Per-seat events:** events carry visibility; the server filters them per seat (fixes the rooms kit's `broadcastEvent`, which goes to everyone). Side-door leak tests: reused piece ids, hidden-hand order, animation events, the summary log, undo, the seed.
- **Bots are just seats:** a bot is a seat whose actions come from an AI module instead of a person. Same rules, same events, same views. Local (pass-and-play with bots, solo vs bots) and online (fill an empty seat, take over a dropped player) use one path.
- **Fair AI:** a bot only sees its seat's view; when it needs to imagine hidden things (rivals' hands, the bag) it samples possibilities consistent with what it knows (determinization). The server bot no longer peeks at the full state.
- **AI needs, provided by Game core:** `legalActions(state, seat)` lists every legal action (deduplicated); a **fast mode** apply that skips the heavy end-screen bookkeeping (mobility, blocked spots); cheap state copies; repeatable random for simulations.
- **Tutorial / Dev Kit needs:** stable ids for every zone and piece (point at them, inspect them), action filtering (limit what's allowed), snapshots (scripted setups).

## How we prove it — Glyphtender v0.6 (no visible change)
Guards before any change: **golden games** (≈300 seeded sim games: every action + a fingerprint of the state after each) must replay identically after every slice; **before-screenshots** of every screen at every size compared after every slice; the existing 359 tests + 16 e2e stay green. Slices (Glyphtender ROADMAP F29–F36), each framework-first then switched over in the same sprint.

## Not in v0.4
Full tag hierarchy · nested zone editor · board zoom/pan · context menus · fan layouts · the AI module itself (Glyphtender beta builds it ON this) · Roll Better's switch-over (the generalising proof, after v0.6).

## Learned in the slices
- **Game core (Glyphtender F30, 2026-10-04):** a game whose apply needs outside data (Glyphtender's word list) makes its rules with a function (`glyphtenderRules(words)`) — consider a context slot if a second game needs it. "Letters to you, a count to everyone else" takes two events (drew + drewHidden) because each event has one audience — a preset could help. Same-letter pieces make "the same action" depend on hand order until stable piece ids (Zones & pieces). Fast mode halved Glyphtender's sim time (36 s → 20 s).
- **Who played each move (Glyphtender F62, 2026-10-10 — table 0.7.0, rooms 0.5.0):** the end screen wants "a bot played these turns for Blue". Decision: the move record says it, per move — `RecordedMove.by?: PlayedBy` = `'seat'` (the person) · `'bot-for-seat'` (a bot playing FOR that person: idle, turn timer, left, kicked, away too long) · `'bot'` (a bot seat from the start, e.g. host-added — nobody to play for, so it never counts as "played for"). Optional, so old records and sims load unchanged; `replay` ignores it (who played never changes the game). `addMove(record, seat, action, by?)`; `botPlayedFor(record, seat)` → the move numbers. Online, rooms answers the question at the moment of the move: `room.playedBy(seatId)` (from `seats.ts playedBy`: human → seat; bot + `bot:` id → bot; other bot → bot-for-seat). It must be asked THEN and stored, because the room state forgets: a tap gives the seat back, and at game over `watchersTakeBack` turns idle-held seats human again. Rooms keeps its own copy of the three words (server files may only import each other), the same strings so they drop straight into the table record. Build note: in a game, the bot path (turn clock's bot step) passes `room.playedBy(seat.id)` into its play/addMove; the person path (onAction) passes `'seat'` (RoomServer takes a bot-held seat back before onAction runs).
