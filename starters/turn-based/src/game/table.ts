// WHO'S TALKING AT THE TABLE — the emotes module (preset phrases in a bubble by a seat) and the bots' banter
// (the AI module: a bot's line is a bot pressing an emote, so mute and "Hide everyone's emotes" cover it too).
// One path for every seat: you, a bot and an online friend all go through `emotes`.
import emotesJson from '../../content/emotes.json'
import banterJson from '../../content/ai/banter.json'
import text from '../../content/text/en.json'
import { createEmotes } from '../emotes'
import { botBanter, type BanterSeat } from '../ai/kit/brain'
import { readBanterSettings } from '../ai/kit/banter'
import { moments } from '../ai/plug'
import { emoteSave, banterSave } from './saves'
import { playSound } from '../audio'

/** The emote seat id of a table seat (local games). Online, the room's own seat ids are used instead. */
export const seatId = (seat: number) => `seat-${seat}`

export const emotes = createEmotes({
  settings: emotesJson,
  words: text.emotes,
  banter: () => text.banter, // read at every lookup: the Dev Kit's edits count at once
  save: emoteSave,
  mine: [seatId(0)],
})
emotes.onEmote(() => playSound('emote.pop'))

// The bot seats right now (match.ts sets them when a game starts; none online — bots there would speak from the server)
let bots: () => BanterSeat[] = () => []
export const setBanterBots = (list: () => BanterSeat[]) => { bots = list }

export const banter = botBanter({
  moments,
  bots: () => bots(),
  settings: () => readBanterSettings(banterJson),
  lines: () => text.banter,
  say: (seat, id) => emotes.say(seatId(seat), id).ok,
  muted: (seat) => emotes.isMuted(seatId(seat)),
  seed: 1,
  save: banterSave,
})
