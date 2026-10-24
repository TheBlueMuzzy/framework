// TALK SAMPLE (?screen=talk) — the TalkingBubble (0.31.0) on a speaker at the bottom of the screen, saying Goops'
// Veteran lines from sketch S9 at Muzzy's approved values (content/tuning/talk.json = DEFAULT_TALK_FEEL). Tap the bubble (or Enter): while it
// types, the whole line shows; once it's out, the next line. Style: Wave (the outline fizzes) or Plain.
// &talk=plain opens on Plain (for the screenshots).
import { useState } from 'react'
import { Panel, Screen, Selector, TalkingBubble, Text } from '../kit'
import talk from './content/tuning/talk.json' // the numbers, as a game keeps them (content/tuning: live in the Dev Kit)

const styles = ['Wave', 'Plain']
const askedStyle = new URLSearchParams(location.search).get('talk') ?? ''
const firstStyle = () => styles.find((s) => s.toLowerCase() === askedStyle.toLowerCase()) ?? 'Wave'

// The Veteran's lines (as a game's content/text/en.json would hold them)
const lines = [
  'Found some scraps. Left \'em in your panel. Don\'t tell the screen.',
  'Listen — don\'t trust the — ... they\'re not— ... Hold on. Bad wire.',
  'Oh! Hi! It\'s me! ... Oof. Glad you\'re not goop yet.',
]

export function TalkSample() {
  const [style, setStyle] = useState(firstStyle)
  const [line, setLine] = useState(0)
  const speaker = (
    <Panel gap="xs" className="gallery-talk-speaker" data-gallery-speaker="">
      <Text kind="caption">THE VETERAN · speaker</Text>
    </Panel>
  )
  // The style picker: across the top on a tall phone, in the top-left corner when sideways (clear of the bubble)
  const picker = <span className="gallery-talk-controls"><Selector label="Style" options={styles} value={style} onChange={setStyle} /></span>
  const sideways = innerWidth > innerHeight
  return (
    <Screen label="Talking bubble" bottom={speaker} top={sideways ? undefined : picker} topLeft={sideways ? picker : undefined}>
      <TalkingBubble key={`${style}-${line}`} target="[data-gallery-speaker]" text={lines[line]} speaker="The Veteran"
        outline={style === 'Plain' ? 'plain' : 'wave'} feel={talk} placement="top" avoid=".gallery-talk-controls"
        onConfirm={() => setLine((n) => (n + 1) % lines.length)} />
    </Screen>
  )
}
