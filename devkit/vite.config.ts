import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The Dev Kit has no app of its own here — only its tests. It runs inside each game.
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', include: ['kit/**/*.test.{ts,tsx,mjs}', 'vite/**/*.test.ts', 'scripts/**/*.test.mjs'] },
})
