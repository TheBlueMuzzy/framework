// Runs in the framework (not copied into games): the Text tab's thinking — flatten / unflatten, {placeholders},
// sections, search, Copy for Claude, and that a no-change Save writes the file back byte for byte.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatJson } from '../../vite/formatJson'
import {
  allFields,
  flattenText,
  friendlyLabel,
  listTextChanges,
  missingPlaceholders,
  placeholderProblems,
  placeholdersIn,
  searchText,
  textSections,
  textValues,
  unflattenText,
  withTexts,
} from './textLogic'

// A copy of Glyphtender's content/text/en.json (2026-10-13)
const SAMPLE_TEXT = readFileSync(join(__dirname, 'en.test.json'), 'utf8')
const SAMPLE = JSON.parse(SAMPLE_TEXT)

const SMALL = {
  _help: 'Every word players read.',
  menu: { title: 'Glyphtender', play: 'Play', _help: 'The first screen.' },
  game: {
    turnOf: "{player}'s turn",
    prompts: { draft: '{player} — place one ({n} of {total})' },
    rules: { pages: [{ title: 'Goal', body: 'Spell words.' }, { title: 'Turn', body: 'Move, then plant.' }] },
    maxPlayers: 4,
    online: true,
  },
  credits: { people: [{ role: 'Art', names: ['Muzzy'] }], empty: [] },
  footer: 'Made by Muzzy',
}

describe('flattenText / unflattenText', () => {
  it('a round trip gives back the same file: same keys in the same order, lists still lists', () => {
    for (const data of [SMALL, SAMPLE]) {
      const back = unflattenText(flattenText(data))
      expect(back).toEqual(data)
      expect(JSON.stringify(back)).toBe(JSON.stringify(data)) // order too
      expect(Array.isArray((back as typeof SMALL).game.rules.pages)).toBe(true)
    }
  })
  it('names each value by its path, lists by number; _help is a note, numbers and true/false are "other"', () => {
    const leaves = flattenText(SMALL)
    const kinds = Object.fromEntries(leaves.map((l) => [l.key, l.kind]))
    expect(kinds['game.rules.pages.1.body']).toBe('text')
    expect(kinds['menu._help']).toBe('note')
    expect(kinds['game.maxPlayers']).toBe('other')
    expect(kinds['credits.empty']).toBe('other')
    expect(leaves.find((l) => l.key === 'game.rules.pages.1.body')!.path).toEqual(['game', 'rules', 'pages', 1, 'body'])
  })
  it('withTexts puts edited words in and leaves the rest alone', () => {
    const out = withTexts(flattenText(SMALL), { 'menu.play': 'Start', 'game.rules.pages.0.body': 'Spell!' }) as typeof SMALL
    expect(out.menu.play).toBe('Start')
    expect(out.game.rules.pages[0].body).toBe('Spell!')
    expect(out.menu._help).toBe('The first screen.')
    expect(Object.keys(out)).toEqual(Object.keys(SMALL))
  })
})

describe('a no-change Save', () => {
  it('writes the sample en.json back byte for byte', () => {
    const data = withTexts(flattenText(SAMPLE), textValues(flattenText(SAMPLE)))
    expect(formatJson(data, SAMPLE_TEXT)).toBe(SAMPLE_TEXT)
  })
  it('an edit changes only its own line', () => {
    const values = textValues(flattenText(SAMPLE))
    const out = formatJson(withTexts(flattenText(SAMPLE), { ...values, 'mainMenu.play': 'Play now' }), SAMPLE_TEXT)
    const before = SAMPLE_TEXT.split('\n')
    const after = out.split('\n')
    expect(after.length).toBe(before.length)
    expect(after.filter((line, i) => line !== before[i])).toEqual(['    "play": "Play now",'])
  })
})

describe('{placeholders}', () => {
  it('finds each {name} once, in order', () => {
    expect(placeholdersIn('{player} — place one ({n} of {total}) {n}')).toEqual(['player', 'n', 'total'])
    expect(placeholdersIn('No braces { here }')).toEqual([])
  })
  it('names the ones an edit lost', () => {
    expect(missingPlaceholders('{player} — {n} of {total}', '{player} — {n}')).toEqual(['total'])
    expect(missingPlaceholders('{player} plays', 'Now {player} plays')).toEqual([])
    expect(missingPlaceholders('Plain', 'Still plain')).toEqual([])
  })
  it('placeholderProblems lists only changed texts that lost one', () => {
    const saved = { a: '{n} left', b: '{player}', c: 'hi' }
    expect(placeholderProblems({ a: 'some left', b: '{player}', c: 'hello' }, saved)).toEqual({ a: ['n'] })
    expect(placeholderProblems(saved, saved)).toEqual({})
  })
})

describe('sections', () => {
  it('top-level keys are sections, objects inside are sub-sections, lists stay inside as named fields', () => {
    const { notes, sections } = textSections(SMALL)
    expect(notes).toEqual(['Every word players read.'])
    expect(sections.map((s) => s.title)).toEqual(['menu', 'game', 'credits', 'Other words'])
    const menu = sections[0]
    expect(menu.notes).toEqual(['The first screen.'])
    expect(menu.fields.map((f) => f.key)).toEqual(['menu.title', 'menu.play'])
    const game = sections[1]
    expect(game.children.map((c) => c.title)).toEqual(['prompts', 'rules'])
    expect(game.children[1].fields.map((f) => f.label)).toEqual(['pages › 1 › title', 'pages › 1 › body', 'pages › 2 › title', 'pages › 2 › body'])
    expect(game.fields.map((f) => [f.key, f.kind])).toEqual([['game.turnOf', 'text'], ['game.maxPlayers', 'other'], ['game.online', 'other']])
    expect(sections[3].fields.map((f) => f.key)).toEqual(['footer'])
  })
  it('every text leaf of the sample is in exactly one section', () => {
    const { sections } = textSections(SAMPLE)
    const keys = sections.flatMap(allFields).filter((f) => f.kind === 'text').map((f) => f.key)
    expect(keys.sort()).toEqual(Object.keys(textValues(flattenText(SAMPLE))).sort())
  })
  it('friendlyLabel counts list places from 1', () => {
    expect(friendlyLabel(['tutorial', 'overview', 'pages', 1, 'body'], ['tutorial', 'overview'])).toBe('pages › 2 › body')
  })
})

describe('search', () => {
  const { sections } = textSections(SMALL)
  const values = textValues(flattenText(SMALL))
  const keysFound = (query: string, v = values) => searchText(sections, query, v).flatMap(allFields).map((f) => f.key)

  it('nothing typed = everything', () => {
    expect(searchText(sections, '  ', values)).toBe(sections)
  })
  it('finds by key or by words, case-insensitive, every word must match', () => {
    expect(keysFound('PLANT')).toEqual(['game.rules.pages.1.body'])
    expect(keysFound('pages body')).toEqual(['game.rules.pages.0.body', 'game.rules.pages.1.body'])
    expect(keysFound('turn of')).toEqual(['game.turnOf']) // a key split into words
    expect(keysFound('zzz')).toEqual([])
  })
  it('searches the words as edited now, and keeps the sections around a match', () => {
    expect(keysFound('banana', { ...values, 'game.prompts.draft': 'Banana time' })).toEqual(['game.prompts.draft'])
    // still found by its saved words while it's being retyped (the box doesn't vanish mid-edit)
    expect(keysFound('place', { ...values, 'game.prompts.draft': 'Banana time' })).toEqual(['game.prompts.draft'])
    const found = searchText(sections, 'draft', values)
    expect(found.map((s) => s.title)).toEqual(['game'])
    expect(found[0].fields).toEqual([])
    expect(found[0].children.map((c) => c.title)).toEqual(['prompts'])
  })
})

describe('Copy for Claude', () => {
  it('lists changed strings as key: "old" → "new"', () => {
    expect(listTextChanges({ a: 'Play', b: 'Stay' }, { a: 'Play now', b: 'Stay' })).toEqual([{ name: 'a', from: '"Play"', to: '"Play now"' }])
  })
})
