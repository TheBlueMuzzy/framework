import { defineConfig } from 'vitest/config'

// The Emotes module has no app of its own here — only its tests. It runs inside each game (kit/ → the game's src/emotes/).
export default defineConfig({
  resolve: {
    // The bubble glue's test draws UI kit parts from ../ui-kit: they must use THIS folder's React (one React only).
    dedupe: ['react', 'react-dom'],
  },
  test: { include: ['kit/**/*.test.{ts,tsx,mjs}', 'scripts/**/*.test.mjs'] },
})
