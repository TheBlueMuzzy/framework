// SETTINGS — drawn from a list, never built by hand. Copy settings.default.json to your game's
// content/ui/settings.json, then switch rows off ("on": false) or add your own. Add a row → it appears.
//   <Settings schema={settingsJson} onChange={(values) => audio.setVolume(values.musicVolume)} />
// Row types: slider · toggle · selector · stepper · button (calls onAction(id)) · link (opens url)
//            · destructive (asks first, then onAction(id)) · info (read-only, e.g. the version).
// Values are remembered in the browser (or pass your own load/save). At start-up, call
// applyAccessibility(loadSettings(schema)) so text size and reduce motion apply before Settings opens.
import { useState } from 'react'
import { Panel, Row, Screen } from '../layout'
import { Button, ListRow, ScrollArea, Selector, Slider, Stepper, Tabs, Text, Toggle } from '../controls'
import { screens } from '../screens'
import { askConfirm } from './dialogs'
import defaultSchema from './settings.default.json'

export type SettingValue = number | boolean | string
export type SettingsValues = Record<string, SettingValue>
export type SettingRow = {
  id: string; type: string; label: string; detail?: string; on?: boolean; default?: SettingValue
  min?: number; max?: number; step?: number; options?: string[] // slider / stepper / selector
  url?: string; button?: string; confirm?: string // link / destructive
}
export type SettingsSchema = { tabs: { id: string; label: string; rows: SettingRow[] }[] }

// Only rows that hold a value are saved (not buttons, links or info lines).
const holdsValue = (row: SettingRow) => ['slider', 'toggle', 'selector', 'stepper'].includes(row.type)
export function defaultValues(schema: SettingsSchema, tabId?: string): SettingsValues {
  const rows = schema.tabs.filter((tab) => !tabId || tab.id === tabId).flatMap((tab) => tab.rows)
  return Object.fromEntries(rows.filter(holdsValue).map((row) => [row.id, row.default ?? 0]))
}

// Saving: localStorage by default. Private browsing can refuse it — then settings last until reload.
const STORAGE_KEY = 'kit-settings'
function loadFromBrowser(): SettingsValues | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') } catch { return null }
}
function saveToBrowser(values: SettingsValues) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)) } catch { /* not remembered, still works */ }
}
export function loadSettings(schema: SettingsSchema = defaultSchema, load = loadFromBrowser): SettingsValues {
  return { ...defaultValues(schema), ...load() }
}

// Text size and reduce motion drive the kit itself: text is in rem, so the page's font size scales
// every word (gaps and 44px targets stay put), and data-reduce-motion stops animations (blocks.css).
export function applyAccessibility(values: SettingsValues, root = document.documentElement) {
  if (typeof values.textSize === 'string') root.style.fontSize = values.textSize
  root.toggleAttribute('data-reduce-motion', values.reduceMotion === true)
}

export const settingsWords = { title: 'Settings', back: 'Back', reset: 'Reset to defaults' }
type SettingsProps = {
  schema?: SettingsSchema
  onChange?: (values: SettingsValues, changedId: string) => void
  onAction?: (id: string) => void // button and destructive rows
  info?: Record<string, string> // text for info rows, e.g. { version: '1.2.0' }
  onBack?: () => void
  load?: () => SettingsValues | null; save?: (values: SettingsValues) => void
  words?: Partial<typeof settingsWords>
  labels?: Record<string, string> // translated tab and row labels, by id: { audio: 'Sonido' }
  hide?: string[] // row ids to leave out right now, e.g. in-game-only rows when opened from the main menu
}

export function Settings({ schema = defaultSchema, onChange, onAction, info = {}, onBack = () => screens.pop(), load = loadFromBrowser, save = saveToBrowser, words, labels = {}, hide = [] }: SettingsProps) {
  const w = { ...settingsWords, ...words }
  const [values, setValues] = useState(() => loadSettings(schema, load))
  const tabs = schema.tabs
    .map((tab) => ({ ...tab, rows: tab.rows.filter((row) => row.on !== false && !hide.includes(row.id)) }))
    .filter((tab) => tab.rows.length > 0)
  const [tabId, setTabId] = useState<string | undefined>(tabs[0]?.id)
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0]
  const labelOf = (item: { id: string; label: string }) => labels[item.id] ?? item.label

  function update(next: SettingsValues, changedId: string) {
    setValues(next)
    save(next)
    applyAccessibility(next)
    onChange?.(next, changedId)
  }
  const set = (id: string) => (value: SettingValue) => update({ ...values, [id]: value }, id)

  function control(row: SettingRow, label: string) {
    const value = values[row.id]
    switch (row.type) {
      case 'slider': return <Slider label={label} value={Number(value)} min={row.min} max={row.max} step={row.step} onChange={set(row.id)} />
      case 'toggle': return <Toggle label={label} on={value === true} onChange={set(row.id)} />
      case 'selector': return <Selector label={label} options={row.options ?? []} value={String(value)} onChange={set(row.id)} />
      case 'stepper': return <Stepper label={label} value={Number(value)} min={row.min} max={row.max} step={row.step} onChange={set(row.id)} />
      case 'info': return <Text kind="caption">{info[row.id] ?? String(row.default ?? '')}</Text>
      case 'destructive': return (
        <Button variant="danger" onClick={() => askConfirm({ title: `${label}?`, message: row.confirm, danger: true,
          words: { yes: row.button ?? label }, onConfirm: () => onAction?.(row.id) })}>{row.button ?? label}</Button>
      )
      default: return null
    }
  }
  const openRow = (row: SettingRow) =>
    row.type === 'link' ? () => window.open(row.url, '_blank', 'noopener') : row.type === 'button' ? () => onAction?.(row.id) : undefined

  const tabPicker = {
    label: w.title, tabs: tabs.map(labelOf), value: tab ? labelOf(tab) : '',
    onChange: (label: string) => setTabId(tabs.find((t) => labelOf(t) === label)?.id),
  }

  return (
    <Screen label={w.title}>
      {/* Several tabs: a steady tall panel, so it doesn't jump when switching. One tab: as tall as its rows. */}
      <Panel depth={2} gap="m" className={tabs.length > 1 ? 'kit-wide kit-tall' : 'kit-wide'}>
        <Row gap="s" justify="between">
          <Text kind="title">{w.title}</Text>
          <Button variant="secondary" onClick={onBack}>{w.back}</Button>
        </Row>
        {/* Phones get ◀ Audio ▶ instead of a tab bar: 8 tabs would fill half the screen. One tab: no picker. */}
        {tabs.length > 1 && <>
          <div className="kit-settings-tabs"><Tabs {...tabPicker} /></div>
          <div className="kit-settings-picker"><Selector {...tabPicker} options={tabPicker.tabs} /></div>
        </>}
        {tab && (
          <ScrollArea label={labelOf(tab)}>
            {tab.rows.map((row) => (
              <ListRow key={row.id} label={labelOf(row)} detail={row.detail} onClick={openRow(row)}>
                {openRow(row) ? <Text kind="caption">›</Text> : control(row, labelOf(row))}
              </ListRow>
            ))}
            {/* Reset scrolls with the rows, so short landscape phones keep their room for rows */}
            {tab.rows.some(holdsValue) && (
              <Row justify="end">
                <Button variant="ghost" onClick={() => update({ ...values, ...defaultValues(schema, tab.id) }, tab.id)}>{w.reset}</Button>
              </Row>
            )}
          </ScrollArea>
        )}
      </Panel>
    </Screen>
  )
}
