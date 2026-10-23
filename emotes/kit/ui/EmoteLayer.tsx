// THE EMOTES ON SCREEN — the glue between the emotes module (../emotes.ts) and the UI kit's parts (SpeechBubble,
// EmotePicker, MuteMenu, MutedMark, LiveAnnouncer). Only installed in games with the UI kit.
//
//   <EmoteBubbles emotes={emotes} targetFor={(seat) => `[data-seat="${seat}"]`} nameFor={(seat) => names[seat]} avoid=".hud-top" />
//     one bubble per seat, pointing at it; a new emote from the same seat replaces the words in place; each one shown is
//     said once to screen readers ("Ada: Well played!")
//   <EmoteMenu emotes={emotes} seat={tapped} mine={tapped === me} anchor={…} name={names[tapped]} onClose={close} />
//     the player's own seat → the picker (cooldown ring while the spam limit holds) · an opponent's → Mute / Unmute
//   const { isMuted } = useEmoteState(emotes)   →   <PlayerChip badge={isMuted(seat) ? <MutedMark /> : undefined} … />
// The game makes the seats tappable (a button round its chip / portrait) and closes the menu when Pause opens.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { EmotePicker, LiveAnnouncer, MuteMenu, SpeechBubble, type CalloutPlacement, type CalloutTarget } from '../../ui/kit'
import type { EmoteMessage, Emotes } from '../emotes'

type Shown = EmoteMessage & { key: number }

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
