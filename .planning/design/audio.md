# The Audio module — design (framework v0.6, proven in Glyphtender beta)

Defined with Muzzy 2026-10-09. Research: `games/glyphtender/.planning/research/audio.md` (+ `audio-standards.md`, `audio-tech.md`).

Muzzy 2026-10-08:
> "audio will be a module we're breaking out into bmuz… robust and tweakable in the dev kit. I should be able to change sounds, tweak them (like audio and speed and whatever else is tweakable)… you'll need to become the subject matter expert."

Muzzy 2026-10-09:
> "solve the architecture and systems for sound… beta is for 'don't let perfect be the enemy of good'."

## The idea
- **Code never names a file.** A game says *what happened*: `audio.play('seed.land')`.
- `content/audio.json` says *what that sounds like*:
  - which files, how loud, how high
  - how much it varies
  - which volume group it's in
  - how often it may repeat
- **Muzzy changes sounds in the Dev Kit Sound Board or the JSON, never in code.** Swapping a placeholder for a final sound means dropping in a file.

Borrowed from the big tools (FMOD / Wwise) without the software:

| Big-tool idea | What it is here |
|---|---|
| Events | Named sounds, e.g. `seed.land` |
| Random / sequence containers | Variants |
| Buses | Volume groups |
| Snapshots | Named mixes |
| Parameters | Pitch steps (the ladder), music intensity |

Left out: 3D sound, blend containers, voice-over.

## Pieces (`framework/audio/kit/` → installs to `src/audio/`)
| File | Job | Tested by |
|---|---|---|
| `planner.ts` | **Pure decisions**: given the sound's settings, what's playing now, the time and a seeded random → a play plan (file, volume, pitch, delay, filters) or a "dropped because…" reason. Variant pick (random-no-repeat · in order · shuffle), random pitch/volume, voice limit + cooldown + priority, the pitch ladder, stale/catch-up drop. | plain unit tests (no audio) |
| `engine.ts` | The browser side: one `AudioContext`, unlock on the first tap, buses → master → limiter, iOS silent-switch respect (`navigator.audioSession.type = 'ambient'` when it exists), pause when hidden / interrupted (and **never queue** while paused), mono option, snapshots + ducking as volume ramps. Plays the planner's plans. | fake AudioContext |
| `loader.ts` | Fetches and decodes short sounds once (cached). Streams music and ambience through `<audio>` into the Music / Ambience bus. Loads sound effects after the unlock; music when first needed. | unit + e2e |
| `music.ts` | Layers that play in sync (each with its own volume), gapless loops (loop points in JSON), crossfades, stingers, and **rests**: after N loops, fade to ambience only for a while. | fake AudioContext + fake `<audio>` + fake timers |
| `stream.ts` | (F28) One file played through an `<audio>` element (MediaElementSource) into the mix, with a crossfade at the loop point. | same |
| `config.ts` | Types, defaults and validation for `content/audio.json`. A bad value gives a clear console warning and a safe default; the game never crashes. | unit |
| `log.ts` | Ring buffer of every play / drop with its reason. `window.__audioLog` in dev and tests. Feeds the Sound Board log. | unit |
| `react.ts` | `useAudioSettings()` (Settings tab → buses), `<AudioUnlock/>` (first tap), `playSound` helper. | unit |
| `devkit/` | Sound Board tab (below), installed with the Dev Kit's game tabs (like the AI tab). | e2e |
| `scripts/` | `audio-check.mjs`: loudness report + convert/normalize (ffmpeg-static). `install-audio.mjs` (same shape as the other installers). | script tests |

No library. The browser's Web Audio has everything we need:
- Howler is stale (last release 2023) and has no buses or filters.
- Tone.js is a ~75 KB music toolkit.
- Code-made placeholder sounds (ZzFX) are **not** in the module. Roll Better's were "horrible" (Muzzy); placeholders are real recordings.

## `content/audio.json` (the one file Muzzy tunes)
```jsonc
{
  "buses":  { "music": -8, "ambience": -10, "sfx": 0, "ui": -8 },        // dB under master
  "master": { "limiterDb": -1 },
  "tiers":  { "small": "tier.small", "medium": "tier.medium", "big": "tier.big" },  // default sound per feel tier
  "ladder": { "scale": "pentatonic", "root": "D", "steps": 10, "resetMs": 1200 },   // chained pops climb this
  "snapshots": { "paused": { "music": -10, "lowpassHz": 900 }, "reveal": { "music": -6, "ambience": -8 } },
  "sounds": {
    "seed.land": {
      "files": ["sfx/seed_land_01.mp3", "sfx/seed_land_02.mp3", "sfx/seed_land_03.mp3"],
      "pick": "random",              // random (never the same twice) · sequence · shuffle
      "bus": "sfx", "volumeDb": -6, "pitch": 0,           // semitones
      "randomPitch": 0.5, "randomVolumeDb": 2,
      "delayMs": 0, "trimStartMs": 0, "trimEndMs": 0, "fadeInMs": 0, "fadeOutMs": 0,
      "loop": false, "loopStartMs": 0, "loopEndMs": 0,
      "maxVoices": 3, "cooldownMs": 40, "priority": 2,
      "pan": 0, "lowpassHz": 0, "highpassHz": 0,           // 0 = off
      "ladder": false                                        // true = each repeat steps up the ladder
    }
  },
  "music": { "tracks": { "garden": { "layers": { "harp": { "file": "…" }, "pad": { "file": "…", "fromIntensity": 0.3, "fullAtIntensity": 0.8 } },
                                     "loop": true, "playsBeforeRest": 2, "restSeconds": [60, 90], "fadeInMs": 2000, "fadeOutMs": 3000 } } }
}   // music as built in F28 — see Build notes, Sprint 21
```
- Every key gets `_help` / `_labels` / `_sections` / `_ranges`, the Dev Kit convention.
- Ranges:
  - volume −40…+6 dB
  - pitch −12…+12 semitones
  - random pitch 0…3
  - random volume 0…6 dB
  - delay 0…1000 ms
  - cooldown 0…500 ms
  - filters 0 or 20…20000 Hz
- **Pitch and speed are one knob** for short sounds: faster = higher. Speed-without-pitch isn't offered; it needs a heavy add-on and short sounds don't need it.

## Volume groups and the mix (standards — `research/audio-standards.md` §1)
- Master → **Music · Ambience · Effects (sfx) · UI**. UI sits 6–10 dB under Effects; it's heard hundreds of times.
- **Loudness target:** −16 to −18 LUFS overall, nothing above −1 dB. A limiter on the master as a safety net.
- **Ducking:** a big moment lowers Music by 6–8 dB (10 ms down, 600 ms back). Snapshots (Paused, Reveal) are named mixes that ramp in and out.
- **Not getting annoying:**
  - 2–3 variants (3–5 for the most frequent sound)
  - never the same one twice
  - ±0.5–1 semitone random pitch, ±1–3 dB random volume
  - 3–4 copies at once, 30–60 ms cooldown
  - ~14 sounds total at once (the oldest and quietest are cut first)
- **The ladder:** a sound with `ladder: true` steps up a pentatonic scale on each repeat (no wrong notes):
  - climbs `steps` steps, then holds the top note
  - resets after `resetMs` of quiet
  - one root key per game, so pops always sit in the music's key

## Settings (UI kit standard Audio tab)
**Rows:** Master · Music · Ambience · Effects · UI (sliders) · Mute everything · Mute when in the background · Mono.
- The kit's tabbed Settings already gives Audio its own page (tabs on wide screens, ◀ Audio ▶ on phones). Eight rows fit a phone with no scrolling, so no new page is needed.
- Defaults: Master 80 · Music 50 · Ambience 60 · Effects 80 · UI 70.
- **Slider feel:** 0–100 maps to decibels, not straight volume, so the middle of the slider sounds like the middle.
- **iPhone silent switch:** respected (Muzzy 2026-10-09: "sure"). Web audio stays silent on silent and mixes with the player's own music.
- Every important sound already has an on-screen twin (turn pulse, no-shake, toasts). Each game's sound list says which.

## Phones and the web (must-handle)
- **Unlock:** sound starts on the first tap (`pointerup`, capture phase, like fullscreen.ts). Sound effects decode right after.
- **Tab hidden / call / lock:** suspend. Sounds asked for while suspended are **dropped, never queued**, so 20 don't play at once on return. Resume on visible plus a tap if iOS needs one.
- **Formats:** **MP3** everywhere: every browser decodes it, the Dev Kit can take any file a designer drops, and the check script converts it.
  - Sound effects: mono, 96–128 kbps.
  - Music: stereo, 128–160 kbps, streamed.
  - Gapless loops come from loop points in the JSON, not the file.
- **Budget:** sound effects in the offline cache ≤ ~500 KB, loaded after the first screen (outside the first-load budget). Music is cached on first play.
- **Files live in `public/audio/{sfx,ui,amb,mus,stg}/`**, named `category_object_action_01.mp3`. Public files can be added by the Dev Kit with no rebuild.

## Online (and catch-up) rules
- Your own action plays on **your tap**, not on the server's echo.
- Other players' actions play as their replay animates (the same moments a local player hears).
- **Catch-up** (rejoin, loading a room, a burst of queued events) plays **nothing**; at most one soft "here's what happened" chime.
- Any request older than ~400 ms is dropped.

## Where sounds hook in (the rule for every game)
- **A sound plays at the animation's moment, not when the event arrives.** Events come before the visual (Glyphtender's seed lands 0.3 s+ after `cast`). So:
  - the code that plays the moment calls `playSound`
  - scheduled sequences hand their times to the planner: `audio.play('score.pop', { at: t })`
- **Same intention → same motion → same sound.** The `feel` tiers (small / medium / big) each have a default sound. A juiced moment with no sound of its own plays its tier's sound in the same frame as its grow/shake. A moment can override it with its own sound.
- **Reduce motion:** the sounds still play, at the instant the moment happens.
- The Dev Kit **Screens** sandbox stays silent until a Moment's first ▶ (then `allowSound()` — `design/devkit-moments.md`).

## Dev Kit — Sound Board tab
| Part | What it does |
|---|---|
| **Sound list** | Every sound in `content/audio.json`, grouped by bus, searchable (joins Dev Kit search). Each row: ▶ · ▶×5 (hear the variation) · its tier · how many files. |
| **Sound editor** | Sliders for every knob above (volume, pitch, random pitch/volume, delay, trim, fades, loop points, voices, cooldown, priority, bus, pan, muffle/thin filters, ladder). Changes are live in the running game; **Save** writes the JSON. ↺ per field. |
| **Files** | The variants list: ▶ each one, remove, reorder. **Drop a file** (or pick one) → saved to `public/audio/<bus>/` with the naming rule, converted to MP3 if needed, added as a variant. A waveform with drag handles for trim and loop points. |
| **A / B** | Hear the saved version against your edit. |
| **▶ in context** | = F32 **Moments**: Screens → a screen → its moments play in the preview sandbox (never the live game), sound included — `design/devkit-moments.md`. |
| **Mixer** | Bus faders (the defaults in `content/audio.json`, not the player's Settings) with level meters. Snapshot buttons (hear Paused, Reveal). |
| **Log** | While you play: every sound that played and every one that was dropped, with why ("cooldown", "voice limit", "audio locked"). |
| **Credits nudge** | A dropped-in file asks for source + licence → `content/credits.json`. |

Saving audio files needs a new Dev Kit endpoint: binary, only into `public/audio/`, dev only. It sits beside the JSON-only save.

## Each game provides
- its `content/audio.json` (the sound list) and `public/audio/` files + credits
- `playSound` calls at its animation moments, plus scheduled sequences
- its moments (`export const moments` in src/devkit-game/previews.tsx — F32) for "▶ in context" (optional)
- its sound list doc: moment · sound · tier · bus · on-screen twin

## Proof (how we know it works)
- Planner unit tests:
  - no-repeat
  - limits and cooldown
  - the ladder climbs and resets
  - stale drop
  - suspended → dropped, not queued
- An engine test with a fake AudioContext: bus wiring, mute, mono, snapshots.
- Game e2e reads `window.__audioLog`: a cast logs `seed.land` at the landing; a reconnect logs no burst.
- **Feel is judged by Muzzy's ear** on a phone and desktop. A loudness check with the script on a recording.

## Not in v0.6 (later or never)
- Speed-without-pitch · 3D / positional sound · voice-over · subtitles.
- A "play even on silent" toggle (could). Haptics pairing (Android-only; could, later).
- Code-made sounds (ZzFX) — never as defaults.
- Middleware (FMOD/Wwise).
- Unity twin (when a Unity game needs it).

## Build notes
Sprint 19 (2026-10-09, built while Muzzy slept — calls made, open to change):
- **Added to `content/audio.json`** beyond the sketch above: per-sound `"duck": true` (big moments dip the music) with a top-level `duck` { amountDb −7, downMs 10, backMs 600 }; `limits` { maxVoices 14, staleMs 400 }; per-snapshot `fadeMs` (default 250).
- **Priority: higher = more important** (0–5, default 2). Over the global cap the least important → quietest → oldest is cut; if everything playing is more important, the new sound is dropped (`global-limit`). Music, ambience and loops don't count toward the cap.
- **Per-sound copies** over `maxVoices` always cut that sound's oldest copy (no "skip the new one" mode — not needed yet).
- **Random volume and pitch are ±** (randomVolumeDb 2 = −2…+2 dB). The limiter catches the top.
- **Ladder sounds get no random pitch** (it would put notes out of key). `ladder.root` is informational — the key the ladder's files are recorded in; the module doesn't retune.
- **Loops are remembered, one-shots are not:** a loop asked for while locked / suspended / still loading starts once it can (one per name — no burst). Asking for a loop that's already playing is a no-op (`already-playing`). One-shots not loaded yet are dropped (`not-loaded`) and load for next time; effect + menu files preload right after the first tap.
- **Mute everything** drops one-shots (`muted`) but lets loops keep running silently under the master, so unmuting brings the ambience back.
- **Slider curve:** gain = (slider/100)² (50 → −12 dB, 0 = silent).
- **Streaming music through `<audio>` moved to F28** — F27 decodes every file; keep beta loops short.
- **`_ranges` / `_help` / `_labels` for sound knobs use a wildcard key** (`"sounds.*.volumeDb"`). The current Dev Kit tuning tab only knows exact paths; the Sound Board (F30) should read the wildcard.
- **No `<AudioUnlock/>` component:** the engine listens for the first tap itself (capture phase), and keeps listening, so a tap after a phone call also resumes.
- **`playSound` lives in `shared.ts`** (no React needed), `react.ts` has `useAudioSettings` / `useAudioSnapshot` / `useLoop`.
- **UI kit (F29):** standard Audio tab rows = the ids `useAudioSettings` reads; the old "Voices" row is gone (voice-over is out of scope).

Sprint 20 — F30 Sound tab (2026-10-10):
- **The Sound Board lives in the Dev Kit** (`devkit/kit/sound/`, Dev Kit 0.7.0), not in `audio/devkit/`: it is a Dev Kit tab like the AI tab, and the Dev Kit installer already ships tabs. A game adds `soundTab(getAudio, { file: audioJson })` in `src/devkit-game/tabs.ts`. It doesn't import the audio module (a structural `SoundBoardAudio` type).
- **Audio 0.1.2 adds `audio.level(bus)`** (peak 0…1, an AnalyserNode side branch made on first use) for the mixer's meters.
- **Files come in through `POST /__devkit/save-audio`** (`devkit/vite/audioSave.ts`): system ffmpeg (not ffmpeg-static), sfx/ui mono 96k trimmed to the onset (B026), music/ambience stereo 128k untouched, named `<folder>_<object>_<action>_NN.mp3` with the next free number. Credits via `POST /__devkit/add-credit` (credits.json is a list, which the JSON Save refuses).
- **"▶ in context"** (play the real moment with its animation) is not in the Sound tab: it is F32's Moments.

Sprint 21 — F28 Music + mix (2026-10-10, audio 0.2.0):
- **Streaming** (`stream.ts`): a sound's `"stream": "auto" | "always" | "never"` (true / false understood). `auto` = music + ambience buses stream through an `<audio>` element → MediaElementSource → the sound's usual chain; effects + menus stay decoded (they must start instantly). **Trade-off:** an `<audio>` element can't loop sample-exact, so a streamed loop primes a second element at the loop start and crossfades `loopCrossfadeMs` (default 100) at the loop point; the seam is a timer set for the exact moment (the 50 ms tick only notices it's near). A short rhythmic loop that must be sample-exact uses `"stream": "never"`. Glyphtender's amb.night (46 s, loopEndMs) streams by default now — if Muzzy hears the seam, raise its crossfade or set never.
- **Music tracks** (`music.ts`), `content/audio.json` → `music.tracks.<name>`: `layers.<layer> = { file, volumeDb, fromIntensity, fullAtIntensity }` + `loop`, `loopStartMs`, `loopEndMs`, `loopCrossfadeMs`, `playsBeforeRest` (0 = never), `restSeconds: [min, max]`, `fadeInMs`, `fadeOutMs`. Calls: renamed the sprint sketch's `crossfadeMs` to `loopCrossfadeMs` (same name as on sounds; switching tracks has its own `fadeMs`). A layer plays ONE file (`files: [one]` accepted) — variants would break the sync.
- **Intensity curve:** a layer is silent ≤ from, full ≥ full, t² in between (the player-slider curve, so halfway sounds like halfway). Only one intensity (per engine), set by the game; not saved in JSON.
- **Plays + rests:** the first layer is the leader (its loops / end count plays). The last play before a rest stops looping and plays into the file's ending (after loopEndMs), fading out over its last fadeOutMs; rest time only counts while audio runs (hidden tab = paused); back from the top over fadeInMs. A piece (`loop: false`) with more plays to go restarts from the top at its end.
- **Layers' sync:** separate `<audio>` elements started in one go — a few ms apart, never re-synced. Fine for beds / pads / melodies over ambience; not for two tight rhythm parts (decode those, later, if a game needs it).
- **API:** `playMusic(name, { fadeMs })` (one at a time; switching crossfades; same name again = nothing; before the first tap → waits and starts after it) · `stopMusic({ fadeMs, track })` (`track` = only if it's that one — so a screen's cleanup never stops the next screen's track) · `setMusicIntensity(x, { rampMs })` · `restMusic()` / `endMusicRest()` (Dev Kit) · `musicState()`. React: `useMusic(audio, track, fadeMs?)`. Log: `result: 'music'`, `event: start | play | rest | stop`.
- **Phones:** streams pause/resume with the AudioContext; an `<audio>` the browser refuses to start (iOS outside a tap) is retried on the next tap. **Not yet heard on a real iPhone** — Muzzy's phone check in Glyphtender task 9.
- **Stingers** = a sound with `"duck": true` (no new stinger type needed): the duck is on the Music group's way out, so streamed music dips too (tested).
- **Snapshot stack:** `pushSnapshot(name)` / `popSnapshot(name)` / `snapshots()`; `useAudioSnapshot` now pushes + pops, so Pause during the Reveal returns to the Reveal's mix. Push fades over the new mix's `fadeMs`; popping the top fades back over the removed one's `fadeMs`; popping one underneath changes nothing you hear. `snapshot(name | null)` still replaces the whole stack. Duck (`duck.amountDb / downMs / backMs`) and snapshot (`snapshots.*.fadeMs`) timings were already in content — confirmed, unchanged.
- `stopAll()` now stops the music too.
