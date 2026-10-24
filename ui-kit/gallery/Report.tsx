// REPORT SAMPLES (0.31.0) — report rows one at a time (Goops' payslip, F41).
// ?screen=payslip: a Modal holding a StatList — the day's wage, five deductions (danger), the debt, net pay and a rank
//   up (success), arriving one row after another. Continue waits for onRevealed (it's there, greyed, from the start, so
//   the card never grows); Replay runs the reveal again.
// ?screen=victoryreveal: Victory with reveal — the same rows, the same motion.
// The ms per row is a tuning number, kept in content/ like a game's would be (gallery/content/tuning/report.json).
import { useState } from 'react'
import { Button, Modal, screens, ScrollArea, StatList, Victory, type Stat } from '../kit'
import report from './content/tuning/report.json'

const payslip: Stat[] = [
  { label: 'Day wage', value: '$140' },
  { label: 'Rent', value: '−$35', tone: 'danger' },
  { label: 'Goop cleanup', value: '−$12', tone: 'danger' },
  { label: 'Air tax', value: '−$8', tone: 'danger' },
  { label: 'Uniform hire', value: '−$5', tone: 'danger' },
  { label: 'Late fine', value: '−$10', tone: 'danger' },
  { label: 'Debt to the company', value: '$1,240', tone: 'danger' },
  { label: 'Net pay', value: '$70', tone: 'success' },
  { label: 'Rank up', value: 'Scrubber', tone: 'success' },
]

export function PayslipSample() {
  const [run, setRun] = useState(0) // a new run = a fresh reveal
  const [revealed, setRevealed] = useState(false)
  const replay = () => { setRevealed(false); setRun((n) => n + 1) }
  return (
    <Modal title="Day 4 payslip" onBack={() => screens.pop()} actions={<>
      <Button variant="secondary" onClick={replay}>Replay</Button>
      <Button disabled={!revealed} onClick={() => screens.pop()}>Continue</Button>
    </>}>
      <ScrollArea label="Day 4 payslip" max="l">
        <StatList key={run} stats={payslip} reveal={report.revealMs} onRevealed={() => setRevealed(true)} words={{ danger: 'Deducted', success: 'Gained' }} />
      </ScrollArea>
    </Modal>
  )
}

const victoryStats: Stat[] = [
  { label: 'Goop cleared', value: '84%' },
  { label: 'Spills', value: '3', tone: 'danger' },
  { label: 'Best streak', value: '12', tone: 'success' },
  { label: 'Time', value: '6:42' },
]

export function VictoryRevealSample() {
  return <Victory message="The vat is clean. Shift over." stats={victoryStats} reveal={report.revealMs}
    onContinue={() => screens.pop()} onQuit={() => screens.pop()} />
}
