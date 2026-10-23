// FRAMEWORK ONLY (never installed) — lets the framework typecheck and test kit/ui/EmoteLayer.tsx.
// In a game the bubbles sit at src/emotes/ui/ and import the UI kit from '../../ui/kit' (= src/ui/kit). Here that
// same path lands in this folder, so this file passes it on to the framework's own UI kit.
export * from '../../../ui-kit/kit/index.ts'
