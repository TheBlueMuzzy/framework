# Audio

Sound for a game: the code says *what happened* (`audio.play('seed.land')`), `content/audio.json` says *what that sounds like*. Design: `../.planning/design/audio.md`. Kit **0.1.0** — being built (framework v0.6, F27).

## Install / update in a game
`node audio/scripts/install-audio.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/audio/` with a VERSION stamp, and gives the game a starter `content/audio.json` once. Tests stay here (`npm test` in `audio/`).
