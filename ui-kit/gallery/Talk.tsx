// TALK SAMPLE (?screen=talk) — the TalkingBubble (0.31.0) on a speaker at the bottom of the screen, saying Goops'
// Veteran lines from sketch S9 at Muzzy's approved values (content/tuning/talk.json = DEFAULT_TALK_FEEL). Tap the bubble (or Enter): while it
// types, the whole line shows; once it's out, the next line. Style: Wave (the outline fizzes) or Plain.
// &talk=plain opens on Plain (for the screenshots).
// Colours (0.33.0, F121): Style = the style's own colours · Paper = the game's colours from talk.json's "colours"
// (Goops' Veteran, sketch S9: a light bubble with dark words). &colours=paper opens on Paper.
import { useState, type ReactNode } from 'react'
import { Panel, Row, Screen, Selector, TalkingBubble, Text } from '../kit'
import talk from './content/tuning/talk.json' // the numbers + colours, as a game keeps them (content/tuning: live in the Dev Kit)

const styles = ['Wave', 'Plain']
const colourChoices = ['Style', 'Paper']
// Read once at load (the gallery tidies the link down to screen + preset straight after)
const link = new URLSearchParams(location.search)
const asked = (name: string, options: string[]) => options.find((o) => o.toLowerCase() === (link.get(name) ?? '').toLowerCase()) ?? options[0]
const firstStyle = () => asked('talk', styles)
const firstColours = () => asked('colours', colourChoices)

// The Veteran's lines (as a game's content/text/en.json would hold them)
const lines = [
  'Found some scraps. Left \'em in your panel. Don\'t tell the screen.',
  'Listen — don\'t trust the — ... they\'re not— ... Hold on. Bad wire.',
  'Oh! Hi! It\'s me! ... Oof. Glad you\'re not goop yet.',
]

export function TalkSample() {
  const [style, setStyle] = useState(firstStyle)
  const [colours, setColours] = useState(firstColours)
  const [line, setLine] = useState(0)
  const speaker = (
    <Panel gap="xs" className="gallery-talk-speaker" data-gallery-speaker="">
      <Text kind="caption">THE VETERAN · speaker</Text>
    </Panel>
  )
  // The pickers: across the top on a tall phone; sideways, one in each top corner — one row, clear of the bubble (both
  // in the top-left corner wrapped to two rows on a phone on its side, and the bubble covered the second: 0.33.2)
  const stylePicker = <Selector label="Style" options={styles} value={style} onChange={setStyle} />
  const colourPicker = <Selector label="Colours" options={colourChoices} value={colours} onChange={setColours} />
  const controls = (picker: ReactNode) => <Row gap="s" justify="center" className="gallery-talk-controls">{picker}</Row>
  const sideways = innerWidth > innerHeight
  return (
    <Screen label="Talking bubble" bottom={speaker} top={sideways ? undefined : controls(<>{stylePicker}{colourPicker}</>)}
      topLeft={sideways ? controls(stylePicker) : undefined} topRight={sideways ? controls(colourPicker) : undefined}>
      <TalkingBubble key={`${style}-${line}`} target="[data-gallery-speaker]" text={lines[line]} speaker="The Veteran"
        outline={style === 'Plain' ? 'plain' : 'wave'} feel={talk} colours={colours === 'Paper' ? talk.colours : undefined} placement="top" avoid=".gallery-talk-controls"
        onConfirm={() => setLine((n) => (n + 1) % lines.length)} />
    </Screen>
  )
}
