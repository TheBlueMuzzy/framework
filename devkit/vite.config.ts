import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// The Dev Kit has no app of its own here — only its tests. It runs inside each game.
export default defineConfig({
  plugins: [react()],
  // In a game the Dev Kit's Vite plugin makes this module (vite/devkitVite.ts, step 6); here: no extra tuning files
  resolve: { alias: { 'virtual:devkit-tuning-files': fileURLToPath(new URL('./kit/tuning/tuningFiles.test-stub.ts', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['kit/**/*.test.{ts,tsx,mjs}', 'vite/**/*.test.ts', 'scripts/**/*.test.mjs'] },
})
