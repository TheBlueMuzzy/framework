// All style presets, by name. A game's content/ui/style.json picks one: { "preset": "clean" }.
import clean from './clean.json'
import type { StylePreset } from '../style/tokens'

export const presets: Record<string, StylePreset> = { clean }
