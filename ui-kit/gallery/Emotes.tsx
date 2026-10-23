// EMOTES SAMPLE (?screen=emotes) — a table of three seats: yours at the bottom, two rivals at the top beside the HUD's
// round line. Bubbles: every seat says something (they come back every few seconds, each a new phrase in the same
// fixed-size bubble). Picker: your seat's phrase panel (tap a phrase: your bubble shows it). Cooling: the same panel
// past the spam limit (dimmed, rings filling). Mute: a rival's mute menu; Bolt is muted (the crossed bubble on his chip).
// &emote=bubbles|picker|cooling|mute opens straight on that view (for the screenshots); &still keeps bubbles up and
// mutes nobody.
import { useEffect, useState } from 'react'
import { Button, EmotePicker, HudText, MuteMenu, MutedMark, PlayerChip, Row, Screen, Selector, SpeechBubble, Stack } from '../kit'
import seats from './content/seats.json' // player colours come from content JSON, like a game's would

const views = ['Bubbles', 'Picker', 'Cooling', 'Mute']
const asked = new URLSearchParams(location.search)
const firstView = () => views.find((v) => v.toLowerCase() === (asked.get('emote') ?? '').toLowerCase()) ?? 'Bubbles'
const still = asked.has('still')

// The starter phrases' words, as content/text/en.json "emotes" would hold them
const phrases = [
  { id: 'hello', label: 'Hello!' }, { id: 'wellPlayed', label: 'Well played!' }, { id: 'thanks', label: 'Thanks!' },
  { id: 'wow', label: 'Wow!' }, { id: 'oops', label: 'Oops!' }, { id: 'thinking', label: 'Thinking…' }, { id: 'goodGame', label: 'Good game!' },
]
const sizeTo = phrases.map((p) => p.label)
const players = [
  { id: 'me', name: 'Muzzy', color: seats[3].color },
  { id: 'ada', name: 'Ada', color: seats[0].color },
  { id: 'bolt', name: 'Bolt', color: seats[1].color },
] as const
const seatOf = (id: string) => `[data-gallery-seat="${id}"]`
// What a bubble stays off: the HUD and every other seat (its own seat holds the target, so it doesn't count)
const avoid = '.gallery-emote-hud, [data-gallery-seat]'

export function EmotesSample() {
  const [view, setView] = useState(firstView)
  const [said, setSaid] = useState<Partial<Record<string, { text: string; key: number }>>>(() => (view === 'Bubbles'
    ? { me: { text: 'Good game!', key: 1 }, ada: { text: 'Well played!', key: 1 }, bolt: { text: 'Wow!', key: 1 } } : {}))
  const [mutedBolt, setMutedBolt] = useState(!still) // (&still: nobody muted, so every seat's bubble is in the screenshot)
  // Bubbles view: every few seconds each seat says the next phrase (unless &still)
  useEffect(() => {
    if (view !== 'Bubbles' || still) return
    let n = 0
    const timer = setInterval(() => {
      n++
      setSaid({ me: { text: phrases[n % 7].label, key: n }, ada: { text: phrases[(n + 3) % 7].label, key: n }, bolt: { text: phrases[(n + 5) % 7].label, key: n } })
    }, 3200)
    return () => clearInterval(timer)
  }, [view])
  const seat = (p: typeof players[number]) => (
    <Button key={p.id} variant="ghost" data-gallery-seat={p.id} aria-label={p.id === 'me' ? 'Your seat: emotes' : `${p.name}: mute emotes`}
      onClick={() => setView(p.id === 'me' ? 'Picker' : 'Mute')}>
      <PlayerChip name={p.name} color={p.color} size={p.id === 'me' ? 's' : 'xs'} score={p.id === 'me' ? 14 : p.id === 'ada' ? 11 : 9}
        badge={p.id === 'bolt' && mutedBolt ? <MutedMark /> : undefined} />
    </Button>
  )
  // A phone on its side (or a desktop window): the rivals sit in the top corners; a tall phone: in a row mid-screen
  const sideways = innerWidth > innerHeight
  return (
    <Screen label="Emotes" top={<span className="gallery-emote-hud"><HudText>Round 2</HudText></span>} bottom={seat(players[0])}
      topLeft={sideways ? seat(players[1]) : undefined} topRight={sideways ? seat(players[2]) : undefined}>
      <Stack gap="l" className="gallery-teach">
        {!sideways && <Row gap="m" justify="between">{seat(players[1])}{seat(players[2])}</Row>}
        <Selector label="View" options={views} value={view} onChange={setView} />
      </Stack>
      {/* a muted seat never gets a bubble */}
      {players.filter((p) => !(p.id === 'bolt' && mutedBolt)).map((p) => {
        const line = said[p.id]
        return line && <SpeechBubble key={`${p.id}-${line.key}`} target={seatOf(p.id)} text={line.text} sizeTo={sizeTo}
          showMs={still ? 3_600_000 : 2500} placement={p.id === 'me' ? 'top' : 'bottom'} avoid={avoid} />
      })}
      {(view === 'Picker' || view === 'Cooling') && (
        <EmotePicker anchor={seatOf('me')} phrases={phrases} readyIn={view === 'Cooling' ? 3200 : 0} avoid=".gallery-emote-hud"
          onPick={(id) => { setSaid({ me: { text: phrases.find((p) => p.id === id)!.label, key: Date.now() } }); setView('Bubbles') }}
          onClose={() => setView('Bubbles')} />
      )}
      {view === 'Mute' && (
        <MuteMenu anchor={seatOf('bolt')} name="Bolt" muted={mutedBolt} placement="bottom" avoid=".gallery-emote-hud"
          onToggle={setMutedBolt} onClose={() => setView('Bubbles')} />
      )}
    </Screen>
  )
}
