// THE GAME UI KIT — copy this whole folder into a game's src/ui/kit/.
// Then: applyStyle(styleJson) once at start-up, and build screens from these parts.
import './kit.css'

export * from './layout'
export * from './controls'
export { applyStyle, resolveStyle, type StyleFile } from './style/applyStyle'
export { presets } from './styles'
