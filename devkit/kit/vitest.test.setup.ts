// The framework's own Dev Kit tests (vite.config.ts setupFiles — not copied into games): each test starts with no
// text edits in memory (text/textStore.ts is shared by the Text and Lessons tabs and outlives a tab, like a page).
import { afterEach } from 'vitest'
import { resetTextStore } from './text/textStore'

afterEach(() => resetTextStore())
