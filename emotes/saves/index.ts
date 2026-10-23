// FRAMEWORK ONLY (never installed) — lets the framework typecheck and test kit/save.ts.
// In a game the emotes module sits at src/emotes/ and imports the saves module from '../saves' (= src/saves). Here that
// same path lands in this folder, so this file passes it on to the framework's own saves module.
export * from '../../saves/kit/index.ts'
