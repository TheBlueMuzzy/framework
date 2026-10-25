// @vitest-environment node
import { EventEmitter } from 'node:events'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { changedMessage, watchCodeChanges } from './codeChanges.mjs'

const root = join('C:', 'kit')
const setup = () => { const watcher = new EventEmitter(); return { watcher, changes: watchCodeChanges(watcher, root) } }

describe('a code change during the shoot (F129)', () => {
  it('a run with no edits has nothing changed', () => {
    expect(setup().changes()).toEqual([])
  })

  it('an edit, a new file or a deleted file is named, relative to the kit', () => {
    const { watcher, changes } = setup()
    watcher.emit('change', join(root, 'kit', 'kit.css'))
    watcher.emit('add', join(root, 'gallery', 'New.tsx'))
    watcher.emit('unlink', join(root, 'gallery', 'Old.tsx'))
    watcher.emit('change', join(root, 'kit', 'kit.css'))
    expect(changes()).toEqual(['kit/kit.css', 'gallery/New.tsx', 'gallery/Old.tsx'])
  })

  it("the run's own screenshots don't count", () => {
    const { watcher, changes } = setup()
    watcher.emit('add', join(root, 'screenshots', 'screens', 'hud-clean-phone.png'))
    watcher.emit('change', join(root, 'screenshots', 'menu-desktop.png'))
    expect(changes()).toEqual([])
  })

  it('the message names the files and says to run it again', () => {
    expect(changedMessage(['kit/kit.css'])).toBe('✗ stopped: kit/kit.css changed during the run — the shots would mix two versions of the code. Run it again when nothing is being edited.')
    expect(changedMessage(['a', 'b', 'c', 'd', 'e'])).toContain('a, b, c and 2 more changed')
  })
})
