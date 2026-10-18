import { describe, expect, it, vi } from 'vitest'
import { applyStyle } from '../../../ui-kit/kit/style/applyStyle'
import { presets } from '../../../ui-kit/kit/styles'
import { createStyleStore } from './styleStore'

const kit = {
  applyStyle: (s: { preset: string; tweaks?: Record<string, unknown> }) => applyStyle(s as Parameters<typeof applyStyle>[0]),
  presets: presets as unknown as Record<string, Record<string, unknown>>,
}
const FONTS = ['font-title', 'font-heading', 'font-body', 'font-numbers']

describe('the shared style store (Color + Fonts tabs)', () => {
  it('a change shows on the page at once; title and heading follow the display font until picked', () => {
    const store = createStyleStore(kit, { preset: 'neon', tweaks: { primary: '#123456' } }, vi.fn())
    expect(store.get().live['font-title']).toBe('var(--font-display)')
    store.set({ 'font-title': "'VT323', system-ui, sans-serif" })
    expect(document.documentElement.style.getPropertyValue('--font-title')).toBe("'VT323', system-ui, sans-serif")
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#123456') // the rest stays
  })

  it("one tab saves only its values; the other tab's unsaved change stays unsaved, and the file keeps its tweaks", async () => {
    const save = vi.fn(async () => {})
    const store = createStyleStore(kit, { preset: 'neon', tweaks: { primary: '#123456' } }, save)
    store.set({ 'font-body': "'VT323', system-ui, sans-serif", accent: '#00ff00' }) // a font (Fonts tab) + a colour (Color tab)
    await store.save(FONTS)
    expect(save).toHaveBeenCalledWith('content/ui/style.json', { preset: 'neon', tweaks: { primary: '#123456', 'font-body': "'VT323', system-ui, sans-serif" } })
    expect(store.get().saved['font-body']).toBe("'VT323', system-ui, sans-serif")
    expect(store.get().saved.accent).not.toBe('#00ff00') // the colour is still unsaved…
    expect(store.get().live.accent).toBe('#00ff00') // …and still showing
    await store.save(['accent'])
    expect(save).toHaveBeenLastCalledWith('content/ui/style.json', {
      preset: 'neon',
      tweaks: { primary: '#123456', 'font-body': "'VT323', system-ui, sans-serif", accent: '#00ff00' },
    })
  })

  it('undo puts back only the values asked for', () => {
    const store = createStyleStore(kit, { preset: 'neon' }, vi.fn())
    store.set({ 'font-title': "'VT323'", accent: '#00ff00' })
    store.undo(['font-title'])
    expect(store.get().live['font-title']).toBe('var(--font-display)')
    expect(store.get().live.accent).toBe('#00ff00')
    store.undo()
    expect(store.get().live.accent).toBe(presets.neon.accent)
  })

  it('a font picked back to the default leaves the file', async () => {
    const save = vi.fn(async () => {})
    const store = createStyleStore(kit, { preset: 'neon', tweaks: { 'font-title': "'VT323'" } }, save)
    store.set({ 'font-title': 'var(--font-display)' })
    await store.save(['font-title'])
    expect(save).toHaveBeenCalledWith('content/ui/style.json', { preset: 'neon', tweaks: {} })
  })
})
