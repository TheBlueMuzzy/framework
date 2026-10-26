// THE MAIN MENU — the UI kit's MainMenu: Continue (when a game vs the computer was left open), one Play button per
// opponent (content/ai/opponents.json), Play online, Settings, Credits. The version sits in its footer.
import text from '../../content/text/en.json'
import { MainMenu, fill, screens, type MainMenuItem } from './kit'
import { useContinue } from '../saves/ui/useContinue'
import { versionLabel } from '../version'
import { opponents } from '../ai/bots'
import { continueMatch, startMatch } from '../game/match'
import { matchRun } from '../game/saves'
import { personalityName } from './names'

export function MainMenuScreen({ onOnline }: { onOnline: () => void }) {
  const resume = useContinue(matchRun, (saved) => continueMatch(saved), {})
  const items: MainMenuItem[] = [
    ...(resume.onContinue ? [{ label: text.mainMenu.continue, onClick: resume.onContinue, detail: resume.continueDetail, primary: true }] : []),
    ...opponents().map((opponent) => ({ label: fill(text.mainMenu.play, { name: personalityName(opponent.personality) }), onClick: () => startMatch(opponent) })),
    { label: text.mainMenu.online, onClick: onOnline },
    { label: text.mainMenu.settings, onClick: () => screens.push('settings') },
    { label: text.mainMenu.credits, onClick: () => screens.push('credits') },
  ]
  return <MainMenu title={text.game.title} subtitle={text.game.subtitle} version={versionLabel} items={items} />
}
