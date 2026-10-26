// THE GAME'S OWN DEV KIT TOOLS — shown after the kit's own tabs. Only loads with the Dev Kit, so nothing here ships
// once the Dev Kit is off (1.0). The adapter plugs the game into Snapshots, Bug capture, Pause and check:framework.
import personalitiesFile from '../../content/ai/personalities.json'
import skillsFile from '../../content/ai/skills.json'
import banterJson from '../../content/ai/banter.json'
import audioJson from '../../content/audio.json'
import en from '../../content/text/en.json'
import { registerDevKitGame } from '../devkit/devkitGame'
import type { DevKitTab } from '../devkit/DevKit'
import { aiTab } from '../devkit/ai/aiTabEntry'
import { soundTab } from '../devkit/sound/soundTabEntry'
import { textTab } from '../devkit/text/textTabEntry'
import { personalityProblems } from '../ai/kit/brain'
import { getAudio } from '../audio'
import { plug } from '../ai/plug'
import { ticTacToeAdapter } from './adapter'

registerDevKitGame(ticTacToeAdapter)

export const gameTabs: DevKitTab[] = [
  aiTab({
    personalities: { path: 'content/ai/personalities.json', data: personalitiesFile, listKey: 'personalities' },
    skills: { path: 'content/ai/skills.json', data: skillsFile, listKey: 'skills' },
    bios: { path: 'content/text/en.json', data: en, at: (id) => ['ai', 'personality', id, 'bio'], nameAt: (id) => ['ai', 'personality', id, 'name'] },
    banter: { path: 'content/text/en.json', data: en, moments: Object.keys(banterJson.chance) },
    readings: ['myDanger', 'myChance'],
    validate: (p) => personalityProblems(p as Parameters<typeof personalityProblems>[0], plug),
  }),
  soundTab(getAudio, { file: audioJson }),
  textTab({ file: 'content/text/en.json', data: en }),
]
