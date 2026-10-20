// FRAMEWORK ONLY (never installed) — lets the framework typecheck kit/ui/SaveCodePanel.tsx.
// In a game the panel sits at src/saves/ui/ and imports the UI kit from '../../ui/kit' (= src/ui/kit). Here that same
// path lands in this folder, so this file passes it on to the framework's own UI kit.
export * from '../../../ui-kit/kit/index.ts'
