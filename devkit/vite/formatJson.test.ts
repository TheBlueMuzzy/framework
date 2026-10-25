// How the Dev Kit writes JSON files (formatJson.ts): a Save must look like the hand-written file it replaces.
import { describe, expect, it } from 'vitest'
import { formatJson, readLayout } from './formatJson'

/** Save the file's own data back: the text must come out exactly the same. */
const roundTrip = (text: string) => formatJson(JSON.parse(text), text)

// Shaped like Glyphtender's content/ai/personalities.json — notes spread out, short rows on one line
const PERSONALITIES = `{
  "_help": {
    "_file": "The AI personalities.",
    "traits.aggression": "TRAP — hem rivals in."
  },
  "_sections": {
    "AI: who it is": ["id", "goals", "nudge", "focus", "steady"]
  },
  "personalities": [
    {
      "id": "Bully",
      "traits": {
        "aggression": { "min": 80, "max": 95 },
        "greed": { "min": 30, "max": 50 }
      },
      "goals": ["TRAP", "DENY", "STEAL", "SCORE"],
      "nudge": 0.3,
      "steady": { "SCORE": 0.6 },
      "shifts": [
        { "reading": "myDanger", "from": 5, "full": 10, "trait": "caution", "by": 20 },
        { "reading": "myDanger", "from": 5, "full": 10, "trait": "aggression", "by": -15 }
      ],
      "extras": { "nerve": 14, "vocabulary": -1.0, "extraWordBonus": 3 }
    }
  ]
}
`

describe('formatJson — a new file (the rule of thumb)', () => {
  it('is 2-space JSON with a newline at the end; the file itself is always spread out', () => {
    expect(formatJson({ preset: 'cartoon', tweaks: {} })).toBe('{\n  "preset": "cartoon",\n  "tweaks": {}\n}\n')
  })
  it('puts short objects and lists of plain values on one line', () => {
    expect(formatJson({ range: { min: 80, max: 95 }, goals: ['TRAP', 'SCORE'], on: [true, false] }))
      .toBe('{\n  "range": { "min": 80, "max": 95 },\n  "goals": ["TRAP", "SCORE"],\n  "on": [true, false]\n}\n')
  })
  it('spreads out anything holding objects or lists, and anything too long for one line (~120 characters)', () => {
    expect(formatJson({ rows: [{ a: 1 }], empty: [] })).toBe('{\n  "rows": [\n    { "a": 1 }\n  ],\n  "empty": []\n}\n')
    const long = { note: { a: 'x'.repeat(60), b: 'y'.repeat(60) } }
    expect(formatJson(long)).toBe(`{\n  "note": {\n    "a": "${'x'.repeat(60)}",\n    "b": "${'y'.repeat(60)}"\n  }\n}\n`)
  })
  it('keeps a list of only numbers on one line however long', () => {
    const many = Array.from({ length: 60 }, (_, i) => i)
    expect(formatJson({ many })).toBe(`{\n  "many": [${many.join(', ')}]\n}\n`)
  })
  it('leaves brackets inside text alone, and writes invisible characters as \\u codes', () => {
    expect(formatJson({ tip: 'a [1,2] in text' })).toBe('{\n  "tip": "a [1,2] in text"\n}\n')
    expect(formatJson({ split: `Words${String.fromCharCode(0xa0)}{n}` })).toBe('{\n  "split": "Words\\u00a0{n}"\n}\n')
  })
})

describe('formatJson — saving over a hand-written file keeps its layout', () => {
  it('a load → save round trip changes nothing (personalities-shaped file)', () => {
    expect(roundTrip(PERSONALITIES)).toBe(PERSONALITIES)
  })
  it('keeps hand-written choices the rule of thumb would make differently', () => {
    const text = '{\n  "names": [\n    "Muzzy"\n  ],\n  "bio": { "name": "the Bully", "bio": "Loves a chase." },\n  "row": { "id": "A", "extras": { "zipf": 3 } }\n}\n'
    expect(roundTrip(text)).toBe(text)
  })
  it('keeps a one-line object or list\'s own spacing ({"a": 1} stays tight, [ 1,2 ] stays as is) — even after an edit', () => {
    const text = '{\n  "bios": {\n    "Scholar": {"name": "the Scholar", "bio": "Eats words."},\n    "pad": { "a": 1 }\n  },\n  "list": [ 1,2 ]\n}\n'
    expect(roundTrip(text)).toBe(text)
    const data = JSON.parse(text)
    data.bios.Scholar.bio = 'Reads a lot.'
    expect(formatJson(data, text)).toContain('    "Scholar": {"name": "the Scholar", "bio": "Reads a lot."},\n')
  })
  it('keeps a value\'s spelling while it is unchanged (1.0, \\u escapes), writes a changed one fresh', () => {
    const text = '{\n  "max": 1.0,\n  "dash": "a\\u2014b"\n}\n'
    expect(roundTrip(text)).toBe(text)
    expect(formatJson({ max: 1.5, dash: 'a—b' }, text)).toBe('{\n  "max": 1.5,\n  "dash": "a\\u2014b"\n}\n')
  })
  it('a changed value inside a one-line row keeps the row on one line', () => {
    const data = JSON.parse(PERSONALITIES)
    data.personalities[0].shifts[1].by = -20
    data.personalities[0].steady = { SCORE: 0.6, TRAP: 0.2 }
    const out = formatJson(data, PERSONALITIES)
    expect(out).toContain('        { "reading": "myDanger", "from": 5, "full": 10, "trait": "aggression", "by": -20 }\n')
    expect(out).toContain('      "steady": { "SCORE": 0.6, "TRAP": 0.2 },\n')
  })
  it('new things follow the rule of thumb: an added row is one line, an added key goes where the data puts it', () => {
    const data = JSON.parse(PERSONALITIES)
    data.personalities[0].shifts.push({ reading: 'fill', from: 4, full: 8, trait: 'greed', by: 10 })
    data.personalities[0].focus = 0.8
    const out = formatJson(data, PERSONALITIES)
    expect(out).toContain('        { "reading": "fill", "from": 4, "full": 8, "trait": "greed", "by": 10 }\n')
    expect(out).toContain('      "focus": 0.8\n')
  })
  it('a file that is not readable JSON gives no layout (the rule of thumb is used)', () => {
    expect(readLayout('{ "a": ').size).toBe(0)
    expect(formatJson({ a: [1] }, '{ "a": ')).toBe('{\n  "a": [1]\n}\n')
  })
})

// F133 (0.28.0): Glyphtender's content/tuning/drag.json as it was before Muzzy's first Save (its commit 4ff82b5) —
// "_sections" wrapped by hand over 2 lines; that Save made it 18 lines, one name per line
const DRAG = `{
  "ghostOpacity": 0.5,
  "_sections": {
    "Dragging": ["styles", "ghostOpacity", "liftScale", "liftShadow", "liftTime", "landTime", "flyTime", "fadeTime",
      "targets", "snap", "snapRadius", "makeRoom", "roomTime", "tetherBend", "arrowSize", "ghostGlow"]
  },
  "_ranges": {
    "ghostOpacity": [0.1, 1, 0.05]
  },
  "spread": [
    1,
    2
  ]
}
`

describe('a list wrapped by hand keeps its line breaks (F133)', () => {
  it('saving with nothing changed gives the file back exactly', () => {
    expect(roundTrip(DRAG)).toBe(DRAG)
  })

  it('a change elsewhere leaves the wrapped list as it was', () => {
    const data = JSON.parse(DRAG)
    data.ghostOpacity = 0.6
    expect(formatJson(data, DRAG)).toBe(DRAG.replace('"ghostOpacity": 0.5', '"ghostOpacity": 0.6'))
  })

  it('a changed item keeps the breaks; an added one joins the last line; a removed one takes its place with it', () => {
    const data = JSON.parse(DRAG)
    data._sections.Dragging[8] = 'aim' // "targets" (first on the second line) → "aim"
    expect(formatJson(data, DRAG)).toContain('"fadeTime",\n      "aim", "snap",')
    data._sections.Dragging.push('trail')
    expect(formatJson(data, DRAG)).toContain('"arrowSize", "ghostGlow", "trail"]')
    data._sections.Dragging.splice(0, 1) // "styles" gone: "ghostOpacity" now opens the list
    expect(formatJson(data, DRAG)).toContain('"Dragging": ["ghostOpacity", "liftScale"')
  })

  it('one-line lists and one-per-line lists are written as before', () => {
    const data = JSON.parse(DRAG)
    data._ranges.ghostOpacity = [0.2, 1, 0.05]
    data.spread = [1, 2, 3]
    const out = formatJson(data, DRAG)
    expect(out).toContain('"ghostOpacity": [0.2, 1, 0.05]')
    expect(out).toContain('"spread": [\n    1,\n    2,\n    3\n  ]')
  })

  it('Windows line endings in the old file don\'t come back as stray \\r', () => {
    expect(roundTrip(DRAG.replace(/\n/g, '\r\n'))).toBe(DRAG)
  })
})
