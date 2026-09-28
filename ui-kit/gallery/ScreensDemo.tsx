// SCREEN STACK DEMO — open a settings screen, a dialog on top of it, then back out
// with Esc, the browser/phone Back button, or the buttons. Only the top screen responds.
import { useState } from 'react'
import { Button, ListRow, Panel, Row, Screen, ScreenStack, screens, Stack, Text, Toggle } from '../kit'

function Settings() {
  const [music, setMusic] = useState(true)
  return (
    <Screen label="Settings">
      <Panel gap="s" depth={2}>
        <Text kind="heading">Settings</Text>
        <ListRow label="Music"><Toggle label="Music" on={music} onChange={setMusic} /></ListRow>
        <Row gap="s" justify="end">
          <Button variant="secondary" onClick={() => screens.pop()}>Back</Button>
          <Button variant="danger" onClick={() => screens.push('quit')}>Quit…</Button>
        </Row>
      </Panel>
    </Screen>
  )
}

function QuitDialog() {
  return (
    <Screen dialog label="Quit game?">
      <Panel gap="s" depth={2}>
        <Text kind="heading">Quit game?</Text>
        <Text kind="caption">Your progress is saved.</Text>
        <Row gap="s" justify="end">
          <Button variant="secondary" onClick={() => screens.pop()}>Stay</Button>
          <Button variant="danger" onClick={() => { screens.pop(); screens.pop() }}>Quit</Button>
        </Row>
      </Panel>
    </Screen>
  )
}

export function ScreensDemo() {
  return (
    <Stack gap="m">
      <Text kind="title">Screens</Text>
      <Text kind="caption">Open settings, then Quit… for a dialog on top. Esc, Back or the buttons close the top one.</Text>
      <div className="gallery-stage gallery-screens">
        <ScreenStack screens={{ settings: Settings, quit: QuitDialog }}>
          <Screen label="Game" top={<Text kind="label">The game</Text>}
            bottom={<Button onClick={() => screens.push('settings')}>Open settings</Button>} />
        </ScreenStack>
      </div>
    </Stack>
  )
}
