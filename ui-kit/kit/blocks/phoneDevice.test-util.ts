// A PRETEND DEVICE for the phone tests (fullscreen.test.tsx, upright.test.tsx — .test-util: never copied into a game): touch or mouse, held upright or on its
// side, can go full screen or not (iPhone Safari), opened from the home screen or not. Undo with vi.unstubAllGlobals().
import { vi } from 'vitest'

export function pretendDevice({ touch = false, sideways = false, can = true, installed = false } = {}) {
  const media = (query: string) => {
    const matches = query.includes('display-mode') ? installed
      : query.includes('coarse') ? touch
      : query.includes('fine') ? !touch
      : query.includes('landscape') ? sideways
      : query.includes('portrait') ? !sideways
      : false
    return { matches, media: query, addEventListener: () => {}, removeEventListener: () => {} }
  }
  vi.stubGlobal('matchMedia', media)
  const requestFullscreen = vi.fn(() => Promise.resolve())
  const exitFullscreen = vi.fn(() => Promise.resolve())
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: can })
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: requestFullscreen })
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
  return { requestFullscreen, exitFullscreen }
}
