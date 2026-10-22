import { defineConfig } from 'vitest/config'

// The Crashes module has no app of its own here — only its tests. It runs inside each game (kit/ → the game's src/crashes/).
export default defineConfig({
  test: { include: ['kit/**/*.test.{ts,tsx,mjs}', 'ui/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'templates/**/*.test.ts'] },
})
