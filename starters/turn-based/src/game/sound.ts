// SOUND — the audio module (src/audio), started once. Code says what happened (playSound('mark.x'));
// content/audio.json says what it sounds like (which file, how loud…). The Dev Kit's Sound tab edits it live, and its
// full pause silences it by itself.
import audioJson from '../../content/audio.json'
import { createAudio, exposeLog, setAudio, type Audio } from '../audio'
import { onTuning } from '../devkit/tuning/liveTuning'
import { setControlSound } from '../ui/kit'

let audio: Audio | null = null

export function startSound(): Audio {
  if (audio) return audio
  audio = createAudio(audioJson, { baseUrl: import.meta.env.BASE_URL })
  setAudio(audio) // so playSound works from any file
  if (import.meta.env.DEV) exposeLog(audio) // window.__audioLog for the e2e scripts and the console
  onTuning('audio', (data) => audio?.setConfig(data as typeof audioJson)) // the Dev Kit's Sound tab
  // The UI kit's buttons, tabs and switches: ui.tap · ui.back · ui.toggle.on · ui.toggle.off
  setControlSound((kind) => audio?.play(`ui.${kind}`))
  return audio
}
