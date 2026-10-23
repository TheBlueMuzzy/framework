import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The Crashes module has no app of its own here — only its tests. It runs inside each game (kit/ → the game's src/crashes/).
// The worker template imports the kit the way it will sit in a game ('../src/crashes/…'); in the tests that's kit/.
export default defineConfig({
  resolve: {
    // The crash screen's test draws UI kit parts from ../ui-kit: they must use THIS folder's React (one React only).
    dedupe: ['react', 'react-dom'],
    alias: [{ find: /^\.\.\/src\/crashes\/(.*)$/, replacement: `${fileURLToPath(new URL('./kit/', import.meta.url))}$1` }],
  },
  test: { include: ['kit/**/*.test.{ts,tsx,mjs}', 'ui/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'templates/**/*.test.ts'] },
})
