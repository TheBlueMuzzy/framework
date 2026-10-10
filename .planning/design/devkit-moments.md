# Dev Kit Moments + feel presets — design (framework F32)

Muzzy 2026-10-09: pick feel by **watching a moment loop**, not by reading numbers. Presets are the easy start (like the UI kit's 5 styles); every slider stays tweakable after.

## Moments

### Where a moment plays (spike, 2026-10-10)
**Decision: in the Screens sandbox frame, with sound let through for moments, and every live edit forwarded into the frame.**

| Option | For | Against |
|---|---|---|
| **(a) Screens sandbox** ✅ | Already a separate copy of the game (own stores, own screen stack). Saves, sends and history are blocked, so a moment can fire 100 times and the real game is **exactly** as it was — nothing to restore. Any screen works: mid-game board, the reveal, the end table, an online lobby. Online games too. | Needs: sound allowed for moments, live edits copied into the frame, the moment controls in the overlay (the overlay covers the Dev Kit panel). |
| (b) Live game via the adapter | Plays in the real game you're looking at. | The adapter must build each moment's state, fire it, then `setState` back. `setState` clears the planned move, AI seats play on after a restore, the game may autosave the moment's board, timers already running still fire. Off in online games (`canRestore`). Every game re-solves "restore after". |
| (c) A bare test scene | Fast. | Not the real animation or sound — defeats the point. |

How (a) works:
- **Where moments live:** the game's `src/devkit-game/previews.tsx`, `export const moments: DevKitMoment[]`, each with `screen` = a preview id. Both windows load that file: the overlay reads labels, knobs and presets; the frame runs `play()`. (Not the adapter in `tabs.ts`: that only loads in the real game, never in the frame.)
- **▶ / 🔁:** the overlay sends `{ kind: 'moment', id }` to the frame; the frame runs `play()` and answers when it's done. 🔁 fires again every *interval* seconds (never overlapping a play that is still running). It stops on 🔁 again, another moment's 🔁, ↻ Replay, a variant change, or closing.
- **`play()` must be repeatable:** it sets up what it needs each time (e.g. load the sample board, then trigger the pop). It runs in the frame, so it may write the stores freely.
- **Sound:** the sandbox stays silent until the first ▶ (opening a screen is still quiet). Then `allowSound()` lets `<audio>` and Web Audio play and resumes any audio context the game made. Saves / sends / history stay blocked. The frame gets `allow="autoplay"`.
- **Live edits:** every Dev Kit edit (`devkit:tuning` — Tuning, Sound, Moments tabs) is copied into the frame, and a fresh frame (↻, variant) gets the latest edit of each file. So the moment loops with the slider you're dragging.

This replaces audio.md's "▶ in context via the adapter" and its "the Screens sandbox stays silent" line: the sandbox is silent **until a moment plays**.

### What a game writes
```ts
// src/devkit-game/previews.tsx
export const moments: DevKitMoment[] = [{
  id: 'score-pop', screen: 'board', label: 'Score pop', note: '+1s pop in, the total flies to the score',
  play: () => { loadSample(); castTwoBirds() },              // runs in the sandbox; may be async
  knobs: [
    { file: 'content/tuning/feel.json', path: 'tiers.big.grow' },                 // role guessed: size
    { file: 'content/tuning/anim.json', path: 'scorePopTime' },                   // role guessed: duration
    { file: 'content/audio.json', path: 'sounds.score.pop.volumeDb',               // role guessed: volume
      values: { soft: -12, balanced: -8, punchy: -5 } },                          // exact values win over the rules
  ],
}]
```
- `path` reads keys that contain dots (`sounds.score.pop.volumeDb` → `sounds` › `score.pop` › `volumeDb`).
- Ranges, labels and help come from the file's `_ranges` / `_labels` / `_help`, wildcards too (`sounds.*.volumeDb`).
- A knob shared by several moments (a feel tier) says so: changing it changes them all — same intention, same motion.

## Feel presets: Soft · Balanced · Punchy
Research (2026-10-10) — every tool and talk splits feel along the same few dials:
- **Unity Feel (MMF Player):** one *intensity* factor scales every feedback; timescale / hit-stop; a sound + scale + shake per feedback.
- **DOTween / Robert Penner eases:** `OutQuad` (calm), `OutBack` (overshoot 1.70158 = a bounce), `OutElastic` (wobbly). A bigger overshoot = more cartoon.
- **"Juice it or lose it"** (Jonasson & Purho) and **"The art of screenshake"** (Vlambeer): tweens, squash & stretch, sound, particles, screen shake — Nuclear Throne turns every one up and lets it decay fast.
- **Celeste:** the polish is mostly *felt*, not seen — small, quick, forgiving.
- **Cozy games** (Lost Garden, "Designing for coziness"): gentle, lower arousal, soft sounds — still responsive, never harsh.
- **Mobile UI motion** (Material): 200–300 ms on phones; past ~400 ms feels slow.

The names stay **Soft · Balanced · Punchy** — plain words, and they map straight onto those families (cozy / Celeste, the game's own, Vlambeer).

### The relative rules (when a game gives no exact values)
**Balanced = the values in the files when the screen opened.** Soft and Punchy move each knob by its *role*, then clamp to the knob's range and round to its step.

| Role (guessed from the key) | Soft | Balanced | Punchy |
|---|---|---|---|
| duration (`…Ms`, `…Time`, fade, hold) | × 1.3 | × 1 | × 0.75 |
| delay / gap / stagger | × 1.25 | × 1 | × 0.8 |
| size (grow, scale, squash, swell) | × 0.6 | × 1 | × 1.4 |
| shake | × 0.5 | × 1 | × 1.5 |
| overshoot / bounce | × 0.5 | × 1 | × 1.5 |
| volume (`volumeDb`) | − 3 dB | 0 | + 2 dB |
| random pitch | × 0.5 | × 1 | × 1.5 |
| anything else (a count, a tier name, pitch) | unchanged | unchanged | unchanged |

- A knob can name its role (`role: 'size'`) when the key doesn't say it, or `role: 'none'` to keep it out of presets.
- **Exact values** (`values: { soft, balanced, punchy }`) win over the rules — use them once a moment's look is decided, so the presets don't drift after a Save (relative presets start from the saved file).
- The picker shows the active style, or **custom** after any slider tweak.

Sources:
[Feel — MMF Player](https://feel-docs.moremountains.com/mmf-player.html) ·
[Feel](https://feel.moremountains.com/) ·
[Juice it or lose it (summary)](https://rpgplayground.com/research-making-a-juicy-game/) ·
[Vlambeer gunfeel in Nuclear Throne](https://killscreen.com/nuclear-throne-is-hotter-than-a-smoking-gun) ·
[Celeste game-feel tricks](https://www.gamespot.com/articles/celeste-dev-explains-how-they-made-their-game-feel/1100-6474775/) ·
[Celeste & Forgiveness](https://maddymakesgames.com/articles/celeste_and_forgiveness/index.html) ·
[Cozy games — Lost Garden](https://lostgarden.com/2018/01/24/cozy-games/) ·
[Designing for coziness](https://www.gamedeveloper.com/design/designing-for-coziness) ·
[Material motion: duration & easing](https://m1.material.io/motion/duration-easing.html) ·
[Back / Elastic ease parameters](https://animejs.com/documentation/easings/built-in-eases)
