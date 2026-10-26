// Small React helpers for the screens.
import { useEffect, useReducer, useSyncExternalStore } from 'react'
import { onTuning } from '../devkit/tuning/liveTuning'

/** Draw again whenever the Dev Kit edits this tuning file (the values themselves are read live where they're used). */
export function useTuningEdits(file: string) {
  const [, redraw] = useReducer((n: number) => n + 1, 0)
  useEffect(() => onTuning(file, redraw), [file])
}

const subscribeResize = (listener: () => void) => {
  addEventListener('resize', listener)
  return () => removeEventListener('resize', listener)
}
const windowSize = () => `${innerWidth}x${innerHeight}`

/** The window's size in CSS px, and the page's rem in px (the Text size setting changes it). Redraws on resize / rotate. */
export function useWindowSize() {
  const [width, height] = useSyncExternalStore(subscribeResize, windowSize).split('x').map(Number)
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return { width, height, rem }
}
