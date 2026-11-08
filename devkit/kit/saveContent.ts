// Shared by every Dev Kit tool: write a content/ JSON file, and copy text for Claude.

/**
 * Can this build write content/ files? Only under `npm run dev` — the Save endpoint lives in the dev server.
 * A release build (the live link, while content/devkit.json has the Dev Kit on) can't: there,
 * tools show "Copy for Claude" instead of Save, and changes last only until a refresh.
 */
export const CAN_SAVE = import.meta.env.DEV

/**
 * The Dev Kit key (0.32.0, F208): the dev server puts a key made fresh each run in every page it serves
 * (<meta name="devkit-key">, vite/devkitVite.ts) and refuses any call to its /__devkit/ routes that doesn't send it
 * back — so a page that opened the game (any browser, any machine, the phone) can save, and a hand-made request can't.
 * Every call to a /__devkit/ route spreads these headers in.
 */
export function devkitKeyHeaders(): Record<string, string> {
  const key = typeof document === 'undefined' ? null : document.querySelector<HTMLMetaElement>('meta[name="devkit-key"]')?.content
  return key ? { 'X-Devkit-Key': key } : {}
}

/**
 * Write a content/ JSON file through the dev server (vite-plugins/devkit/devkitVite.ts). Throws with a plain reason.
 * Normally the game is NOT reloaded for the file (it already shows the tool's live values). reload: true = let Vite
 * hot-reload it like a hand edit — for files the game only reads at load time (the Text tab: content/text/en.json).
 */
export async function saveContentFile(path: string, data: object, options: { reload?: boolean } = {}): Promise<void> {
  let res: Response
  try {
    res = await fetch('/__devkit/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...devkitKeyHeaders() },
      body: JSON.stringify(options.reload ? { path, data, reload: true } : { path, data }),
    })
  } catch {
    throw new Error('the dev server is not reachable (is npm run dev still running?)')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `the dev server said ${res.status}`)
}

/** A content/ JSON file as it is on disk right now (the dev server serves it as is), or null if it can't be read.
 *  The Text and Lessons tabs read it just before Save, so only their own edits go on top of it. */
export async function readContentFile(path: string): Promise<object | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL ?? '/'}${path}`, { cache: 'no-store' })
    const data: unknown = res.ok ? await res.json() : null
    return data !== null && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/** Copy text to the clipboard. Returns false if the browser refused (e.g. a phone on http://) */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older way — works on plain http:// pages where the clipboard API is blocked
    const box = document.createElement('textarea')
    box.value = text
    box.style.position = 'fixed'
    box.style.opacity = '0'
    document.body.appendChild(box)
    box.select()
    const ok = document.execCommand('copy')
    box.remove()
    return ok
  }
}
