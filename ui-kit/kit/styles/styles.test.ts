// PRESET TEST — every style fills in the same names, and its text is readable.
// Readable = WCAG contrast of at least 4.5:1 for text, 3:1 for the focus ring (a shape, not text).
import { describe, expect, it } from 'vitest'
import { presets } from '.'
import { requiredTokenNames, optionalTokens } from '../style/tokens'

// Text colour → the backgrounds it is drawn on
const textPairs: [text: string, background: string][] = [
  ['on-bg', 'bg'], ['on-surface', 'surface'], ['on-primary', 'primary'], ['on-danger', 'danger'], ['on-success', 'success'],
  ['muted', 'surface'], ['muted', 'bg'], // captions, hints and inactive tabs sit on both
  ['on-game', 'game-shade'], ['accent', 'game-shade'], // HUD text on the game: its shadow is what it reads against
]
// success is also a card's edge (Card tone="success", 0.27.0): a shape on the card's surface
const shapePairs: [shape: string, background: string][] = [['focus', 'bg'], ['focus', 'surface'], ['success', 'surface']]

// Hue of a #rrggbb colour, 0–360 (red 0, green 120, cyan 180, blue 240)
function hue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  if (!d) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

// WCAG relative luminance of a #rrggbb colour
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const allNames = [...requiredTokenNames, ...Object.keys(optionalTokens)].sort()

describe.each(Object.entries(presets))('preset %s', (_name, preset) => {
  it('fills in exactly the same setting names as every other preset', () => {
    expect(Object.keys(preset).sort()).toEqual(allNames)
  })

  it.each(textPairs)('%s on %s is at least 4.5:1', (text, background) => {
    const a = String(preset[text as keyof typeof preset]), b = String(preset[background as keyof typeof preset])
    expect(a).toMatch(/^#[0-9a-f]{6}$/i)
    expect(contrast(a, b)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(shapePairs)('%s ring on %s is at least 3:1', (shape, background) => {
    expect(contrast(String(preset[shape as keyof typeof preset]), String(preset[background as keyof typeof preset]))).toBeGreaterThanOrEqual(3)
  })

  it('success reads as green (hue 90–160°) and is not the primary colour', () => {
    const h = hue(String(preset.success))
    expect(h).toBeGreaterThanOrEqual(90)
    expect(h).toBeLessThanOrEqual(160)
    expect(String(preset.success).toLowerCase()).not.toBe(String(preset.primary).toLowerCase())
  })
})

it('Neon: success is a clear green, well apart from its cyan primary (at least 35° of hue)', () => {
  expect(hue(String(presets.neon.primary)) - hue(String(presets.neon.success))).toBeGreaterThanOrEqual(35)
})
