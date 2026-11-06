// "TURN YOUR PHONE" (F192 — from Goops' src/ui/Upright.tsx, Muzzy 2026-10-19: "a phone held sideways should never affect
// the orientation of the game. the game is a portrait only game"). A web page can't stop a phone from turning, so a
// phone held against the game's content/ui/style.json "orientation" gets this card over everything:
//   "portrait"  + a phone on its side  → "Turn your phone upright"
//   "landscape" + a phone held upright → "Turn your phone on its side"
//   "any" or not set                   → never shown
// Only on touch screens: a short desktop WINDOW (a mouse for a pointer) is not a phone on its side — it keeps its own
// layout. Where the browser allows it (Android, full screen) the screen is also locked the game's way (fullscreen.ts).
//   <UprightCard />                    once, beside the ScreenStack (like <ToastStack />); it shows and hides itself
//   const wrongWay = useWrongWayUp()   to pause a real-time game under it (Goops pauses its shift)
// It catches every tap while it shows (above every screen), and its words come from the game: words={text.upright}.
import { useSyncExternalStore, type CSSProperties } from 'react'
import { Panel, Screen } from '../layout'
import { gameOrientation, type Orientation } from '../orientation'
import { EmptyState } from './dialogs'
import { isTouchDevice } from './fullscreen'

export const uprightWords = {
  upright: 'Turn your phone upright', uprightMessage: 'This game plays with your phone held upright.',
  sideways: 'Turn your phone on its side', sidewaysMessage: 'This game plays with your phone on its side.',
}

const media = (query: string) => typeof matchMedia === 'function' && matchMedia(query).matches

/** Is a touch screen held against the game's orientation right now? (orientation: style.json's, by default) */
export function wrongWayUp(orientation: Orientation | undefined = gameOrientation()) {
  if (orientation !== 'portrait' && orientation !== 'landscape') return false
  if (!isTouchDevice()) return false
  return media(`(orientation: ${orientation === 'portrait' ? 'landscape' : 'portrait'})`)
}

// Turning the phone resizes the window (and flips the orientation query): read again then
const subscribe = (changed: () => void) => {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('resize', changed)
  window.addEventListener('orientationchange', changed)
  return () => { window.removeEventListener('resize', changed); window.removeEventListener('orientationchange', changed) }
}
/** true while the phone is held the wrong way up for this game — pause a real-time game under the card. */
export function useWrongWayUp(orientation?: Orientation) {
  return useSyncExternalStore(subscribe, () => wrongWayUp(orientation ?? gameOrientation()), () => false)
}

type UprightProps = {
  words?: Partial<typeof uprightWords>
  orientation?: Orientation // the game's way; style.json's by default
  backdrop?: string // the game's own background picture behind the card (Goops: its console art)
  show?: boolean // show it whatever the phone is doing (the gallery, screenshots)
}
export function UprightCard({ words, orientation, backdrop, show }: UprightProps) {
  const way = orientation ?? gameOrientation()
  const wrongWay = useWrongWayUp(way)
  if (!show && !wrongWay) return null
  const w = { ...uprightWords, ...words }
  const title = way === 'landscape' ? w.sideways : w.upright
  const message = way === 'landscape' ? w.sidewaysMessage : w.uprightMessage
  return (
    <div className="kit-overlay" data-open data-upright role="alertdialog" aria-modal aria-label={title}
      style={{ '--kit-overlay-z': 'var(--kit-upright-z, 2147482000)' } as CSSProperties}>
      <Screen label={title} backdrop={backdrop}>
        <Panel><EmptyState title={title} message={message} /></Panel>
      </Screen>
    </div>
  )
}
