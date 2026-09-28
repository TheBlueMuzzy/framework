import { describe, expect, it, vi } from 'vitest'
import { applyStyle, resolveStyle } from './applyStyle'

describe('style engine', () => {
  it('fills every variable from the preset', () => {
    const vars = resolveStyle({ preset: 'clean' })
    expect(vars.primary).toBe('#2f5bd3')
    expect(vars['gap-m']).toBe('16px') // 4 steps × 4px × density 1
    expect(vars['target-min']).toBe('44px')
    expect(vars['text-body']).toBe('1.125rem') // 18px
    expect(vars.glow).toBe('none') // optional extra gets its default
  })

  it('lets tweaks win over the preset', () => {
    const vars = resolveStyle({ preset: 'clean', tweaks: { accent: '#e07a5f', density: 1.25 } })
    expect(vars.accent).toBe('#e07a5f')
    expect(vars['gap-m']).toBe('20px')
  })

  it('never lets text go below 18px', () => {
    expect(resolveStyle({ preset: 'clean', tweaks: { 'text-size': 0.5 } })['text-body']).toBe('1.125rem')
  })

  it('falls back to clean for an unknown preset', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveStyle({ preset: 'nope' }).primary).toBe('#2f5bd3')
  })

  it('sets CSS variables on <html>', () => {
    applyStyle({ preset: 'clean', tweaks: { primary: '#123456' } })
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#123456')
  })
})
