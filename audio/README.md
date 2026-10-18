# Audio

Sound for a game. **Code never names a file**: the game says *what happened* (`playSound('seed.land')`), and `content/audio.json` says *what that sounds like* — which files, how loud, how high, how much it varies, which volume group, how often it may repeat. Swapping a placeholder for a final sound means dropping in a file and editing the JSON (or, soon, the Dev Kit Sound Board).

Design: `../.planning/design/audio.md`. Framework v0.6 (F27 engine + rules, F28 music + mix). Kit **0.3.0** (0.3.0: the Dev Kit's full pause silences it; its promise checks). Proven in Glyphtender (its v0.9).

No library: the browser's own Web Audio does it all. No runtime dependencies.

## What a game gets (0.2.0)
| File | Does |
|---|---|
| `index.ts` | The public API (below) — import from `src/audio` |
| `config.ts` | Types, defaults and checks for `content/audio.json`. A bad value gives ONE plain-English console warning and a safe default; the game never crashes. Also the sound maths (dB, semitones, the slider curve) |
| `planner.ts` | Pure decisions (no audio): which file, how loud, how high, when — or a drop with a reason. Variants, random pitch/volume, voice limits, cooldown, priority, the pitch ladder, stale/catch-up drops |
| `engine.ts` | The browser side: one AudioContext (made in the first tap), buses → master → limiter, iPhone silent switch, hidden tab / phone call = paused (and sounds asked for meanwhile are **dropped, never queued**), mono, snapshots (a stack), ducking |
| `loader.ts` | Fetches + decodes each effect / menu file once (cached), from `<baseUrl>audio/<file>` |
| `stream.ts` | Music + ambience **stream** from the file through an `<audio>` element into their volume group (never decoded whole). Streamed loops crossfade at the loop point |
| `music.ts` | Music **tracks**: layers in sync, one 0–1 intensity that fades layers in, rests (the music comes and goes), one track at a time with crossfades |
| `log.ts` | Every play and drop with its reason (ring buffer). `exposeLog` → `window.__audioLog` |
| `settings.ts` | The player's Settings → Audio values → the engine (same ids as the UI kit's standard Audio tab) |
| `react.ts` | `useAudioSettings`, `useAudioSnapshot`, `useLoop`, `useMusic` |
| `shared.ts` | One shared engine so any file can `playSound(...)` |

Kit 0.1.2 adds `audio.level(bus)` for the Dev Kit **Sound tab** (F30 — it lives in the Dev Kit: `devkit/kit/sound/`, see the Dev Kit README).

Kit 0.2.0 (F28) adds music tracks (layers + intensity + rests), streaming for music + ambience, and the snapshot stack.

Kit 0.2.1: the Settings row is **Sound** (`sound`, on = plays; was `muteAll` — an old save is read as its opposite), and switching it off lets the click that just started finish (`master.muteDelayMs`, 250) before the silence.

Coming next: loudness check script (F31).

## What a game must provide
From MODULE-CONTRACTS.md (`~/.claude/config/bmuz/`):
- **Code says what happened** — `playSound('seed.land')` — and **`content/audio.json` says what it sounds like**.
  Game code never names a sound file and never makes its own `Audio` / `AudioContext` (the mixing, the player's
  Settings and the Dev Kit's pause can't reach those).
- **The Dev Kit's ⏸ Full pause silences it** — nothing to wire since 0.3.0: the engine hears the Dev Kit's
  `devkit:pause` window event itself (full = suspended like a hidden tab, sounds asked for meanwhile are dropped;
  resume plays on; ◐ half pause leaves sound alone). The Sound tab edits play live.

**How it's checked — `npm run check:framework`** (the Dev Kit's runner runs `kit/conformance.mjs`):
- *sounds are named in code, described in content/audio.json* — fails on a missing `content/audio.json`, and names
  each line of game code with a sound file name or its own `new Audio(` / `new AudioContext(`.
- *the Dev Kit's full pause silences the sound* — fails when this copy of the module is older than 0.3.0.

## Install / update in a game
```
node ../../framework/audio/scripts/install-audio.mjs .            (from the game folder)
node ../../framework/audio/scripts/install-audio.mjs . --dry-run  (just show what would change)
```
Copies `kit/` → `<game>/src/audio/` with a VERSION stamp (tests stay here), removes files the module no longer ships (only inside `src/audio/`), and gives the game a starter `content/audio.json` **once** — after that the file is the game's and is never overwritten. Sound files go in `public/audio/{sfx,ui,amb,mus,stg}/`, named `category_object_action_01.mp3`. The game needs React (for `react.ts`).

## Hooking it up (once, at start-up)
```ts
import audioJson from '../content/audio.json'
import { createAudio, setAudio, exposeLog } from './audio'

const audio = createAudio(audioJson, { baseUrl: import.meta.env.BASE_URL }) // the game may live under /glyphtender/
setAudio(audio)                            // so playSound works from any file
if (import.meta.env.DEV) exposeLog(audio)  // window.__audioLog for e2e tests and the console
```
In the Settings screen's parent: `useAudioSettings(audio, settingsValues)`. On the Pause screen: `useAudioSnapshot(audio, 'paused')`. On the game screen: `useLoop(audio, 'amb.night')` + `useMusic(audio, 'garden')`. In the menus: `useMusic(audio, 'menu')` (changing screens crossfades the two tracks).
Nothing else is needed for phones: audio starts on the first tap by itself.

## Where sounds go: at the animation's moment
- **A sound plays when the player SEES the moment, not when the event arrives.** Events come before the visual (a seed lands 0.3 s after the cast). Call `playSound` in the code that plays the moment (the animation's land / pop / end callback).
- **Scheduled sequences hand over their times:** `playSound('score.pop', { at: popTime })`, where `popTime` is on the `performance.now()` clock (the same clock as `requestAnimationFrame`). The future is scheduled precisely on the audio clock.
- **Same intention → same sound:** a juiced moment with no sound of its own plays its feel tier: `playTier('medium')`, in the same frame as its grow/shake.
- **Online:** your own action plays on your tap, not on the server's echo. A rival's turn plays as its replay animates. Catch-up (rejoin, loading a room) is silent: pass `{ catchUp: true }` or simply don't call. Anything more than `limits.staleMs` (400 ms) late is dropped.
- **Reduce motion:** sounds still play, at the instant the moment happens.

## The public API
```ts
createAudio(config: unknown, options?: {
  baseUrl?: string                               // files load from <baseUrl>audio/<file>; default "/"
  fetchFile?: (url: string) => Promise<ArrayBuffer>
  context?: () => AudioContext                   // tests pass a fake
  now?: () => number                             // the clock `at` uses; default performance.now()
  rng?: () => number                             // default Math.random (seed it in tests)
  preload?: boolean                              // load every sfx + ui file right after the unlock (default true)
  logSize?: number                               // default 200
  mediaElement?: (url: string) => <audio>-like    // tests pass a fake; default new Audio()
}): Audio

audio.play(name, options?) → PlayPlan | Drop     // never throws; a Drop has { reason, detail }
  options: { at?, delayMs?, pan?, volumeDb?, pitch?, step?, catchUp? }
audio.playTier('small' | 'medium' | 'big', options?)
audio.stop(name, { fadeMs? })  ·  audio.stopAll({ fadeMs? })
audio.setBusVolume('master' | 'music' | 'ambience' | 'sfx' | 'ui', slider 0–100)
audio.setMuted(bool)  ·  audio.setMuteInBackground(bool)  ·  audio.setMono(bool)
audio.snapshot('paused' | 'reveal' | … | null)  // a named mix; null = normal (replaces the whole stack)
audio.pushSnapshot(name) · audio.popSnapshot(name) · audio.snapshots()   // mixes STACK: pop the top → the one below comes back
audio.playMusic(track, { fadeMs? })              // music.tracks.<track>; one at a time (switching crossfades); before the tap → waits
audio.stopMusic({ fadeMs?, track? })             // fade out (default its fadeOutMs); with track: only if it's the one playing
audio.setMusicIntensity(0…1, { rampMs? })        // layers fade in between their fromIntensity and fullAtIntensity (default ramp 300 ms)
audio.restMusic() · audio.endMusicRest()         // rest now / come back now (the Dev Kit's buttons)
audio.musicState() → { track, phase: off|waiting|playing|fading|resting, play, playsBeforeRest, restLeftMs, intensity, layers }
audio.duck()                                     // music dips for a moment (sounds with "duck": true do this themselves)
audio.unlock()                                   // only for custom flows — the first tap does it anyway
audio.state() → 'locked' | 'running' | 'suspended'
audio.setConfig(json)                            // live tuning (Dev Kit): validated like at start
audio.config()  ·  audio.voices()  ·  audio.preload(names?)  ·  audio.reloadFile(file)
audio.level(bus | 'master') → 0…1                // the peak right now — the Dev Kit Sound tab's meters (0.1.2)
audio.log.entries()  ·  audio.onLog(fn) → unsubscribe  ·  audio.dispose()

setAudio(audio)  ·  getAudio()  ·  playSound(name, options?)  ·  playTier(tier, options?)   // shared engine; null-safe
exposeLog(audio)                                 // window.__audioLog = audio.log
useAudioSettings(audio, values)  ·  useAudioSnapshot(audio, name)  ·  useLoop(audio, name, fadeMs?)  ·  useMusic(audio, track, fadeMs?)
readAudioConfig(json, warn?) · planPlay(input) · seededRandom(seed) · dbToGain · semitonesToRate · sliderToGain
```
**Drop reasons** (in the log): `unknown-sound` · `no-files` · `catch-up` · `locked` (no tap yet) · `suspended` (hidden / call / lock screen) · `muted` · `stale` · `cooldown` · `already-playing` (a loop) · `global-limit` · `not-loaded` (the file is still loading — it loads for next time). Loops (music, ambience) asked for while locked or paused are remembered and start as soon as audio can play.

**Player sliders** (0–100) use the curve gain = (slider / 100)²: 100 → 0 dB · 80 → −3.9 dB · 50 → −12 dB · 25 → −24 dB · 0 → silent. So the middle of the slider sounds like the middle.

## `content/audio.json`
```jsonc
{
  "buses":  { "music": -8, "ambience": -10, "sfx": 0, "ui": -8 },   // dB under master
  "master": { "limiterDb": -1 },                                     // nothing louder than this
  "tiers":  { "small": "tier.small", "medium": "tier.medium", "big": "tier.big" },
  "ladder": { "scale": "pentatonic", "root": "D", "steps": 10, "resetMs": 1200 },
  "snapshots": { "paused": { "music": -10, "lowpassHz": 900, "fadeMs": 250 }, "reveal": { "music": -6, "ambience": -8 } },
  "duck":   { "amountDb": -7, "downMs": 10, "backMs": 600 },
  "limits": { "maxVoices": 14, "staleMs": 400 },
  "sounds": {
    "seed.land": {
      "files": ["sfx/seed_land_01.mp3", "sfx/seed_land_02.mp3"],
      "pick": "random",                       // random (never the same twice) · sequence · shuffle
      "bus": "sfx", "volumeDb": -6, "pitch": 0, "randomPitch": 0.5, "randomVolumeDb": 2,
      "delayMs": 0, "trimStartMs": 0, "trimEndMs": 0, "fadeInMs": 0, "fadeOutMs": 0,
      "loop": false, "loopStartMs": 0, "loopEndMs": 0,
      "maxVoices": 3, "cooldownMs": 40, "priority": 2,
      "pan": 0, "lowpassHz": 0, "highpassHz": 0,
      "ladder": false, "duck": false,
      "stream": "auto", "loopCrossfadeMs": 100   // auto: music + ambience stream, effects + menus are decoded
    }
  },
  "music": {
    "tracks": {
      "garden": {
        "layers": {                                 // start together, stay together: record them the same length
          "harp": { "file": "mus/mus_garden_harp_01.mp3" },     // from 0 + full 0 = always on
          "pad":  { "file": "mus/mus_garden_pad_01.mp3", "volumeDb": -6, "fromIntensity": 0.3, "fullAtIntensity": 0.8 }
        },
        "loop": true, "loopStartMs": 0, "loopEndMs": 0, "loopCrossfadeMs": 100,
        "playsBeforeRest": 2,                       // 0 = never rests
        "restSeconds": [60, 90],                    // a random rest between the two
        "fadeInMs": 2000, "fadeOutMs": 3000
      }
    }
  }
}
```
- **Every field of a sound is optional** — `{ "files": ["ui/tap.mp3"], "bus": "ui" }` is a whole sound. Defaults: random pick · sfx · 0 dB · no pitch · no randomness · 4 copies · 30 ms cooldown · priority 2 · centre · no filters.
- **Ranges** (out of range → clamped, with a warning): volume −40…+6 dB · pitch −12…+12 semitones · random pitch 0…3 · random volume 0…6 dB · delay 0…1000 ms · cooldown 0…500 ms · copies 1…8 · priority 0…5 (higher = more important) · pan −1…1 · filters 0 (off) or 20…20000 Hz.
- **Pitch and speed are one knob:** +12 = an octave higher and twice as fast (streamed sounds too).
- **Streaming** (`stream`): `auto` = music + ambience play straight from the file through an `<audio>` element (a 3-minute song is ~40 MB decoded); effects + menus are decoded so they start instantly. The trade-off: an `<audio>` element can't jump back sample-exact, so a **streamed loop crossfades** for `loopCrossfadeMs` at its loop point. A short rhythmic loop that must be sample-exact sets `"stream": "never"`. A streamed one-shot's fade-out starts once its length is known. Streams pause with the AudioContext (hidden tab); a phone that refuses to start an `<audio>` gets it started on the next tap.
- **Music tracks** (`music.tracks`):
  - **Layers** start together (separate `<audio>` elements can drift a few ms — fine for beds and pads, not for tight rhythm parts). A layer's volume = its `volumeDb` × the intensity curve: silent up to `fromIntensity`, full from `fullAtIntensity`, t² in between (like the player sliders). The first layer is the leader: its loops and its end count the plays.
  - **One intensity** per track: `setMusicIntensity(x)` — the game raises it in exciting moments (a reveal).
  - **Plays and rests:** a loop counts each time round as a play; a piece (`loop: false`) counts one play when it ends. The last play before a rest doesn't loop: it plays into the file's ending (anything after `loopEndMs`) and fades out over its last `fadeOutMs`. Then quiet for a random time in `restSeconds` (only counted while audio runs), then back from the top over `fadeInMs`. Logged as `{ result: 'music', event: 'start' | 'play' | 'rest' | 'stop', detail }` — e2e tests read them.
  - **One track at a time:** playing another crossfades (the old fades out over `fadeMs` or its `fadeOutMs`, the new fades in over `fadeMs` or its `fadeInMs`).
  - **Stingers** are sounds with `"duck": true` — the duck sits on the Music group, so it dips streamed music too.
- **Snapshots stack:** `useAudioSnapshot` pushes on mount and pops on unmount, so the Pause screen during the Reveal returns to the Reveal's mix. Pushing fades in over the new mix's `fadeMs`; popping the top fades back over the removed one's `fadeMs`; popping one that isn't on top changes nothing you hear. `snapshot(name | null)` still replaces the whole stack.
- **Ladder sounds** (`"ladder": true`) climb the scale one note per quick repeat, hold the top note after `steps`, and start over after `resetMs` of quiet. No random pitch on a ladder (it would knock the notes out of key). `root` is the key the ladder's files are recorded in — record/tune them to it; the module doesn't retune. A game can name the step itself: `{ step: 3 }`.
- **Copies and the cap:** one copy over `maxVoices` cuts that sound's oldest copy. Over `limits.maxVoices` effect + menu sounds at once (music and ambience don't count), the least important, then quietest, then oldest is cut — or the new sound is dropped if everything playing is more important.
- **`_help` / `_labels` / `_sections` / `_ranges`** follow the Dev Kit convention (`_ranges` = `[min, max, step]`). Per-sound knobs use a `sounds.*.knob` wildcard key (e.g. `"sounds.*.volumeDb"`) so one entry covers every sound — the Sound Board (F30) reads those.

## Tests
`npm test` (vitest) and `npx tsc --noEmit` here in `audio/`. The planner is tested without audio; the engine with a hand-rolled fake AudioContext (`kit/fakeAudioContext.test.helper.ts`, not shipped — it includes a fake `<audio>` element whose position follows the test's clock); music + streaming with fake timers (`kit/music.test.ts`). `react.ts` is three thin `useEffect`s, typechecked here and exercised in the game.
