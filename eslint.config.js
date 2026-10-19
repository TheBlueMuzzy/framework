// The ONE lint setup for every framework module (devkit, ui-kit, audio, table, ai, rooms).
// Why it lives here: games ignore their kit folders (src/ui/kit, src/audio, ...) on purpose,
// so before this file framework code was never linted anywhere (Dev Kit 0.8.0's errors only
// showed up inside Glyphtender).
//
// How it's run:
//   - in a module folder:  npm run lint   (each module's script is `eslint .`; ESLint walks up
//     and finds this file, npm finds eslint in ../node_modules/.bin)
//   - here at the root:    npm run lint   (every module at once)
// Needs `npm install` once in this folder (the devDependencies live only here, not in six copies).
//
// Rules are the same as the games' (copied from Glyphtender's eslint.config.js), with one change:
//   react-refresh/only-export-components is OFF. That rule exists so Vite's hot reload can swap a
//   component file in place; it complains when a file exports a component AND a hook/constant.
//   Kit files are library code that deliberately ship a component with its hooks and helpers
//   (e.g. a part + its useX hook), and they are reloaded as copies inside a game anyway.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/node_modules',
    '**/screenshots',
    '**/e2e-shots',
    '.claude', // helpers' worktrees
    '.planning',
    '**/spike', // throwaway experiments (like a game's sketches/) — not shipped code
  ]),
  {
    // Kit, gallery, templates, vite plugins — TypeScript + React
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Installers and helper scripts — plain Node JavaScript
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
