// usage: node shake.mjs <gameRoot> <dev:true|false> <entry> [entry...] -- <moduleDir> ...
// Bundles the game with esbuild (tree-shaken, npm packages left out) and reports, per module folder,
// how many of its source lines end up in the bundle vs how many the copy holds.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const [root, dev, ...rest] = process.argv.slice(2);
const sep = rest.indexOf('--');
const entries = rest.slice(0, sep).map(e => path.resolve(root, e));
const modDirs = rest.slice(sep + 1);
const esbuild = createRequire(path.resolve(root, 'package.json'))('esbuild');
const res = await esbuild.build({
  entryPoints: entries, bundle: true, write: false, metafile: true, outdir: 'out', format: 'esm', splitting: true,
  packages: 'external', treeShaking: true, minify: false, logLevel: 'silent', platform: 'browser',
  define: { 'import.meta.env.DEV': dev, 'import.meta.env.PROD': String(dev !== 'true'), 'import.meta.env.MODE': JSON.stringify(dev === 'true' ? 'development' : 'production') },
  loader: { '.png': 'empty', '.jpg': 'empty', '.svg': 'empty', '.woff2': 'empty', '.woff': 'empty', '.ttf': 'empty', '.mp3': 'empty', '.ogg': 'empty', '.wav': 'empty', '.txt': 'text', '.css': 'empty' },
  external: ['virtual:*', '*.gen.txt'],
});
// bytesInOutput per input file across all outputs
const inOut = {};
for (const o of Object.values(res.metafile.outputs)) for (const [f, v] of Object.entries(o.inputs)) inOut[f] = (inOut[f] || 0) + v.bytesInOutput;
for (const d of modDirs) {
  const abs = path.resolve(root, d);
  let held = 0, kept = 0, keptBytes = 0, files = 0, keptFiles = 0;
  const walk = p => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name); if (e.isDirectory()) walk(q); else if (/\.(tsx?|mjs|js)$/.test(e.name) && !/\.test\.|test-util|\.d\.m?ts$/.test(e.name)) { const n = fs.readFileSync(q, 'utf8').split('\n').length; held += n; files++; const key = path.relative(process.cwd(), q).split(path.sep).join('/'); const b = inOut[key]; if (b > 0) { kept += n; keptBytes += b; keptFiles++; } else if (process.env.LIST) console.log(`   not in bundle: ${n}\t${path.relative(abs, q).split(path.sep).join('/')}`); } } };
  walk(abs);
  console.log(`${d}\theld ${files} files / ${held} lines\tin bundle ${keptFiles} files (${held ? Math.round(100 * kept / held) : 0}% of lines)`);
}
