// Tests for the Dev Kit install/update tool, run against a throwaway game folder.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RELEASE_SWITCH, installDevkit, wiringSteps } from './install-devkit.mjs'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const write = (path, text) => { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, text) }
const quiet = () => {}
let game

beforeEach(() => { game = mkdtempSync(join(tmpdir(), 'devkit-install-')) })
afterEach(() => rmSync(game, { recursive: true, force: true }))

describe('install-devkit', () => {
  it('fresh install: copies the kit + Vite plugin (no tests), stamps VERSION, creates tabs.ts + devkit.json', () => {
    installDevkit(game, { log: quiet })
    const kit = join(game, 'src/devkit')
    expect(existsSync(join(kit, 'DevKit.tsx'))).toBe(true)
    expect(existsSync(join(kit, 'color/ColorTab.tsx'))).toBe(true)
    expect(existsSync(join(kit, 'DevKit.test.tsx'))).toBe(false)
    expect(existsSync(join(kit, 'color/colorLogic.test.ts'))).toBe(false)
    expect(readFileSync(join(kit, 'VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+\ncommit /)
    expect(existsSync(join(game, 'vite-plugins/devkit/devkitVite.ts'))).toBe(true)
    expect(existsSync(join(game, 'vite-plugins/devkit/devkitVite.test.ts'))).toBe(false)
    expect(existsSync(join(game, 'vite-plugins/devkit/VERSION'))).toBe(true)
    expect(readFileSync(join(game, 'src/devkit-game/tabs.ts'), 'utf8')).toContain('export const gameTabs')
    expect(readJson(join(game, 'content/devkit.json'))).toEqual(RELEASE_SWITCH)
  })

  it('re-install keeps the game\'s tabs + devkit.json, replaces edited kit files, removes dropped ones', () => {
    installDevkit(game, { log: quiet })
    writeFileSync(join(game, 'src/devkit-game/tabs.ts'), '// my tabs')
    writeFileSync(join(game, 'content/devkit.json'), '{ "inReleaseBuilds": false }')
    writeFileSync(join(game, 'src/devkit/devkit.css'), '/* edited */')
    writeFileSync(join(game, 'src/devkit/old-tool.tsx'), '')

    const lines = []
    const result = installDevkit(game, { log: (line) => lines.push(line) })
    expect(readFileSync(join(game, 'src/devkit-game/tabs.ts'), 'utf8')).toBe('// my tabs')
    expect(readFileSync(join(game, 'content/devkit.json'), 'utf8')).toBe('{ "inReleaseBuilds": false }')
    const kitPlan = result.plans.find((p) => p.to === 'src/devkit')
    expect(kitPlan.changed).toEqual(['devkit.css'])
    expect(kitPlan.removed).toEqual(['old-tool.tsx'])
    expect(kitPlan.handMade).toBe(false)
    expect(existsSync(join(game, 'src/devkit/old-tool.tsx'))).toBe(false)
    expect(readFileSync(join(game, 'src/devkit/devkit.css'), 'utf8')).not.toBe('/* edited */')
    expect(lines.join('\n')).toMatch(/changed {2}src\/devkit\/devkit\.css/)
  })

  it('warns before replacing a hand-made src/devkit (no VERSION) and lists old files to delete', () => {
    write(join(game, 'src/devkit/DevKit.tsx'), '// hand-made')
    write(join(game, 'src/devkit/color/colorLogic.test.ts'), '')
    write(join(game, 'src/devkit-flags.d.ts'), 'declare const __DEVKIT_IN_RELEASE__: boolean')
    write(join(game, 'vite-plugins/devkitSave.ts'), '')
    const lines = []
    const result = installDevkit(game, { dryRun: true, log: (line) => lines.push(line) })
    const text = lines.join('\n')
    expect(text).toMatch(/didn't come from the framework/)
    expect(text).toMatch(/changed {2}src\/devkit\/DevKit\.tsx/)
    expect(text).toMatch(/removed {2}src\/devkit\/color\/colorLogic\.test\.ts/)
    expect(result.oldFiles).toEqual(['src/devkit-flags.d.ts', 'vite-plugins/devkitSave.ts'])
    expect(text).toMatch(/src\/devkit-flags\.d\.ts/)
  })

  it('dry run changes nothing', () => {
    installDevkit(game, { dryRun: true, log: quiet })
    expect(existsSync(join(game, 'src'))).toBe(false)
    expect(existsSync(join(game, 'content'))).toBe(false)
    expect(existsSync(join(game, 'vite-plugins'))).toBe(false)
  })

  it('never deletes anything outside src/devkit, vite-plugins/devkit', () => {
    write(join(game, 'src/devkit-game/MyTab.tsx'), 'mine')
    write(join(game, 'src/App.tsx'), 'app')
    write(join(game, 'vite-plugins/other.ts'), 'other')
    installDevkit(game, { log: quiet })
    installDevkit(game, { log: quiet })
    expect(readFileSync(join(game, 'src/devkit-game/MyTab.tsx'), 'utf8')).toBe('mine')
    expect(readFileSync(join(game, 'src/App.tsx'), 'utf8')).toBe('app')
    expect(readFileSync(join(game, 'vite-plugins/other.ts'), 'utf8')).toBe('other')
  })
})

describe('wiring steps', () => {
  it('a bare game needs every step', () => {
    expect(wiringSteps(game).filter((w) => !w.done)).toHaveLength(6) // no tsconfig.node.json → that step is skipped
  })

  it('a wired-up game needs none', () => {
    write(join(game, 'src/main.tsx'), "if (import.meta.env.DEV || __DEVKIT_IN_RELEASE__) import('./devkit/mount').then((m) => m.mountDevKit())")
    write(join(game, 'vite.config.ts'), "import { devkit } from './vite-plugins/devkit/devkitVite'")
    write(join(game, 'tsconfig.node.json'), '{ "include": ["vite.config.ts", "vite-plugins"] }')
    write(join(game, '.gitignore'), 'node_modules\ndevkit.local.json\n')
    write(join(game, 'package.json'), JSON.stringify({ scripts: { 'check:devkit': 'node src/devkit/check-devkit.mjs', 'check:framework': 'node src/devkit/check-framework.mjs' }, devDependencies: { 'playwright-core': '^1' } }))
    expect(wiringSteps(game).filter((w) => !w.done)).toEqual([])
  })

  it('asks for vite-plugins in tsconfig.node.json when it only has vite.config.ts', () => {
    write(join(game, 'tsconfig.node.json'), '{ "include": ["vite.config.ts"] }')
    expect(wiringSteps(game).some((w) => !w.done && w.step.includes('tsconfig.node.json'))).toBe(true)
  })
})
