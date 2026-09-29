// Runs in the framework (not copied into games): the release check's small helpers.
// The check itself is proven by running it in a game (npm run check:devkit).
import { describe, expect, it } from 'vitest'
import { baseFromIndexHtml, readArgs } from './check-devkit.mjs'

describe('check-devkit', () => {
  it('reads the web path from the build', () => {
    expect(baseFromIndexHtml('<script type="module" src="/roll-better/assets/index-abc.js">')).toBe('/roll-better/')
    expect(baseFromIndexHtml('<link rel="stylesheet" href="/assets/index.css">')).toBe('/')
    expect(baseFromIndexHtml('<script src="./assets/index.js">')).toBe('/')
    expect(baseFromIndexHtml('<p>no assets</p>')).toBe('/')
  })
  it('reads --port and --base, with 5198 as the default port', () => {
    expect(readArgs([])).toEqual({ port: 5198, base: undefined })
    expect(readArgs(['--port', '6001', '--base', 'my-game'])).toEqual({ port: 6001, base: '/my-game/' })
    expect(readArgs(['--base', '/my-game/'])).toEqual({ port: 5198, base: '/my-game/' })
    expect(() => readArgs(['--port', 'x'])).toThrow(/--port/)
  })
})
