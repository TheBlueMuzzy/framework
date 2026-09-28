// THE STYLE SETTINGS — every name a style preset must fill in.
// Each name becomes a CSS variable: "primary" → var(--primary).
// Parts never use raw colours, sizes or fonts, only these names.

// Colours come in pairs: a background and the text/icon colour that sits on it ("on-…").
export const colourTokens = {
  'bg': 'Page background',
  'on-bg': 'Text on the page background',
  'surface': 'Panels, cards, inputs',
  'on-surface': 'Text on panels',
  'primary': 'Main buttons and selected things',
  'on-primary': 'Text on primary',
  'accent': 'Highlights: fills, active rings (never behind text)',
  'danger': 'Destructive buttons, errors',
  'on-danger': 'Text on danger',
  'muted': 'Quiet text: hints, captions',
  'border': 'Outlines, dividers, empty tracks',
  'focus': 'Keyboard/gamepad focus ring',
} as const

export const otherTokens = {
  'font-display': 'Font for titles (font names live only in presets)',
  'font-body': 'Font for everything else',
  'text-size': 'Body text size, 1 = 18px (never smaller than 1)',
  'font-scale': 'How much bigger each heading level is, e.g. 1.25',
  'radius-control': 'Corner roundness of buttons and inputs',
  'radius-panel': 'Corner roundness of panels and cards',
  'density': 'Spacing multiplier: 0.75 tight, 1 normal, 1.25 roomy',
  'depth-0': 'Shadow for flat things (buttons at rest)',
  'depth-1': 'Shadow for raised things (panels, cards)',
  'depth-2': 'Shadow for floating things (dialogs, popups)',
  'border-width': 'Outline thickness',
  'motion-fast': 'Quick animations (presses, toggles)',
  'motion-normal': 'Normal animations (panels, screens)',
  'press-scale': 'How much a button shrinks when pressed, e.g. 0.96',
  'ease': 'Animation curve',
} as const

// Optional extras: a preset may leave these out and gets the default.
export const optionalTokens = {
  'glow': 'none',
  'panel-texture': 'none',
} as const

// Worked out by applyStyle from the settings above — presets don't set these.
export const derivedTokens = {
  'gap-xs': '1 step of the 4-based spacing scale × density',
  'gap-s': '2 steps',
  'gap-m': '4 steps',
  'gap-l': '6 steps',
  'gap-xl': '8 steps',
  'text-body': 'Body text size (floor: 18px)',
  'text-heading': 'body × font-scale',
  'text-title': 'body × font-scale²',
  'text-display': 'body × font-scale³',
} as const

type RequiredName = keyof typeof colourTokens | keyof typeof otherTokens
export type TokenName = RequiredName | keyof typeof optionalTokens
export type StylePreset = Record<RequiredName, string | number> & Partial<Record<TokenName, string | number>>
export type StyleTweaks = Partial<Record<TokenName, string | number>>

// Names every preset must have (F02's test checks all presets match this list).
export const requiredTokenNames = [...Object.keys(colourTokens), ...Object.keys(otherTokens)] as TokenName[]

// Every CSS variable the kit may read (the rule checker uses this list).
export const allVariableNames = [
  ...requiredTokenNames, ...Object.keys(optionalTokens), ...Object.keys(derivedTokens),
]
