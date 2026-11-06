// THE UPDATE STARTER — a returning player gets a new release on THIS visit, a first visit never reloads.
// From Goops' main.tsx (F193): the plain `registerSW({ immediate: true })` (Glyphtender, Roll Better) misses two cases —
//   · the new worker takes over before registerSW is listening → the page stays on the old build (Goops' e2e caught it)
//     → the browser's own controllerchange swaps it too;
//   · a page under ANOTHER worker (an older game's address, e.g. Goops v1's /GOOPS/sw.js) is a first visit, but
//     registerSW reloads it ("external" worker) → registerSW is handed onNeedReload, and both signals ask the same
//     question: did this page already run under OUR worker? Only then does it reload — once.
// The game hands in its own registerSW (from 'virtual:pwa-register'), so this module never imports it: a game without
// offline mode can still import the Version module.
//   import { registerSW } from 'virtual:pwa-register'
//   import { startUpdates } from './version'
//   startUpdates(registerSW)                          // the worker file is vite-plugin-pwa's default, sw.js
//   startUpdates(registerSW, { worker: 'goops-sw.js' }) // a game that names its own (vite.config.ts "filename")
// Needs vite-plugin-pwa 1.3.0+ (older ones ignore onNeedReload and reload by themselves).

/** What vite-plugin-pwa's registerSW takes (the part this uses). */
export type RegisterSWOptions = { immediate?: boolean; onNeedReload?: () => void }

/** The bits of navigator.serviceWorker this reads (a stand-in in tests). */
export type ServiceWorkerLike = {
  controller: { scriptURL: string } | null
  addEventListener: (type: 'controllerchange', listener: () => void) => void
}

export type UpdateOptions = {
  /** The worker's file name — vite.config.ts VitePWA "filename" (default 'sw.js'). */
  worker?: string
  /** The site's base path (default import.meta.env.BASE_URL). */
  base?: string
  /** For tests: the page's origin, its serviceWorker (undefined = a browser without them) and its reload. */
  origin?: string
  serviceWorker?: ServiceWorkerLike
  reload?: () => void
}

export type StartedUpdates<U> = {
  /** True when this page already ran under our worker (a returning player) — only then can it reload. */
  returning: boolean
  /** Our worker's full address. */
  ourWorker: string
  /** What registerSW gave back (its "update now" function). */
  update: U
}

/** Starts the offline cache's updates. Call once, as the game starts (main.tsx). */
export function startUpdates<U>(registerSW: (options: RegisterSWOptions) => U, options: UpdateOptions = {}): StartedUpdates<U> {
  const { worker = 'sw.js', base = import.meta.env.BASE_URL ?? '/' } = options
  const origin = options.origin ?? globalThis.location?.origin ?? 'http://localhost'
  const serviceWorker = 'serviceWorker' in options ? options.serviceWorker : (globalThis.navigator?.serviceWorker as ServiceWorkerLike | undefined)
  const reload = options.reload ?? (() => globalThis.location.reload())

  const ourWorker = new URL(`${base}${worker}`, origin).href
  const returning = serviceWorker?.controller?.scriptURL === ourWorker
  let swapped = false
  const swap = () => { if (returning && !swapped) { swapped = true; reload() } }

  const update = registerSW({ immediate: true, onNeedReload: swap })
  serviceWorker?.addEventListener('controllerchange', swap)
  return { returning, ourWorker, update }
}
