// THE GALLERY MENU — every built screen, grouped. Plain data, so scripts/shoot.mjs can read it too.
// id = the link: …/?screen=settings&preset=neon opens that screen straight away.
// To add a screen: add a line here, then its sample in gallery/Screens.tsx.
export type MenuEntry = { id: string; name: string; about: string }
export type MenuGroup = { title: string; entries: MenuEntry[] }

export const menu: MenuGroup[] = [
  { title: 'Dialogs & feedback', entries: [
    { id: 'confirm', name: 'Confirm', about: '“Are you sure?” with the yes in danger red' },
    { id: 'rewards', name: 'Reward popup', about: 'A tile per reward, then Collect' },
    { id: 'feedback', name: 'Toasts & tooltip', about: 'Toasts (one you tap to close), a tooltip, a spinner, an empty list' },
  ] },
  { title: 'Front end', entries: [
    { id: 'menu', name: 'Main menu', about: 'The game’s name and its big buttons, in the game’s own order' },
    { id: 'modes', name: 'Mode select', about: 'A card per mode, then Start' },
    { id: 'howto', name: 'How to play', about: 'Pages to flip through' },
    { id: 'credits', name: 'Credits', about: 'People, then the kit’s fonts from credits.json' },
  ] },
  { title: 'Settings', entries: [
    { id: 'settings', name: 'Settings', about: 'Tabs from a list; remembers what you set' },
  ] },
  { title: 'In game / HUD', entries: [
    { id: 'hud', name: 'HUD', about: 'Bars, score, timer, turns — numbers change live' },
    { id: 'chips', name: 'Player chips', about: 'Beside each row: score counts up, dim, a goal chip' },
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
    { id: 'gameover', name: 'Game over', about: 'Try again or quit' },
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
  ] },
]

// Every screen's id, in menu order
export const screenIds = menu.flatMap((group) => group.entries.map((entry) => entry.id))
