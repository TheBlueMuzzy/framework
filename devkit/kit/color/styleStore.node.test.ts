// @vitest-environment node
// A game's own Node tests (no page, no `document`) import Dev Kit files — e.g. Glyphtender's select.test.ts.
// Since 0.17.0 color/uiKit.ts builds the shared style store as it loads; it must not touch the page until first used.
import { describe, expect, it, vi } from 'vitest'
import { createStyleStore } from './styleStore'

const kit = { applyStyle: vi.fn(), presets: { clean: {} } }

describe('the style store without a page (Node tests)', () => {
  it('there really is no document here', () => {
    expect(typeof document).toBe('undefined')
  })

  it('color/uiKit.ts loads without a document', async () => {
    await expect(import('./uiKit')).resolves.toBeDefined()
  })

  it('building the store reads nothing from the page; the page is only looked up on the first change', () => {
    const store = createStyleStore(kit, { preset: 'clean' }, vi.fn())
    expect(store.get().live).toBeDefined()
    expect(() => store.set({ primary: '#123456' })).toThrow(/document/) // first use is where the page is needed
    const page = { style: { removeProperty: vi.fn() } } as unknown as HTMLElement
    const withPage = createStyleStore(kit, { preset: 'clean' }, vi.fn(), page)
    withPage.set({ primary: '#123456' })
    expect(kit.applyStyle).toHaveBeenCalled()
  })
})
