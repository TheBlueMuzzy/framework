// EMOTES SAMPLE (?screen=emotes) — a table of three seats: yours at the bottom, two rivals at the top beside the HUD's
// round line. Every seat is the UI kit's tappable seat row (PlayerSeats + onSeatTap, 0.29.0 — what the emotes module's
// <EmoteSeats> draws): tap yours → the picker, a rival's → the mute menu. Bubbles: every seat says something (they come
// back every few seconds, each a new phrase in the same fixed-size bubble). Picker: your seat's phrase panel (tap a
// phrase: your bubble shows it). Cooling: the same panel past the spam limit (dimmed, rings filling). Mute: a rival's
// mute menu; Bolt is muted (the crossed bubble on his portrait's corner — his chip keeps its size).
// &emote=bubbles|picker|cooling|mute opens straight on that view (for the screenshots); &still keeps bubbles up and
// mutes nobody.
import { useEffect, useState } from 'react'
import { EmotePicker, HudText, MuteMenu, MutedMark, PlayerSeats, Row, Screen, Selector, SpeechBubble, Stack, type Seat } from '../kit'
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
  { id: 'me', name: 'Muzzy', color: seats[3].color, score: 14 },
  { id: 'ada', name: 'Ada', color: seats[0].color, score: 11 },
  { id: 'bolt', name: 'Bolt', color: seats[1].color, score: 9 },
]
const nameOf = (id: string) => players.find((p) => p.id === id)!.name
const seatOf = (id: string) => `[data-gallery-seat="${id}"]`
// What a bubble stays off: the HUD and every other seat (its own seat holds the target, so it doesn't count)
const avoid = '.gallery-emote-hud, [data-gallery-seat]'

export function EmotesSample() {
  const [view, setView] = useState(firstView)
  const [said, setSaid] = useState<Partial<Record<string, { text: string; key: number }>>>(() => (view === 'Bubbles'
    ? { me: { text: 'Good game!', key: 1 }, ada: { text: 'Well played!', key: 1 }, bolt: { text: 'Wow!', key: 1 } } : {}))
  const [muted, setMuted] = useState<string[]>(still ? [] : ['bolt']) // (&still: nobody muted, so every seat's bubble shows)
  const [rival, setRival] = useState('bolt') // whose mute menu is open
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
  // A seat of the row: named for screen readers, tagged (data-gallery-seat, like a game's data-emote-seat), muted mark on
  const asSeat = (p: typeof players[number]): Seat => ({
    ...p, tapLabel: p.id === 'me' ? `${p.name} — send an emote` : `${p.name} — mute or unmute`,
    badge: muted.includes(p.id) ? <MutedMark /> : undefined, seatProps: { 'data-gallery-seat': p.id },
  })
  const tap = (s: Seat) => {
    if (s.id === 'me') return setView(view === 'Picker' ? 'Bubbles' : 'Picker')
    setRival(s.id)
    setView(view === 'Mute' && rival === s.id ? 'Bubbles' : 'Mute')
  }
  const row = (...ids: string[]) => <PlayerSeats players={players.filter((p) => ids.includes(p.id)).map(asSeat)} activeId="ada" onSeatTap={tap} />
  // A phone on its side (or a desktop window): the rivals sit in the top corners; a tall phone: in a row mid-screen
  const sideways = innerWidth > innerHeight
  return (
    <Screen label="Emotes" top={<span className="gallery-emote-hud"><HudText>Round 2</HudText></span>} bottom={row('me')}
      topLeft={sideways ? row('ada') : undefined} topRight={sideways ? row('bolt') : undefined}>
      <Stack gap="l" className="gallery-teach">
        {!sideways && <Row justify="center">{row('ada', 'bolt')}</Row>}
        <Selector label="View" options={views} value={view} onChange={setView} />
      </Stack>
      {/* a muted seat never gets a bubble */}
      {players.filter((p) => !muted.includes(p.id)).map((p) => {
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
        <MuteMenu anchor={seatOf(rival)} name={nameOf(rival)} muted={muted.includes(rival)} placement="bottom" avoid=".gallery-emote-hud"
          onToggle={(on) => setMuted((list) => (on ? [...list, rival] : list.filter((id) => id !== rival)))} onClose={() => setView('Bubbles')} />
      )}
    </Screen>
  )
}
