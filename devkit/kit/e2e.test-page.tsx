// The page kit/e2e.test.mjs opens (e2e.test-page.html): mounts the REAL Dev Kit, ?late=<ms> after the page loaded
// (a busy PC's slow arrival). Its game tabs are e2e.test-tabs.tsx (the test's Vite server aliases ../devkit-game/tabs).
// (".test" in the name: install-devkit leaves it out of games.)
import { mountDevKit } from './mount'

const late = Number(new URLSearchParams(location.search).get('late') ?? 0)
setTimeout(mountDevKit, late)
