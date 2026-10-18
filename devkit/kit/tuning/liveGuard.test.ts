import { describe, expect, it } from 'vitest'
import { copiedAtLoad } from './liveGuard'

const file = (path: string, text: string) => ({ path, text })

describe('copiedAtLoad — game code that would not follow the Tuning sliders', () => {
  it('passes code that reads the live import where it is used', () => {
    const ok = file('src/view/tank.ts', [
      "import tank from '../../content/tuning/tank.json'",
      "import type text from '../../content/text/en.json'",
      'export type Tank = typeof tank',
      'export const colorOf = (c: number) => tank.colors[c]',
      'export function speed() { return tank.cameraSpeed }',
      "const live = liveTuning('tank', tank)",
      'const KEYS = { tank: 1 }',
    ].join('\n'))
    expect(copiedAtLoad([ok])).toEqual([])
  })
  it('FAILS on a value copied at the top of the file (one line or spread over several)', () => {
    const bad = file('src/game/repairs.ts', [
      "import breakdowns from '../../content/tuning/breakdowns.json'",
      'const colorNames = breakdowns.colors',
      'const STEPS: Record<string, number> = {',
      '  laser: breakdowns.laser.repairSliders,',
      '}',
    ].join('\n'))
    const problems = copiedAtLoad([bad])
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/^src\/game\/repairs\.ts:2 — copies breakdowns when the file loads/)
    expect(problems[1]).toMatch(/^src\/game\/repairs\.ts:3 /)
  })
  it('FAILS on a ?raw import and on a named import', () => {
    const problems = copiedAtLoad([
      file('src/goo/palette.ts', "import paletteJson from '../../../content/tuning/goo-colors.json?raw'"),
      file('src/a.ts', "import { speed } from '../content/tuning/tank.json'"),
    ])
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/with a query \(raw\)/)
    expect(problems[1]).toMatch(/named import/)
  })
  it('skips tests, the Dev Kit folder, files outside content/tuning and allowed files', () => {
    const copy = "import t from '../content/tuning/a.json'\nconst x = t.b"
    expect(copiedAtLoad([
      file('src/a.test.ts', copy),
      file('src/devkit/x.ts', copy),
      file('src/b.ts', "import s from '../content/ui/settings.json'\nconst x = s.rows"),
      file('src/c.ts', copy),
    ], { allow: { 'src/c.ts': 'read once at start-up on purpose' } })).toEqual([])
  })
  it('follows extra folders when the game lists them', () => {
    const f = file('src/a.ts', "import audio from '../content/audio.json'\nconst v = audio.volume")
    expect(copiedAtLoad([f])).toEqual([])
    expect(copiedAtLoad([f], { folders: ['content/tuning/', 'content/audio.json'] })).toHaveLength(1)
  })
  it('does not count words in strings or object keys', () => {
    expect(copiedAtLoad([file('src/a.ts', "import tank from '../content/tuning/tank.json'\nconst words = { tank: 'the tank' }")])).toEqual([])
  })
})
