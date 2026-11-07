// @vitest-environment node
// The installer on a throwaway game folder: what it copies, what it leaves, what it refuses.
import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installTutorial } from './install-tutorial.mjs'

const made = []
function game() {
  const dir = mkdtempSync(join(tmpdir(), 'tutorial-install-'))
  made.push(dir)
  writeFileSync(join(dir, 'package.json'), '{ "name": "g" }')
  return dir
}
afterEach(() => { for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const quiet = () => {}

describe('install-tutorial', () => {
  it('copies the kit into src/tutorial/ — the code, not the tests — with a VERSION', () => {
    const dir = game()
    const { changed } = installTutorial(dir, { log: quiet })
    expect(changed).toEqual(expect.arrayContaining(['index.ts', 'runner.ts', 'lessonTypes.ts', 'patterns.ts', 'controlWords.ts', 'conformance.mjs']))
    expect(changed.some((f) => f.includes('.test.'))).toBe(false)
    expect(existsSync(join(dir, 'src/tutorial/runner.ts'))).toBe(true)
    const version = readFileSync(join(dir, 'src/tutorial/VERSION'), 'utf8')
    expect(version).toMatch(/^\d+\.\d+\.\d+ \(framework .+\)\n$/)
    expect(version.startsWith(readFileSync(new URL('../kit/VERSION', import.meta.url), 'utf8').trim())).toBe(true)
  })

  it('a dry run changes nothing; a second install is already up to date; a file the module dropped goes', () => {
    const dir = game()
    expect(installTutorial(dir, { dryRun: true, log: quiet }).changed.length).toBeGreaterThan(0)
    expect(existsSync(join(dir, 'src/tutorial'))).toBe(false)
    installTutorial(dir, { log: quiet })
    writeFileSync(join(dir, 'src/tutorial/old.ts'), '')
    const again = installTutorial(dir, { log: quiet })
    expect(again.changed).toEqual([])
    expect(again.removed).toEqual(['old.ts'])
    expect(existsSync(join(dir, 'src/tutorial/old.ts'))).toBe(false)
  })

  it('never touches a game\'s own src/tutorial/ (no VERSION) nor its lesson files', () => {
    const dir = game()
    mkdirSync(join(dir, 'src/tutorial'), { recursive: true })
    writeFileSync(join(dir, 'src/tutorial/mine.ts'), 'mine')
    const result = installTutorial(dir, { log: quiet })
    expect(result.refused).toContain('game\'s own files')
    expect(readFileSync(join(dir, 'src/tutorial/mine.ts'), 'utf8')).toBe('mine')
    const other = game()
    mkdirSync(join(other, 'content/lessons'), { recursive: true })
    writeFileSync(join(other, 'content/lessons/first.json'), '{"id":"first","steps":[]}')
    installTutorial(other, { log: quiet })
    expect(readFileSync(join(other, 'content/lessons/first.json'), 'utf8')).toBe('{"id":"first","steps":[]}')
  })
})
