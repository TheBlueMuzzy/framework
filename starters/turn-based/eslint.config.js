import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import bmuz from './src/lint/rules.mjs' // bmuz lint (F90)

export default defineConfig([
  globalIgnores(['dist', 'e2e-shots', '.claude', '.wrangler', 'src/table', 'src/devkit', 'vite-plugins/devkit', 'src/ui/kit', 'src/version', 'src/saves', 'src/crashes', 'src/audio', 'src/ai/kit', 'src/emotes', 'src/rooms', 'src/lint']), // install-module adds each framework module's folders here (they're linted in the framework)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Node scripts (checks, e2e)
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // bmuz lint (F90, install-lint): settings live in content/ (the Dev Kit and Obsidian edit them there), and React state
    // is never set every frame in useFrame. A real constant says why on its line: // tuning-ok: <why>
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/devkit-game/**', '**/*.test.*'],
    plugins: { bmuz },
    rules: { 'bmuz/no-state-in-frame': 'error', 'bmuz/no-tuning-numbers': 'error' },
  },
])
