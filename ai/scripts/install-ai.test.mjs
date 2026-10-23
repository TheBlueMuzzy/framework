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
    expect(JSON.parse(readFileSync(join(game, 'content/ai/banter.json'), 'utf8'))).toMatchObject({ cooldownTurns: 2, alwaysAllowed: ['won', 'lost'] })
    expect(lines.join('\n')).toContain('"ai:arena": "node src/ai/kit/ai-arena.mjs"')
    expect(lines.join('\n')).toContain('src/ai/arenaGame.ts')
    // A game's own older arena script isn't the framework's: the step still shows, naming what it says now
    writeFileSync(join(game, 'package.json'), JSON.stringify({ scripts: { 'ai:arena': 'node scripts/ai-arena.mjs' } }))
    const old = []
    installAi(game, { log: (l) => old.push(l) })
    expect(old.join('\n')).toContain('it says "node scripts/ai-arena.mjs" now')
    // The game's own numbers are kept; once wired, the steps go quiet
    writeFileSync(join(game, 'content/ai/arena.json'), '{ "games": 12 }')
    writeFileSync(join(game, 'package.json'), JSON.stringify({ scripts: { 'ai:arena': 'node src/ai/kit/ai-arena.mjs' } }))
    writeFileSync(join(game, 'src/ai/arenaGame.ts'), 'export default async () => ({})')
    const again = []
    const second = installAi(game, { log: (l) => again.push(l) })
    expect(readFileSync(join(game, 'content/ai/arena.json'), 'utf8')).toBe('{ "games": 12 }')
    expect(second).toMatchObject({ changed: [], removed: [], starter: [] })
    expect(again.join('\n')).not.toContain('Still to wire')
    // 0.6.0: "What wins?" is offered (optional) until the arena plug names its situations
    expect(again.join('\n')).toContain('Optional: "What wins?": name the game\'s situations')
    writeFileSync(join(game, 'src/ai/arenaGame.ts'), 'export const plug = { situations: (state, seat) => ({ lead: 1 }) }')
    const named = []
    installAi(game, { log: (l) => named.push(l) })
    expect(named.join('\n')).not.toContain('What wins?')
    // A personality that talks asks for the banter wiring until botBanter is in the game's code
    writeFileSync(join(game, 'content/ai/personalities.json'), JSON.stringify({ personalities: [{ id: 'Bully', chattiness: 60 }, { id: 'Mute', chattiness: 0 }] }))
    const chat = []
    installAi(game, { log: (l) => chat.push(l) })
    expect(chat.join('\n')).toContain('the bots talk (Bully has chattiness > 0)')
    mkdirSync(join(game, 'src/game'), { recursive: true })
    writeFileSync(join(game, 'src/game/bots.ts'), 'const banter = botBanter<GameEvent>(options)')
    const talking = []
    installAi(game, { log: (l) => talking.push(l) })
    expect(talking.join('\n')).not.toContain('the bots talk (')
    // 0.5.0: then the "Bot chatter" Settings row and its wiring, until they're there
    expect(talking.join('\n')).toContain('BANTER_SETTINGS_ROWS')
    expect(talking.join('\n')).toContain('applyBanterSetting(banter, values)')
    mkdirSync(join(game, 'content/ui'), { recursive: true })
    writeFileSync(join(game, 'content/ui/settings.json'), JSON.stringify({ tabs: [{ id: 'game', label: 'Game', rows: [{ id: 'botChatter', type: 'selector', label: 'Bot chatter', options: ['Off', 'Some', 'Lots'], default: 'Some' }] }] }))
    writeFileSync(join(game, 'src/game/settings.ts'), 'applyBanterSetting(banter, values)')
    const wired = []
    installAi(game, { log: (l) => wired.push(l) })
    expect(wired.join('\n')).not.toContain('Still to wire')
  })

  it('with the saves module: the banter save\'s golden copy once, and the createSave step until it\'s made', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'mygame', scripts: {} }))
    mkdirSync(join(game, 'src/saves'), { recursive: true })
    writeFileSync(join(game, 'src/saves/VERSION'), '0.9.0')
    mkdirSync(join(game, 'content/ai'), { recursive: true })
    writeFileSync(join(game, 'content/ai/personalities.json'), JSON.stringify({ personalities: [{ id: 'Bully', chattiness: 60 }] }))
    const lines = []
    installAi(game, { log: (l) => lines.push(l) })
    const golden = JSON.parse(readFileSync(join(game, 'tests/saves/mygame_banter-v1.json'), 'utf8'))
    expect(golden).toMatchObject({ stored: { save: 'mygame:banter', version: 1, data: { chatter: 'lots' } }, expect: { chatter: 'lots' } })
    expect(lines.join('\n')).toContain("createSave({ ...BANTER_SAVE, key: 'mygame:banter', version: 1 })")
    writeFileSync(join(game, 'tests/saves/mygame_banter-v1.json'), '{ "mine": true }')
    mkdirSync(join(game, 'src/game'), { recursive: true })
    writeFileSync(join(game, 'src/game/saves.ts'), 'export const banterSave = createSave({ ...BANTER_SAVE, key: "mygame:banter", version: 1 })')
    const again = []
    installAi(game, { log: (l) => again.push(l) })
    expect(readFileSync(join(game, 'tests/saves/mygame_banter-v1.json'), 'utf8')).toBe('{ "mine": true }') // the game's now
    expect(again.join('\n')).not.toContain('BANTER_SAVE')
  })

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'ai-game-'))
    const { changed } = installAi(game, { dryRun: true, log: quiet })
    expect(changed).toContain('brain.ts')
    expect(existsSync(join(game, 'src/ai/kit'))).toBe(false)
  })
})
