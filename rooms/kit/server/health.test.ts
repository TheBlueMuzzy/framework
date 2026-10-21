import { describe, expect, it } from 'vitest'
import { HEALTH_PATH, healthResponse } from './health'

describe('health check', () => {
  it('answers /health with ok, never cached', async () => {
    const response = healthResponse(new Request(`https://game.example.workers.dev${HEALTH_PATH}`))
    expect(response?.status).toBe(200)
    expect(response?.headers.get('cache-control')).toBe('no-store')
    expect(await response?.json()).toEqual({ ok: true })
  })

  it('names the version when the game passes one', async () => {
    const response = healthResponse(new Request('https://x.dev/health'), '1.2.3')
    expect(await response?.json()).toEqual({ ok: true, version: '1.2.3' })
  })

  it('leaves every other address to the worker (rooms, /health/x, /healthy)', () => {
    for (const path of ['/parties/main/ABCD', '/health/x', '/healthy', '/']) {
      expect(healthResponse(new Request(`https://x.dev${path}`)), path).toBeNull()
    }
  })

  it('only reads (GET / HEAD)', () => {
    expect(healthResponse(new Request('https://x.dev/health', { method: 'HEAD' }))?.status).toBe(200)
    expect(healthResponse(new Request('https://x.dev/health', { method: 'POST' }))?.status).toBe(405)
  })
})
