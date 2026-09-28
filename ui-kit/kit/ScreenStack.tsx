// SCREEN STACK (React) — draws the open screens on top of the game, newest on top.
//   <ScreenStack screens={{ settings: SettingsScreen, quit: QuitDialog }}>
//     <GameHud />            ← the always-there bottom layer
//   </ScreenStack>
// Each screen is a component that returns a <Screen>. A dialog is just <Screen dialog> pushed on top.
// Everything under the top screen is inert: it can be seen but not clicked, tapped or focused.
import { useEffect, useRef, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'
import { screens as store } from './screens'

type ScreenStackProps = { screens: Record<string, ComponentType>; children?: ReactNode }

export function useScreens() {
  return useSyncExternalStore(store.subscribe, () => store.current, () => store.current)
}

export function ScreenStack({ screens, children }: ScreenStackProps) {
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
      layers.current[depth]?.querySelector<HTMLElement>('button, input, [tabindex="0"]')?.focus()
    } else if (depth < lastDepth.current) {
      (openers.current[depth] as HTMLElement | null)?.focus?.()
    }
    lastDepth.current = depth
  }, [depth])

  return (
    <>
      <div className="kit-layer" ref={(el) => { layers.current[0] = el }} inert={depth > 0}>{children}</div>
      {stack.map((name, i) => {
        const Screen = screens[name]
        return (
          <div key={`${i}-${name}`} className="kit-layer" ref={(el) => { layers.current[i + 1] = el }} inert={i < depth - 1}>
            {Screen ? <Screen /> : null}
          </div>
        )
      })}
    </>
  )
}
