// HUD logic: English place names, and the +N float-up appearing when a number changes.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Bar, Counter, Hud, HudText, ordinal, Pause, PlayerChip, PlayerSeats, Score, TurnBanner } from './hud'
import { Row, Stack } from '../layout'
import { Avatar, Text } from '../controls'
import { toMilliseconds } from './motion'

afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-reduce-motion') })

describe('ordinal', () => {
  it('names places the English way', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st'])
  })
})

describe('Counter', () => {
  it('floats up the difference when the number changes, and nothing at the start', () => {
    const { container, rerender } = render(<Counter label="Coins" value={10} />)
    expect(container.querySelector('.kit-float-up')).toBeNull()
    rerender(<Counter label="Coins" value={15} />)
    expect(container.querySelector('.kit-float-up')?.textContent).toBe('+5')
    rerender(<Counter label="Coins" value={12} />)
    expect([...container.querySelectorAll('.kit-float-up')].map((f) => f.textContent)).toEqual(['+5', '−3'])
  })
})

describe('toMilliseconds', () => {
  it('reads a style motion time', () => {
    expect([toMilliseconds('420ms'), toMilliseconds('0.3s'), toMilliseconds(' 90ms '), toMilliseconds('', 300)]).toEqual([420, 300, 90, 300])
  })
})

describe('PlayerChip', () => {
  it('shows avatar, name, badge, detail and score; reads the score out', () => {
    const { container } = render(<PlayerChip name="Muzzy" color="#e8553d" score={12} detail="S2 · T5" badge="Bot" active />)
    expect(container.querySelector('.kit-avatar')?.getAttribute('aria-label')).toBe('Muzzy')
    expect(container.textContent).toContain('S2 · T5')
    expect(container.textContent).toContain('Bot')
    expect(container.querySelector('[aria-label="12 points"]')).toBeTruthy()
    expect(container.querySelector('.kit-player-chip')?.getAttribute('data-state')).toBe('active')
  })
  it('keeps room for its biggest score from the start (scoreDigits, default 2), and the avatar knows it has its own colour', () => {
    const digits = (el: Element) => (el.querySelector('.kit-float-anchor') as HTMLElement).style.getPropertyValue('--kit-digits')
    const { container, rerender } = render(<PlayerChip name="Muzzy" color="#e8553d" score={3} />)
    expect(digits(container)).toBe('2')
    rerender(<PlayerChip name="Muzzy" color="#e8553d" score={3} scoreDigits={3} />)
    expect(digits(container)).toBe('3')
    expect(container.querySelector('.kit-avatar')?.hasAttribute('data-color')).toBe(true)
  })
  it('a goal chip: an icon instead of the avatar', () => {
    const { container } = render(<PlayerChip name="Goal" icon="◎" score={30} />)
    expect(container.querySelector('.kit-avatar')).toBeNull()
    expect(container.textContent).toContain('◎')
  })
  it('avatar={false} and showName={false} leave just the score', () => {
    const { container } = render(<PlayerChip name="Goal" avatar={false} showName={false} score={30} />)
    expect(container.querySelector('.kit-avatar')).toBeNull()
    expect(container.querySelector('.kit-player-chip-text')).toBeNull()
  })
  it('dim marks it faded', () => {
    const { container } = render(<PlayerChip name="Sam" dim />)
    expect(container.querySelector('.kit-player-chip')?.hasAttribute('data-dim')).toBe(true)
  })
  it('floatUps={false}: a rising score floats no "+N" (the game flies its own points in)', () => {
    const { container, rerender } = render(<PlayerChip name="Sam" score={5} floatUps={false} />)
    rerender(<PlayerChip name="Sam" score={8} floatUps={false} />)
    expect(container.querySelector('.kit-float-up')).toBeNull()
  })
  it('with reduce motion on, a rising score jumps straight to its new value', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const { container, rerender } = render(<PlayerChip name="Sam" score={5} />)
    rerender(<PlayerChip name="Sam" score={9} />)
    expect(container.querySelector('.kit-player-chip-score .kit-text')?.textContent).toBe('9')
  })
})

describe('HudText', () => {
  it('is plain words read out politely: no panel, no badge, no button', () => {
    const { container } = render(<HudText detail="Tap a die to keep it">Hold to Roll</HudText>)
    const box = container.querySelector('.kit-hud-text')
    expect(box?.getAttribute('aria-live')).toBe('polite')
    expect(box?.textContent).toBe('Hold to RollTap a die to keep it')
    expect(container.querySelector('.kit-panel, .kit-badge, .kit-hud-chip, button')).toBeNull()
  })
  it('sizes s/m/l pick the text size; tone accent is marked', () => {
    const kinds = (['s', 'm', 'l'] as const).map((size) => {
      const { container } = render(<HudText size={size}>Round 1</HudText>)
      return container.querySelector('.kit-text')?.getAttribute('data-kind')
    })
    expect(kinds).toEqual(['label', 'heading', 'title'])
    const { container } = render(<HudText tone="accent">Locked 1!</HudText>)
    expect(container.querySelector('.kit-hud-text')?.getAttribute('data-tone')).toBe('accent')
  })
  it('live (0.14.1): a changing reading keeps its words box (no entrance each change) and is not read out each time', () => {
    const { container, rerender } = render(<HudText live>72%</HudText>)
    const first = container.querySelector('.kit-stack')
    rerender(<HudText live>71%</HudText>)
    expect(container.querySelector('.kit-stack')).toBe(first) // the same box: its entrance animation doesn't replay
    expect(container.textContent).toBe('71%')
    expect(container.querySelector('.kit-hud-text')?.getAttribute('aria-live')).toBe('off')
    rerender(<HudText>Round 1</HudText>)
    const plain = container.querySelector('.kit-stack')
    rerender(<HudText>Round 2</HudText>)
    expect(container.querySelector('.kit-stack')).not.toBe(plain) // plain HudText still pops in again
  })
  it('TurnBanner variant="plain" is HudText, not a panel', () => {
    const { container } = render(<TurnBanner variant="plain" text="Sam's turn" />)
    expect(container.querySelector('.kit-panel')).toBeNull()
    expect(container.querySelector('.kit-hud-text')?.textContent).toBe("Sam's turn")
  })
})

describe('Bar width', () => {
  it('width names the bar length for the CSS; no width = fills its room, as before', () => {
    const { container, rerender } = render(<Bar label="Time" value={50} />)
    const chip = () => container.querySelector('.kit-hud-chip')
    expect(chip()?.hasAttribute('data-width')).toBe(false)
    rerender(<Bar label="Time" value={50} width="s" />)
    expect(chip()?.getAttribute('data-width')).toBe('s')
  })
})

describe('Bar showLabel', () => {
  it('prints the label beside the bar only when asked (screen readers already get it from the bar)', () => {
    const { container, rerender } = render(<Bar label="Tank" value={50} />)
    expect(container.querySelector('.kit-bar-label')).toBeNull()
    rerender(<Bar label="Tank" value={50} showLabel />)
    expect(container.querySelector('.kit-bar-label')?.textContent).toBe('Tank')
  })
})

describe('Bar 0.17.0: share, label above / inside, thickness, plain, alert', () => {
  it('a number width is a share of the row, passed to the CSS', () => {
    const { container } = render(<Bar label="Laser" value={50} width={0.24} plain />)
    const bar = container.querySelector<HTMLElement>('.kit-bar')!
    expect(bar.getAttribute('data-width')).toBe('share')
    expect(bar.style.getPropertyValue('--kit-bar-share')).toBe('0.24')
    expect(container.querySelector('.kit-hud-chip')).toBeNull() // plain = no plate
  })
  it('labelAt above prints the label before the bar; inside puts it in the bar; showLabel still means beside', () => {
    const { container, rerender } = render(<Bar label="Laser" value={50} labelAt="above" plain />)
    expect(container.querySelector('.kit-bar-label-above')?.textContent).toBe('Laser')
    expect(container.querySelector('.kit-bar')?.firstElementChild?.className).toBe('kit-bar-label-above')
    rerender(<Bar label="Integrity" value={50} labelAt="inside" plain />)
    expect(container.querySelector('.kit-bar-inside .kit-bar-label-inside')?.textContent).toBe('Integrity')
    expect(container.querySelector('.kit-bar-inside .kit-progress')).not.toBeNull()
    rerender(<Bar label="Tank" value={50} showLabel />)
    expect(container.querySelector('.kit-bar-label')?.textContent).toBe('Tank')
    expect(container.querySelector('.kit-hud-chip')?.getAttribute('data-label-at')).toBe('beside')
  })
  it('thickness and alert are named for the CSS; the bar is still one progressbar for screen readers', () => {
    const { container } = render(<Bar label="Visor" value={20} thickness="m" alert="pulse" variant="danger" plain />)
    const bar = container.querySelector('.kit-bar')!
    expect(bar.getAttribute('data-thickness')).toBe('m')
    expect(bar.getAttribute('data-alert')).toBe('pulse')
    expect(screen.getAllByRole('progressbar')).toHaveLength(1)
  })
})

// (their CSS rules: blocksCss.test.mjs)
describe('0.25.0 (Goops): Bar atMost + Hud dockTight', () => {
  it('atMost turns a share into "at most its share" (data-width="at-most"), the share still passed to the CSS', () => {
    const { container, rerender } = render(<Bar label="Laser" value={50} width={0.3} atMost plain />)
    const bar = container.querySelector<HTMLElement>('.kit-bar')!
    expect(bar.getAttribute('data-width')).toBe('at-most')
    expect(bar.style.getPropertyValue('--kit-bar-share')).toBe('0.3')
    rerender(<Bar label="Laser" value={50} width="m" atMost plain />) // no share: atMost means nothing
    expect(container.querySelector('.kit-bar')!.getAttribute('data-width')).toBe('m')
  })

  it('dockTight marks the dock (data-tight) and its CSS uses the small gap style name', () => {
    const { container, rerender } = render(<Hud dock={<Bar label="Integrity" value={80} plain />} dockTight />)
    expect(container.querySelector('.kit-hud-dock')!.hasAttribute('data-tight')).toBe(true)
    rerender(<Hud dock={<Bar label="Integrity" value={80} plain />} />)
    expect(container.querySelector('.kit-hud-dock')!.hasAttribute('data-tight')).toBe(false)
  })
})

describe('Hud oneRow + dock', () => {
  it('oneRow marks the status slot; dock adds a panel beside the screen (bottom by default)', () => {
    const { container, rerender } = render(<Hud status={<HudText fit>Cracks 0 / 10</HudText>} oneRow dock={<Bar label="Integrity" value={80} plain />} />)
    expect(container.querySelector('[data-slot="top"] > .kit-hud-slot[data-one-row]')).not.toBeNull()
    const dock = container.querySelector('.kit-hud-dock')!
    expect(dock.getAttribute('data-side')).toBe('bottom')
    expect(dock.querySelector('.kit-panel .kit-bar')).not.toBeNull()
    expect(dock.previousElementSibling?.classList.contains('kit-screen')).toBe(true)
    rerender(<Hud status={<HudText>Round 1</HudText>} dock={<Bar label="Integrity" value={80} plain />} dockSide="right" />)
    expect(container.querySelector('.kit-hud-dock')?.getAttribute('data-side')).toBe('right')
    expect(container.querySelector('[data-one-row]')).toBeNull()
    rerender(<Hud status={<HudText>Round 1</HudText>} />)
    expect(container.querySelector('.kit-hud-dock')).toBeNull()
  })
})

describe('HudText fit / numbers, Score compact', () => {
  it('fit and numbers are named for the CSS', () => {
    const { container } = render(<HudText fit numbers>10% PRESS</HudText>)
    const el = container.querySelector('.kit-hud-text')!
    expect(el.hasAttribute('data-fit')).toBe(true)
    expect(el.hasAttribute('data-numbers')).toBe(true)
  })
  it('compact shows just the number; the word is still the group name', () => {
    const { container } = render(<Score value={1234} compact />)
    expect(container.querySelector('[data-kind="caption"]')).toBeNull()
    expect(screen.getByRole('group', { name: 'Score' })).toBeTruthy()
  })
})

describe('PlayerChip xs', () => {
  it('xs puts name, badge and detail on one line; other sizes keep the detail below', () => {
    const lines = (size: 'xs' | 's') => {
      const { container, unmount } = render(<PlayerChip name="Bolt" badge="Bot" detail="S2 · T5" size={size} />)
      const text = container.querySelector('.kit-player-chip-text')!
      const result = [...text.children].map((line) => line.textContent)
      unmount()
      return result
    }
    expect(lines('xs')).toEqual(['BoltBotS2 · T5'])
    expect(lines('s')).toEqual(['BoltBot', 'S2 · T5'])
  })

  it('no empty name line when only the detail shows (no stray gap above it)', () => {
    const { container } = render(<PlayerChip name="Sam" showName={false} detail="S2 · T5" size="s" />)
    expect([...container.querySelector('.kit-player-chip-text')!.children].map((line) => line.textContent)).toEqual(['S2 · T5'])
  })
})

describe('Pause', () => {
  it('note: one quiet caption under the title, above the buttons — none without it', () => {
    const { rerender } = render(<Pause onQuit={() => {}} />)
    expect(document.querySelector('.kit-modal [data-kind="caption"]')).toBeNull()
    rerender(<Pause onQuit={() => {}} note="Small garden · 2-letter words off" />)
    expect(screen.getByText('Small garden · 2-letter words off').getAttribute('data-kind')).toBe('caption')
    const order = [...document.querySelector('.kit-modal')!.children].map((child) => child.getAttribute('data-kind') ?? child.className)
    expect(order.indexOf('caption')).toBeGreaterThan(order.indexOf('kit-menu-header')) // (the title sits in the header, 0.10.0)
    expect(order.indexOf('caption')).toBeLessThan(order.findIndex((name) => name.split(' ').includes('kit-menu')))
  })

  it('items: the game’s own rows sit after How to play and before Quit; a disabled one stays visible but can’t be pressed (0.8.0)', () => {
    let pressed = 0
    render(<Pause onHowToPlay={() => {}} onQuit={() => {}} items={[{ label: 'Submit a word', onClick: () => pressed++ }, { label: 'Later', onClick: () => pressed++, disabled: true }]} />)
    const labels = [...document.querySelectorAll('.kit-menu button')].map((b) => b.textContent)
    expect(labels).toEqual(['Resume', 'How to play', 'Submit a word', 'Later', 'Quit'])
    screen.getByText('Submit a word').closest('button')!.click()
    screen.getByText('Later').closest('button')!.click()
    expect(pressed).toBe(1)
    expect(screen.getByText('Later').closest('button')!.disabled).toBe(true)
  })

  it('its box wears kit-pause (its side-by-side layout on a phone on its side, blocks.css — 0.7.0)', () => {
    render(<Pause onQuit={() => {}} />)
    expect(document.querySelector('.kit-modal')!.classList.contains('kit-pause')).toBe(true)
  })
})

describe('PlayerSeats (0.29.0, F109: the tappable seat row)', () => {
  const players = [{ id: 'a', name: 'Ada', score: 3 }, { id: 'b', name: 'Bo' }]
  // What PlayerSeats drew before 0.29.0, kept here to prove a game that passes nothing new sees exactly the same
  function OldSeats({ players: list, activeId }: { players: { id: string; name: string; avatar?: string; score?: number }[]; activeId?: string }) {
    return (
      <Row gap="s">
        {list.map((p) => (
          <Row key={p.id} gap="s" className="kit-hud-chip" data-state={p.id === activeId ? 'active' : undefined}>
            <Avatar name={p.name} src={p.avatar} active={p.id === activeId} />
            <Stack gap="xs">
              <Text kind="label" translate="no">{p.name}</Text>{/* (0.37.0, F156: a name is never translated) */}
              {p.score !== undefined && <Text kind="caption">{p.score}</Text>}
            </Stack>
          </Row>
        ))}
      </Row>
    )
  }
  it('without onSeatTap / badge / seatProps it draws exactly as before', () => {
    const before = render(<OldSeats players={players} activeId="b" />).container.innerHTML
    cleanup()
    const now = render(<PlayerSeats players={players} activeId="b" />).container.innerHTML
    expect(now).toBe(before)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
  it('with onSeatTap each seat is a real button named for screen readers, and a tap hands back its seat', () => {
    const tapped: string[] = []
    render(<PlayerSeats players={[{ ...players[0], tapLabel: 'Ada — send an emote', seatProps: { 'data-emote-seat': 'a', 'data-emote-mine': '' } }, players[1]]}
      onSeatTap={(s) => tapped.push(s.id)} />)
    const ada = screen.getByRole('button', { name: 'Ada — send an emote' })
    const bo = screen.getByRole('button', { name: 'Bo' }) // no tapLabel → its name
    expect(ada.getAttribute('type')).toBe('button')
    expect(ada.getAttribute('data-emote-seat')).toBe('a')
    expect(ada.hasAttribute('data-emote-mine')).toBe(true)
    expect(bo.hasAttribute('data-emote-mine')).toBe(false)
    ada.focus() // a real button: Tab reaches it (no tabindex tricks)
    expect(document.activeElement).toBe(ada)
    fireEvent.click(ada)
    fireEvent.click(bo)
    expect(tapped).toEqual(['a', 'b'])
  })
  it('a badge sits on the portrait (inside its box), not beside it: the chip keeps the same parts with or without it', () => {
    const { container, rerender } = render(<PlayerSeats players={players} onSeatTap={() => {}} />)
    const parts = () => [...container.querySelectorAll('.kit-hud-chip')].map((chip) => [...chip.children].map((c) => c.className).join(' | '))
    const without = parts()
    expect(container.querySelector('.kit-seat-badge')).toBeNull()
    rerender(<PlayerSeats players={[players[0], { ...players[1], badge: <span role="img" aria-label="Emotes muted">x</span> }]} onSeatTap={() => {}} />)
    expect(parts()).toEqual(without)
    const badge = container.querySelector('.kit-seat-badge')!
    expect(badge.parentElement!.classList.contains('kit-seat-avatar')).toBe(true)
    expect(screen.getByRole('img', { name: 'Emotes muted' })).toBeTruthy()
  })
  it('showNames={false}: portraits only, each still named', () => {
    render(<PlayerSeats players={players} showNames={false} onSeatTap={() => {}} />)
    expect(document.querySelector('.kit-text')).toBeNull()
    expect(screen.getByRole('button', { name: 'Ada' })).toBeTruthy()
  })
})
