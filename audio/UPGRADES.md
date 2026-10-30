# Audio — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.4.0: check:framework (audio) and check:fast go red on the new promise "every sound is as loud as the others and starts on time" until the files are evened: run `npm run audio:check -- --fix` (it keeps each original in `audio-originals/`, outside public/), then listen in the game. A game that set per-sound `volumeDb` by ear hears its mix change (Glyphtender: sprout leaf ~5 dB louder, seed land ~6 dB quieter) — re-balance those volumeDb values or ask Muzzy. (F169 will change --fix to keep the tuned mix — this line is updated then.)
