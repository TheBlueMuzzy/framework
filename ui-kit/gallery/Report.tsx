// REPORT SAMPLES (0.31.0) — report rows one at a time (Goops' payslip, F41).
// ?screen=payslip: a Modal holding a StatList — the day's wage, five deductions (danger), the debt, net pay and a rank
//   up (success), arriving one row after another. Continue waits for onRevealed (it's there, greyed, from the start, so
//   the card never grows); Replay runs the reveal again; Next payday (0.32.0) swaps in the next day's rows with no
//   key — the reveal replays by itself because the rows' words changed.
// ?screen=victoryreveal: Victory with reveal — the same motion, a list too long for a phone (it scrolls; the scroll
//   follows the newest row until you scroll it yourself).
// The ms per row is a tuning number, kept in content/ like a game's would be (gallery/content/tuning/report.json).
import { useState } from 'react'
import { Button, Modal, screens, ScrollArea, StatList, Victory, type Stat } from '../kit'
import report from './content/tuning/report.json'

// Day 4's payslip; each "Next payday" is a new day — new numbers under the same labels
const ranks = ['Scrubber', 'Scrubber', 'Senior scrubber', 'Vat hand']
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US')}`
function payslip(day: number): Stat[] {
  const step = day - 4
  const wage = 140 + step * 10, fine = 10 - (step % 2) * 10, debt = 1240 - step * 30
  return [
    { label: 'Day wage', value: money(wage) },
    { label: 'Rent', value: money(-35), tone: 'danger' },
    { label: 'Goop cleanup', value: money(-12), tone: 'danger' },
    { label: 'Air tax', value: money(-8), tone: 'danger' },
    { label: 'Uniform hire', value: money(-5), tone: 'danger' },
    { label: 'Late fine', value: money(-fine), tone: 'danger' },
    { label: 'Debt to the company', value: money(debt), tone: 'danger' },
    { label: 'Net pay', value: money(wage - 35 - 12 - 8 - 5 - fine), tone: 'success' },
    { label: 'Rank up', value: ranks[step % ranks.length], tone: 'success' },
  ]
}

export function PayslipSample() {
  const [day, setDay] = useState(4)
  const [run, setRun] = useState(0) // Replay = the SAME rows again, so it takes a fresh StatList (a key)
  const [revealed, setRevealed] = useState(false)
  const replay = () => { setRevealed(false); setRun((n) => n + 1) }
  // Next payday swaps the rows WITHOUT a key (0.32.0): rows with new words replay the reveal by themselves
  const nextPayday = () => { setRevealed(false); setDay((d) => d + 1) }
  const title = `Day ${day} payslip`
  return (
    <Modal title={title} onBack={() => screens.pop()} actions={<>
      <Button variant="secondary" onClick={replay}>Replay</Button>
      <Button variant="secondary" disabled={!revealed} onClick={nextPayday}>Next payday</Button>
      <Button disabled={!revealed} onClick={() => screens.pop()}>Continue</Button>
    </>}>
      <ScrollArea label={title} max="l">
        <StatList key={run} stats={payslip(day)} reveal={report.revealMs} onRevealed={() => setRevealed(true)} words={{ danger: 'Deducted', success: 'Gained' }} />
      </ScrollArea>
    </Modal>
  )
}

// A long list with long names (0.31.0, Goops' end-of-day case: more rows than a phone has room for), so the
// ScrollArea shows: the title, message and buttons stay in sight; the rows scroll and the reveal follows the newest one.
const victoryStats: Stat[] = [
  { label: 'Gross pay', value: '$140' },
  { label: 'Fine: unauthorised goop contact (Vat Hygiene Compliance Division)', value: '−$25', tone: 'danger' },
  { label: 'Fine: excess breathing surcharge (Breathable Air Holdings Ltd)', value: '−$12', tone: 'danger' },
  { label: 'Fine: uniform wear recovery (Consolidated Garment Services)', value: '−$8', tone: 'danger' },
  { label: 'Rent: company dormitory, block C', value: '−$35', tone: 'danger' },
  { label: 'Debt to the company', value: '$1,240', tone: 'danger' },
  { label: 'Goop cleared', value: '84%' },
  { label: 'Best streak', value: '12', tone: 'success' },
  { label: 'Net pay', value: '$60', tone: 'success' },
]

export function VictoryRevealSample() {
  return <Victory message="The vat is clean. Shift over." stats={victoryStats} reveal={report.revealMs}
    onContinue={() => screens.pop()} onQuit={() => screens.pop()} />
}
