// Types for e2e.mjs (a game's TypeScript test scripts may import it too). `page` = a Playwright Page.
type PageLike = { locator: (selector: string) => { count: () => Promise<number>; first: () => { getAttribute: (name: string, options?: { timeout?: number }) => Promise<string | null> } } }

export declare const META_SELECTOR: 'meta[name="app-version"]'
export declare function expectedVersion(gameDir?: string, env?: Record<string, string | undefined>): string
export declare function staleMessage(shown: string | null, want: string): string
export declare function checkVersion(page: PageLike, want?: string): Promise<string>
export declare function builtVersion(distDir?: string): string | null
export declare function versionInHtml(html: string): string | null

// "A new version arrives" (F193). `page` = a Playwright Page in a fresh browser context.
export type UpdateCheck = { name: string; ok: boolean; detail: string }
export type UpdateResult = { ok: boolean; checks: UpdateCheck[]; first: string | null; shown: string | null; firstVisitLoads: number; updateLoads: number }
export declare function nextVersion(label: string, build?: number): string
export declare function shownVersion(page: unknown): Promise<string | null>
export declare function checkUpdateArrives(page: unknown, options: {
  url: string; next: string; publish: () => unknown; worker?: string; timeout?: number; settle?: number; step?: number
}): Promise<UpdateResult>
