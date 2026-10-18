import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The gallery app lives in gallery/. Port 5180 is this project's dev port.
export default defineConfig({
  root: 'gallery',
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  build: { outDir: '../dist', emptyOutDir: true },
  test: { root: '.', environment: 'jsdom', include: ['kit/**/*.test.ts?(x)', 'kit/**/*.test.mjs', 'scripts/**/*.test.mjs'] },
})
