import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installAi } from './install-ai.mjs'

const quiet = () => {}

describe('install-ai', () => {
  it('copies the kit without its tests, stamps VERSION, and removes files the module no longer ships', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    mkdirSync(join(game, 'src/ai/kit'), { recursive: true })
    writeFileSync(join(game, 'src/ai/kit/old.ts'), '// gone from the kit')
    installAi(game, { log: quiet })
    expect(existsSync(join(game, 'src/ai/kit/brain.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/ai/kit/random.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/ai/kit/brain.test.ts'))).toBe(false)
    expect(existsSync(join(game, 'src/ai/kit/old.ts'))).toBe(false)
    expect(readFileSync(join(game, 'src/ai/kit/VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+ \(framework /)
  })

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    const { changed } = installAi(game, { dryRun: true, log: quiet })
    expect(changed).toContain('brain.ts')
    expect(existsSync(join(game, 'src/ai/kit'))).toBe(false)
  })
})
