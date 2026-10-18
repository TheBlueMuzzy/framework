import { defineConfig } from 'vitest/config'

// The AI module has no app of its own here — only its tests. It runs inside each game (kit/ → the game's src/ai/kit/).
export default defineConfig({
  test: { include: ['kit/**/*.test.{ts,mjs}', 'scripts/**/*.test.mjs'] },
})
