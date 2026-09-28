// DEV STYLE SWITCHER — try presets and tweaks live, on top of content/ui/style.json.
// It only changes this browser tab; to keep a look, copy it into style.json.
import { Button, ListRow, Panel, Selector, Text, presets, type StyleFile } from '../kit'

// Friendly names → the setting values they set
const corners = { Square: '0rem', Medium: '0.5rem', Round: '1.5rem' }
const density = { Tight: 0.75, Normal: 1, Roomy: 1.25 }
const textSize = { '100%': 1, '150%': 1.5, '200%': 2 }

const nameFor = <T,>(table: Record<string, T>, value: unknown, fallback: string) =>
  Object.keys(table).find((name) => table[name] === value) ?? fallback

type Props = { current: StyleFile; onChange: (style: StyleFile) => void; onReset: () => void }

export function StyleSwitcher({ current: style, onChange, onReset }: Props) {
  const tweaks = style.tweaks ?? {}
  const tweak = (name: string, value: string | number) => onChange({ ...style, tweaks: { ...tweaks, [name]: value } })
  const preset = presets[style.preset] ?? presets.clean
  // Corners sets both controls and panels
  const setCorners = (radius: string) => onChange({ ...style, tweaks: { ...tweaks, 'radius-control': radius, 'radius-panel': radius } })
  const primary = String(tweaks.primary ?? preset.primary)

  return (
    <Panel gap="s" depth={1}>
      <Text kind="heading">Style (dev)</Text>
      <ListRow label="Preset">
        <Selector label="Preset" options={Object.keys(presets)} value={style.preset} onChange={(p) => onChange({ ...style, preset: p })} />
      </ListRow>
      <ListRow label="Corners">
        <Selector label="Corners" options={Object.keys(corners)} value={nameFor(corners, tweaks['radius-control'], 'Medium')}
          onChange={(n) => setCorners(corners[n as keyof typeof corners])} />
      </ListRow>
      <ListRow label="Spacing">
        <Selector label="Spacing" options={Object.keys(density)} value={nameFor(density, tweaks.density, 'Normal')}
          onChange={(n) => tweak('density', density[n as keyof typeof density])} />
      </ListRow>
      <ListRow label="Text size" detail="Accessibility: up to 200%">
        <Selector label="Text size" options={Object.keys(textSize)} value={nameFor(textSize, tweaks['text-size'], '100%')}
          onChange={(n) => tweak('text-size', textSize[n as keyof typeof textSize])} />
      </ListRow>
      <ListRow label="Primary colour">
        <input className="kit-input kit-target gallery-colour" type="color" aria-label="Primary colour" value={primary}
          onChange={(e) => tweak('primary', e.target.value)} />
      </ListRow>
      <Button variant="ghost" onClick={onReset}>Reset to style.json</Button>
    </Panel>
  )
}
