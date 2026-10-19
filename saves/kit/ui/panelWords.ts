// The Save code screen's words (SaveCodePanel.tsx) — pass `words` to change any of them (another language, the game's
// own voice). In their own file because a component file that also exports values breaks Vite's hot reload rule.
export const SAVE_PANEL_WORDS = {
  title: 'Save code',
  intro: 'Your save code holds all your progress. Keep a copy somewhere safe, or paste it into the game on another device.',
  yourCode: 'Your save code',
  copy: 'Copy code',
  copied: 'Save code copied.',
  copyFailed: 'Couldn\'t copy it — select the code and copy it yourself.',
  download: 'Download file',
  downloadFailed: 'This browser couldn\'t download the file — copy the code instead.',
  paste: 'Paste a save code',
  load: 'Load code',
  loadFile: 'Load a file',
  askTitle: 'Load this save?',
  askMessage: 'Progress is combined with what\'s on this device (nothing is lost); other saved choices are replaced. The save on this device is kept as a backup.',
  loaded: 'Save loaded.',
  close: 'Close',
}
