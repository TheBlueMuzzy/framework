// THE GALLERY MENU — every built screen, grouped. Plain data, so scripts/shoot.mjs can read it too.
// id = the link: …/?screen=settings&preset=neon opens that screen straight away.
// To add a screen: add a line here, then its sample in gallery/Screens.tsx.
export type MenuEntry = { id: string; name: string; about: string }
export type MenuGroup = { title: string; entries: MenuEntry[] }

export const menu: MenuGroup[] = [
  { title: 'Dialogs & feedback', entries: [
    { id: 'confirm', name: 'Confirm', about: '“Are you sure?” with the yes in danger red' },
    { id: 'rewards', name: 'Reward popup', about: 'A tile per reward, then Collect' },
    { id: 'teach', name: 'Callouts', about: 'Speech-bubble tips pointing at a target: flips to fit, a dimmed pause, a point, a moving piece' },
    { id: 'talk', name: 'Talking bubble', about: 'A story line someone says: grows from its pointer, types out with rests, its outline fizzes as a speech wave and pops per syllable; tap for the next line' },
    { id: 'feedback', name: 'Toasts & tooltip', about: 'Toasts (one you tap to close), a tooltip, a spinner, an empty list' },
  ] },
  { title: 'Front end', entries: [
    { id: 'menu', name: 'Main menu', about: 'The game’s name and its big buttons, in the game’s own order' },
    { id: 'continuemenu', name: 'Main menu: Continue', about: 'A game in progress: Continue first, with where you were and when (the saves module’s run)' },
    { id: 'artmenu', name: 'Main menu: game art', about: 'The game’s own pictures: logo, backdrop, art buttons (hold one: its pushed-in picture shows)' },
    { id: 'artstage', name: 'Art stage', about: 'A scene from the game’s own pictures: pull the lever (drag or tap), the screen slides, the level meter fills; an off panel' },
    { id: 'snap', name: 'Repair panel: sliders + dial', about: 'SnapControl: drag OR tap a slider to a stop, turn a dial to its corners; a lamp blinks, a wrong end shakes' },
    { id: 'modes', name: 'Mode select', about: 'A card per mode, then Start' },
    { id: 'howto', name: 'How to play', about: 'Pages to flip through' },
    { id: 'credits', name: 'Credits', about: 'People, then the kit’s fonts from credits.json' },
    { id: 'scrolling', name: 'Whole-screen scroll', about: '<Screen scroll>: a tall menu drags as one, no scroll bar; a section opening pushes Start down' },
  ] },
  { title: 'Settings', entries: [
    { id: 'settings', name: 'Settings', about: 'Tabs from a list; remembers what you set' },
  ] },
  { title: 'In game / HUD', entries: [
    { id: 'hud', name: 'HUD', about: 'Bars, score, timer, turns — numbers change live' },
    { id: 'huddock', name: 'HUD: one row + dock', about: 'oneRow top (fit status, compact score) · a dock panel of bars: label above / inside, thick, low = pulse, broken = flash' },
    { id: 'chips', name: 'Player chips', about: 'Beside each row: score counts up, dim, a goal chip' },
    { id: 'emotes', name: 'Emotes', about: 'The tappable seat row (a muted rival’s mark on his portrait), speech bubbles by each seat (fixed size), your seat’s phrase picker, the cooldown ring, a rival’s mute menu' },
    { id: 'pinned', name: 'Pinned to the table', about: 'PinnedBox: xs chips beside rows, sized with the table' },
    { id: 'hand', name: 'Hand: rack', about: 'HandView: a hand of plain pieces — tap to hold, swap (shrink → grow), hide' },
    { id: 'pause', name: 'Pause', about: 'Over the HUD; Quit asks first' },
  ] },
  { title: 'Flow', entries: [
    { id: 'loading', name: 'Loading', about: 'A bar and a tip' },
    { id: 'countdown', name: 'Countdown', about: '3, 2, 1, Go! (repeats)' },
    { id: 'round', name: 'Round intro', about: '“Round 2 of 5”' },
    { id: 'results', name: 'Results', about: 'Scores, best first; ties share a place' },
    { id: 'endgame', name: 'Results: end of game', about: 'Title, player colours, winner star, Rematch / Quit' },
    { id: 'endgamedim', name: 'Results: over the game', about: 'dim: the game stays visible behind, darkened' },
    { id: 'victory', name: 'Victory', about: 'The big win, with stats' },
    { id: 'victoryreveal', name: 'Victory: rows one at a time', about: 'reveal: the stats arrive one after another (the Results rows’ motion), the card its final size from the start' },
    { id: 'payslip', name: 'Report in a Modal', about: 'StatList in a Modal: a payslip — deductions ▼, net pay + rank up ▲, one row at a time; Continue waits for onRevealed, Replay' },
    { id: 'gameover', name: 'Game over', about: 'Try again or quit' },
    { id: 'artend', name: 'Game over: game art', about: 'The report inside the game’s frame picture (corners never stretch), art buttons' },
    { id: 'postgame', name: 'Post-game', about: 'Rematch, lobby or quit' },
  ] },
  { title: 'Online', entries: [
    { id: 'lobby', name: 'Lobby: join', about: 'Create a room or join by code, or go Back' },
    { id: 'room', name: 'Lobby: room', about: 'Room code (tap Copy), players, ready' },
    { id: 'roomauto', name: 'Lobby: no Ready', about: 'The game readies players itself; player colours' },
    { id: 'reconnecting', name: 'Reconnecting', about: 'Over the HUD, with a spinner' },
    { id: 'failed', name: 'Can’t connect', about: 'Try again or quit' },
    { id: 'seats', name: 'Seat picker', about: 'Join a game in progress: take over a seat' },
    { id: 'joining', name: 'Seat picker: joining', about: 'After picking: spinner and Cancel' },
    { id: 'noseats', name: 'Seat picker: no seats', about: 'Nothing free right now, so Leave' },
    { id: 'idle', name: 'Idle warning', about: 'Your turn, nothing done: a bar drains, then a bot plays (tap = back)' },
    { id: 'idlebot', name: 'Idle: bot playing', about: 'A bot plays for you — tap to play' },
  ] },
]

// Every screen's id, in menu order
export const screenIds = menu.flatMap((group) => group.entries.map((entry) => entry.id))
