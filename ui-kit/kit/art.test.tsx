// Art skins (0.11.0): art buttons (up / down pictures), a screen backdrop, a frame picture around a panel,
// and the blocks that pass them through (MainMenu, Victory, GameOver).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button } from './controls'
import { Panel, Screen, frameVariables } from './layout'
import { GameOver, MainMenu, Victory } from './blocks'

afterEach(cleanup)

const up = '/art/btn up.svg', down = '/art/btn-down.svg'

describe('Button art', () => {
  it('draws the up and down pictures (hidden from screen readers) and keeps the words as its name', () => {
    const onClick = vi.fn()
    const { container } = render(<Button art={{ up, down }} onClick={onClick}>Start shift</Button>)
    const button = screen.getByRole('button', { name: 'Start shift' })
    expect(button.dataset.art).toBe('beside')
    expect(button.dataset.artSize).toBe('m')
    const pictures = [...container.querySelectorAll('img')]
    expect(pictures.map((img) => img.getAttribute('src'))).toEqual([up, down])
    expect(pictures.every((img) => img.alt === '')).toBe(true)
    expect(container.querySelector('.kit-art-face')?.getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('marks itself pressed while held, so the down picture shows on every phone', () => {
    render(<Button art={{ up, down }}>Go</Button>)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button)
    expect(button.dataset.pressed).toBe('')
    fireEvent.pointerUp(button)
    expect(button.dataset.pressed).toBeUndefined()
    fireEvent.pointerDown(button)
    fireEvent.pointerLeave(button) // slid off: back up
    expect(button.dataset.pressed).toBeUndefined()
  })

  it('label below / hidden and the size pass through; no down picture is fine', () => {
    const { container } = render(<Button art={{ up, label: 'hidden', size: 'l' }}>Settings</Button>)
    const button = screen.getByRole('button', { name: 'Settings' })
    expect(button.dataset.art).toBe('hidden')
    expect(button.dataset.artSize).toBe('l')
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('without art it is the normal style button', () => {
    render(<Button>Plain</Button>)
    expect(screen.getByRole('button').dataset.art).toBeUndefined()
  })
})

describe('Screen backdrop + Panel frame', () => {
  it('a backdrop sets the picture as a CSS variable (spaces made safe) and says how it fits', () => {
    const { container } = render(<Screen backdrop="/art/my back.svg" backdropFit="contain"><p>hi</p></Screen>)
    const section = container.querySelector('.kit-screen') as HTMLElement
    expect(section.dataset.backdrop).toBe('contain')
    expect(section.style.getPropertyValue('--kit-backdrop')).toBe('url("/art/my%20back.svg")')
  })

  it('no backdrop: nothing set', () => {
    const { container } = render(<Screen><p>hi</p></Screen>)
    expect((container.querySelector('.kit-screen') as HTMLElement).dataset.backdrop).toBeUndefined()
  })

  // 0.35.1 (F145): the widths are the rem counted at the usual 16 px, so the frame doesn't grow with the text size
  it('frame: cut lines in the picture units, border widths from rem at 16 px (scale = rem per unit)', () => {
    expect(frameVariables({ src: '/f.svg', slice: [104, 66, 66, 66], scale: 0.0375, ink: 'on-game' })).toEqual({
      '--kit-art-frame-ink': 'var(--on-game)', '--kit-art-frame': 'url("/f.svg")', '--kit-art-frame-slice': '104 66 66 66', '--kit-art-frame-width': '62.4px 39.6px 39.6px 39.6px',
      '--kit-art-frame-width-short': '37.44px 23.76px 23.76px 23.76px',
    })
    const plain = frameVariables({ src: '/f.svg', slice: [16, 32, 16, 32] }) as Record<string, string>
    expect(plain['--kit-art-frame-width']).toBe('16px 32px 16px 32px') // default scale: 16 units = 1rem (16 px)
    expect(plain['--kit-art-frame-ink']).toBe('var(--on-surface)') // default: words like any panel's
    const { container } = render(<Panel frame={{ src: '/f.svg', slice: [10, 10, 10, 10] }}>x</Panel>)
    const panel = container.querySelector('.kit-panel') as HTMLElement
    expect(panel.dataset.frame).toBe('')
    expect(panel.style.getPropertyValue('--kit-art-frame-slice')).toBe('10 10 10 10')
  })
})

describe('blocks pass the art through', () => {
  it('MainMenu: logo picture named by the title, backdrop, art per item', () => {
    const { container } = render(<MainMenu title="Goops" titleArt="/title.svg" backdrop="/bg.svg"
      items={[{ label: 'Start', onClick: () => {}, art: { up, down } }, { label: 'Settings', onClick: () => {} }]} />)
    expect(screen.getByRole('img', { name: 'Goops' }).getAttribute('src')).toBe('/title.svg')
    expect((container.querySelector('.kit-screen') as HTMLElement).dataset.backdrop).toBe('cover')
    expect(screen.getByRole('button', { name: 'Start' }).dataset.art).toBe('beside')
    expect(screen.getByRole('button', { name: 'Settings' }).dataset.art).toBeUndefined()
  })

  it('GameOver / Victory: the report sits in the frame, buttons wear their art', () => {
    const frame = { src: '/frame.svg', slice: [20, 20, 20, 20] as [number, number, number, number] }
    const { container, unmount } = render(<GameOver frame={frame} art={{ retry: { up }, quit: { up: down } }} onRetry={() => {}} onQuit={() => {}} />)
    const panel = container.querySelector('.kit-panel') as HTMLElement
    expect(panel.dataset.frame).toBe('')
    // report and buttons in two groups (side by side on a phone on its side)
    expect(panel.classList.contains('kit-end')).toBe(true)
    expect(panel.querySelector('.kit-end-actions')?.querySelectorAll('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Try again' }).dataset.art).toBe('beside')
    expect(screen.getByRole('button', { name: 'Quit' }).dataset.art).toBe('beside')
    unmount()
    render(<Victory backdrop="/bg.svg" art={{ continue: { up } }} onContinue={() => {}} />)
    expect(screen.getByRole('button', { name: 'Continue' }).dataset.art).toBe('beside')
  })
})
