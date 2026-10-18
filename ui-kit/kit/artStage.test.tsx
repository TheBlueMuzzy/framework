// 0.12.0: ArtStage / ArtLayer (a scene from the game's own pictures), PullHandle, LevelMeter, Screen column · swipe ·
// slide, Victory onQuit + swipe up, TitleArt.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ArtLayer, ArtStage, TitleArt } from './artStage'
import { PullHandle } from './controls'
import { Screen } from './layout'
import { GameOver, LevelMeter, Victory } from './blocks'

afterEach(() => { cleanup(); vi.useRealTimers(); document.documentElement.removeAttribute('data-reduce-motion') })
const vars = (el: Element | null) => (el as HTMLElement).style

describe('ArtStage + ArtLayer', () => {
  it('passes the scene, the view and the short view as CSS variables in picture units', () => {
    const { container } = render(<ArtStage size={[648, 1983]} view={[0, 831, 648, 1046]} viewShort={[0, 831, 648, 620]} label="Console" />)
    const stage = container.querySelector('.kit-art-stage')
    expect(screen.getByRole('group', { name: 'Console' })).toBe(stage)
    expect(vars(stage).getPropertyValue('--kit-scene-w')).toBe('648')
    expect(vars(stage).getPropertyValue('--kit-scene-ratio')).toBe('648 / 1983')
    expect(vars(stage).getPropertyValue('--kit-view-y')).toBe('831')
    expect(vars(stage).getPropertyValue('--kit-view-ratio')).toBe(String(+(648 / 1046).toFixed(3)))
    expect(vars(stage).getPropertyValue('--kit-view-short-ratio')).toBe(String(+(648 / 620).toFixed(3)))
    expect(container.querySelector('.kit-art-view > .kit-art-scene')).not.toBeNull()
  })

  it('no view: the whole scene shows (short windows too)', () => {
    const { container } = render(<ArtStage size={[100, 200]} />)
    const stage = container.querySelector('.kit-art-stage')
    expect(vars(stage).getPropertyValue('--kit-view-w')).toBe('100')
    expect(vars(stage).getPropertyValue('--kit-view-short-ratio')).toBe('0.5')
  })

  it('a layer: its spot, its picture (unread), its shape; no height = the picture decides', () => {
    const { container } = render(<ArtStage size={[100, 100]}>
      <ArtLayer src="/a b.svg" at={[10, 20, 30, 40]} />
      <ArtLayer src="/c.svg" at={[1, 2, 3]} />
    </ArtStage>)
    const [a, c] = container.querySelectorAll('.kit-art-layer')
    expect(vars(a).getPropertyValue('--kit-at-x')).toBe('10')
    expect(vars(a).getPropertyValue('--kit-at-ratio')).toBe('30 / 40')
    expect((a as HTMLElement).dataset.sized).toBe('')
    expect(a.querySelector('img')?.getAttribute('alt')).toBe('')
    expect((c as HTMLElement).dataset.sized).toBeUndefined()
    expect(vars(c).getPropertyValue('--kit-at-ratio')).toBe('')
  })

  it('off: dimmed, unpressable (inert), read out as unavailable; dim only darkens', () => {
    const onClick = vi.fn()
    const { container } = render(<ArtStage size={[100, 100]}>
      <ArtLayer at={[0, 0, 50, 50]} off label="Reset laser — not working yet"><button onClick={onClick}>slider</button></ArtLayer>
      <ArtLayer at={[0, 0, 50, 50]} dim><button>lever</button></ArtLayer>
    </ArtStage>)
    const [off, dim] = container.querySelectorAll('.kit-art-layer') as NodeListOf<HTMLElement>
    expect(off.dataset.off).toBe('true')
    expect(off.hasAttribute('inert')).toBe(false) // (inert would hide it from screen readers too)
    expect(off.querySelector('.kit-art-layer-off')?.hasAttribute('inert')).toBe(true)
    expect(off.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('img', { name: 'Reset laser — not working yet' })).toBe(off)
    expect(dim.dataset.dim).toBe('true')
    expect(dim.hasAttribute('inert')).toBe(false)
  })

  it('words: their size in picture units, tone and alignment', () => {
    const { container } = render(<ArtStage size={[100, 100]}><ArtLayer at={[0, 0, 50, 10]} text={21} tone="primary" align="end">Reset laser</ArtLayer></ArtStage>)
    const layer = container.querySelector('.kit-art-layer') as HTMLElement
    expect(layer.dataset.text).toBe('')
    expect(layer.dataset.tone).toBe('primary')
    expect(layer.dataset.align).toBe('end')
    expect(layer.style.getPropertyValue('--kit-art-text')).toBe('21')
    expect(layer.textContent).toBe('Reset laser')
  })

  it('TitleArt: the logo with its name; size s', () => {
    render(<TitleArt src="/t.svg" alt="GOOPS" size="s" />)
    expect(screen.getByRole('img', { name: 'GOOPS' }).dataset.size).toBe('s')
  })
})

describe('PullHandle', () => {
  // the handle (moves; carries --kit-pull and the drag state) holds the look and its grip (the button)
  const handleOf = (grip: HTMLElement) => grip.closest('.kit-pull') as HTMLElement
  const box = (el: HTMLElement) => { el.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 200, width: 100, height: 200, toJSON: () => ({}) }) }

  it('a tap on the grip pulls it all the way, then calls onPull once (after the glide); the look is unread', () => {
    vi.useFakeTimers()
    const onPull = vi.fn()
    const { container } = render(<PullHandle label="Start shift" onPull={onPull} grip={0.35}><img alt="" src="/p.svg" /></PullHandle>)
    const grip = screen.getByRole('button', { name: 'Start shift' })
    expect(container.querySelector('.kit-pull-look')?.getAttribute('aria-hidden')).toBe('true')
    expect(handleOf(grip).style.getPropertyValue('--kit-pull-grip')).toBe('0.35')
    fireEvent.pointerDown(grip, { pointerId: 1, clientX: 50, clientY: 50 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 50, clientY: 50 })
    fireEvent.click(grip)
    expect(handleOf(grip).dataset.pulled).toBe('true')
    expect(handleOf(grip).style.getPropertyValue('--kit-pull')).toBe('1')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('a drag follows the finger (travel = share of the whole handle); short of the threshold it springs back', () => {
    vi.useFakeTimers()
    const onPull = vi.fn()
    render(<PullHandle label="Pull" onPull={onPull} travel={0.5} threshold={0.6} />)
    const grip = screen.getByRole('button', { name: 'Pull' })
    box(handleOf(grip))
    fireEvent.pointerDown(grip, { pointerId: 1, clientX: 50, clientY: 10 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 50, clientY: 60 }) // 50 of 100 travel = 0.5
    expect(handleOf(grip).dataset.dragging).toBe('true')
    expect(handleOf(grip).style.getPropertyValue('--kit-pull')).toBe('0.5')
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 50, clientY: 60 })
    fireEvent.click(grip) // the click after a drag is not a tap
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPull).not.toHaveBeenCalled()
    expect(handleOf(grip).style.getPropertyValue('--kit-pull')).toBe('0')
  })

  it('a drag past the threshold finishes the pull; it never goes past the end or backwards', () => {
    vi.useFakeTimers()
    const onPull = vi.fn()
    render(<PullHandle label="Pull" onPull={onPull} />)
    const grip = screen.getByRole('button', { name: 'Pull' })
    box(handleOf(grip))
    fireEvent.pointerDown(grip, { pointerId: 1, clientX: 50, clientY: 10 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 50, clientY: -50 })
    expect(handleOf(grip).style.getPropertyValue('--kit-pull')).toBe('0')
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 50, clientY: 400 })
    expect(handleOf(grip).style.getPropertyValue('--kit-pull')).toBe('1')
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 50, clientY: 400 })
    fireEvent.click(grip)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('let go at the end: it acts straight away, no glide to wait for (0.15.1)', () => {
    vi.useFakeTimers()
    const onPull = vi.fn()
    render(<PullHandle label="Pull" onPull={onPull} />)
    const grip = screen.getByRole('button', { name: 'Pull' })
    box(handleOf(grip))
    fireEvent.pointerDown(grip, { pointerId: 1, clientX: 50, clientY: 10 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 50, clientY: 400 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 50, clientY: 400 })
    expect(onPull).toHaveBeenCalledOnce() // no timers advanced
  })

  it('keys: its own arrow pulls it (Enter / Space click it like any button); disabled does nothing', () => {
    vi.useFakeTimers()
    const onPull = vi.fn()
    const { rerender } = render(<PullHandle label="Pull" onPull={onPull} direction="up" />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPull).toHaveBeenCalledOnce()
    rerender(<PullHandle label="Pull" onPull={onPull} disabled />)
    fireEvent.click(screen.getByRole('button'))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('pulled keeps it at the end', () => {
    render(<PullHandle label="Pull" onPull={() => {}} pulled />)
    expect(handleOf(screen.getByRole('button')).style.getPropertyValue('--kit-pull')).toBe('1')
  })
})

describe('LevelMeter', () => {
  it('shows the level and "xp / next XP" as a progress bar', () => {
    const { container } = render(<LevelMeter level={2} xp={10347} xpToNext={12500} words={{ label: 'Operator rank' }} format={(n) => n.toLocaleString('en')} />)
    const bar = screen.getByRole('progressbar', { name: 'Operator rank 2' })
    expect(bar.getAttribute('aria-valuetext')).toBe('10,347 / 12,500 XP')
    expect(bar.style.getPropertyValue('--kit-meter-share')).toBe(String(10347 / 12500))
    expect(container.querySelector('.kit-level-meter-level')?.textContent).toBe('2')
  })

  it('the top level: full bar and words.max', () => {
    render(<LevelMeter level={30} xp={0} xpToNext={0} />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('Max')
    expect(screen.getByRole('progressbar').style.getPropertyValue('--kit-meter-share')).toBe('1')
  })

  it('art: the bar picture and its shape', () => {
    render(<LevelMeter level={1} xp={1} xpToNext={2} art={{ fill: '/fill bar.svg', ratio: 24.6 }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.dataset.art).toBe('')
    expect(bar.style.getPropertyValue('--kit-meter-art')).toBe('url("/fill%20bar.svg")')
    expect(bar.style.getPropertyValue('--kit-meter-art-ratio')).toBe('24.6')
  })

  it('plays the steps: fills, levels up (pop + onLevelUp), then settles on the final numbers', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] })
    const onLevelUp = vi.fn(), onDone = vi.fn()
    const steps = [{ level: 1, from: 3000, to: 3750, max: 3750 }, { level: 2, from: 0, to: 500, max: 4000 }]
    const { container, rerender } = render(<LevelMeter level={2} xp={500} xpToNext={4000} steps={steps} onLevelUp={onLevelUp} onDone={onDone} />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(`${(3000).toLocaleString()} / ${(3750).toLocaleString()} XP`) // waits for play
    rerender(<LevelMeter level={2} xp={500} xpToNext={4000} steps={steps} play onLevelUp={onLevelUp} onDone={onDone} />)
    act(() => { vi.advanceTimersByTime(700) }) // first step done (2 × 300 ms in a test page)
    expect(onLevelUp).toHaveBeenCalledWith(2)
    expect((container.querySelector('.kit-level-meter-level') as HTMLElement).dataset.pop).toBe('true')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onDone).toHaveBeenCalledOnce()
    expect(screen.getByRole('progressbar', { name: 'Level 2' }).getAttribute('aria-valuenow')).toBe('500')
  })

  it('reduce motion: straight to the end, still says it levelled up', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const onLevelUp = vi.fn(), onDone = vi.fn()
    render(<LevelMeter level={3} xp={10} xpToNext={4250} play onLevelUp={onLevelUp} onDone={onDone}
      steps={[{ level: 1, from: 0, to: 3750, max: 3750 }, { level: 2, from: 0, to: 4000, max: 4000 }, { level: 3, from: 0, to: 10, max: 4250 }]} />)
    expect(onLevelUp).toHaveBeenCalledWith(3)
    expect(onDone).toHaveBeenCalledOnce()
    expect(screen.getByRole('progressbar', { name: 'Level 3' })).toBeTruthy()
  })
})

describe('Screen column · swipe · slide', () => {
  const rem = 16

  it('column marks the screen', () => {
    const { container } = render(<Screen column><p>x</p></Screen>)
    expect((container.querySelector('.kit-screen') as HTMLElement).dataset.column).toBe('true')
  })

  it('a mouse swipe up calls up; a short drag or a sideways one does not', () => {
    const up = vi.fn()
    const { container } = render(<Screen swipe={{ up }}><p>report</p></Screen>)
    const section = container.querySelector('.kit-screen') as HTMLElement
    expect(section.dataset.swipe).toBe('')
    const swipe = (x1: number, y1: number, x2: number, y2: number) => {
      fireEvent.pointerDown(screen.getByText('report'), { pointerType: 'mouse', button: 0, clientX: x1, clientY: y1 })
      fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: x2, clientY: y2 })
    }
    swipe(100, 400, 100, 400 - rem) // too short
    swipe(100, 400, 300, 330) // mostly sideways
    expect(up).not.toHaveBeenCalled()
    swipe(100, 400, 110, 300)
    expect(up).toHaveBeenCalledOnce()
  })

  it('a finger swipe up calls up (touch events), unless it can scroll what it started on', () => {
    const up = vi.fn()
    const { container } = render(<Screen swipe={{ up }}><div data-testid="list">long</div></Screen>)
    const section = container.querySelector('.kit-screen') as HTMLElement
    const list = screen.getByTestId('list')
    const touch = (target: Element) => {
      fireEvent.touchStart(target, { touches: [{ clientX: 50, clientY: 500 }] })
      fireEvent.touchEnd(target, { changedTouches: [{ clientX: 52, clientY: 380 }] })
    }
    touch(list)
    expect(up).toHaveBeenCalledOnce()
    Object.defineProperties(list, { scrollHeight: { value: 900 }, clientHeight: { value: 300 }, scrollTop: { value: 0 } })
    touch(list)
    expect(up).toHaveBeenCalledOnce() // it scrolls the list instead
    expect(section).toBeTruthy()
  })

  it('slide: in / out from its edge; onSlideEnd once when the animation ends (straight away with reduce motion)', () => {
    const done = vi.fn()
    const { container, rerender } = render(<Screen slide="out" slideEdge="bottom" onSlideEnd={done}><p>x</p></Screen>)
    const section = container.querySelector('.kit-screen') as HTMLElement
    expect(section.dataset.slide).toBe('out')
    expect(section.dataset.slideEdge).toBe('bottom')
    fireEvent.animationEnd(screen.getByText('x')) // a child's animation doesn't count
    expect(done).not.toHaveBeenCalled()
    fireEvent.animationEnd(section)
    fireEvent.animationEnd(section)
    expect(done).toHaveBeenCalledOnce()
    document.documentElement.setAttribute('data-reduce-motion', '')
    rerender(<Screen slide="in" onSlideEnd={done}><p>x</p></Screen>)
    expect(done).toHaveBeenCalledTimes(2)
  })
})

describe('Victory / GameOver: swipe up, Victory quit', () => {
  it('Victory: Continue, a quieter Quit, and swipe up with its hint', () => {
    const onQuit = vi.fn()
    const { container } = render(<Victory onContinue={() => {}} onQuit={onQuit} onSwipeUp={onQuit} words={{ quit: 'Back to the console', swipe: 'Swipe up to end the day' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back to the console' }))
    expect(onQuit).toHaveBeenCalledOnce()
    expect(screen.getByText('Swipe up to end the day')).toBeTruthy()
    expect((container.querySelector('.kit-screen') as HTMLElement).dataset.swipe).toBe('')
  })

  it('no onSwipeUp: no hint, no swipe', () => {
    const { container } = render(<GameOver onQuit={() => {}} words={{ swipe: 'Swipe up' }} />)
    expect(screen.queryByText('Swipe up')).toBeNull()
    expect((container.querySelector('.kit-screen') as HTMLElement).dataset.swipe).toBeUndefined()
  })
})
