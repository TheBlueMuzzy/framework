// START-UP — in this order: catch errors first, then the look, the saves, the clocks, sound and the player's settings,
// then the screens. Every framework module's start-up line is here (MODULE-CONTRACTS.md says what each one needs).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import crashesJson from '../content/crashes.json'
import savesJson from '../content/saves.json'
import style from '../content/ui/style.json'
import { readCrashesConfig, startCrashes } from './crashes'
import { crashRootOptions } from './crashes/ui/crashRoot'
import { versionLabel } from './version'
import { setSavesConfig } from './saves'
import { applyStyle } from './ui/kit'
import { setPaceClock } from './ai/kit/pace'
import { rulesClock } from './devkit/gameClock'
import { startSound } from './game/sound'
import { applySettings, currentSettings } from './game/settings'
import App from './App'

// Crashes: a broken game reports what broke (nothing about the player) — content/crashes.json says where to
startCrashes({ config: readCrashesConfig(crashesJson), version: versionLabel })

setSavesConfig(savesJson) // backups and the "back up your save" nudge
setPaceClock(rulesClock) // bots think on the rules clock: a pause (the game's own, or the Dev Kit's) holds a bot mid-think
applyStyle(style) // content/ui/style.json → the UI kit's look (Clean)
startSound() // made now, starts on the first tap
applySettings(currentSettings()) // the player's saved Settings → text size, volumes, crash reports, emotes, bot chatter

// Dev Kit → Screens: this page is a PREVIEW inside the Dev Kit (dev only) — one screen with sample data, sandboxed
if (import.meta.env.DEV && location.search.includes('devkit-preview=')) {
  import('./devkit/previews/frame').then((m) => m.startPreviewFrame({ app: <App />, root: document.getElementById('root')! }))
} else {
  startGame()
}

function startGame() {
  // Dev Kit (the ` key, or triple-tap the top-right corner): always in local dev; in release builds while
  // content/devkit.json "inReleaseBuilds" is true — loaded after the first screen, when the phone is idle.
  if (import.meta.env.DEV) {
    import('./devkit/mount').then((m) => m.mountDevKit())
  } else if (__DEVKIT_IN_RELEASE__) {
    const mount = () => import('./devkit/mount').then((m) => m.mountDevKit())
    const whenIdle = () => ('requestIdleCallback' in window ? requestIdleCallback(mount, { timeout: 3000 }) : setTimeout(mount, 1000))
    if (document.readyState === 'complete') whenIdle()
    else addEventListener('load', whenIdle, { once: true })
  }

  // crashRootOptions: a broken screen shows "Something broke · Reload" (and is reported), never a blank page
  createRoot(document.getElementById('root')!, crashRootOptions()).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
