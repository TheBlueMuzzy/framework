import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installSaves } from './install-saves.mjs'

const quiet = () => {}
const newGame = ({ uiKit = false } = {}) => {
  const game = mkdtempSync(join(tmpdir(), 'saves-game-'))
  if (uiKit) { mkdirSync(join(game, 'src/ui/kit'), { recursive: true }); writeFileSync(join(game, 'src/ui/kit/VERSION'), '0.20.1') }
  return game
}

describe('install-saves', () => {
  it('copies the kit without its tests, stamps VERSION, and removes files the module no longer ships', () => {
    const game = newGame()
    mkdirSync(join(game, 'src/saves'), { recursive: true })
    writeFileSync(join(game, 'src/saves/old.ts'), '// gone from the kit')
    installSaves(game, { log: quiet })
    expect(existsSync(join(game, 'src/saves/saves.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/saves/oldSaves.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/saves/conformance.mjs'))).toBe(true)
    expect(existsSync(join(game, 'src/saves/saves.test.ts'))).toBe(false)
    expect(existsSync(join(game, 'src/saves/conformance.test.mjs'))).toBe(false)
    expect(existsSync(join(game, 'src/saves/old.ts'))).toBe(false)
    expect(readFileSync(join(game, 'src/saves/VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+ \(framework /)
  })

  it('the Save code screen (ui/) only goes into a game with the UI kit — and leaves if the UI kit does', () => {
    const plain = newGame()
    const { changed } = installSaves(plain, { log: quiet })
    expect(changed.some((f) => f.startsWith('ui/'))).toBe(false)
    expect(existsSync(join(plain, 'src/saves/ui'))).toBe(false)
    const withKit = newGame({ uiKit: true })
    installSaves(withKit, { log: quiet })
    expect(existsSync(join(withKit, 'src/saves/ui/SaveCodePanel.tsx'))).toBe(true)
    rmSync(join(withKit, 'src/ui/kit'), { recursive: true }) // the game dropped the UI kit
    const { removed } = installSaves(withKit, { log: quiet })
    expect(removed).toContain('ui/SaveCodePanel.tsx')
    expect(existsSync(join(withKit, 'src/saves/ui'))).toBe(false)
  })

  it('gives starter content/saves.json and tests/saves/saves.test.ts once, and never overwrites the game\'s own', () => {
    const game = newGame()
    installSaves(game, { log: quiet })
    expect(JSON.parse(readFileSync(join(game, 'content/saves.json'), 'utf8')).backups).toBe(2)
    expect(readFileSync(join(game, 'tests/saves/saves.test.ts'), 'utf8')).toContain('const SAVES')
    writeFileSync(join(game, 'content/saves.json'), '{ "backups": 3 }')
    writeFileSync(join(game, 'tests/saves/saves.test.ts'), '// mine')
    const { starter } = installSaves(game, { log: quiet })
    expect(starter).toEqual([])
    expect(readFileSync(join(game, 'content/saves.json'), 'utf8')).toBe('{ "backups": 3 }')
    expect(readFileSync(join(game, 'tests/saves/saves.test.ts'), 'utf8')).toBe('// mine')
  })

  it('a dry run changes nothing', () => {
    const game = newGame()
    const { changed, starter } = installSaves(game, { dryRun: true, log: quiet })
    expect(changed).toContain('saves.ts')
    expect(starter).toEqual(['content/saves.json', 'tests/saves/saves.test.ts'])
    expect(existsSync(join(game, 'src/saves'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
  })
})
