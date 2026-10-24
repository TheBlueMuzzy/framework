import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, posix, resolve, win32 } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addLibraryFont, installedNote, installedFontFolders, installedFontsOn, libraryFile, libraryFolder, libraryPathFile, libraryRoots,
  listInstalled, listLibrary, prettyFontName, readFontNames, type LibraryRoot,
} from './fontLibrary'

/** A tiny but real TrueType file: just the OS/2 (weight, italic) and name (family, style) tables the library reads. */
function fakeFont(family: string, style: string, weight = 400, italic = false): Buffer {
  const os2 = Buffer.alloc(64)
  os2.writeUInt16BE(weight, 4)
  os2.writeUInt16BE(italic ? 1 : 0x40, 62)
  const texts = [[1, family], [2, style]] as const
  const strings = texts.map(([, t]) => Buffer.from(t, 'utf16le').swap16())
  const name = Buffer.alloc(6 + texts.length * 12)
  name.writeUInt16BE(texts.length, 2)
  name.writeUInt16BE(name.length, 4)
  let offset = 0
  texts.forEach(([id], i) => {
    const r = 6 + i * 12
    ;[3, 1, 0x409, id, strings[i].length, offset].forEach((v, j) => name.writeUInt16BE(v, r + j * 2))
    offset += strings[i].length
  })
  const nameTable = Buffer.concat([name, ...strings])
  const head = Buffer.alloc(12 + 2 * 16)
  head.writeUInt32BE(0x00010000, 0)
  head.writeUInt16BE(2, 4)
  const tables = [['OS/2', os2], ['name', nameTable]] as const
  let at = head.length
  tables.forEach(([tag, data], i) => {
    head.write(tag, 12 + i * 16, 'latin1')
    head.writeUInt32BE(at, 12 + i * 16 + 8)
    head.writeUInt32BE(data.length, 12 + i * 16 + 12)
    at += data.length
  })
  return Buffer.concat([head, os2, nameTable])
}

let dir: string, lib: string, game: string, pc: string, roots: LibraryRoot[]
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'devkit-fonts-'))
  lib = join(dir, 'Font')
  game = join(dir, 'game')
  pc = join(dir, 'Windows', 'Fonts')
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
  // An installed-font folder the Windows way: one file per style
  mkdirSync(pc, { recursive: true })
  writeFileSync(join(pc, 'tst.ttf'), fakeFont('Test Sans', 'Regular'))
  writeFileSync(join(pc, 'tstbd.ttf'), fakeFont('Test Sans', 'Bold', 700))
  writeFileSync(join(pc, 'tsti.ttf'), fakeFont('Test Sans', 'Italic', 400, true))
  writeFileSync(join(pc, 'oddball.ttf'), fakeFont('Oddball', 'Black', 900))
  writeFileSync(join(pc, 'noname.otf'), 'not a real font')
  writeFileSync(join(pc, 'cambria.ttc'), 'a collection')
  writeFileSync(join(pc, 'serife.fon'), 'an old screen font')
  writeFileSync(join(pc, 'licence.txt'), 'not this font\'s licence')
  mkdirSync(join(game, 'content', 'ui'), { recursive: true })
  writeFileSync(join(game, 'content', 'credits.json'), '[\n  { "paths": ["a.woff2"], "source": "x", "licence": "OFL" }\n]\n')
  roots = [
    { key: 'folder', dir: lib, label: 'Your font folder', installed: false },
    { key: 'installed1', dir: pc, label: 'Windows Fonts', installed: true },
  ]
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('which folders', () => {
  it('DEVKIT_FONT_LIBRARY, else devkit.local.json, else Downloads/Font in the home folder', () => {
    expect(libraryFolder(game, '')).toBe(join(homedir(), 'Downloads', 'Font'))
    writeFileSync(join(game, 'devkit.local.json'), JSON.stringify({ fontLibrary: lib }))
    expect(libraryFolder(game, '')).toBe(resolve(lib))
    expect(libraryFolder(game, join(dir, 'other'))).toBe(resolve(dir, 'other'))
  })
  it('installed-font folders per computer', () => {
    expect(installedFontFolders('win32', { WINDIR: 'C:\\Windows', LOCALAPPDATA: 'C:\\Users\\jo\\AppData\\Local' }, 'C:\\Users\\jo').map((f) => f.dir))
      .toEqual(['C:\\Windows\\Fonts', 'C:\\Users\\jo\\AppData\\Local\\Microsoft\\Windows\\Fonts'])
    expect(installedFontFolders('win32', {}, 'C:\\Users\\jo').map((f) => f.dir))
      .toEqual([win32.join('C:/Windows', 'Fonts'), 'C:\\Users\\jo\\AppData\\Local\\Microsoft\\Windows\\Fonts'])
    expect(installedFontFolders('darwin', {}, '/Users/jo').map((f) => f.dir)).toEqual(['/System/Library/Fonts', '/Library/Fonts', '/Users/jo/Library/Fonts'])
    expect(installedFontFolders('linux', {}, '/home/jo').map((f) => f.dir))
      .toEqual(['/usr/share/fonts', '/usr/local/share/fonts', '/home/jo/.local/share/fonts', '/home/jo/.fonts'])
    // labels never name the user
    for (const os of ['win32', 'darwin', 'linux']) {
      for (const f of installedFontFolders(os, { LOCALAPPDATA: 'C:\\Users\\jo\\AppData\\Local' }, os === 'win32' ? 'C:\\Users\\jo' : '/home/jo')) expect(f.label).not.toContain('jo')
    }
  })
  it('roots: the designer folder first, then only the installed folders that exist', () => {
    const home = join(dir, 'home')
    mkdirSync(join(home, '.fonts'), { recursive: true })
    const linux = libraryRoots(game, { folderEnv: lib, installedEnv: '', platform: 'linux', home })
    expect(linux[0]).toEqual({ key: 'folder', dir: resolve(lib), label: 'Your font folder', installed: false })
    expect(linux.at(-1)).toEqual({ key: 'installed4', dir: posix.join(home, '.fonts'), label: '~/.fonts', installed: true })
    if (process.platform === 'win32') { // (Windows paths only exist on Windows)
      const win = libraryRoots(game, { folderEnv: lib, installedEnv: '', platform: 'win32', env: { WINDIR: join(dir, 'Windows'), LOCALAPPDATA: join(dir, 'nope') }, home })
      expect(win.map((r) => [r.key, r.dir])).toEqual([['folder', resolve(lib)], ['installed1', win32.join(dir, 'Windows', 'Fonts')]])
    }
    // the designer folder IS an installed folder → listed once
    expect(libraryRoots(game, { folderEnv: join(home, '.fonts'), installedEnv: '', platform: 'linux', home }).filter((r) => r.dir === join(home, '.fonts'))).toHaveLength(1)
  })
  it('the off switch: DEVKIT_INSTALLED_FONTS=0, or "installedFonts": false in devkit.local.json', () => {
    const home = join(dir, 'home')
    mkdirSync(join(home, '.fonts'), { recursive: true })
    const options = { folderEnv: lib, platform: 'linux', home }
    expect(installedFontsOn(game, '')).toBe(true)
    expect(libraryRoots(game, { ...options, installedEnv: '' }).length).toBeGreaterThanOrEqual(2)
    for (const off of ['0', 'false', 'OFF', 'no']) {
      expect(installedFontsOn(game, off)).toBe(false)
      expect(libraryRoots(game, { ...options, installedEnv: off })).toHaveLength(1)
    }
    writeFileSync(join(game, 'devkit.local.json'), JSON.stringify({ installedFonts: false }))
    expect(installedFontsOn(game, '')).toBe(false)
    expect(libraryRoots(game, { ...options, installedEnv: '' })).toHaveLength(1)
    expect(installedFontsOn(game, '1')).toBe(true) // the environment variable wins for one run
  })
})

describe('listing', () => {
  it('every font file, in sub-folders too — nothing else', () => {
    const { fonts, more } = listLibrary(lib)
    expect(fonts.map((f) => f.path).sort()).toEqual([
      'folder:After Burner/After Burner Neue Shadow.ttf', 'folder:After Burner/After Burner Neue.ttf', 'folder:After Burner/deeper/x.woff2', 'folder:press_start_dx/Press Start DX.ttf',
    ])
    expect(fonts.find((f) => f.file.startsWith('press'))).toEqual({
      path: 'folder:press_start_dx/Press Start DX.ttf', name: 'Press Start DX', folder: 'press_start_dx', file: 'press_start_dx/Press Start DX.ttf',
    })
    expect(more).toBe(false)
    expect(listLibrary(join(dir, 'nope')).fonts).toEqual([])
  })
  it('names', () => expect(prettyFontName('gbb__.ttf')).toBe('Gbb'))
  it('the cap: at most MAX_LISTED files per folder, then "more"', () => {
    const capped = listLibrary(lib, 'folder', 2)
    expect(capped.fonts).toHaveLength(2)
    expect(capped.more).toBe(true)
    expect(listInstalled(roots, true, 2)).toMatchObject({ more: true })
    expect(listInstalled(roots, true, 2).fonts.length).toBeLessThanOrEqual(2)
  })
  it('a font\'s own names', () => {
    expect(readFontNames(join(pc, 'tstbd.ttf'))).toEqual({ family: 'Test Sans', style: 'Bold', weight: 700, italic: false })
    expect(readFontNames(join(pc, 'noname.otf'))).toEqual({})
    expect(readFontNames(join(dir, 'nope.ttf'))).toEqual({})
  })
  it('installed fonts: one row per family, its regular file; .ttc / .fon skipped and counted', () => {
    const { fonts, more, skipped } = listInstalled(roots, true)
    expect(fonts).toEqual([
      { path: 'installed1:noname.otf', name: 'Noname', folder: 'Windows Fonts', file: 'noname.otf', styles: 1 }, // no names inside → the file name
      { path: 'installed1:oddball.ttf', name: 'Oddball', folder: 'Windows Fonts', file: 'oddball.ttf', styles: 1 },
      { path: 'installed1:tst.ttf', name: 'Test Sans', folder: 'Windows Fonts', file: 'tst.ttf', styles: 3 },
    ])
    expect(more).toBe(false)
    expect(skipped).toEqual({ ttc: 1, fon: 1 })
  })
  it('installed folders are read once and kept — refresh looks again', () => {
    listInstalled(roots, true)
    writeFileSync(join(pc, 'newone.ttf'), fakeFont('New One', 'Regular'))
    expect(listInstalled(roots).fonts.map((f) => f.name)).not.toContain('New One')
    expect(listInstalled(roots, true).fonts.map((f) => f.name)).toContain('New One')
  })
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
  it('a path names ONE root and stays inside it', () => {
    expect(libraryPathFile(roots, 'folder:press_start_dx/Press Start DX.ttf')).toMatchObject({ file: join(lib, 'press_start_dx', 'Press Start DX.ttf'), inside: 'press_start_dx/Press Start DX.ttf' })
    expect(libraryPathFile(roots, 'installed1:tst.ttf')).toMatchObject({ file: join(pc, 'tst.ttf'), root: roots[1] })
    // into another root, or out of them all
    expect(libraryPathFile(roots, 'installed1:../../Font/press_start_dx/Press Start DX.ttf')).toEqual({ refused: 'that path leaves the font library' })
    expect(libraryPathFile(roots, 'folder:../Windows/Fonts/tst.ttf')).toEqual({ refused: 'that path leaves the font library' })
    expect(libraryPathFile(roots, `folder:${join(pc, 'tst.ttf')}`)).toHaveProperty('refused') // a whole path (C:\… or /…)
    expect(libraryPathFile(roots, 'installed1:C:tst.ttf')).toHaveProperty('refused') // a drive name inside
    expect(libraryPathFile(roots, 'folder:tst.ttf')).toHaveProperty('refused') // that root has no such file
    // no key, an unknown key, a key the computer doesn't have
    expect(libraryPathFile(roots, 'press_start_dx/Press Start DX.ttf')).toEqual({ refused: 'that path names no font library folder' })
    expect(libraryPathFile(roots, 'installed2:tst.ttf')).toEqual({ refused: 'that path names no font library folder' })
    expect(libraryPathFile(roots, `${pc}:tst.ttf`)).toHaveProperty('refused')
    expect(libraryPathFile(roots, ':tst.ttf')).toHaveProperty('refused')
    expect(libraryPathFile(roots, 'installed1:licence.txt')).toHaveProperty('refused')
  })
  it('a link inside a root that leads out is refused (and never listed)', () => {
    const out = join(dir, 'elsewhere')
    mkdirSync(out)
    writeFileSync(join(out, 'secret.ttf'), fakeFont('Secret', 'Regular'))
    symlinkSync(out, join(pc, 'linked'), 'junction') // a folder link — Windows lets anyone make these
    expect(existsSync(join(pc, 'linked', 'secret.ttf'))).toBe(true)
    expect(libraryPathFile(roots, 'installed1:linked/secret.ttf')).toEqual({ refused: 'that path leaves the font library' })
    expect(listInstalled(roots, true).fonts.map((f) => f.name)).not.toContain('Secret')
  })
})

describe('adding to the game', () => {
  it('copies the font + its licence / readme / picture (not other fonts or programs), lists it, credits it 🔴', () => {
    const added = addLibraryFont(game, roots, 'folder:After Burner/After Burner Neue.ttf')
    expect(added.already).toBe(false)
    expect(added.font).toMatchObject({ name: 'After Burner Neue', file: 'after_burner/After Burner Neue.ttf', licence: 'unknown' })
    expect(added.font.licenceNote).toContain('the font library (After Burner/After Burner Neue.ttf)')
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
    expect(credits[1]).toMatchObject({ paths: ['public/fonts/after_burner/After Burner Neue.ttf'], source: 'Font library: After Burner/After Burner Neue.ttf', light: '🔴' })
    // the library is untouched
    expect(existsSync(join(lib, 'After Burner', 'After Burner Neue.ttf'))).toBe(true)
  })
  it('an installed font: named by its family, always 🔴 unknown with the warning, nothing else from that folder', () => {
    const added = addLibraryFont(game, roots, 'installed1:tstbd.ttf')
    expect(added.font).toMatchObject({ name: 'Test Sans', file: 'test_sans/tstbd.ttf', licence: 'unknown' })
    expect(added.font.licenceNote).toContain(installedNote())
    expect(installedNote('win32')).toBe("most fonts that come with Windows can't ship in a game: check its licence")
    expect(added.wrote).toEqual(['public/fonts/test_sans/tstbd.ttf', 'content/ui/fonts.json', 'content/credits.json'])
    expect(existsSync(join(game, 'public', 'fonts', 'test_sans', 'licence.txt'))).toBe(false)
    const credits = JSON.parse(readFileSync(join(game, 'content', 'credits.json'), 'utf8'))
    expect(credits[1]).toMatchObject({ source: 'Installed on this computer (Windows Fonts): tstbd.ttf', licence: 'unknown — check its licence', light: '🔴' })
    expect(existsSync(join(pc, 'tstbd.ttf'))).toBe(true)
  })
  it('twice = no duplicate', () => {
    addLibraryFont(game, roots, 'folder:press_start_dx/Press Start DX.ttf')
    const again = addLibraryFont(game, roots, 'folder:press_start_dx/Press Start DX.ttf')
    expect(again.already).toBe(true)
    expect(JSON.parse(readFileSync(join(game, 'content', 'ui', 'fonts.json'), 'utf8')).fonts).toHaveLength(1)
    expect(JSON.parse(readFileSync(join(game, 'content', 'credits.json'), 'utf8'))).toHaveLength(2)
  })
  it('refuses a path outside the library or into another root', () => {
    expect(() => addLibraryFont(game, roots, 'folder:../outside.ttf')).toThrow('leaves the font library')
    expect(() => addLibraryFont(game, roots, 'installed1:../../Font/press_start_dx/Press Start DX.ttf')).toThrow('leaves the font library')
    expect(() => addLibraryFont(game, roots, 'press_start_dx/Press Start DX.ttf')).toThrow('names no font library folder')
  })
})
