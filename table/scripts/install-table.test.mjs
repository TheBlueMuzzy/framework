import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installTable } from './install-table.mjs'

const quiet = () => {}

describe('install-table', () => {
  it('copies the kit without its tests, stamps VERSION, and removes files the module no longer ships', () => {
    const game = mkdtempSync(join(tmpdir(), 'table-game-'))
    mkdirSync(join(game, 'src/table'), { recursive: true })
    writeFileSync(join(game, 'src/table/old.ts'), '// gone from the kit')
    installTable(game, { log: quiet })
    expect(existsSync(join(game, 'src/table/core.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/table/selfTest.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/table/core.test.ts'))).toBe(false)
    expect(existsSync(join(game, 'src/table/old.ts'))).toBe(false)
    expect(readFileSync(join(game, 'src/table/VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+ \(framework /)
  })

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'table-game-'))
    const { changed } = installTable(game, { dryRun: true, log: quiet })
    expect(changed).toContain('core.ts')
    expect(existsSync(join(game, 'src/table'))).toBe(false)
  })
})
