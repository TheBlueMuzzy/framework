// WORDS — every block's text is a `words` prop with English defaults (the …Words objects),
// so a game can pass its own from content/text/en.json and translate later.
//   <Pause words={text.pause} />      → only the words you pass change; the rest stay English
// fill('Round {n} of {total}', { n: 2, total: 5 }) → 'Round 2 of 5'
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))

// noOrphan('…from 18 moves to 7') → the last two words held together (a no-break space), so a wrapped sentence never
// leaves one short word alone on its last line. The kit's text also asks the browser for this (kit.css text-wrap:
// pretty); this makes sure of it in browsers that don't.
const NO_BREAK = String.fromCharCode(160) // a no-break space
export const noOrphan = (sentence: string) => sentence.replace(/ (\S+)\s*$/, `${NO_BREAK}$1`)

// PSEUDO — the long fake language (F91): what a screen looks like once its words are translated, before they are.
// pseudo('Round {n} of 5') → '[Ŕöûñðŕö {n} öƒö 5]'
//   - every letter accented (tall marks above and below show clipped tops and bottoms)
//   - every word ~40% longer, with no new spaces — translations are longer words, not more of them (German), so a
//     word that won't fit can't hide by wrapping. Godot's built-in pass uses 30%; short words get at least 1 more.
//   - [brackets] round the whole text: a missing end bracket on screen = cut off
//   - {slots} kept as they are, so fill() still finds them
const ACCENTS: Record<string, string> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö',
  p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö',
  P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
}
export const PSEUDO_GROWTH = 0.4
const accent = (word: string) => [...word].map((ch) => ACCENTS[ch] ?? ch).join('')
const longer = (word: string) => {
  const letters = [...word].filter((ch) => /\p{L}/u.test(ch))
  if (!letters.length) return word
  const extra = Math.max(1, Math.round(letters.length * PSEUDO_GROWTH))
  const lower = letters.map((ch) => ch.toLowerCase())
  return accent(word) + accent(Array.from({ length: extra }, (_, i) => lower[i % lower.length]).join(''))
}
// The fake-language letters real languages (almost) never use — é, ö, ñ, ç are left out on purpose: a real
// "Spieleinstellungsmöglichkeiten" or "Café" must still be rewritten (sprint 45: an ö made a planted German word look
// done, and it hid the cut-off it was planted to show)
const MARKER_LETTERS = new Set([...'ƀðƒĝĥĵķļɱþǫŕţṽŵẋƁÐƑĜĤĴĶĻṀÞǪŔŢṼŴẊ'])
/** Is this text already in the fake language — whole ([…]), or a piece of it with one of its marker letters? (The page
 *  pass also remembers its own writes, pseudoPage.ts — that's what stops a word looping; this stops a piece of one.) */
export const isPseudo = (text: string) => /^\s*\[[\s\S]*\]\s*$/.test(text) || [...text].some((ch) => MARKER_LETTERS.has(ch))
export function pseudo(text: string) {
  if (!/\p{L}/u.test(text) || isPseudo(text)) return text
  const lead = text.match(/^\s*/)![0]
  const trail = text.match(/\s*$/)![0]
  const body = text.slice(lead.length, text.length - trail.length)
  // {slots} kept; every other run of letters made longer
  const out = body.split(/(\{\w+\})/).map((part) => (/^\{\w+\}$/.test(part) ? part : part.replace(/\p{L}[\p{L}'’]*/gu, longer))).join('')
  return `${lead}[${out}]${trail}`
}
