// The Dev Kit's sliders can only change values the game reads where it uses them. This fails on a tuning value copied
// once when a file loads (const size = board.cellSize at the top of a file, a named JSON import, ?raw).
import { expect, it } from 'vitest'
import { copiedAtLoad, type SourceFile } from '../src/devkit/tuning/liveGuard'

const sources = import.meta.glob<string>('../src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
const srcFiles = (): SourceFile[] => Object.entries(sources).map(([path, text]) => ({ path: path.slice(3), text }))

it('no tuning value is copied at load', () => expect(copiedAtLoad(srcFiles())).toEqual([]))
