// usage: node classify.mjs <wc-l output> [depth]
import fs from 'fs';
const lines = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n');
const depth = +(process.argv[3] || 1);
const agg = {};
for (const l of lines) {
  const m = l.trim().match(/^(\d+)\s+(.*)$/); if (!m) continue;
  const n = +m[1], f = m[2];
  const parts = f.split('/');
  let top = parts.slice(0, depth).join('/');
  if (parts.length <= depth) top = parts.slice(0, depth - 1).join('/') || parts[0];
  let cls;
  if (/package-lock\.json$|\.lock$/.test(f)) cls = 'lock';
  else if (/(^|\/)(VERSION|UPGRADES[^/]*)$/.test(f)) cls = 'stamp';
  else if (/\.(test|spec)\.(m?[jt]sx?)$|(^|\/)(tests?|e2e|__tests__)\//.test(f)) cls = 'tests';
  else if (/\.(md|txt)$/.test(f)) cls = 'docs';
  else if (/\.json$/.test(f)) cls = 'json';
  else if (/\.(m?[jt]sx?|css|html|cjs)$/.test(f)) cls = 'src';
  else cls = 'other';
  agg[top] ??= {}; agg[top][cls] = (agg[top][cls] || 0) + n; agg[top].files = (agg[top].files || 0) + 1;
}
const cols = ['files', 'src', 'tests', 'docs', 'json', 'lock', 'stamp', 'other'];
console.log(['top', ...cols].join('\t'));
const tot = {};
for (const [k, v] of Object.entries(agg).sort()) {
  console.log([k, ...cols.map(c => v[c] || 0)].join('\t'));
  for (const c of cols) tot[c] = (tot[c] || 0) + (v[c] || 0);
}
console.log(['TOTAL', ...cols.map(c => tot[c])].join('\t'));
