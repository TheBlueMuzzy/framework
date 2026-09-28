// RULE CHECKER for the framework: the rules live in kit/check-ui.mjs (it ships inside the kit,
// so games check their own UI code with it). This just checks the kit + gallery by default.
// Usage: npm run check-ui   or   node scripts/check-ui.mjs [folders…]
import { pathToFileURL } from 'node:url'
import { checkFolders } from '../kit/check-ui.mjs'

export { checkSource } from '../kit/check-ui.mjs'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const folders = process.argv.slice(2).length ? process.argv.slice(2) : ['kit', 'gallery']
  process.exit(checkFolders(folders) ? 1 : 0)
}
