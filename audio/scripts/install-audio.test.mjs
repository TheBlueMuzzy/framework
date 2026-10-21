import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installAudio } from './install-audio.mjs'

const quiet = () => {}

describe('install-audio', () => {
  it('copies the kit without its tests, stamps VERSION, and removes files the module no longer ships', () => {
    const game = mkdtempSync(join(tmpdir(), 'audio-game-'))
    mkdirSync(join(game, 'src/audio'), { recursive: true })
    writeFileSync(join(game, 'src/audio/old.ts'), '// gone from the kit')
    installAudio(game, { log: quiet })
    expect(existsSync(join(game, 'src/audio/config.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/audio/config.test.ts'))).toBe(false)
    expect(existsSync(join(game, 'src/audio/fakeAudioContext.test.helper.ts'))).toBe(false)
    expect(existsSync(join(game, 'src/audio/engine.ts'))).toBe(true)
    expect(existsSync(join(game, 'src/audio/old.ts'))).toBe(false)
    expect(readFileSync(join(game, 'src/audio/VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+ \(framework /)
  })

  it('gives a starter content/audio.json once, and never overwrites the game\'s own', () => {
    const game = mkdtempSync(join(tmpdir(), 'audio-game-'))
    installAudio(game, { log: quiet })
    const starter = JSON.parse(readFileSync(join(game, 'content/audio.json'), 'utf8'))
    expect(starter.sounds).toBeTypeOf('object')
    writeFileSync(join(game, 'content/audio.json'), '{ "sounds": {} }')
    const { starter: second } = installAudio(game, { log: quiet })
    expect(second).toEqual([])
    expect(readFileSync(join(game, 'content/audio.json'), 'utf8')).toBe('{ "sounds": {} }')
  })

  it('adds "audio:check" to package.json once, and leaves a game\'s own alone', () => {
    const game = mkdtempSync(join(tmpdir(), 'audio-game-'))
    writeFileSync(join(game, 'package.json'), '{\r\n    "name": "g",\r\n    "scripts": { "dev": "vite" }\r\n}\r\n')
    expect(installAudio(game, { log: quiet }).script).toHaveLength(1)
    const text = readFileSync(join(game, 'package.json'), 'utf8')
    expect(JSON.parse(text).scripts).toEqual({ dev: 'vite', 'audio:check': 'node src/audio/audio-check.mjs' })
    expect(text).toContain('\r\n    "name"') // the file's own line endings + indent kept
    expect(installAudio(game, { log: quiet }).script).toEqual([])
    expect(existsSync(join(game, 'src/audio/audio-check.mjs'))).toBe(true)
    expect(existsSync(join(game, 'src/audio/loudness.mjs'))).toBe(true)
    const own = mkdtempSync(join(tmpdir(), 'audio-game-'))
    writeFileSync(join(own, 'package.json'), '{ "scripts": { "audio:check": "my-own" } }')
    installAudio(own, { log: quiet })
    expect(JSON.parse(readFileSync(join(own, 'package.json'), 'utf8')).scripts['audio:check']).toBe('my-own')
  })

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'audio-game-'))
    const { changed, starter } = installAudio(game, { dryRun: true, log: quiet })
    expect(changed).toContain('config.ts')
    expect(starter).toEqual(['content/audio.json'])
    expect(existsSync(join(game, 'src/audio'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
  })
})
