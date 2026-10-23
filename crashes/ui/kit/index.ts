// FRAMEWORK ONLY (never installed) — lets the framework typecheck and test kit/ui/CrashScreen.tsx.
// In a game the screen sits at src/crashes/ui/ and imports the UI kit from '../../ui/kit' (= src/ui/kit). Here that
// same path lands in this folder, so this file passes it on to the framework's own UI kit.
export * from '../../../ui-kit/kit/index.ts'
