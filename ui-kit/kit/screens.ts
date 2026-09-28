// SCREEN STACK — which screens are open, bottom first. Only the top one takes input.
//   screens.push('settings')   open a screen on top
//   screens.pop()              close the top screen (safe when nothing is open)
//   screens.replace('shop')    swap the top screen for another
//   screens.current            the open screens, e.g. ['settings', 'quit']
// Esc and the browser/phone Back button close the top screen on their own.
// Gamepad: call screens.pop() when B is pressed (the kit doesn't read gamepads itself).
//
// Back button: every open screen is also a browser history entry, so a phone's Back closes
// the screen instead of leaving the page. Once every screen is closed, Back leaves as normal.

let stack: readonly string[] = []
const listeners = new Set<() => void>()
const depthOf = (state: unknown) => (state as { kitScreens?: number } | null)?.kitScreens ?? 0
let historyDepth = typeof history === 'undefined' ? 0 : depthOf(history.state) // our entries in history
let travelling = false // true while the browser is still stepping back for us

function setStack(next: readonly string[]) {
  stack = next
  listeners.forEach((listener) => listener())
}

// Make history hold one entry per open screen. Stepping back is slow (the browser answers with a
// popstate later), and two quick steps can merge into one, so it goes one trip at a time.
function syncHistory() {
  if (travelling) return // popstate will call this again when the trip is done
  if (historyDepth > stack.length) { travelling = true; history.go(stack.length - historyDepth) }
  while (historyDepth < stack.length) history.pushState({ kitScreens: ++historyDepth }, '')
}

export const screens = {
  get current() { return stack },

  push(name: string) {
    setStack([...stack, name])
    syncHistory()
  },

  pop() {
    if (!stack.length) return
    setStack(stack.slice(0, -1))
    syncHistory()
  },

  replace(name: string) {
    if (!stack.length) return screens.push(name)
    setStack([...stack.slice(0, -1), name]) // same depth, so history stays as it is
  },

  // For React's useSyncExternalStore (see ScreenStack.tsx)
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    const ourTrip = travelling
    travelling = false
    historyDepth = depthOf(e.state)
    // Browser/phone Back (not a trip we asked for): close screens to match.
    if (!ourTrip && historyDepth < stack.length) setStack(stack.slice(0, historyDepth))
    syncHistory() // catch up with anything opened or closed during the trip
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length && !e.defaultPrevented) screens.pop()
  })
}
