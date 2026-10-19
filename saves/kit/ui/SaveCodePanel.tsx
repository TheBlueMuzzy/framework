// SAVE CODE PANEL — the ready-made screen behind Settings → "Save code", built from UI kit parts (Modal, Button,
// TextInput, toast, askConfirm). Copy the code out, download it as a file, paste a code in, or load a file.
// This folder (src/saves/ui/) is only installed in games that have the UI kit (src/ui/kit/) — it's the saves
// module's one link to another module, and it's optional: a game without the UI kit uses saveCode.ts directly.
//
// Register it as a screen (the screen stack gives it Esc, phone Back and "only the top screen takes taps"):
//   <ScreenStack screens={{ ...screens, saveCode: () => <SaveCodePanel saves={[progress, settings]} health={health}
//      nudge={nudge} onLoaded={() => location.reload()} /> }}>
// and open it from the Settings row: onAction={(id) => id === SAVE_CODE_ROW && screens.push('saveCode')}
import { useEffect, useRef, useState } from 'react'
import { askConfirm, Button, Modal, Row, Stack, Text, TextInput, screens, toast } from '../../ui/kit'
import { HEALTH_WORDS, type SaveHealth } from '../health'
import type { BackupNudge } from '../nudge'
import type { Save, SlotSaves } from '../saves'
import { copyText, downloadSaveFile, makeSaveCode, readSaveCode, readSaveFile, saveFileName } from '../saveCode'

export const SAVE_PANEL_WORDS = {
  title: 'Save code',
  intro: 'Your save code holds all your progress. Keep a copy somewhere safe, or paste it into the game on another device.',
  yourCode: 'Your save code',
  copy: 'Copy code',
  copied: 'Save code copied.',
  copyFailed: 'Couldn\'t copy it — select the code and copy it yourself.',
  download: 'Download file',
  downloadFailed: 'This browser couldn\'t download the file — copy the code instead.',
  paste: 'Paste a save code',
  load: 'Load code',
  loadFile: 'Load a file',
  askTitle: 'Load this save?',
  askMessage: 'Progress is combined with what\'s on this device (nothing is lost); other saved choices are replaced. The save on this device is kept as a backup.',
  loaded: 'Save loaded.',
  close: 'Close',
}

type AnySave = Save<any> | SlotSaves<any> // eslint-disable-line @typescript-eslint/no-explicit-any -- any of the game's saves

export interface SaveCodePanelProps {
  saves: AnySave[]
  /** checkSaveHealth()'s result — its most serious warning is shown at the top. */
  health?: SaveHealth | null
  /** Copying or downloading the code counts as a backup for the "back up your save" nudge. */
  nudge?: BackupNudge
  /** After a code or file was loaded (the game reloads its state — location.reload() is the simplest). */
  onLoaded?: () => void
  words?: Partial<typeof SAVE_PANEL_WORDS>
}

export function SaveCodePanel({ saves, health, nudge, onLoaded, words: wordsIn }: SaveCodePanelProps) {
  const words = { ...SAVE_PANEL_WORDS, ...wordsIn }
  const [code, setCode] = useState('')
  const [pasted, setPasted] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const warning = health?.warnings.find((w) => w.level === 'risk')

  useEffect(() => {
    let live = true
    makeSaveCode(saves).then((made) => { if (live) setCode(made) })
    return () => { live = false }
  }, [saves])

  async function copy() {
    const ok = await copyText(code)
    toast(ok ? words.copied : words.copyFailed, { variant: ok ? 'neutral' : 'danger' })
    if (ok) nudge?.backedUp()
  }

  function download() {
    const ok = downloadSaveFile(code, saveFileName(saves))
    if (ok) nudge?.backedUp()
    else toast(words.downloadFailed, { variant: 'danger' })
  }

  function load(text: string) {
    askConfirm({
      title: words.askTitle, message: words.askMessage, words: { yes: words.load },
      onConfirm: async () => {
        const result = await readSaveCode(text, saves)
        if (!result.ok) { toast(result.message, { variant: 'danger', seconds: 6 }); return }
        toast(words.loaded)
        setPasted('')
        onLoaded?.()
      },
    })
  }

  async function loadFile(file: File | undefined) {
    if (!file) return
    load(await readSaveFile(file))
    if (fileInput.current) fileInput.current.value = '' // the same file can be picked again
  }

  return (
    <Modal title={words.title} onBack={() => screens.pop()} backLabel={words.close}>
      <Stack gap="m">
        <Text kind="body">{warning ? warning.message : words.intro}</Text>
        {!warning && health && <Text kind="caption">{HEALTH_WORDS.ok}</Text>}
        <TextInput label={words.yourCode} value={code} readOnly onFocus={(e) => e.currentTarget.select()} data-save-code="" />
        <Row gap="s">
          <Button variant="primary" onClick={copy} disabled={!code}>{words.copy}</Button>
          <Button variant="secondary" onClick={download} disabled={!code}>{words.download}</Button>
        </Row>
        <TextInput label={words.paste} value={pasted} onChange={(e) => setPasted(e.currentTarget.value)} autoComplete="off" spellCheck={false} data-save-paste="" />
        <Row gap="s">
          <Button variant="secondary" onClick={() => load(pasted)} disabled={!pasted.trim()}>{words.load}</Button>
          <Button variant="ghost" onClick={() => fileInput.current?.click()}>{words.loadFile}</Button>
        </Row>
        <input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={(e) => loadFile(e.currentTarget.files?.[0])} />
      </Stack>
    </Modal>
  )
}
