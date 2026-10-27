// WHICH VERSION OF A MODULE IS THIS? — the one place an installer asks git (F159).
// Every installer prints "<module> <version> (<commit>)" into the game, so a game always says which framework copy it
// took. Before F159 each of the 11 installers had its own copy of this; asking git on every install was slow under
// check:fast's load (fixed twice, F128 and F90), so it lives here once, remembered per module folder.
//   import { kitVersion } from '../../scripts/kitVersion.mjs'
//   const { version, commit } = kitVersion(moduleDir, { watch: ['kit', 'scripts'] })
//     version = what <moduleDir>/kit/VERSION says
//     commit  = the short commit, + " + uncommitted changes" when a watched folder has edits; 'no git' outside a repo
// watch = the module's folders whose edits count (each module keeps its own list: kit · kit scripts · kit templates ·
// kit vite devkit-game).
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Runs one git command in a folder and gives back what it printed (throws outside a git folder)
function runGit(command, cwd) {
  return execSync(command, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
}

// Answers already worked out this run: "<folder>|<watched folders>" → { version, commit }
const remembered = new Map()

// run = who asks git — the tests hand in their own to count the calls
export function kitVersion(moduleDir, { watch = ['kit'], run = runGit } = {}) {
  const key = `${resolve(moduleDir)}|${watch.join(' ')}`
  if (!remembered.has(key)) remembered.set(key, readKitVersion(moduleDir, watch, run))
  return remembered.get(key)
}

function readKitVersion(moduleDir, watch, run) {
  const version = readFileSync(join(moduleDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = run('git rev-parse --short HEAD', moduleDir)
    if (run(`git status --porcelain ${watch.join(' ')}`, moduleDir)) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}
