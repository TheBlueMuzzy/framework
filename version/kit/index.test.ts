// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

describe('appVersion / versionLabel', () => {
  it('"dev" when the build baked nothing in (no versionPlugin) — never a made-up number', async () => {
    vi.resetModules()
    const { appVersion, versionLabel } = await import('./index')
    expect(appVersion).toBe('dev')
    expect(versionLabel).toBe('dev')
  })

  it('vX.Y.Z.B from what versionPlugin baked in', async () => {
    vi.resetModules()
    vi.stubEnv('APP_VERSION', '0.11.0.4')
    const { appVersion, versionLabel } = await import('./index')
    expect(appVersion).toBe('0.11.0.4')
    expect(versionLabel).toBe('v0.11.0.4')
    vi.unstubAllEnvs()
  })

  // F204: the screenshot check's ?freeze-version holds the label still, so a new build number doesn't redden the pictures
  const withAddress = async (search: string, dev: boolean) => {
    vi.resetModules()
    vi.stubEnv('APP_VERSION', '0.11.0.4')
    vi.stubEnv('DEV', dev)
    vi.stubGlobal('window', { location: { search } })
    const mod = await import('./index')
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    return mod
  }

  it('?freeze-version on the dev server → every place shows v0.0.0.0; appVersion stays the real one', async () => {
    const { appVersion, versionLabel, FROZEN_LABEL } = await withAddress('?seed=7&freeze-version', true)
    expect(versionLabel).toBe(FROZEN_LABEL)
    expect(FROZEN_LABEL).toBe('v0.0.0.0')
    expect(appVersion).toBe('0.11.0.4')
  })

  it('a release build ignores ?freeze-version — players always see the real version', async () => {
    const { versionLabel } = await withAddress('?freeze-version', false)
    expect(versionLabel).toBe('v0.11.0.4')
  })

  it('the dev server without the switch shows the real version', async () => {
    const { versionLabel } = await withAddress('?seed=7', true)
    expect(versionLabel).toBe('v0.11.0.4')
  })
})
