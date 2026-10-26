/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devkit } from './vite-plugins/devkit/devkitVite'
import { versionPlugin } from './src/version/vitePlugin.mjs'
import { crashesMaps } from './src/crashes/vitePlugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    devkit(), // the Dev Kit: live content/tuning, the release switch, Save (dev server only)
    versionPlugin(), // version.json → import.meta.env.APP_VERSION + <meta name="app-version">
    crashesMaps(), // hidden source maps → releases/<version>/maps/ (players never download them)
  ],
  // Bundled up front, so the first visit to online play never reloads the page mid-test ("new dependencies optimized")
  optimizeDeps: { include: ['partysocket', 'react', 'react-dom/client'] },
  test: {
    // Helpers' git worktrees live in .claude/worktrees — never run their copies of the tests
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  server: {
    host: true, // on the local network too, for phone testing
    port: 6173,
  },
})
