// CARD — a tile with a title (mode select, level, reward). With onClick it can be picked;
// `selected` marks the chosen one.
// tone="success" (0.27.0): the card is "good / owned / done" — an upgrade with a level, a finished goal. Its edge turns
// the style's success colour (the same inset ring `selected` uses, so the card never grows) and its shadow becomes
// the style's depth-success (Neon: its glow in green). Which cards get it is the game's call.
// It keeps its size once it's on screen (0.21.0, useFixedSize): give it room for everything it can hold from the start.
import type { ReactNode } from 'react'
import { useFixedSize } from '../fixedSize'

type CardProps = { title: ReactNode; children?: ReactNode; selected?: boolean; tone?: 'success'; onClick?: () => void }

export function Card({ title, children, selected, tone, onClick }: CardProps) {
  const fixed = useFixedSize()
  const inside = <><span className="kit-card-title">{title}</span>{children}</>
  const state = selected ? 'selected' : undefined
  return onClick
    ? <button ref={fixed} type="button" className="kit-card kit-target" data-depth={1} data-state={state} data-tone={tone} aria-pressed={selected} onClick={onClick}>{inside}</button>
    : <article ref={fixed} className="kit-card" data-depth={1} data-state={state} data-tone={tone}>{inside}</article>
}
