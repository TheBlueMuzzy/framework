// CODE CHANGES DURING A RUN — the shoot's Vite server reloads screens when a file changes, so a run that saw an edit
// would mix shots of two versions of the code (F129, 0.33.3). This keeps the list of what changed; shoot.mjs stops
// at the next shot when it isn't empty.
import { relative, sep } from 'node:path'

// What the run itself writes (its own screenshots) — never counted as a code change
export const RUN_OUTPUT = ['screenshots']

/** Listen to a Vite server's file watcher; returns () => the changed files so far (relative to root, / separators). */
export function watchCodeChanges(watcher, root, { ignore = RUN_OUTPUT } = {}) {
  const changed = new Set()
  const note = (file) => {
    const path = relative(root, file).split(sep).join('/')
    if (ignore.some((dir) => path === dir || path.startsWith(`${dir}/`))) return
    changed.add(path)
  }
  for (const event of ['change', 'add', 'unlink']) watcher.on(event, note)
  return () => [...changed]
}

/** The plain-English line for a run stopped by an edit. */
export function changedMessage(files) {
  const names = files.slice(0, 3).join(', ') + (files.length > 3 ? ` and ${files.length - 3} more` : '')
  return `✗ stopped: ${names} changed during the run — the shots would mix two versions of the code. Run it again when nothing is being edited.`
}
