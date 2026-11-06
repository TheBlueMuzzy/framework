// usage: node deadweight.mjs <frameworkModuleKitDir> <game>:<root>:<excludeDir,excludeDir> ...
// For every non-test source file in the module: its lines, its exported names, and whether
// any game's OWN code (module copies excluded) mentions one of those names.
// Files nobody's game code names but another module file imports = "inside only".
// Heuristic (word match, not a real type resolver) — good for a rough dead-weight map.
import fs from 'fs';
import path from 'path';
const kit = path.resolve(process.argv[2]);
const games = process.argv.slice(3).map(a => { const [name, root, ex] = a.split('|'); return { name, root: path.resolve(root), ex: (ex || '').split(',').filter(Boolean).map(e => path.resolve(root, e)) }; });
const skip = new Set(['node_modules', '.git', 'dist', '.claude', '.wrangler', 'e2e-shots', 'releases', 'public', 'screenshots']);
function walk(d, ex, acc) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (skip.has(e.name) || ex.includes(p)) continue; walk(p, ex, acc); }
    else if (/\.(m?[jt]sx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const words = {};
for (const g of games) {
  const set = new Set();
  for (const f of walk(g.root, g.ex, [])) for (const w of fs.readFileSync(f, 'utf8').match(/[A-Za-z_$][\w$]*/g) || []) set.add(w);
  words[g.name] = set;
}
const kitFiles = walk(kit, [], []).filter(f => !/\.(test|spec)\.|test-util|\.d\.m?ts$/.test(f));
const kitText = Object.fromEntries(kitFiles.map(f => [f, fs.readFileSync(f, 'utf8')]));
const rows = [];
for (const f of kitFiles) {
  const src = kitText[f];
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}(?!\s*from)/g)) m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop().replace(/^type\s+/, '')).filter(Boolean).forEach(n => names.add(n));
  const rel = path.relative(kit, f).split(path.sep).join('/');
  if (/(^|\/)index\.m?[jt]sx?$/.test(rel)) continue;
  const lines = src.split('\n').length;
  const usedBy = games.filter(g => [...names].some(n => words[g.name].has(n))).map(g => g.name);
  const base = path.basename(f).replace(/\.(m?[jt]sx?)$/, '');
  const inside = kitFiles.some(o => o !== f && new RegExp(`from\\s+['"][^'"]*/${base}(\\.m?[jt]sx?)?['"]`).test(kitText[o]));
  rows.push({ rel, lines, n: names.size, usedBy: usedBy.join(',') || '-', inside });
}
rows.sort((a, b) => a.rel.localeCompare(b.rel));
let dead = 0, insideOnly = 0, used = 0;
for (const r of rows) {
  const tag = r.usedBy !== '-' ? 'USED' : (r.inside ? 'inside-only' : 'NO-GAME');
  if (tag === 'USED') used += r.lines; else if (tag === 'inside-only') insideOnly += r.lines; else dead += r.lines;
  console.log(`${tag}\t${r.lines}\t${r.rel}\t${r.usedBy}`);
}
console.log(`SUM used=${used} inside-only=${insideOnly} no-game=${dead}`);
