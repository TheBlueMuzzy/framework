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

  it('a dry run changes nothing', () => {
    const game = mkdtempSync(join(tmpdir(), 'audio-game-'))
    const { changed, starter } = installAudio(game, { dryRun: true, log: quiet })
    expect(changed).toContain('config.ts')
    expect(starter).toEqual(['content/audio.json'])
    expect(existsSync(join(game, 'src/audio'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
  })
})
