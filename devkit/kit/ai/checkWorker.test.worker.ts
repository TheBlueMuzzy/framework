// A real worker thread for checkWorker.test.ts (Node runs this TypeScript as it is): a pretend game's check that keeps
// its thread busy for 40 ms a game, like real AI-vs-AI games do — so the test can show the main thread stays free.
import { parentPort } from 'node:worker_threads'
import { serveCheck, type CheckWorkerLike } from './checkWorker.ts'

const port = parentPort!
const scope: CheckWorkerLike = {
  postMessage: (message) => port.postMessage(message),
  addEventListener: ((type: string, listener: (event: { data: unknown }) => void) => {
    if (type === 'message') port.on('message', (data) => listener({ data }))
  }) as CheckWorkerLike['addEventListener'],
}

serveCheck(scope, (job, onProgress) => {
  if (job.games === 13) throw new Error('unlucky number of games')
  for (let g = 1; g <= job.games; g++) {
    const until = Date.now() + 40
    while (Date.now() < until) { /* busy, like a game being played */ }
    onProgress(g, job.games)
  }
  return `<p>${job.games} games: ${job.personalities.map((p) => p.id).join(', ')}</p>`
})
