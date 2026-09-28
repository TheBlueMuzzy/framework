// Tests for the install/update tool, run against a throwaway game folder.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installKit } from './install-kit.mjs'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const quiet = () => {}
let game

beforeEach(() => { game = mkdtempSync(join(tmpdir(), 'kit-install-')) })
afterEach(() => rmSync(game, { recursive: true, force: true }))

describe('install-kit', () => {
  it('fresh install: copies the kit (no tests), stamps VERSION, creates style + settings + credits', () => {
    installKit(game, { preset: 'cozy', log: quiet })
    const kit = join(game, 'src/ui/kit')
    expect(existsSync(join(kit, 'index.ts'))).toBe(true)
    expect(existsSync(join(kit, 'check-ui.mjs'))).toBe(true)
    expect(existsSync(join(kit, 'fonts/nunito.woff2'))).toBe(true)
    expect(existsSync(join(kit, 'screens.test.ts'))).toBe(false)
    expect(readFileSync(join(kit, 'VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+\ncommit /)
    expect(readJson(join(game, 'content/ui/style.json'))).toEqual({ preset: 'cozy', tweaks: {} })
    expect(readJson(join(game, 'content/ui/settings.json')).tabs.length).toBeGreaterThan(0)
    const credits = readJson(join(game, 'content/credits.json'))
    expect(credits.some((c) => c.paths.includes('src/ui/kit/fonts/nunito.woff2'))).toBe(true)
  })

  it('re-install keeps the game\'s style.json and settings.json edits, and lists what changed', () => {
    installKit(game, { log: quiet })
    const style = { preset: 'neon', tweaks: { accent: '#e07a5f' } }
    writeFileSync(join(game, 'content/ui/style.json'), JSON.stringify(style))
    writeFileSync(join(game, 'content/ui/settings.json'), '{ "tabs": [] }')
    writeFileSync(join(game, 'src/ui/kit/kit.css'), '/* edited */')
    writeFileSync(join(game, 'src/ui/kit/old-part.tsx'), '')

    const lines = []
    const result = installKit(game, { preset: 'pixel', log: (line) => lines.push(line) })
    expect(readJson(join(game, 'content/ui/style.json'))).toEqual(style)
    expect(readFileSync(join(game, 'content/ui/settings.json'), 'utf8')).toBe('{ "tabs": [] }')
    expect(result.changed).toEqual(['kit.css'])
    expect(result.removed).toEqual(['old-part.tsx'])
    expect(existsSync(join(game, 'src/ui/kit/old-part.tsx'))).toBe(false)
    expect(lines.join('\n')).toMatch(/changed {2}kit\.css/)
  })

  it('merges font credits without duplicates and keeps the game\'s own entries', () => {
    mkdirSync(join(game, 'content'))
    const own = { paths: ['public/dice.glb'], source: 'Kenney', licence: 'CC0', light: '🟢', credit: '' }
    writeFileSync(join(game, 'content/credits.json'), JSON.stringify([own]))
    installKit(game, { log: quiet })
    installKit(game, { log: quiet })
    const credits = readJson(join(game, 'content/credits.json'))
    expect(credits[0]).toEqual(own)
    const nunito = credits.filter((c) => c.paths.includes('src/ui/kit/fonts/nunito.woff2'))
    expect(nunito).toHaveLength(1)
  })

  it('dry run changes nothing', () => {
    installKit(game, { dryRun: true, log: quiet })
    expect(existsSync(join(game, 'src'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
  })
})
