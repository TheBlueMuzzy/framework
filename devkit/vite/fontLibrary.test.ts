import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addLibraryFont, libraryFile, libraryFolder, listLibrary, prettyFontName } from './fontLibrary'

let dir: string, lib: string, game: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'devkit-fonts-'))
  lib = join(dir, 'Font')
  game = join(dir, 'game')
  mkdirSync(join(lib, 'press_start_dx'), { recursive: true })
  mkdirSync(join(lib, 'After Burner', 'deeper'), { recursive: true })
  writeFileSync(join(lib, 'press_start_dx', 'Press Start DX.ttf'), 'font-bytes')
  writeFileSync(join(lib, 'After Burner', 'After Burner Neue.ttf'), 'ab')
  writeFileSync(join(lib, 'After Burner', 'After Burner Neue Shadow.ttf'), 'abs')
  writeFileSync(join(lib, 'After Burner', 'Read Me.txt'), 'keep me with the font')
  writeFileSync(join(lib, 'After Burner', 'sample.png'), 'png')
  writeFileSync(join(lib, 'After Burner', 'setup.exe'), 'never copied')
  writeFileSync(join(lib, 'After Burner', 'deeper', 'x.woff2'), 'w')
  writeFileSync(join(dir, 'outside.ttf'), 'outside')
  mkdirSync(join(game, 'content', 'ui'), { recursive: true })
  writeFileSync(join(game, 'content', 'credits.json'), '[\n  { "paths": ["a.woff2"], "source": "x", "licence": "OFL" }\n]\n')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('which folder', () => {
  it('DEVKIT_FONT_LIBRARY, else devkit.local.json, else Downloads/Font in the home folder', () => {
    expect(libraryFolder(game, '')).toBe(join(homedir(), 'Downloads', 'Font'))
    writeFileSync(join(game, 'devkit.local.json'), JSON.stringify({ fontLibrary: lib }))
    expect(libraryFolder(game, '')).toBe(resolve(lib))
    expect(libraryFolder(game, join(dir, 'other'))).toBe(resolve(dir, 'other'))
  })
})

describe('listing', () => {
  it('every font file, in sub-folders too — nothing else', () => {
    const { fonts, more } = listLibrary(lib)
    expect(fonts.map((f) => f.path).sort()).toEqual([
      'After Burner/After Burner Neue Shadow.ttf', 'After Burner/After Burner Neue.ttf', 'After Burner/deeper/x.woff2', 'press_start_dx/Press Start DX.ttf',
    ])
    expect(fonts.find((f) => f.path.startsWith('press'))).toEqual({ path: 'press_start_dx/Press Start DX.ttf', name: 'Press Start DX', folder: 'press_start_dx' })
    expect(more).toBe(false)
    expect(listLibrary(join(dir, 'nope')).fonts).toEqual([])
  })
  it('names', () => expect(prettyFontName('gbb__.ttf')).toBe('Gbb'))
})

describe('serving a file', () => {
  it('only fonts inside the library', () => {
    expect(libraryFile(lib, 'press_start_dx/Press Start DX.ttf')).toBe(join(lib, 'press_start_dx', 'Press Start DX.ttf'))
    expect(libraryFile(lib, '../outside.ttf')).toEqual({ refused: 'that path leaves the font library' })
    expect(libraryFile(lib, 'press_start_dx/../../outside.ttf')).toEqual({ refused: 'that path leaves the font library' })
    expect(libraryFile(lib, join(dir, 'outside.ttf'))).toHaveProperty('refused')
    expect(libraryFile(lib, 'After Burner/setup.exe')).toEqual({ refused: 'only font files (.ttf .otf .woff .woff2)' })
    expect(libraryFile(lib, 'After Burner/Read Me.txt')).toHaveProperty('refused')
    expect(libraryFile(lib, 'nope.ttf')).toEqual({ refused: 'no such font: nope.ttf' })
    expect(libraryFile(lib, 42)).toHaveProperty('refused')
  })
})

describe('adding to the game', () => {
  it('copies the font + its licence / readme / picture (not other fonts or programs), lists it, credits it 🔴', () => {
    const added = addLibraryFont(game, lib, 'After Burner/After Burner Neue.ttf')
    expect(added.already).toBe(false)
    expect(added.font).toMatchObject({ name: 'After Burner Neue', file: 'after_burner/After Burner Neue.ttf', licence: 'unknown' })
    const folder = join(game, 'public', 'fonts', 'after_burner')
    expect(existsSync(join(folder, 'After Burner Neue.ttf'))).toBe(true)
    expect(readFileSync(join(folder, 'Read Me.txt'), 'utf8')).toBe('keep me with the font')
    expect(existsSync(join(folder, 'sample.png'))).toBe(true)
    expect(existsSync(join(folder, 'setup.exe'))).toBe(false)
    expect(existsSync(join(folder, 'After Burner Neue Shadow.ttf'))).toBe(false)
    const fonts = JSON.parse(readFileSync(join(game, 'content', 'ui', 'fonts.json'), 'utf8'))
    expect(fonts.fonts).toHaveLength(1)
    const credits = JSON.parse(readFileSync(join(game, 'content', 'credits.json'), 'utf8'))
    expect(credits).toHaveLength(2)
    expect(credits[1]).toMatchObject({ paths: ['public/fonts/after_burner/After Burner Neue.ttf'], light: '🔴' })
    // the library is untouched
    expect(existsSync(join(lib, 'After Burner', 'After Burner Neue.ttf'))).toBe(true)
  })
  it('twice = no duplicate', () => {
    addLibraryFont(game, lib, 'press_start_dx/Press Start DX.ttf')
    const again = addLibraryFont(game, lib, 'press_start_dx/Press Start DX.ttf')
    expect(again.already).toBe(true)
    expect(JSON.parse(readFileSync(join(game, 'content', 'ui', 'fonts.json'), 'utf8')).fonts).toHaveLength(1)
    expect(JSON.parse(readFileSync(join(game, 'content', 'credits.json'), 'utf8'))).toHaveLength(2)
  })
  it('refuses a path outside the library', () => {
    expect(() => addLibraryFont(game, lib, '../outside.ttf')).toThrow('leaves the font library')
  })
})
