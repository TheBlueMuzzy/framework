// F134 (0.33.3): a 0 handed to a part shows as "0" inside its place — never a stray "0" loose on the page, never lost.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { shown } from './shown'
import { MainMenu } from './blocks/frontend'
import { Hud, PlayerChip } from './blocks/hud'
import { ListRow } from './controls'
import { Screen } from './layout'

afterEach(cleanup)

// The page's text that sits directly in an element (not inside a child element) — where a stray "0" would be
const looseText = (root: HTMLElement) => [...root.querySelectorAll('*')].flatMap((el) =>
  [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent?.trim()).map((n) => ({ text: n.textContent!.trim(), in: el as HTMLElement })))

describe('shown — is there something to draw?', () => {
  it('nothing: undefined, null, false, empty text; something: 0, text, an element, a list', () => {
    expect([undefined, null, false, ''].map(shown)).toEqual([false, false, false, false])
    expect([0, 'a', <b key="b" />, []].map(shown)).toEqual([true, true, true, true])
  })
})

describe('a 0 shows in its place', () => {
  it('MainMenu children = 0: inside the extras box, not loose in the button list', () => {
    const { container } = render(<MainMenu title="Game" items={[{ label: 'Play', onClick: () => {} }]}>{0}</MainMenu>)
    const zero = looseText(container).find((t) => t.text === '0')
    expect(zero?.in.className).toBe('kit-main-menu-extra')
  })

  it('a PlayerChip badge of 0 shows "0" in its badge, even with the name hidden', () => {
    const { container } = render(<PlayerChip name="Ana" showName={false} badge={0} />)
    expect(container.querySelector('.kit-badge')?.textContent).toBe('0')
  })

  it('a ListRow detail of 0 shows in the detail; a Screen / Hud slot of 0 is kept', () => {
    const { container } = render(<><ListRow label="Wins" detail={0} /><Screen label="s" topLeft={0} /><Hud currency={0} /></>)
    expect(container.querySelector('.kit-listrow-detail')?.textContent).toBe('0')
    expect(container.querySelector('[data-slot="top-left"]')?.textContent).toBe('0')
    expect(container.querySelector('.kit-hud-slot')?.textContent).toBe('0')
    expect(looseText(container).filter((t) => t.text === '0').every((t) => t.in.closest('[data-slot], .kit-listrow-detail'))).toBe(true)
  })
})
