import { defineConfig } from 'vitest/config'

// The rooms module has no app of its own here — only its tests. It runs inside each game
// (kit/ → the game's src/rooms/, and the game's party/server.ts uses src/rooms/server/).
export default defineConfig({
  test: { environment: 'jsdom', include: ['kit/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'] },
})
