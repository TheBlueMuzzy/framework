// RUN THE PERSONALITY CHECK — plays N AI-vs-AI games with the personalities and skills as they are in the tab right
// now (unsaved changes too) and opens the report page in a new browser tab. The game does the playing (its runCheck
// callback, played in a Web Worker so the screen stays alive — checkWorker.ts does both ends); this shows progress and
// the link.
import { useEffect, useState } from 'react'
import type { AiPersonality, AiSkill, DevKitAi } from './aiTypes'

const GAME_CHOICES = [6, 20, 60] // a quick look · a fair read · a proper check (slow)

/** "What wins?" (AI kit 0.6.0) read off the report page itself — its sentences sit in `[data-what-wins] li` — so a
 *  game's runCheck stays as it is (it returns the page). An older report has none: null, the panel shows nothing. */
export function whatWinsFrom(html: string): { top: string[]; none: boolean; leftOut: number } | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const list = doc.querySelector('[data-what-wins]')
  const none = !!doc.querySelector('[data-what-wins-none]')
  if (!list && !none) return null
  const leftOut = Number(doc.querySelector('[data-what-wins-left]')?.getAttribute('data-what-wins-left') ?? 0)
  return { top: list ? [...list.querySelectorAll('li')].map((li) => li.textContent ?? '') : [], none, leftOut }
}

type Props = {
  runCheck: NonNullable<DevKitAi['runCheck']>
  personalities: AiPersonality[]
  skills: AiSkill[]
}

export function CheckPanel({ runCheck, personalities, skills }: Props) {
  const [games, setGames] = useState(GAME_CHOICES[0])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wins, setWins] = useState<ReturnType<typeof whatWinsFrom>>(null)

  useEffect(() => () => { if (reportUrl) URL.revokeObjectURL(reportUrl) }, [reportUrl])

  async function run() {
    setError(null)
    setReportUrl(null)
    setWins(null)
    setProgress({ done: 0, total: games })
    try {
      const html = await runCheck({ games, personalities, skills, onProgress: (done, total) => setProgress({ done, total }) })
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      setReportUrl(url)
      setWins(whatWinsFrom(html))
      window.open(url, '_blank') // may be blocked (it isn't straight after a click) — the link below always works
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="ai-check">
      <p className="tt-help">
        Plays AI-vs-AI games with the personalities as they are here (unsaved changes too) and checks each one's feel
        targets, tell-apart, wins and the skill ladder — and, when the game names its situations, what wins. The
        report opens in a new tab.
      </p>
      <div className="ai-watch-bar">
        <label>
          Games{' '}
          <select value={games} onChange={(e) => setGames(Number(e.target.value))} disabled={!!progress}>
            {GAME_CHOICES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="devkit-btn devkit-btn-main" onClick={run} disabled={!!progress}>
          {progress ? `Playing… ${progress.done}/${progress.total}` : 'Run check'}
        </button>
      </div>
      {progress && (
        <span className="ai-bar ai-bar-progress" role="progressbar" aria-valuenow={progress.done} aria-valuemax={progress.total}>
          <span className="ai-bar-fill" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
        </span>
      )}
      {reportUrl && (
        <p className="devkit-status is-ok">
          Done — <a href={reportUrl} target="_blank" rel="noreferrer" className="ai-link">open the report</a>
        </p>
      )}
      {wins && (
        <div className="ai-wins">
          <div className="ai-wins-title">What wins?</div>
          {wins.top.length > 0 && <ol className="ai-wins-list">{wins.top.map((line, i) => <li key={i}>{line}</li>)}</ol>}
          {wins.none && <p className="ai-wins-none">No situation has enough games yet — try 60 games, or npm run ai:arena on the PC.</p>}
          {wins.leftOut > 0 && <p className="ai-wins-none">{wins.leftOut} left out for too few games (listed on the report).</p>}
        </div>
      )}
      {error && <p className="devkit-status is-error">The check stopped: {error}</p>}
    </div>
  )
}
