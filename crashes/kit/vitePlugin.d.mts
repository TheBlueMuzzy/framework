// Types for vitePlugin.mjs, so the game's vite.config.ts type-checks.
import type { Plugin } from 'vite'

export declare const MAPS_FOLDER: 'releases'
/** Where an ordinary (check / e2e) build's maps go — never committed, never shipped (0.3.0). */
export declare const CHECK_MAPS_FOLDER: 'node_modules/.cache/crashes-maps'
/** The game folder's version.json → "X.Y.Z.B". */
export declare function readGameVersion(root: string, env?: Record<string, string | undefined>): string
/** Every .map file under a folder (relative paths). */
export declare function findMaps(folder: string): string[]
/** Moves every .map in outDir to mapsDir, keeping its path. → the paths moved. release: throws (moving nothing) when
 *  mapsDir already holds a file — a released version's maps are never replaced (0.3.1). */
export declare function moveMaps(outDir: string, mapsDir: string, options?: { release?: boolean }): string[]
/** root = the game folder (default: Vite's root); version = what to file the maps under (default: version.json);
 *  release = the build players get (default: CRASHES_MAPS=release) → releases/, else the check cache. */
export declare function crashesMaps(options?: { root?: string; version?: string; release?: boolean }): Plugin
