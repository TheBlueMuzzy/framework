export type BmuzBand = { text: string; status: string }

declare module 'claude-code' {
  interface PluginState {
    'bmuz-proof': { band: BmuzBand | null }
  }
}
