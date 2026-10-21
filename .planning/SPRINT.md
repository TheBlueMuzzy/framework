# Sprint 24 — Every sound in a game comes out equally loud and starts on time
Started 2026-10-21 · Milestone v0.6 leftover (F31) · Features: F31
From the v0.11.0 release: the only ready framework feature, and the one Goops needs next (26 recorded placeholders, Muzzy hunting better ones; Goops' session: "a loudness check could become a framework audio-module check later"). Convert-to-MP3 + onset trim already exist in the Dev Kit's drop (devkit/vite/audioSave.ts, F30); this sprint adds the loudness half. Muzzy 2026-10-21: "/develop" on the plan (= OK).

## F31 🔧 Audio check
Done when: one shared loudness matcher lives in the audio module (Goops' active-RMS method, harvested from goops/scripts/sounds/build.mjs); a sound dropped into the Sound Board comes out at its bus's target loudness as well as trimmed + MP3; `audio-check` reports every file in a game's public/audio (loudness, peak, onset delay, length) and flags the off ones, `--fix` evens them out keeping the originals; check:framework's audio part warns on a sound far off target or late to start; targets per bus live in content/audio.json; uses the system ffmpeg (never ffmpeg-static).
- [x] 🤖 1. Research loudness targets for games (phone vs desktop, effects vs UI vs music vs ambience, true-peak ceiling, how far off is "off") → a Loudness section in the design — .planning/design/audio.md
- [ ] 🤖 2. The shared loudness matcher: measure active loudness + peak + onset, gain to a target, a fast limiter for spikes (from Goops' build.mjs) + tests — audio/scripts/loudness.mjs
- [ ] 🤖 3. The Sound Board drop also matches the bus's target loudness (targets from content/audio.json, defaults in the template) — devkit/vite/audioSave.ts
- [ ] 🤖 4. `audio-check` report + `--fix` (originals kept beside, never overwritten silently) — audio/scripts/audio-check.mjs
- [ ] 🤖 5. check:framework audio part: warns on a sound > the allowed distance from its target or with a late onset (effects/UI only) — audio/kit/conformance.mjs
- [ ] 🤖 6. Docs + versions: audio README, template audio.json targets, audio kit + Dev Kit VERSION bumps, audio-setup skill points at audio-check — audio/README.md
- [ ] 🤖 7. Proof: scratch Goops (.scratch/goops-f31) — the report on its sounds, then --fix, then the report again — audio/kit/conformance.test.mjs
- [ ] 🙋 8. Listen to 3 before/after pairs from the scratch Goops and say if they sound even
Check: audio + devkit tests, typecheck, lint green (root check:fast); scratch Goops: audio-check lists every file with numbers and flags the off ones; --fix brings them within the allowed distance and keeps originals; a dropped WAV in the Sound Board lands at its target; check:framework's audio part warns on a deliberately quiet file and passes after --fix; no ffmpeg → a plain message.
Ask Muzzy: —

Notes:
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No BUGS.md in the framework.
- Technical calls (Claude): system ffmpeg, not ffmpeg-static (GPL binary, ~70 MB per game; the Dev Kit drop already uses the system one); targets in content/audio.json so Muzzy can edit them (Dev Kit / Obsidian).
- F62 (Goops passes the pack) stays with Goops' own session; F64/F65 wait on it.
- Task 1 (Claude): standards are whole-game numbers (console −24/−23 LUFS, phone −18/−16, ceiling −1 dBTP, ±2 LU); there's no standard per category — studios level every file to one reference and mix in the engine. So **every folder defaults to −18** and the mix stays in the buses (ui −8, music −8, ambience −10 already). Tolerance 3 dB (a single click wobbles more than a whole game's average). Short sounds use Goops' active loudness, long ones real LUFS (BS.1770, written in JS — testable with made-up samples, no ffmpeg needed).
