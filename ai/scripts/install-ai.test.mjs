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

  it('ships the arena: the PC command next to the kit, content/ai/arena.json once, and only the missing steps', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    writeFileSync(join(game, 'package.json'), JSON.stringify({ scripts: {} }))
    const lines = []
    installAi(game, { log: (l) => lines.push(l) })
    expect(existsSync(join(game, 'src/ai/kit/arena.ts'))).toBe(true)
    expect(readFileSync(join(game, 'src/ai/kit/ai-arena.mjs'), 'utf8')).toBe(readFileSync(new URL('./ai-arena.mjs', import.meta.url), 'utf8'))
    expect(JSON.parse(readFileSync(join(game, 'content/ai/arena.json'), 'utf8'))).toMatchObject({ games: 60, minSeats: 2, maxSeats: 4, seed: 1000 })
    expect(lines.join('\n')).toContain('"ai:arena": "node src/ai/kit/ai-arena.mjs"')
    expect(lines.join('\n')).toContain('src/ai/arenaGame.ts')
    // The game's own numbers are kept; once wired, the steps go quiet
    writeFileSync(join(game, 'content/ai/arena.json'), '{ "games": 12 }')
    writeFileSync(join(game, 'package.json'), JSON.stringify({ scripts: { 'ai:arena': 'node src/ai/kit/ai-arena.mjs' } }))
    writeFileSync(join(game, 'src/ai/arenaGame.ts'), 'export default async () => ({})')
    const again = []
    const second = installAi(game, { log: (l) => again.push(l) })
    expect(readFileSync(join(game, 'content/ai/arena.json'), 'utf8')).toBe('{ "games": 12 }')
    expect(second).toMatchObject({ changed: [], removed: [], starter: [] })
    expect(again.join('\n')).not.toContain('Still to wire')
  })

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    const { changed } = installAi(game, { dryRun: true, log: quiet })
    expect(changed).toContain('brain.ts')
    expect(existsSync(join(game, 'src/ai/kit'))).toBe(false)
  })
})
