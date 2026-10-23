import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// npm run ai:arena, run for real (Node + Vite) in a throwaway game folder, on the Draw to 10 test game.
const script = fileURLToPath(new URL('./ai-arena.mjs', import.meta.url))
const gameFile = fileURLToPath(new URL('../fixtures/arenaGame.ts', import.meta.url))

function gameFolder(arena) {
  const dir = mkdtempSync(join(tmpdir(), 'ai-arena-'))
  mkdirSync(join(dir, 'content/ai'), { recursive: true })
  writeFileSync(join(dir, 'content/ai/cast.json'), JSON.stringify({ personalities: ['Careful', 'Greedy'] }))
  if (arena) writeFileSync(join(dir, 'content/ai/arena.json'), JSON.stringify(arena))
  return dir
}
const arenaRun = (dir, ...flags) => {
  const r = spawnSync(process.execPath, [script, '--game', gameFile, ...flags], { cwd: dir, encoding: 'utf8' })
  return { code: r.status, out: (r.stdout + r.stderr).replaceAll('\r', '\n') }
}
// The report without the time it was written (the only part that changes between two runs)
const page = (path) => readFileSync(path, 'utf8').replace(/ · \d{4}-\d\d-\d\d \d\d:\d\d/, '')

describe('npm run ai:arena', () => {
  it('plays the game through its own rules, prints the summary and writes the report page where it says', () => {
    const dir = gameFolder({ games: 12, ladderGames: 2, reportPath: 'out/check.html' })
    const { code, out } = arenaRun(dir)
    expect(code, out).toBe(0)
    expect(out).toContain('16 games in')
    expect(out).toMatch(/decision time: median [\d.]+ ms/)
    expect(out).toMatch(/Careful\s+[\d.]+\s+[\d.]+\s+[\d.]+/) // won, draws, busted (the game's columns)
    expect(out).toMatch(/feel targets: \d\/4 green · tell-apart \d+% · for-all checks \d\/3/)
    const path = /report: (.+)/.exec(out)[1].trim()
    expect(path).toBe(join(dir, 'out', 'check.html'))
    const html = readFileSync(path, 'utf8')
    expect(html).toContain('Personality Check — Draw to 10')
    expect(html).toContain('12 mixed games at Steady (2–4 players) + 4 skill-ladder games · seed 1000')
    // "What wins?" (0.6.0): 12 games are too few to say — said, on the PC and on the page
    expect(out).toMatch(/What wins\? \(players win \d+% on average\)/)
    expect(out).toMatch(/no situation has enough games yet|left out for too few games/)
    expect(html).toContain('<h2>What wins?')
  }, 30000)

  it('flags change one run: --games --ladder --seats --skill --seed --notes --out; the same seed = the same report', () => {
    const dir = gameFolder()
    const a = arenaRun(dir, '--games', '6', '--ladder', '0', '--seats', '3', '--skill', 'Expert', '--seed', '7', '--notes', '--out', 'a.html')
    expect(a.code, a.out).toBe(0)
    expect(page(join(dir, 'a.html'))).toContain('6 mixed games at Expert (3 players) · seed 7')
    expect(a.out).toMatch(/\n0 Careful|\n0 Greedy|\n0 \w+/) // the first game's notes, seat first
    arenaRun(dir, '--games', '6', '--ladder', '0', '--seats', '3', '--skill', 'Expert', '--seed', '7', '--out', 'b.html')
    expect(page(join(dir, 'b.html'))).toBe(page(join(dir, 'a.html')))
    arenaRun(dir, '--games', '6', '--ladder', '0', '--seats', '3', '--skill', 'Expert', '--seed', '8', '--out', 'c.html')
    expect(page(join(dir, 'c.html'))).not.toBe(page(join(dir, 'a.html')))
    const named = arenaRun(dir, '--games', '3', '--ladder', '0', '--seats', 'greedy,Greedy', '--out', 'd.html')
    expect(named.code, named.out).toBe(0)
    expect(named.out).not.toMatch(/\nCareful/) // only the Greedy played
  }, 30000)

  it('--tune (npm run ai:tune): prints the suggestion, writes its page, and never touches content/', () => {
    const dir = gameFolder({ games: 6, reportPath: 'out/check.html', tuneGames: 3, tuneFreshGames: 4 })
    const before = readFileSync(join(dir, 'content/ai/arena.json'), 'utf8') + readFileSync(join(dir, 'content/ai/cast.json'), 'utf8')
    const r = arenaRun(dir, '--tune', '--personality', 'careful', '--budget', 'tries=4,seconds=0')
    expect(r.code, r.out).toBe(0)
    expect(r.out).toContain('3 games a try at Steady · up to 4 tries · checked on 4 fresh games')
    expect(r.out).toMatch(/Careful: (Suggested|No slider|The best try|All \d)/)
    expect(r.out).toMatch(/feel targets on 4 fresh games \(now → (suggested|best found)\):/)
    expect(r.out).toContain('Nothing was written to content/')
    const path = /page: (.+)/.exec(r.out)[1].trim()
    expect(path).toBe(join(dir, 'out', 'ai-tune-Careful.html'))
    const html = readFileSync(path, 'utf8')
    expect(html).toContain('Suggested sliders — Careful')
    expect(html).toMatch(/data-tune-verdict="(better|noGain|alreadyGreen|tooFewGames)"/)
    expect(readFileSync(join(dir, 'content/ai/arena.json'), 'utf8') + readFileSync(join(dir, 'content/ai/cast.json'), 'utf8')).toBe(before)
    expect(arenaRun(dir, '--tune')).toMatchObject({ code: 1, out: expect.stringContaining('ai:tune: which personality? npm run ai:tune -- --personality <id>   (there are Careful, Greedy)') })
    expect(arenaRun(dir, '--tune', '--personality', 'Nobody')).toMatchObject({ code: 1, out: expect.stringContaining('No personality "Nobody"') })
    expect(arenaRun(dir, '--tune', '--personality', 'Careful', '--budget', 'lots=3')).toMatchObject({ code: 1, out: expect.stringContaining('--budget wants name=number pairs') })
  }, 60000)

  it('says what is wrong in plain English', () => {
    const dir = gameFolder()
    expect(arenaRun(dir, '--skill', 'Wizard')).toMatchObject({ code: 1, out: expect.stringContaining('No skill "Wizard" (there are Apprentice, Steady, Expert)') })
    expect(arenaRun(dir, '--games', 'lots')).toMatchObject({ code: 1, out: expect.stringContaining('--games wants a whole number (got "lots")') })
    const none = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' })
    expect(none.status).toBe(1)
    expect(none.stderr).toContain('no arena file at src')
  }, 30000)
})
