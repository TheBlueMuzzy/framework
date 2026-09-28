// THE GALLERY MENU — every built screen, grouped. Plain data, so scripts/shoot.mjs can read it too.
// id = the link: …/?screen=settings&preset=neon opens that screen straight away.
// To add a screen: add a line here, then its sample in gallery/Screens.tsx.
export type MenuEntry = { id: string; name: string; about: string }
export type MenuGroup = { title: string; entries: MenuEntry[] }

export const menu: MenuGroup[] = [
  { title: 'Dialogs & feedback', entries: [
    { id: 'confirm', name: 'Confirm', about: '“Are you sure?” with the yes in danger red' },
    { id: 'rewards', name: 'Reward popup', about: 'A tile per reward, then Collect' },
    { id: 'feedback', name: 'Toasts & tooltip', about: 'Toasts, a tooltip, a spinner and an empty list' },
  ] },
  { title: 'Front end', entries: [
    { id: 'menu', name: 'Main menu', about: 'The game’s name and its big buttons' },
    { id: 'modes', name: 'Mode select', about: 'A card per mode, then Start' },
    { id: 'howto', name: 'How to play', about: 'Pages to flip through' },
    { id: 'credits', name: 'Credits', about: 'People, then the kit’s fonts from credits.json' },
  ] },
  { title: 'Settings', entries: [
    { id: 'settings', name: 'Settings', about: 'Tabs from a list; remembers what you set' },
  ] },
  { title: 'In game / HUD', entries: [
    { id: 'hud', name: 'HUD', about: 'Bars, score, timer, turns — numbers change live' },
    { id: 'pause', name: 'Pause', about: 'Over the HUD; Quit asks first' },
  ] },
  { title: 'Flow', entries: [
    { id: 'loading', name: 'Loading', about: 'A bar and a tip' },
    { id: 'countdown', name: 'Countdown', about: '3, 2, 1, Go! (repeats)' },
    { id: 'round', name: 'Round intro', about: '“Round 2 of 5”' },
    { id: 'results', name: 'Results', about: 'Scores, best first; ties share a place' },
    { id: 'victory', name: 'Victory', about: 'The big win, with stats' },
    { id: 'gameover', name: 'Game over', about: 'Try again or quit' },
    { id: 'postgame', name: 'Post-game', about: 'Rematch, lobby or quit' },
  ] },
  { title: 'Online', entries: [
    { id: 'lobby', name: 'Lobby: join', about: 'Create a room or join by code' },
    { id: 'room', name: 'Lobby: room', about: 'Room code, players, ready' },
    { id: 'reconnecting', name: 'Reconnecting', about: 'Over the HUD, with a spinner' },
    { id: 'failed', name: 'Can’t connect', about: 'Try again or quit' },
  ] },
]

// Every screen's id, in menu order
export const screenIds = menu.flatMap((group) => group.entries.map((entry) => entry.id))
