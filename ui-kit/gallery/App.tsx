// THE GALLERY — a menu of every part and built screen, in the chosen style.
// Its style comes from content/ui/style.json, exactly like a game; the dev switcher tries others on top.
// Links:  ?preset=neon                    the menu in Neon
//         ?screen=settings&preset=neon    straight into one screen (the ids are in menu.ts)
//         ?screen=parts                   the parts page
import { useEffect, useRef, useState } from 'react'
import { applyStyle, Grid, ListRow, Panel, screens, Stack, Text, ToastStack, type StyleFile } from '../kit'
import styleFile from './content/ui/style.json'
import { StyleSwitcher } from './StyleSwitcher'
import { menu, type MenuGroup as MenuGroupType } from './menu'
import { Parts } from './Parts'
import { Stage } from './Screens'

const param = (name: string) => new URLSearchParams(location.search).get(name)
const presetFromLink = (): StyleFile | null => (param('preset') ? { preset: param('preset')! } : null)

export function App() {
  // The dev switcher's changes sit on top of style.json until you press Reset.
  const [devStyle, setDevStyle] = useState<StyleFile | null>(presetFromLink)
  const style = devStyle ?? (styleFile as StyleFile)
  useEffect(() => applyStyle(style), [style])

  // Which page is showing: null = the menu, 'parts', or a screen id. The link always says it too.
  const [page, setPage] = useState(() => param('screen'))
  const pageNow = useRef(page)
  pageNow.current = page
  const linkTo = (to: string | null) => {
    const query = new URLSearchParams()
    if (to) query.set('screen', to)
    if (devStyle) query.set('preset', devStyle.preset)
    return `${location.pathname}${query.toString() ? `?${query}` : ''}`
  }
  // A new style updates the link, without adding a Back step
  useEffect(() => history.replaceState(history.state, '', linkTo(page)), [devStyle?.preset])

  // Opening a page adds a Back step, so the phone's Back button returns to the menu
  const open = (to: string) => { history.pushState({ gallery: true }, '', linkTo(to)); setPage(to) }
  const goToMenu = () => {
    // Close any open screens first: the kit steps back through history, then onBack below finishes the trip
    if (screens.current.length) { while (screens.current.length) screens.pop(); return }
    if (history.state?.gallery) history.back() // back to the menu's own history entry
    else { history.replaceState(null, '', linkTo(null)); setPage(null) } // opened from a link: no menu behind it
  }

  useEffect(() => {
    const onBack = () => {
      if (history.state?.kitScreens) return // still stepping back through open screens
      const next = param('screen')
      // The last screen just closed (its own Back button, Esc or the phone's Back): back to the menu
      const closedLastScreen = next && next !== 'parts' && next === pageNow.current && !screens.current.length
      if (closedLastScreen) goToMenu()
      else setPage(next)
    }
    addEventListener('popstate', onBack)
    return () => removeEventListener('popstate', onBack)
  })

  const setPreset = (preset: string) => setDevStyle({ ...style, preset })
  return (
    <>
      {page === 'parts' ? <Parts onMenu={goToMenu} />
        : page ? <Stage id={page} preset={style.preset} onPreset={setPreset} onMenu={goToMenu} />
        : <Menu current={style} onStyle={setDevStyle} onOpen={open} />}
      <ToastStack />
    </>
  )
}

type MenuProps = { current: StyleFile; onStyle: (style: StyleFile | null) => void; onOpen: (page: string) => void }
function Menu({ current, onStyle, onOpen }: MenuProps) {
  return (
    <main className="gallery">
      <Stack gap="xl">
        <Stack gap="xs">
          <Text kind="display">Game UI Kit</Text>
          <Text kind="caption">Pick a screen to run it live in this style. Back or Esc comes back here.</Text>
        </Stack>
        <StyleSwitcher current={current} onChange={onStyle} onReset={() => onStyle(null)} />
        <Grid gap="l" min="l" className="gallery-menu">
          <MenuGroup title="Parts" entries={[{ id: 'parts', name: 'Parts', about: 'Every box and control on one page' }]} onOpen={onOpen} />
          {menu.map((group) => <MenuGroup key={group.title} title={group.title} entries={group.entries} onOpen={onOpen} />)}
        </Grid>
      </Stack>
    </main>
  )
}

// One group of the menu: a panel with a row per screen (tap the row to open it)
function MenuGroup({ title, entries, onOpen }: MenuGroupType & { onOpen: (page: string) => void }) {
  return (
    <Panel gap="xs">
      <Text kind="heading">{title}</Text>
      {entries.map((entry) => (
        <ListRow key={entry.id} label={entry.name} detail={entry.about} onClick={() => onOpen(entry.id)}><Text kind="caption">›</Text></ListRow>
      ))}
    </Panel>
  )
}
