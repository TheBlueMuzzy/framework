// SCREEN STACK (React) — draws the open screens on top of the game, newest on top.
//   <ScreenStack screens={{ settings: SettingsScreen, quit: QuitDialog }}>
//     <GameHud />            ← the always-there bottom layer
//   </ScreenStack>
// Each screen is a component that returns a <Screen>. A dialog is just <Screen dialog> pushed on top.
// Everything under the top screen is inert: it can be seen but not clicked, tapped or focused.
//
// overlay: for a game whose own view isn't built from kit Screens (a letterboxed canvas, its own HUD
// with z-indexes). Put <ScreenStack overlay screens={…} /> next to the game, with no children:
// open screens then cover the whole window above the game (at --kit-overlay-z, default 100), dim it
// and block taps to it. Tapping the dim closes the top screen, like Esc and Back.
import { useEffect, useRef, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'
import { screens as store } from './screens'

// Until a key is pressed, a screen that opens shouldn't show the keyboard focus ring
// (browsers show it for focus moved by code before any click or key, e.g. a screen opened at load).
let keyPressed = false
if (typeof window !== 'undefined') window.addEventListener('keydown', () => { keyPressed = true }, { once: true, capture: true })

type ScreenStackProps = { screens: Record<string, ComponentType>; children?: ReactNode; overlay?: boolean }

export function useScreens() {
  return useSyncExternalStore(store.subscribe, () => store.current, () => store.current)
}

export function ScreenStack({ screens, children, overlay }: ScreenStackProps) {
  const stack = useScreens()
  const layers = useRef<(HTMLDivElement | null)[]>([])
  const openers = useRef<(Element | null)[]>([]) // what had focus when each screen opened

  // Keyboard/gamepad focus: into a screen when it opens, back to its opener when it closes.
  const depth = stack.length
  const lastDepth = useRef(depth)
  // Noted while drawing, before the screen below turns inert and drops its focus.
  if (depth > lastDepth.current) openers.current[depth - 1] = document.activeElement
  useEffect(() => {
    if (depth > lastDepth.current) {
      // The first button or input; a scroll box only if there's nothing else (it would wear the focus ring)
      const layer = layers.current[depth]
      const first = layer?.querySelector<HTMLElement>('button:not(:disabled), input') ?? layer?.querySelector<HTMLElement>('[tabindex="0"]')
      // ("as FocusOptions": older TypeScript versions, like many games use, don't know focusVisible yet)
      first?.focus(keyPressed ? undefined : ({ focusVisible: false } as FocusOptions))
    } else if (depth < lastDepth.current) {
      (openers.current[depth] as HTMLElement | null)?.focus?.()
    }
    lastDepth.current = depth
  }, [depth])

  const open = stack.map((name, i) => {
    const Screen = screens[name]
    return (
      <div key={`${i}-${name}`} className="kit-layer" ref={(el) => { layers.current[i + 1] = el }} inert={i < depth - 1}>
        {Screen ? <Screen /> : null}
      </div>
    )
  })

  return (
    <>
      <div className="kit-layer" ref={(el) => { layers.current[0] = el }} inert={depth > 0}>{children}</div>
      {overlay
        ? <div className="kit-overlay" data-open={depth > 0 || undefined}
            onClick={(e) => { if (e.target === e.currentTarget) store.pop() }}>{open}</div>
        : open}
    </>
  )
}
