// Tests for the rooms install/update tool, run against a throwaway game folder.
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installRooms, partykitConfig, wiringSteps } from './install-rooms.mjs'

const roomsDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
const quiet = () => {}
let game

beforeEach(() => {
  game = mkdtempSync(join(tmpdir(), 'rooms-install-'))
  write(join(game, 'package.json'), JSON.stringify({ name: 'my-game' }))
})
afterEach(() => rmSync(game, { recursive: true, force: true }))

describe('install-rooms', () => {
  it('fresh install: copies the kit (no tests) with a VERSION stamp and makes the starter files', () => {
    installRooms(game, { log: quiet })
    const kit = join(game, 'src/rooms')
    for (const file of ['protocol.ts', 'roomCodes.ts', 'identity.ts', 'roomClient.ts', 'useRoom.ts', 'server/roomServer.ts', 'server/seats.ts', 'server/timers.ts', 'server/checks.ts', 'server/gameRules.ts', 'server/settings.ts']) {
      expect(existsSync(join(kit, file)), file).toBe(true)
    }
    expect(existsSync(join(kit, 'useRoom.test.tsx'))).toBe(false)
    expect(existsSync(join(kit, 'server/seats.test.ts'))).toBe(false)
    expect(readFileSync(join(kit, 'VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+\ncommit /)
    expect(readFileSync(join(game, 'party/server.ts'), 'utf8')).toContain("from '../src/rooms/server/roomServer'")
    expect(existsSync(join(game, 'party/rules.ts'))).toBe(true)
    expect(readJson(join(game, 'content/rooms.json')).idleTakeoverAfterMs).toBe(60000)
    expect(readJson(join(game, 'partykit.json'))).toEqual({ name: 'my-game', main: 'party/server.ts', compatibilityDate: '2024-12-01', port: 1999 })
  })

  it('never overwrites the game\'s own files; an existing server keeps its own rules (no example added)', () => {
    write(join(game, 'party/server.ts'), '// mine')
    write(join(game, 'content/rooms.json'), '{ "maxSeats": 6 }')
    write(join(game, 'partykit.json'), '{ "name": "custom" }')
    installRooms(game, { log: quiet })
    expect(readFileSync(join(game, 'party/server.ts'), 'utf8')).toBe('// mine')
    expect(existsSync(join(game, 'party/rules.ts'))).toBe(false)
    expect(readFileSync(join(game, 'content/rooms.json'), 'utf8')).toBe('{ "maxSeats": 6 }')
    expect(readJson(join(game, 'partykit.json')).name).toBe('custom')
  })

  it('a game on wrangler (PartyServer on Cloudflare) gets no partykit.json', () => {
    write(join(game, 'wrangler.json'), '{ "name": "my-game" }')
    installRooms(game, { log: quiet })
    expect(existsSync(join(game, 'partykit.json'))).toBe(false)
  })

  it('update: replaces edited kit files, removes dropped ones, lists them', () => {
    installRooms(game, { log: quiet })
    writeFileSync(join(game, 'src/rooms/roomCodes.ts'), '// edited')
    write(join(game, 'src/rooms/server/oldThing.ts'), '')
    const lines = []
    const result = installRooms(game, { log: (line) => lines.push(line) })
    expect(result.plan.changed).toEqual(['roomCodes.ts'])
    expect(result.plan.removed).toEqual(['server/oldThing.ts'])
    expect(existsSync(join(game, 'src/rooms/server/oldThing.ts'))).toBe(false)
    expect(readFileSync(join(game, 'src/rooms/roomCodes.ts'), 'utf8')).not.toBe('// edited')
    expect(lines.join('\n')).toMatch(/changed {2}src\/rooms\/roomCodes\.ts/)
  })

  it('dry run changes nothing but still lists the steps', () => {
    const lines = []
    installRooms(game, { dryRun: true, log: (line) => lines.push(line) })
    expect(existsSync(join(game, 'src'))).toBe(false)
    expect(existsSync(join(game, 'party'))).toBe(false)
    expect(existsSync(join(game, 'partykit.json'))).toBe(false)
    expect(lines.join('\n')).toMatch(/npm install partysocket/)
  })

  it('never deletes anything outside src/rooms', () => {
    write(join(game, 'src/App.tsx'), 'app')
    write(join(game, 'party/extra.ts'), 'extra')
    installRooms(game, { log: quiet })
    installRooms(game, { log: quiet })
    expect(readFileSync(join(game, 'src/App.tsx'), 'utf8')).toBe('app')
    expect(readFileSync(join(game, 'party/extra.ts'), 'utf8')).toBe('extra')
  })

  it('wiring steps: only the missing ones', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    expect(missing()).toMatch(/npm install partysocket/)
    expect(missing()).toMatch(/"party:dev": "partykit dev"/)
    expect(missing()).toMatch(/\.partykit\//)
    write(join(game, 'package.json'), JSON.stringify({
      name: 'my-game',
      dependencies: { partysocket: '^1.1.16' },
      devDependencies: { partykit: '^0.0.115' },
      scripts: { 'party:dev': 'partykit dev', 'party:deploy': 'partykit deploy' },
    }))
    write(join(game, '.gitignore'), 'node_modules/\n.partykit/\n')
    write(join(game, 'tsconfig.app.json'), '{ "include": ["src", "party"] }')
    expect(missing()).not.toMatch(/npm install|party:dev"|\.partykit\/|tsconfig/)
    write(join(game, '.env'), 'VITE_PARTY_HOST=localhost:1999\n')
    expect(missing()).toMatch(/\.env: remove VITE_PARTY_HOST/)
    expect(missing()).toMatch(/VITE_PARTY_HOST=my-game\./) // going live
  })

  it('partykit.json name comes from package.json', () => {
    expect(partykitConfig(game).name).toBe('my-game')
  })

  it('a fresh install type-checks (kit + starter server + example rules) with a game-style tsconfig', () => {
    installRooms(game, { log: quiet })
    symlinkSync(join(roomsDir, 'node_modules'), join(game, 'node_modules'), 'junction')
    write(join(game, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler',
        types: ['vite/client'], jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: true, resolveJsonModule: true,
        allowImportingTsExtensions: true, verbatimModuleSyntax: true, erasableSyntaxOnly: true, noUnusedLocals: true, noUnusedParameters: true,
      },
      include: ['src', 'party'],
    }))
    const tsc = join(roomsDir, 'node_modules', 'typescript', 'bin', 'tsc')
    expect(() => execSync(`node "${tsc}" -p .`, { cwd: game, stdio: 'pipe' })).not.toThrow()
  }, 30_000)
})
