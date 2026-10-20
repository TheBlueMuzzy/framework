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
})
