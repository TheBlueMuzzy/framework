// Arrow keys on a menu: ↑ / ↓ jump from control to control (never to words), ← / → work the focused control,
// and a box you type in keeps its arrows. Also <Screen scroll>: the whole screen scrolls, focus moves bring things into view.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Button, ListRow, Panel, Screen, ScreenStack, ScrollArea, Selector, Stepper, Text, TextInput, Toggle, screens } from '.'

afterEach(() => {
  cleanup()
  while (screens.current.length) screens.pop()
})

// Like a game's New Game screen: a title, words, rows with a Stepper / Selector / Toggle, a box to type in, Start
function NewGame() {
  const [players, setPlayers] = useState(2)
  const [board, setBoard] = useState('Small')
  const [music, setMusic] = useState(false)
  return (
    <Screen label="New game">
      <Panel>
        <Text kind="title">New game</Text>
        <Button variant="secondary">Back</Button>
        <ScrollArea label="Options">
          <ListRow label="Players" detail="How many sit at the table"><Stepper label="Players" value={players} min={2} max={4} onChange={setPlayers} /></ListRow>
          <Text kind="caption">Some words between the rows</Text>
          <ListRow label="Board"><Selector label="Board" options={['Small', 'Medium', 'Large']} value={board} onChange={setBoard} /></ListRow>
          <ListRow label="Music"><Toggle label="Music" on={music} onChange={setMusic} /></ListRow>
          <TextInput label="Name" aria-label="Name" defaultValue="Ann" />
        </ScrollArea>
        <Button disabled>Can't start</Button>
        <Button>Start</Button>
      </Panel>
    </Screen>
  )
}

const press = (key: string) => fireEvent.keyDown(document.activeElement ?? document.body, { key })
const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent

function openNewGame() {
  render(<ScreenStack screens={{ newGame: NewGame }}><button>Game button</button></ScreenStack>)
  act(() => screens.push('newGame'))
  expect(focusedName()).toBe('Back') // the screen opened with its first button focused
}

describe('arrow keys on a screen', () => {
  it('↓ / ↑ jump from control to control, skipping words and disabled buttons, and wrap at the ends', () => {
    openNewGame()
    const seen = ['Back']
    for (let i = 0; i < 4; i++) { press('ArrowDown'); seen.push(focusedName()!) }
    // Back → Players → Board → Music → Name box (the title, the captions and the words between rows are skipped)
    expect(seen).toEqual(['Back', 'Players', 'Board', 'Music', 'Name'])
    // (the Name box keeps its own arrows — see below — so Tab leaves it)
    press('ArrowUp')
    expect(focusedName()).toBe('Name')
    screen.getByText('Start').focus()
    press('ArrowUp')
    expect(focusedName()).toBe('Name') // "Can't start" (disabled) is skipped
    screen.getByText('Start').focus()
    press('ArrowDown')
    expect(focusedName()).toBe('Back') // past the last: round to the first
    press('ArrowUp')
    expect(focusedName()).toBe('Start') // and back the other way
  })

  it('never moves the focus of the screen underneath, or the game', () => {
    openNewGame()
    press('ArrowUp')
    expect(screen.getByText('Game button')).not.toBe(document.activeElement)
  })

  it('← / → step a Selector, a Stepper and a Toggle', () => {
    openNewGame()
    press('ArrowDown') // Players
    press('ArrowRight')
    expect(screen.getByRole('group', { name: 'Players' }).textContent).toContain('3')
    press('ArrowDown') // Board
    press('ArrowRight')
    expect(screen.getByRole('group', { name: 'Board' }).textContent).toContain('Medium')
    press('ArrowLeft')
    press('ArrowLeft')
    expect(screen.getByRole('group', { name: 'Board' }).textContent).toContain('Large') // wraps round
    press('ArrowDown') // Music
    const music = screen.getByRole('switch', { name: 'Music' })
    press('ArrowRight')
    expect(music.getAttribute('aria-checked')).toBe('true')
    press('ArrowRight')
    expect(music.getAttribute('aria-checked')).toBe('true') // → is "on", not "flip"
    press('ArrowLeft')
    expect(music.getAttribute('aria-checked')).toBe('false')
  })

  it('a Selector whose ◀ was clicked still steps with ← / →, and ↓ moves on from it', () => {
    openNewGame()
    const next = screen.getByRole('button', { name: 'Next Board' })
    next.focus() // a click focuses the arrow itself
    press('ArrowRight')
    expect(screen.getByRole('group', { name: 'Board' }).textContent).toContain('Medium')
    press('ArrowDown')
    expect(focusedName()).toBe('Music')
  })

  it('a box you type in keeps all its arrows (for the text caret)', () => {
    openNewGame()
    const name = screen.getByRole('textbox', { name: 'Name' })
    name.focus()
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
      const handled = !fireEvent.keyDown(name, { key }) // fireEvent returns false when preventDefault was called
      expect(handled).toBe(false)
      expect(document.activeElement).toBe(name)
    }
  })

  it('stops the page scrolling when it moves the focus', () => {
    openNewGame()
    expect(fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })).toBe(false) // default prevented
  })
})

describe('arrow keys with no screen open', () => {
  it('move inside a menu Panel, and leave the rest of the game alone', () => {
    render(
      <ScreenStack screens={{}}>
        <Panel><Button>Play</Button><Text>Words</Text><Button>Rules</Button></Panel>
        <button>Board cell</button>
      </ScreenStack>,
    )
    screen.getByText('Play').focus()
    press('ArrowDown')
    expect(focusedName()).toBe('Rules')
    screen.getByText('Board cell').focus()
    expect(fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })).toBe(true) // not touched: the game's key
    expect(focusedName()).toBe('Board cell')
  })
})

describe('<Screen scroll>', () => {
  function Tall() {
    return (
      <Screen scroll label="Tall menu">
        <Panel>
          <Button>Back</Button>
          {Array.from({ length: 12 }, (_, i) => <ListRow key={i} label={`Rule ${i + 1}`}><Toggle label={`Rule ${i + 1}`} on={false} onChange={() => {}} /></ListRow>)}
          <Button>Start</Button>
        </Panel>
      </Screen>
    )
  }

  it('marks the screen as the scroller (kit.css: scrolls, no scroll bar, centre from the top)', () => {
    render(<Tall />)
    const box = screen.getByRole('region', { name: 'Tall menu' })
    expect(box.hasAttribute('data-scroll')).toBe(true)
    expect(box.querySelector('.kit-scroll')).toBeNull() // no inner ScrollArea: the panel's own buttons scroll with it
  })

  it('↓ / ↑ bring the focused control (its whole row) into view inside it', () => {
    const shown: Element[] = []
    const real = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function () { shown.push(this) }
    try {
      render(<ScreenStack screens={{ tall: Tall }} />)
      act(() => screens.push('tall'))
      press('ArrowUp') // from Back, round to Start at the bottom
      expect(focusedName()).toBe('Start')
      expect(shown.at(-1)?.textContent).toBe('Start')
      press('ArrowUp')
      expect(shown.at(-1)?.classList.contains('kit-listrow')).toBe(true)
      expect(shown.at(-1)?.textContent).toContain('Rule 12')
    } finally {
      Element.prototype.scrollIntoView = real
    }
  })

  it('in overlay mode, a stray tap on its empty space never closes it (a form would lose its choices) — Back / Esc do', () => {
    render(<ScreenStack overlay screens={{ tall: Tall }} />)
    act(() => screens.push('tall'))
    fireEvent.click(screen.getByText('Start'))
    act(() => { fireEvent.click(screen.getByRole('region', { name: 'Tall menu' })) })
    expect(screens.current).toEqual(['tall'])
  })

  it("a tool beside the stack keeps its arrows while a screen is open (the Dev Kit's sliders)", () => {
    render(<><ScreenStack screens={{ tall: Tall }} /><input type="range" aria-label="Tool slider" /></>)
    act(() => screens.push('tall'))
    const slider = screen.getByLabelText('Tool slider')
    act(() => slider.focus())
    const event = fireEvent.keyDown(slider, { key: 'ArrowDown' })
    expect(event).toBe(true) // not prevented: the slider steps
    expect(document.activeElement).toBe(slider)
  })
})
