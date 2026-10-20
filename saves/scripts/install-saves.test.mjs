import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { boardWiringSteps, boardWranglerConfig, cloudWiringSteps, cloudWranglerConfig, installSaves } from './install-saves.mjs'

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
    writeFileSync(join(game, 'src/saves/VERSION'), '0.0.1 (framework abc)\n') // an earlier install of this module
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

  it('a game with its OWN src/saves/ (no VERSION — not ours) is refused in plain words, and nothing of it is touched', () => {
    const game = newGame()
    mkdirSync(join(game, 'src/saves'), { recursive: true })
    writeFileSync(join(game, 'src/saves/mySlots.ts'), '// the game\'s own')
    const lines = []
    const result = installSaves(game, { log: (l) => lines.push(l) })
    expect(result.refused).toContain('src/saves/ already holds the game\'s own files')
    expect(readFileSync(join(game, 'src/saves/mySlots.ts'), 'utf8')).toBe('// the game\'s own')
    expect(existsSync(join(game, 'src/saves/saves.ts'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
    expect(lines.join('\n')).toContain('src/saves/ already holds')
  })

  it('--cloud gives cloud/worker.ts + cloud/wrangler.json once, then prints only the missing wiring (going live = Muzzy\'s call)', () => {
    const game = newGame()
    writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'goops', devDependencies: {} }))
    installSaves(game, { log: quiet })
    expect(existsSync(join(game, 'cloud'))).toBe(false) // not without --cloud
    const lines = []
    const { starter } = installSaves(game, { cloud: true, log: (l) => lines.push(l) })
    expect(starter).toEqual(['cloud/worker.ts', 'cloud/wrangler.json'])
    expect(readFileSync(join(game, 'cloud/worker.ts'), 'utf8')).toContain('export class SaveCloud')
    expect(JSON.parse(readFileSync(join(game, 'cloud/wrangler.json'), 'utf8'))).toEqual(cloudWranglerConfig(game))
    expect(cloudWranglerConfig(game)).toMatchObject({
      name: 'goops-saves', main: 'worker.ts', migrations: [{ tag: 'v1', new_sqlite_classes: ['SaveCloud'] }], dev: { port: 1998 },
    })
    const said = lines.join('\n')
    expect(said).toContain('npm install -D wrangler')
    expect(said).toContain('"cloud:dev": "wrangler dev -c cloud/wrangler.json"')
    expect(said).toContain('cloudAddress(import.meta.env.VITE_SAVES_CLOUD)')
    expect(said).toContain('Going live (Muzzy\'s call')
    expect(said).toContain('goops-saves.joebrogno.workers.dev')

    // wired up → those steps go; the game's own edits to cloud/ are never overwritten; no --cloud needed any more
    writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'goops', devDependencies: { wrangler: '^4' },
      scripts: { 'cloud:dev': 'wrangler dev -c cloud/wrangler.json', 'cloud:deploy': 'wrangler deploy -c cloud/wrangler.json' } }))
    writeFileSync(join(game, '.gitignore'), 'node_modules\n.wrangler/\n')
    mkdirSync(join(game, 'src'), { recursive: true })
    writeFileSync(join(game, 'src/menus.tsx'), 'const cloud = { url: cloudAddress(import.meta.env.VITE_SAVES_CLOUD) }')
    expect(cloudWiringSteps(game).filter((w) => !w.done).map((w) => w.step.slice(0, 7))).toEqual(['Try it:', 'Going l'])
    writeFileSync(join(game, 'cloud/worker.ts'), '// mine')
    const again = installSaves(game, { log: quiet })
    expect(again.starter).toEqual([])
    expect(readFileSync(join(game, 'cloud/worker.ts'), 'utf8')).toBe('// mine')
  })

  it('--board gives board/worker.ts + board/wrangler.json once, ASKS for dailyTries, then prints only the missing wiring (F98)', () => {
    const game = newGame()
    writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'glyphtender', devDependencies: {} }))
    const lines = []
    const { starter } = installSaves(game, { board: true, log: (l) => lines.push(l) })
    expect(starter).toEqual(['content/saves.json', 'tests/saves/saves.test.ts', 'board/worker.ts', 'board/wrangler.json'])
    expect(readFileSync(join(game, 'board/worker.ts'), 'utf8')).toContain('export class DailyBoard')
    expect(boardWranglerConfig(game)).toMatchObject({
      name: 'glyphtender-board', main: 'worker.ts', migrations: [{ tag: 'v1', new_sqlite_classes: ['DailyBoard'] }], dev: { port: 1996 },
    })
    expect(JSON.parse(readFileSync(join(game, 'board/wrangler.json'), 'utf8'))).toEqual(boardWranglerConfig(game))
    const said = lines.join('\n')
    expect(said).toMatch(/Choose how many Daily games count per player per day for THIS game.*"dailyTries": 1.*1 = only the first.*0 = unlimited/s)
    expect(said).toContain('fill in THE GAME')
    expect(said).toContain('"board:dev": "wrangler dev -c board/wrangler.json"')
    expect(said).toContain('10 ms of CPU per request')
    expect(said).toContain('Going live (Muzzy\'s call')
    expect(said).toContain('glyphtender-board.joebrogno.workers.dev')

    // the saves.json is the game's own now: its number is the game's choice (an older one without "board" still asks)
    const missing = () => boardWiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    expect(missing()).not.toMatch(/dailyTries/)
    writeFileSync(join(game, 'content/saves.json'), JSON.stringify({ backups: 2 }))
    expect(missing()).toMatch(/dailyTries/)
    writeFileSync(join(game, 'content/saves.json'), JSON.stringify({ backups: 2, board: { dailyTries: 3 } }))
    expect(missing()).not.toMatch(/dailyTries/)

    // wired up → only Try it + Going live are left; the game's board/worker.ts is never overwritten; no --board needed any more
    writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'glyphtender', devDependencies: { wrangler: '^4' },
      scripts: { 'board:dev': 'wrangler dev -c board/wrangler.json', 'board:deploy': 'wrangler deploy -c board/wrangler.json' } }))
    writeFileSync(join(game, '.gitignore'), '.wrangler/\n')
    mkdirSync(join(game, 'src/game'), { recursive: true })
    writeFileSync(join(game, 'src/game/board.ts'), 'keepForBoard(record, day, board)')
    writeFileSync(join(game, 'src/menus.tsx'), 'dailyBoard: () => <BoardPanel board={board} />')
    writeFileSync(join(game, 'board/worker.ts'), '// mine: const game = { rulesVersion: RULES_VERSION }')
    expect(boardWiringSteps(game).filter((w) => !w.done).map((w) => w.step.slice(0, 7))).toEqual(['Try it:', 'Going l'])
    const again = installSaves(game, { log: quiet })
    expect(again.starter).toEqual([])
    expect(readFileSync(join(game, 'board/worker.ts'), 'utf8')).toContain('// mine')
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
