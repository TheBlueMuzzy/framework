// WORDS PER CONTROL TYPE — one line of teaching text, written for each way the player plays:
//   "toConsole": { "keys": "Press W or ↑ for the console.", "mouse": "Click the console.", "phone": "Flick up for the console." }
// or one plain string when it's the same for everyone. The look asks for the line for how the player plays NOW.
// From Goops' lessonWords (goopsLessons.ts) + its last-input watch — only the generic part (F198). Filling
// {placeholders} is the game's (the UI kit's fill()), and so is where its words live (content/text/en.json).

export type ControlKind = 'keys' | 'mouse' | 'phone'
export type ControlWords = string | { keys?: string; mouse?: string; phone?: string }

/** The words for this kind of control. A missing one falls back keys → mouse → phone (a line that's only been
 *  written for one still shows something), then to `otherwise`. */
export function wordsFor(words: ControlWords | undefined, kind: ControlKind, otherwise = ''): string {
  if (words === undefined) return otherwise
  if (typeof words === 'string') return words
  return words[kind] ?? words.keys ?? words.mouse ?? words.phone ?? otherwise
}

/** A book of lesson lines: { "<lesson id>": { "<line id>": ControlWords }, "shared": { … } } (Goops keeps it at
 *  en.json → lessons). A line id → its words: the lesson's own line, else a shared one (lines several lessons use),
 *  else the id itself (handy while writing a lesson: the id shows until it has words). */
export function lessonLine(book: Record<string, Record<string, ControlWords> | undefined> | undefined, lessonId: string | null, id: string, kind: ControlKind): string {
  const entry = book?.[lessonId ?? '']?.[id] ?? book?.shared?.[id]
  return wordsFor(entry, kind, id)
}

/** Which kind of control the player used last: a key → keys, a touch → phone, a mouse or pen → mouse. Before
 *  anything is pressed it guesses from the screen (a touch screen with no mouse = phone; Goops' first line shows
 *  before the player has touched anything). Returns { kind(), stop() }. */
export function watchControls(target: EventTarget | undefined = typeof window !== 'undefined' ? window : undefined, startsAs: ControlKind = guessControls()) {
  let last = startsAs
  const onKey = () => { last = 'keys' }
  const onPointer = (e: Event) => { last = (e as Event & { pointerType?: string }).pointerType === 'touch' ? 'phone' : 'mouse' }
  // (heard first, in the capture phase: a part that stops the event still counts. An options object, not `true`:
  // Node's EventTarget doesn't remove a listener added with a bare `true`)
  const capture = { capture: true }
  target?.addEventListener('keydown', onKey, capture)
  target?.addEventListener('pointerdown', onPointer, capture)
  return {
    kind: () => last,
    stop() { target?.removeEventListener('keydown', onKey, capture); target?.removeEventListener('pointerdown', onPointer, capture) },
  }
}

/** Before any input: a screen that can't hover and has a coarse pointer is a phone; anything else, keys. */
export function guessControls(): ControlKind {
  return typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches ? 'phone' : 'keys'
}
