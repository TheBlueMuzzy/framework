// THE DEV KIT'S E2E HELPERS (0.31.0, F196) — plain Node, for the game's Playwright scripts (e2e/*.mjs):
//   import { openDevKit, openTab, closeDevKit } from '../src/devkit/e2e.mjs'
//   const panel = await openDevKit(page)          // the panel, open (it waits for the Dev Kit to arrive first)
//   const tuning = await openTab(page, 'Tuning')  // opens the panel if needed, then the tab — on any page of the tab row
//   await closeDevKit(page)
// Why: every game's e2e opened the Dev Kit its own way — a ` press, then a fixed wait or a guess at where the tab is.
// The Dev Kit loads a moment after the page (much later on a busy PC), so a ` pressed too early did nothing; and on a
// phone the tab row is a carousel (carousel/Carousel.tsx), so a tab can sit on a page before or after the one showing
// (Glyphtender B030). These wait for the thing itself — the panel attached, the panel shown, the tab in view — never a
// set time.
// Only e2e scripts import this file: nothing in the kit does, so a game's build never bundles it (kit/e2e.test.mjs checks).

// tuning-ok: a test's patience, not a game value — long enough for a very busy PC, short enough to fail a real break
const ARRIVE_MS = 60_000

const PANEL = '#devkit-root aside[data-devkit]'

/** The Dev Kit panel (a locator; it may still be closed). */
export const devkitPanel = (page) => page.locator(PANEL)

/** Opens the Dev Kit panel (the ` key) once the Dev Kit has arrived; already open → left open. Returns the panel. */
export async function openDevKit(page, { timeout = ARRIVE_MS } = {}) {
  const panel = devkitPanel(page)
  await panel.waitFor({ state: 'attached', timeout }).catch(() => {
    throw new Error(`the Dev Kit never arrived on the page (no ${PANEL} after ${timeout / 1000} s) — is mountDevKit() wired in main.tsx, and is this a dev server or a build with the Dev Kit on?`)
  })
  if (await panel.isVisible()) return panel
  // ` in a text box is a letter, not the Dev Kit key (DevKit.tsx isTyping) — step out of the box first
  await page.evaluate(() => {
    const el = document.activeElement
    if (el && !el.closest('.devkit') && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) el.blur()
  })
  await page.keyboard.press('Backquote')
  await panel.waitFor({ state: 'visible', timeout }).catch(() => {
    throw new Error('pressed ` but the Dev Kit panel never opened (a screen preview open? the game eating the key?)')
  })
  return panel
}

/** Closes the panel (its ✕ button); already closed → nothing. */
export async function closeDevKit(page, { timeout = ARRIVE_MS } = {}) {
  const panel = devkitPanel(page)
  if (!(await panel.isVisible())) return
  await panel.getByRole('button', { name: 'Close the Dev Kit' }).click({ timeout })
  await panel.waitFor({ state: 'hidden', timeout })
}

/**
 * Opens a Dev Kit tab by its whole label ("Tuning"), wherever it sits in the tab row: opens the panel first if it's
 * closed, brings the tab's page into view (focusing a tab turns the carousel to it), clicks it and waits for its
 * panel. Returns the tab's panel (role tabpanel) — look for its controls inside it. An unknown name fails at once,
 * listing the tabs there are.
 */
export async function openTab(page, name, { timeout = ARRIVE_MS } = {}) {
  const panel = await openDevKit(page, { timeout })
  const tab = panel.locator('.devkit-tab', { hasText: new RegExp(`^${escapeRegExp(name)}$`) })
  if (!(await tab.count())) {
    const names = await panel.locator('.devkit-tab').allTextContents()
    throw new Error(`the Dev Kit has no "${name}" tab — it has: ${names.join(', ')}`)
  }
  // A tab on another page of the carousel is masked off: focusing it turns the row to its page (Carousel onFocus).
  // Then wait until it's what's under its own centre and the row has stopped sliding.
  await tab.focus()
  const handle = await tab.elementHandle()
  await page.waitForFunction((el) => {
    const box = el.getBoundingClientRect()
    const track = el.closest('.dk-carousel-track')
    const sliding = track?.getAnimations().some((a) => a.playState === 'running')
    return !sliding && el.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))
  }, handle, { timeout })
  await handle.dispose()
  await tab.click({ timeout })
  const body = panel.getByRole('tabpanel', { name, exact: true })
  await body.waitFor({ state: 'visible', timeout })
  return body
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
