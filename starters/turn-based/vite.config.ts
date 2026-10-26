/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
  ],
  test: {
    // Helpers' git worktrees live in .claude/worktrees — never run their copies of the tests
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  server: {
    host: true, // on the local network too, for phone testing
    port: 6173,
  },
})
