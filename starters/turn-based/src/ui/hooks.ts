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
const shortSide = () => Math.min(innerWidth, innerHeight)

/** The window's shorter side, in CSS px (redraws on resize / rotate). */
export const useShortSide = () => useSyncExternalStore(subscribeResize, shortSide)
