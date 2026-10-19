import { defineConfig } from 'vitest/config'

// The Saves module has no app of its own here — only its tests. It runs inside each game (kit/ → the game's src/saves/).
export default defineConfig({
  test: { include: ['kit/**/*.test.{ts,mjs}', 'scripts/**/*.test.mjs'] },
})
