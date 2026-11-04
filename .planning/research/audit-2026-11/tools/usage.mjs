// usage: node usage.mjs <gameRoot> <moduleDir>=<name> ...
// Walks the game's own code (not the module copies, not node_modules) and lists
// which module files + exported names the game imports.
import fs from 'fs';
import path from 'path';
const root = path.resolve(process.argv[2]);
const mods = process.argv.slice(3).map(a => { const [d, n] = a.split('='); return { dir: path.resolve(root, d), name: n }; });
const skip = new Set(['node_modules', '.git', 'dist', '.claude', '.wrangler', 'e2e-shots', 'releases', 'public', 'screenshots']);
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      if (mods.some(m => p === m.dir)) continue;
      walk(p);
    } else if (/\.(m?[jt]sx?)$/.test(e.name)) files.push(p);
  }
}
walk(root);
const out = {};
const importRe = /import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(src))) {
    const spec = m[3] || m[4] || m[5];
    if (!spec || !spec.startsWith('.')) continue;
    const abs = path.resolve(path.dirname(f), spec);
    const mod = mods.find(x => abs === x.dir || abs.startsWith(x.dir + path.sep));
    if (!mod) continue;
    const rel = path.relative(mod.dir, abs).split(path.sep).join('/') || '(index)';
    const names = (m[2] || '').replace(/[{}]/g, ' ').split(',').map(s => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()).filter(Boolean);
    out[mod.name] ??= { files: new Set(), names: new Set(), importers: new Set() };
    out[mod.name].files.add(rel);
    names.forEach(n => out[mod.name].names.add(n));
    out[mod.name].importers.add(path.relative(root, f).split(path.sep).join('/'));
  }
}
for (const m of mods) {
  const o = out[m.name];
  if (!o) { console.log(`## ${m.name}: NOT IMPORTED by game code`); continue; }
  console.log(`## ${m.name}: ${o.importers.size} game files import ${o.files.size} module files, ${o.names.size} names`);
  console.log('  module files: ' + [...o.files].sort().join(', '));
  console.log('  names: ' + [...o.names].sort().join(', '));
}
