// PRESET TEST — every style fills in the same names, and its text is readable.
// Readable = WCAG contrast of at least 4.5:1 for text, 3:1 for the focus ring (a shape, not text).
import { describe, expect, it } from 'vitest'
import { presets } from '.'
import { requiredTokenNames, optionalTokens } from '../style/tokens'

// Text colour → the backgrounds it is drawn on
const textPairs: [text: string, background: string][] = [
  ['on-bg', 'bg'], ['on-surface', 'surface'], ['on-primary', 'primary'], ['on-danger', 'danger'],
  ['muted', 'surface'], ['muted', 'bg'], // captions, hints and inactive tabs sit on both
]
const shapePairs: [shape: string, background: string][] = [['focus', 'bg'], ['focus', 'surface']]

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
})
