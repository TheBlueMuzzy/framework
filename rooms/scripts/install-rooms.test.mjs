// Tests for the rooms install/update tool, run against a throwaway game folder.
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installRooms, wiringSteps, wranglerConfig } from './install-rooms.mjs'

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
    for (const file of ['protocol.ts', 'roomCodes.ts', 'identity.ts', 'roomClient.ts', 'useRoom.ts', 'server/roomServer.ts', 'server/liveConnections.ts', 'server/seats.ts', 'server/timers.ts', 'server/checks.ts', 'server/gameRules.ts', 'server/settings.ts']) {
      expect(existsSync(join(kit, file)), file).toBe(true)
    }
    expect(existsSync(join(kit, 'useRoom.test.tsx'))).toBe(false)
    expect(existsSync(join(kit, 'server/seats.test.ts'))).toBe(false)
    expect(readFileSync(join(kit, 'VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+\ncommit /)
    expect(readFileSync(join(game, 'party/server.ts'), 'utf8')).toContain("from '../src/rooms/server/roomServer'")
    expect(existsSync(join(game, 'party/rules.ts'))).toBe(true)
    expect(readJson(join(game, 'content/rooms.json')).idleTakeoverAfterMs).toBe(60000)
    expect(readFileSync(join(game, 'party/worker.ts'), 'utf8')).toContain("from '../src/rooms/server/liveConnections'")
    const wrangler = readJson(join(game, 'wrangler.json'))
    expect(wrangler).toMatchObject({ name: 'my-game', main: 'party/worker.ts', dev: { port: 1999, ip: '0.0.0.0' } })
    expect(wrangler.durable_objects.bindings).toEqual([{ name: 'Main', class_name: 'Main' }])
    expect(wrangler.migrations).toEqual([{ tag: 'v1', new_sqlite_classes: ['Main'] }])
    expect(existsSync(join(game, 'partykit.json'))).toBe(false)
  })

  it('never overwrites the game\'s own files; an existing server keeps its own rules (no example added)', () => {
    write(join(game, 'party/server.ts'), '// mine')
    write(join(game, 'content/rooms.json'), '{ "maxSeats": 6 }')
    write(join(game, 'party/worker.ts'), '// my worker')
    write(join(game, 'wrangler.json'), '{ "name": "custom" }')
    installRooms(game, { log: quiet })
    expect(readFileSync(join(game, 'party/server.ts'), 'utf8')).toBe('// mine')
    expect(existsSync(join(game, 'party/rules.ts'))).toBe(false)
    expect(readFileSync(join(game, 'content/rooms.json'), 'utf8')).toBe('{ "maxSeats": 6 }')
    expect(readFileSync(join(game, 'party/worker.ts'), 'utf8')).toBe('// my worker')
    expect(readJson(join(game, 'wrangler.json')).name).toBe('custom')
  })

  it('a game with its own wrangler.toml gets no wrangler.json', () => {
    write(join(game, 'wrangler.toml'), 'name = "my-game"')
    installRooms(game, { log: quiet })
    expect(existsSync(join(game, 'wrangler.json'))).toBe(false)
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
    expect(existsSync(join(game, 'wrangler.json'))).toBe(false)
    expect(lines.join('\n')).toMatch(/npm install partysocket partyserver/)
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
    expect(missing()).toMatch(/npm install partysocket partyserver/)
    expect(missing()).toMatch(/"party:dev": "wrangler dev"/)
    expect(missing()).toMatch(/\.wrangler\//)
    expect(missing()).not.toMatch(/Move off PartyKit/)
    write(join(game, 'package.json'), JSON.stringify({
      name: 'my-game',
      dependencies: { partysocket: '^1.3.0', partyserver: '^0.5.10' },
      devDependencies: { wrangler: '^4.145.0' },
      scripts: { 'party:dev': 'wrangler dev --persist-to .wrangler/state-dev', 'party:deploy': 'wrangler deploy' },
    }))
    write(join(game, '.gitignore'), 'node_modules/\n.wrangler/\n')
    write(join(game, 'tsconfig.app.json'), '{ "include": ["src", "party"] }')
    expect(missing()).not.toMatch(/npm install|party:dev"|\.wrangler\/|tsconfig|PartyKit/)
    write(join(game, '.env'), 'VITE_PARTY_HOST=localhost:1999\n')
    expect(missing()).toMatch(/\.env: remove VITE_PARTY_HOST/)
    expect(missing()).toMatch(/VITE_PARTY_HOST=my-game\./) // going live
  })

  it('a game still on PartyKit is told to move off it', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    write(join(game, 'partykit.json'), '{ "name": "my-game" }')
    expect(missing()).toMatch(/Move off PartyKit.*delete partykit\.json/s)
    rmSync(join(game, 'partykit.json'))
    write(join(game, 'package.json'), JSON.stringify({ name: 'my-game', devDependencies: { partykit: '^0.0.115' } }))
    expect(missing()).toMatch(/npm uninstall partykit/)
  })

  it('an older worker without /health is told to add it; the template has it', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    expect(missing()).not.toMatch(/answer \/health/) // no worker yet → nothing to say
    write(join(game, 'party/worker.ts'), 'export default { fetch() { return routePartykitRequest() } }')
    expect(missing()).toMatch(/party\/worker\.ts: answer \/health/)
    rmSync(join(game, 'party/worker.ts'))
    installRooms(game, { log: quiet })
    expect(missing()).not.toMatch(/answer \/health/)
  })

  it('an older worker that keeps nothing is told how to keep a match in storage; the template does it (0.10.0)', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    write(join(game, 'party/worker.ts'), 'onStart() { this.room = new GameServer({ id: this.name }) } healthResponse(request)')
    expect(missing()).toMatch(/party\/worker\.ts: keep a match in the room's storage/)
    rmSync(join(game, 'party/worker.ts'))
    installRooms(game, { log: quiet })
    expect(missing()).not.toMatch(/keep a match in the room's storage/)
  })

  it('a game with timers of its own is asked for onRestore (0.10.0)', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    write(join(game, 'party/turnClock.ts'), "room.timers.start('turn', 30_000, () => room.timedOut(seatId))")
    expect(missing()).toMatch(/add onRestore\(state, room, timersEndAt\)/)
    write(join(game, 'party/rules.ts'), 'onRestore(state, room, timersEndAt) { return state }')
    expect(missing()).not.toMatch(/add onRestore/)
  })

  it('keepMatchDays: the designer is asked to choose it for the game — after a fresh install, and while rooms.json says nothing (0.10.0)', () => {
    const logged = []
    installRooms(game, { log: (line) => logged.push(line) })
    expect(logged.join('\n')).toMatch(/Choose how long an unfinished match is kept for THIS game.*"keepMatchDays" \(now 7\).*live game ~7.*~30/s)
    expect(readJson(join(game, 'content/rooms.json')).keepMatchDays).toBe(7) // the template's default…
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')
    expect(missing()).not.toMatch(/keepMatchDays/) // …once it's the game's own file, its number is the game's choice
    write(join(game, 'content/rooms.json'), JSON.stringify({ maxSeats: 2 })) // an older rooms.json: no keepMatchDays
    expect(missing()).toMatch(/Choose how long an unfinished match is kept/)
    write(join(game, 'content/rooms.json'), JSON.stringify({ maxSeats: 2, keepMatchDays: 30 }))
    expect(missing()).not.toMatch(/keepMatchDays/)
  })

  // 0.13.0 (F155): the local room port lives in wrangler.json dev.port — the installer adds only that key
  describe('the local room port (wrangler.json dev.port)', () => {
    const missing = () => wiringSteps(game).filter((w) => !w.done).map((w) => w.step).join('\n')

    it('a game\'s own wrangler.json without a dev port gets one — every other byte comes back as it was', () => {
      const before = [
        '{',
        '    "name": "custom",',
        '    "main": "party/worker.ts",',
        '    "build": { "command": "node scripts/server-words.mjs" },',
        '    "rules": [{ "type": "Text", "globs": ["**/*.txt"], "fallthrough": true }],',
        '    "env": { "staging": { "name": "custom-staging", "vars": { "URL": "https://x.dev/a//b" } } }',
        '}',
        '',
      ].join('\n')
      write(join(game, 'wrangler.json'), before)
      const result = installRooms(game, { log: quiet })
      const after = readFileSync(join(game, 'wrangler.json'), 'utf8')
      const added = ',\n    "dev": { "port": 1999, "ip": "0.0.0.0" }'
      const at = before.lastIndexOf('}') - 1 // right after the last value, before the closing line
      expect(result.addedDevPort).toBe(true)
      expect(after).toBe(before.slice(0, at) + added + before.slice(at))
      expect(after.replace(added, '')).toBe(before) // nothing else touched
      expect(readJson(join(game, 'wrangler.json')).dev).toEqual({ port: 1999, ip: '0.0.0.0' })
      // a second install changes nothing
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe(after)
    })

    it('a "dev" block without a port gets just the port, in its own line ends (a Windows-saved file)', () => {
      const before = '{\r\n  "name": "custom",\r\n  "dev": { "ip": "0.0.0.0", "local_protocol": "http" },\r\n  "observability": { "enabled": true }\r\n}\r\n'
      write(join(game, 'wrangler.json'), before)
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe(before.replace('"dev": {', '"dev": { "port": 1999,'))
      const noKeys = '{\r\n  "name": "custom"\r\n}\r\n'
      write(join(game, 'wrangler.json'), noKeys)
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe('{\r\n  "name": "custom",\r\n  "dev": { "port": 1999, "ip": "0.0.0.0" }\r\n}\r\n')
    })

    it('a game that already picked a port keeps its file byte for byte, and the steps name its port', () => {
      const before = '{ "name": "glyph", "rules": [], "dev": { "port": 1997, "ip": "0.0.0.0" } }\n'
      write(join(game, 'wrangler.json'), before)
      const lines = []
      expect(installRooms(game, { log: (line) => lines.push(line) }).addedDevPort).toBe(false)
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe(before)
      expect(lines.join('\n')).toMatch(/npm run party:dev \(server, port 1997\)/)
      expect(lines.join('\n')).not.toMatch(/give the local room server its port/)
    })

    it('never guesses: an environment called "dev" (env.dev) or a .jsonc file is left alone, and the step says what to add', () => {
      const before = '{ "name": "a", "env": { "dev": { "vars": {} } }, "dev": { "ip": "0.0.0.0" } }'
      write(join(game, 'wrangler.json'), before)
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe(before)
      expect(missing()).toMatch(/wrangler\.json: give the local room server its port — "dev": \{ "port": 1999/)
      rmSync(join(game, 'wrangler.json'))
      write(join(game, 'wrangler.jsonc'), '{\n  // mine\n  "name": "a"\n}\n')
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.jsonc'), 'utf8')).toBe('{\n  // mine\n  "name": "a"\n}\n')
      expect(missing()).toMatch(/wrangler\.jsonc: give the local room server its port/)
    })

    it('a broken wrangler.json is left alone and named', () => {
      write(join(game, 'wrangler.json'), '{ "name": ')
      installRooms(game, { log: quiet })
      expect(readFileSync(join(game, 'wrangler.json'), 'utf8')).toBe('{ "name": ')
      expect(missing()).toMatch(/wrangler\.json isn't valid JSON/)
    })

    it('asks for roomsPort() in vite.config until it\'s there; the plugin ships with the kit', () => {
      installRooms(game, { log: quiet })
      expect(existsSync(join(game, 'src/rooms/vitePlugin.mjs'))).toBe(true)
      expect(existsSync(join(game, 'src/rooms/vitePlugin.d.mts'))).toBe(true)
      expect(existsSync(join(game, 'src/rooms/vitePlugin.test.mjs'))).toBe(false)
      expect(missing()).toMatch(/vite\.config\.ts: import \{ roomsPort \} from '\.\/src\/rooms\/vitePlugin\.mjs'/)
      write(join(game, 'vite.config.ts'), "import { roomsPort } from './src/rooms/vitePlugin.mjs'\nexport default { plugins: [roomsPort()] }\n")
      expect(missing()).not.toMatch(/roomsPort/)
    })
  })

  it('wrangler.json name comes from package.json', () => {
    expect(wranglerConfig(game).name).toBe('my-game')
  })

  it('a fresh install type-checks (kit + starter server + worker + example rules) with a game-style tsconfig', () => {
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
    let errors = '' // (tsc's own words when it fails, so a failure says what's wrong)
    try { execSync(`node "${tsc}" -p .`, { cwd: game, stdio: 'pipe' }) } catch (error) { errors = String(error.stdout) || String(error) }
    expect(errors).toBe('')
  }, 30_000)
})
