// RULE CHECKER for the framework: the rules live in kit/check-ui.mjs (it ships inside the kit,
// so games check their own UI code with it). This just checks the kit + gallery by default.
// Usage: npm run check-ui   or   node scripts/check-ui.mjs [folders…] [--css folders…]
// (npm run check-ui also warns if the gallery's CSS restyles kit parts, the way a game would run it.)
import { pathToFileURL } from 'node:url'
import { checkFolders, readArguments } from '../kit/check-ui.mjs'

export { checkSource, findKitRestyles, readArguments } from '../kit/check-ui.mjs'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { folders, cssFolders } = readArguments(process.argv.slice(2))
  process.exit(checkFolders(folders.length ? folders : ['kit', 'gallery'], cssFolders) ? 1 : 0)
}
