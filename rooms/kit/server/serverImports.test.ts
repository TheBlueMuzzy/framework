// The server runs on PartyServer (Cloudflare Workers), not in a browser: it can't use React, the Dev Kit,
// browser storage or Vite's import.meta.env — and everything it imports is bundled into the server
// (which has a size limit). This test keeps the server files and what they share with the game clean.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const serverDir = import.meta.dirname
const kitDir = join(serverDir, '..')
const serverFiles = readdirSync(serverDir).filter((f) => f.endsWith('.ts') && !f.includes('.test.')).map((f) => join(serverDir, f))
const sharedFiles = ['protocol.ts', 'roomCodes.ts'].map((f) => join(kitDir, f))

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])
}

describe('server code stays server-safe', () => {
  it('server files only import each other and the shared protocol + room codes', () => {
    expect(serverFiles.length).toBeGreaterThan(4)
    for (const file of serverFiles) {
      for (const path of importsOf(file)) {
        const allowed = path.startsWith('./') || path === '../protocol' || path === '../roomCodes'
        expect(allowed, `${file} imports ${path}`).toBe(true)
      }
    }
  })

  it('the shared files import nothing from React, the browser side or the Dev Kit', () => {
    for (const file of sharedFiles) {
      for (const path of importsOf(file)) expect(path, `${file} imports ${path}`).toMatch(/^\.\/(protocol|roomCodes)$/)
    }
  })

  it('no browser-only things in server or shared code', () => {
    for (const file of [...serverFiles, ...sharedFiles]) {
      const code = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '') // ignore comments
      for (const banned of ['localStorage', 'sessionStorage', 'window.', 'document.', 'import.meta.env', 'react', 'devkit']) {
        expect(code.includes(banned), `${file} uses ${banned}`).toBe(false)
      }
    }
  })
})
