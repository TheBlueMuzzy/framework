// THE TABLE ITSELF — the game's own world, behind the UI kit's HUD. The kit draws its in-game words (whose turn it is,
// "Game over") in the light on-game colour with a dark halo, made to sit on the game's picture — on the plain light
// page they all but vanished. A real game draws its board, art or 3D scene here; the starter has a felt-coloured table.
// The colour is content/tuning/board.json tableColour (a colour picker in the Dev Kit's Tuning tab, live).
// (src/world/, not src/ui/: the world is the game's own drawing — the UI kit's rules are for menus and the HUD.)
import boardTuning from '../../content/tuning/board.json'
import { useTuningEdits } from '../ui/hooks'

export function TableWorld() {
  useTuningEdits('board')
  return <div aria-hidden="true" data-table-world="" style={{ position: 'fixed', inset: 0, zIndex: -1, background: boardTuning.tableColour }} />
}
