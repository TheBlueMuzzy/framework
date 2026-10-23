// THE AI MODULE — THE PERSONALITY CHECK REPORT. One self-contained HTML page (no scripts, no files) a game's arena
// writes after a run: feel targets green/red, the tell-apart grid, win shares, the skill ladder, example notes.
import type { TargetResult } from './check'
import { span, type SituationWins, type WhatWins } from './wins'

export interface CheckReport {
  title: string
  /** e.g. "300 games · 2–4 players · First Class" */
  subtitle: string
  feel: Record<string, TargetResult[]>
  /** The "for all of them" checks, already judged. */
  all: { label: string; pass: boolean; detail: string }[]
  tell: { accuracy: Record<string, number>; overall: number; grid: Record<string, Record<string, number>> }
  wins: { overall: Record<string, number>; headToHead: Record<string, Record<string, number>> }
  ladder: Record<string, number>
  /** A few decision notes from one game, to read how it thinks. */
  notes?: string[]
  /** "What wins?" (F25) — only when the game names situations. */
  whatWins?: WhatWins
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const pct = (v: number) => `${Math.round(v * 100)}%`
const mark = (pass: boolean) => `<span class="${pass ? 'ok' : 'no'}">${pass ? '✓' : '✗'}</span>`

/** "What wins?": the top sentences in a card (the Dev Kit's Check panel reads them from `data-what-wins`), the
 *  pitfall, every situation in a table, and what was left out for too few games. */
function whatWinsHtml(w: WhatWins): string {
  const cell = (s: SituationWins, i: number) => {
    const g = s.groups.length === 3 ? s.groups[i] : s.groups.length === 2 ? [s.groups[0], undefined, s.groups[1]][i] : i === 1 ? s.groups[0] : undefined
    return g ? `<td>${pct(g.winRate)} <span class="dim">${span(g.low, g.high)} · ${g.games}</span></td>` : '<td class="dim">—</td>'
  }
  const rows = w.all.map((s) => `<tr${s.leftOut ? ' class="dim"' : ''}><th>${esc(s.situation)}</th><td>${esc(s.moment)}</td><td>${s.leftOut ? 'left out' : `${pct(s.edge)}${s.isTheWin ? ' <span class="dim">(the win itself)</span>' : ''}`}</td>${[0, 1, 2].map((i) => cell(s, i)).join('')}</tr>`).join('')
  const top = w.top.length
    ? `<ol data-what-wins>${w.top.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`
    : `<p data-what-wins-none>No situation has enough games yet — play more (npm run ai:arena -- --games 200).</p>`
  return `<h2>What wins? <span class="dim">(players win ${pct(w.baseRate)} of their games on average)</span></h2>
<section class="card">${top}</section>
<p class="dim">${w.theWin.length ? `${w.theWin.map(esc).join(', ')} at the end decide${w.theWin.length === 1 ? 's' : ''} who wins by ${w.theWin.length === 1 ? 'itself' : 'themselves'} — the score itself, so not in the list. ` : ''}These go with winning; they don't prove they cause it — change a goal and run again to check.</p>
${w.leftOut.length ? `<p class="dim" data-what-wins-left="${w.leftOut.length}">Left out: ${w.leftOut.map(esc).join(' · ')}</p>` : ''}
<div class="scroll"><table class="wins"><tr><th>situation</th><th>when</th><th>winner had more</th><th>low</th><th>mid</th><th>high</th></tr>${rows}</table></div>`
}

export function reportHtml(r: CheckReport): string {
  const names = Object.keys(r.tell.grid)
  const feelRows = Object.entries(r.feel)
    .map(([p, list]) => {
      const passed = list.filter((t) => t.pass).length
      const items = list
        .map((t) => `<li>${mark(t.pass)} ${esc(t.label)} <span class="dim">— ${esc(t.meter)} ${t.measured}${t.op === 'beats' ? ` (wins ${Math.round(t.measured * 100)}% of its games with the ${esc(t.against ?? '')}; target ${Math.round((t.value ?? 0.5) * 100)}%)` : t.extremes ? (t.extremes.length ? ` (extreme on: ${t.extremes.map(esc).join(', ')})` : '') : t.op === 'nearAverage' && t.rival ? ` (table average ${t.rival.measured}, within ${t.value})` : t.rival ? ` (next best: ${esc(t.rival.personality)} ${t.rival.measured})` : t.value !== undefined ? ` (target ${t.op} ${t.value})` : ''}</span></li>`)
        .join('')
      return `<section class="card"><h3>${esc(p)} <span class="${passed === list.length ? 'ok' : 'no'}">${passed}/${list.length}</span></h3><ul>${items}</ul></section>`
    })
    .join('')
  const grid = `<table><tr><th>played ↓ · guessed →</th>${names.map((n) => `<th>${esc(n)}</th>`).join('')}<th>right</th></tr>${names
    .map((a) => `<tr><th>${esc(a)}</th>${names.map((b) => `<td class="${a === b ? 'diag' : r.tell.grid[a][b] ? 'off' : ''}">${r.tell.grid[a][b]}</td>`).join('')}<td>${pct(r.tell.accuracy[a])}</td></tr>`)
    .join('')}</table>`
  const h2h = Object.keys(r.wins.overall)
  const winTable = `<table><tr><th>win share</th>${h2h.map((n) => `<th>${esc(n)}</th>`).join('')}<th>overall</th><th>skill ladder</th></tr>${h2h
    .map((a) => `<tr><th>${esc(a)}</th>${h2h.map((b) => (a === b ? '<td class="dim">—</td>' : `<td>${r.wins.headToHead[a]?.[b] !== undefined ? pct(r.wins.headToHead[a][b]) : ''}</td>`)).join('')}<td>${pct(r.wins.overall[a])}</td><td>${r.ladder[a] !== undefined ? pct(r.ladder[a]) : ''}</td></tr>`)
    .join('')}</table>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Personality Check</title><style>
:root{--bg:#f6f3ee;--card:#fff;--ink:#2a2622;--dim:#857c72;--ok:#2f7d4f;--no:#b4432f;--line:#e2dbd1;--diag:#dcefe2;--off:#f7e1dc}
@media (prefers-color-scheme:dark){:root{--bg:#171a22;--card:#20242e;--ink:#ece6dc;--dim:#9a93a0;--ok:#6fcf97;--no:#f08a76;--line:#323848;--diag:#1f3b2c;--off:#45251f}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}main{max-width:1000px;margin:0 auto;padding:24px 16px}
h1{margin:0 0 4px}h2{margin:32px 0 8px}.dim{color:var(--dim)}.ok{color:var(--ok);font-weight:600}.no{color:var(--no);font-weight:600}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.card h3{margin:0 0 6px}ul{margin:0;padding-left:18px}li{margin:2px 0}.scroll{overflow-x:auto}
table{border-collapse:collapse;background:var(--card);border-radius:8px}th,td{border:1px solid var(--line);padding:6px 10px;text-align:center}td.diag{background:var(--diag)}td.off{background:var(--off)}table.wins td,table.wins th{white-space:nowrap}
pre{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;white-space:pre-wrap;font-size:13px}
</style></head><body><main>
<h1>${esc(r.title)}</h1><p class="dim">${esc(r.subtitle)}</p>
<h2>For all of them</h2><ul>${r.all.map((a) => `<li>${mark(a.pass)} ${esc(a.label)} <span class="dim">— ${esc(a.detail)}</span></li>`).join('')}</ul>
<h2>Does each one feel like itself?</h2><div class="cards">${feelRows}</div>
<h2>Can you tell them apart? <span class="dim">(${pct(r.tell.overall)} guessed right from behaviour alone)</span></h2><div class="scroll">${grid}</div>
<h2>Does everyone win sometimes?</h2><div class="scroll">${winTable}</div>
${r.whatWins ? whatWinsHtml(r.whatWins) : ''}
${r.notes?.length ? `<h2>How they think (one game)</h2><pre>${r.notes.map(esc).join('\n')}</pre>` : ''}
</main></body></html>`
}
