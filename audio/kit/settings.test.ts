import { describe, expect, it } from 'vitest'
import { applyAudioSettings, DEFAULT_AUDIO_SETTINGS, readAudioSettings, type AudioSettingsTarget } from './settings.ts'

function recorder() {
  const calls: string[] = []
  const target: AudioSettingsTarget = {
    setBusVolume: (bus, slider) => calls.push(`${bus}=${slider}`),
    setMuted: (muted) => calls.push(`muted=${muted}`),
    setMuteInBackground: (mute) => calls.push(`background=${mute}`),
    setMono: (mono) => calls.push(`mono=${mono}`),
  }
  return { target, calls }
}

describe('audio settings', () => {
  it('defaults match the UI kit Settings → Audio standard', () => {
    expect(DEFAULT_AUDIO_SETTINGS).toEqual({
      masterVolume: 80, musicVolume: 50, ambienceVolume: 60, sfxVolume: 80, uiVolume: 70,
      sound: true, muteInBackground: true, mono: false,
    })
  })

  it('missing or wrong-type values use the defaults', () => {
    expect(readAudioSettings({ musicVolume: 10, sfxVolume: 'loud', mono: true })).toEqual({ ...DEFAULT_AUDIO_SETTINGS, musicVolume: 10, mono: true })
    expect(readAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS)
  })

  it('drives every bus, mute, background mute and mono', () => {
    const { target, calls } = recorder()
    applyAudioSettings(target, { masterVolume: 100, sound: false })
    expect(calls).toEqual(['master=100', 'music=50', 'ambience=60', 'sfx=80', 'ui=70', 'muted=true', 'background=true', 'mono=false'])
  })

  it('an older save with Mute everything (muteAll) comes out as Sound off / on, once — a saved Sound wins', () => {
    expect(readAudioSettings({ muteAll: true }).sound).toBe(false)
    expect(readAudioSettings({ muteAll: false }).sound).toBe(true)
    expect(readAudioSettings({ muteAll: true, sound: true }).sound).toBe(true)
    const { target, calls } = recorder()
    applyAudioSettings(target, { masterVolume: 60, muteAll: true })
    expect(calls).toContain('muted=true')
  })
})
