// THE EMOTES ON SCREEN — the glue between the emotes module (../emotes.ts) and the UI kit's parts (SpeechBubble,
// EmotePicker, MuteMenu, MutedMark, LiveAnnouncer). Only installed in games with the UI kit.
//
//   <EmoteBubbles emotes={emotes} targetFor={(seat) => `[data-seat="${seat}"]`} nameFor={(seat) => names[seat]} avoid=".hud-top" />
//     one bubble per seat, pointing at it; a new emote from the same seat replaces the words in place; each one shown is
//     said once to screen readers ("Ada: Well played!")
//   <EmoteMenu emotes={emotes} seat={tapped} mine={tapped === me} anchor={…} name={names[tapped]} onClose={close} />
//     the player's own seat → the picker (cooldown ring while the spam limit holds) · an opponent's → Mute / Unmute
//   const { isMuted } = useEmoteState(emotes)   →   <PlayerChip badge={isMuted(seat) ? <MutedMark /> : undefined} … />
//   <EmoteSeats emotes={emotes} seats={seats} mine={me} />   (0.3.0, F109 — THE EASY WAY, all of the above in one line)
//     the UI kit's PlayerSeats with every seat a button: yours opens the picker, a rival's Mute; a muted rival's
//     portrait wears the MutedMark; the bubbles point at the seats. seats = the kit's Seat list ({ id: the emote seat
//     id, name, avatar, color, score }).
// By hand, the game makes the seats tappable (a button round its chip / portrait, with emoteSeatProps(seat, mine)) and
// closes the menu when Pause opens. Pass avoid="<the HUD's selector>, [data-emote-seat]" so bubbles stay off both.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { EmotePicker, LiveAnnouncer, MutedMark, MuteMenu, PlayerSeats, SpeechBubble, fill, type CalloutPlacement, type CalloutTarget, type Seat } from '../../ui/kit'
import type { EmoteMessage, Emotes } from '../emotes'

type Shown = EmoteMessage & { key: number }

/** Put on each tappable seat (the button round its chip / portrait): marks whose it is, so check:framework can find
 *  the player's own seat (the picker) and the bubbles can stay off the other seats (avoid '[data-emote-seat]'). */
export function emoteSeatProps(seat: string, mine: boolean) {
  return { 'data-emote-seat': seat, 'data-emote-mine': mine ? '' : undefined }
}

/** The bubble showing at each seat right now (seat → its emote), and the newest one for the announcer. */
export function useEmoteBubbles(emotes: Emotes) {
  const [shown, setShown] = useState<Record<string, Shown>>({})
  const [newest, setNewest] = useState<Shown | null>(null)
  useEffect(() => {
    let count = 0
    return emotes.onEmote((emote) => {
      const next = { ...emote, key: ++count }
      setShown((before) => ({ ...before, [emote.seat]: next }))
      setNewest(next)
    })
  }, [emotes])
  // A bubble that has faded goes — unless a newer one from the same seat already took its place
  const done = useCallback((seat: string, key: number) => {
    setShown((before) => {
      if (before[seat]?.key !== key) return before
      const rest = { ...before }
      delete rest[seat]
      return rest
    })
  }, [])
  return { shown, newest, done }
}

/** The muted seats and the switch, kept up to date (for the chips' MutedMark). */
export function useEmoteState(emotes: Emotes) {
  const snapshot = useSyncExternalStore(
    (changed) => emotes.onChange(changed),
    () => `${emotes.hideAll()}|${emotes.muted().join(',')}`,
  )
  const [hide, list] = snapshot.split('|')
  const muted = list ? list.split(',') : []
  return { hideAll: hide === 'true', muted, isMuted: (seat: string) => muted.includes(seat) }
}

export type EmoteBubblesProps = {
  emotes: Emotes
  /** Where each seat's chip / portrait is: an Element, a CSS selector or a point. */
  targetFor: (seat: string) => CalloutTarget
  /** The seat's player name, for the screen-reader line ("Ada: Well played!"). */
  nameFor?: (seat: string) => string
  /** The side each seat's bubble tries first (default 'top'; it flips to fit). */
  placementFor?: (seat: string) => CalloutPlacement
  /** A CSS selector of what bubbles stay clear of (the HUD). */
  avoid?: string
}

export function EmoteBubbles({ emotes, targetFor, nameFor, placementFor, avoid }: EmoteBubblesProps) {
  const { shown, newest, done } = useEmoteBubbles(emotes)
  const sizeTo = emotes.allTexts()
  return (
    <>
      {Object.values(shown).map((emote) => (
        <SpeechBubble key={`${emote.seat}-${emote.key}`} target={targetFor(emote.seat)} text={emotes.text(emote.id)}
          sizeTo={sizeTo} showMs={emotes.bubbleMs(emote.id)} placement={placementFor?.(emote.seat) ?? 'top'} avoid={avoid}
          onDone={() => done(emote.seat, emote.key)} />
      ))}
      <LiveAnnouncer stamp={newest?.key ?? 0} text={newest ? `${nameFor?.(newest.seat) ?? newest.seat}: ${emotes.text(newest.id)}` : ''} />
    </>
  )
}

export type EmoteMenuProps = {
  emotes: Emotes
  /** The seat that was tapped. */
  seat: string
  /** true = the player's own seat (the picker) · false = an opponent's (the mute menu). */
  mine: boolean
  /** The tapped chip / portrait. */
  anchor: CalloutTarget
  /** The opponent's name (the mute menu is named after them). */
  name?: string
  onClose: () => void
  placement?: CalloutPlacement
  avoid?: string
}

export function EmoteMenu({ emotes, seat, mine, anchor, name = '', onClose, placement, avoid }: EmoteMenuProps) {
  const { isMuted } = useEmoteState(emotes)
  // The cooldown: measured when it opens and after each press; one re-draw when it's over
  const [readyIn, setReadyIn] = useState(() => emotes.readyIn(seat))
  useEffect(() => {
    if (readyIn <= 0) return
    const timer = window.setTimeout(() => setReadyIn(emotes.readyIn(seat)), readyIn)
    return () => clearTimeout(timer)
  }, [readyIn, emotes, seat])
  if (!mine) return <MuteMenu anchor={anchor} name={name} muted={isMuted(seat)} onToggle={(on) => emotes.mute(seat, on)} onClose={onClose} placement={placement} avoid={avoid} />
  const phrases = emotes.phrases.map((id) => ({ id, label: emotes.text(id) || id }))
  const pick = (id: string) => {
    const result = emotes.sendEmote(seat, id)
    if (result.ok && emotes.config.picker.closeAfterSend) onClose()
    else setReadyIn(emotes.readyIn(seat))
  }
  return <EmotePicker anchor={anchor} phrases={phrases} onPick={pick} onClose={onClose} readyIn={readyIn} placement={placement} avoid={avoid} />
}

// ─── The seat row (0.3.0, F109) ─────────────────────────────────────

/** The seat buttons' screen-reader names and the muted mark's — pass the game's own text to translate them. */
export const emoteSeatWords = { mine: '{name} — send an emote', rival: '{name} — mute or unmute', muted: 'Emotes muted' }

export type EmoteSeatsProps = {
  emotes: Emotes
  /** Every seat at the table, in order: the UI kit's Seat ({ id: the emote seat id, name, avatar, color, score }). */
  seats: readonly Seat[]
  /** This device's seat id(s) — a hot-seat game has several. Theirs open the picker; everyone else's, Mute. */
  mine: string | readonly string[]
  /** The name read out with an emote and on the mute menu (default: the seat's own name). */
  nameFor?: (seat: string) => string
  /** Whose turn it is (that seat gets the highlight). */
  activeId?: string
  /** false = portraits only (the names are still read out). */
  showNames?: boolean
  /** The side the menu and the bubbles try first (default 'top'; they flip to fit) — 'bottom' for a row along the top. */
  placement?: CalloutPlacement
  /** A CSS selector of what the menu and bubbles stay clear of (the HUD); the other seats are always added. */
  avoid?: string
  /** false = no bubbles here (the game draws its own <EmoteBubbles>). */
  bubbles?: boolean
  words?: Partial<typeof emoteSeatWords>
}

// "[data-emote-seat="<id>"]" — the id escaped, so an odd room id can't break the selector: a quote or backslash gets a
// backslash; a line break or other control character becomes its code ("\a ") — left raw, it made querySelector throw
// and took the whole row down (F109 review: a relayed seat id is any string up to 64)
const seatSelector = (seat: string) => {
  const escaped = [...seat].map((c) => {
    const code = c.charCodeAt(0)
    if (code < 0x20 || code === 0x7f) return `\\${code.toString(16)} `
    return c === '"' || c === '\\' ? `\\${c}` : c
  }).join('')
  return `[data-emote-seat="${escaped}"]`
}

/** One line in a game: the tappable seat row, its menu (picker / Mute), the muted marks and the bubbles. */
export function EmoteSeats({ emotes, seats, mine, nameFor, activeId, showNames, placement = 'top', avoid, bubbles = true, words }: EmoteSeatsProps) {
  const w = { ...emoteSeatWords, ...words }
  const mineList: readonly string[] = typeof mine === 'string' ? [mine] : mine
  const isMine = (seat: string) => mineList.includes(seat)
  const { isMuted } = useEmoteState(emotes)
  const [tapped, setTapped] = useState<string | null>(null)
  const name = (seat: string) => nameFor?.(seat) ?? seats.find((s) => s.id === seat)?.name ?? seat
  const clearOf = avoid ? `${avoid}, [data-emote-seat]` : '[data-emote-seat]'
  const open = tapped !== null && seats.some((s) => s.id === tapped) ? tapped : null // (a seat that left closes its menu)
  // … for good: forget the tap too, or the menu popped open again when that seat came back (F109 review)
  if (tapped !== null && open === null) setTapped(null)
  const row: Seat[] = seats.map((s) => ({
    ...s,
    tapLabel: fill(isMine(s.id) ? w.mine : w.rival, { name: name(s.id) }),
    badge: s.badge ?? (isMuted(s.id) ? <MutedMark label={w.muted} /> : undefined),
    seatProps: { ...s.seatProps, ...emoteSeatProps(s.id, isMine(s.id)), 'aria-haspopup': 'dialog', 'aria-expanded': open === s.id },
  }))
  return (
    <>
      <PlayerSeats players={row} activeId={activeId} showNames={showNames} onSeatTap={(s) => setTapped(open === s.id ? null : s.id)} />
      {open !== null && <EmoteMenu emotes={emotes} seat={open} mine={isMine(open)} anchor={seatSelector(open)} name={name(open)}
        placement={placement} avoid={clearOf} onClose={() => setTapped(null)} />}
      {bubbles && <EmoteBubbles emotes={emotes} targetFor={seatSelector} nameFor={name} placementFor={() => placement} avoid={clearOf} />}
    </>
  )
}
