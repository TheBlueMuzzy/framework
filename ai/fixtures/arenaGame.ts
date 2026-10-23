// Draw to 10's arena file — the shape a game's src/ai/arenaGame.ts has, for the ai-arena.mjs test.
// `files.read` reads a file from the game folder (a game reads its content/ai/*.json and anything else it needs here).
import type { ArenaGameFile } from '../kit/arena'
import { arenaPlug, careful, greedy, skills, targets, type Action, type Setup, type State, type View } from './drawTo10'

export default async function arenaGame(files: { read(path: string): Promise<string> }): Promise<ArenaGameFile<State, Action, Setup, View>> {
  const cast = JSON.parse(await files.read('content/ai/cast.json')) as { personalities: string[] }
  const all = [careful, greedy]
  return { plug: arenaPlug, personalities: all.filter((p) => cast.personalities.includes(p.id)), skills, targets, columns: ['draws', 'busted'] }
}
