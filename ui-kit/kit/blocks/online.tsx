// ONLINE — Lobby (create a room, or join one by its code; then who's in and who's ready)
// and Reconnecting (lost connection / can't connect). The game does the networking and
// passes in what's true right now; these screens only show it and report button presses.
import { useState } from 'react'
import { Panel, Row, Screen, Stack } from '../layout'
import { Avatar, Badge, Button, ListRow, RoomCodeInput, ScrollArea, Text, TextInput } from '../controls'
import { Modal, Spinner } from './dialogs'
import { fill } from './words'

export const lobbyWords = {
  title: 'Play online', create: 'Create a room', or: 'or join a friend', join: 'Join', name: 'Your name',
  room: 'Room {code}', share: 'Share this code with your friends', host: 'Host', ready: 'Ready', notReady: 'Not ready',
  imReady: 'I’m ready', notYet: 'Not ready yet', start: 'Start game', leave: 'Leave',
  waitingHost: 'Waiting for the host to start…', needPlayers: 'Need at least {n} players', waitingReady: 'Waiting for everyone to be ready',
}
export type LobbyPlayer = { id: string; name: string; ready?: boolean; avatar?: string }
type LobbyProps = {
  roomCode?: string // no code yet → the create / join screen; a code → the room
  players?: LobbyPlayer[]; meId?: string; hostId?: string; minPlayers?: number; codeLength?: number
  busy?: boolean; error?: string // busy: creating or joining right now; error: why it didn't work
  name?: string; onNameChange?: (name: string) => void // shows a name box when given
  onCreate: () => void; onJoin: (code: string) => void
  onReady: (ready: boolean) => void; onStart: () => void; onLeave: () => void
  words?: Partial<typeof lobbyWords>
}

export function Lobby(props: LobbyProps) {
  const w = { ...lobbyWords, ...props.words }
  return (
    <Screen label={w.title}>
      <Panel depth={2} gap="m" className="kit-modal">
        {props.roomCode ? <Room {...props} w={w} roomCode={props.roomCode} /> : <JoinOrCreate {...props} w={w} />}
      </Panel>
    </Screen>
  )
}

function JoinOrCreate({ w, busy, error, name, onNameChange, onCreate, onJoin, codeLength = 4 }: LobbyProps & { w: typeof lobbyWords }) {
  const [code, setCode] = useState('')
  return (
    <>
      <Text kind="title">{w.title}</Text>
      {onNameChange && <TextInput label={w.name} value={name ?? ''} onChange={(e) => onNameChange(e.target.value)} />}
      <Button loading={busy} onClick={onCreate}>{w.create}</Button>
      <Text kind="caption">{w.or}</Text>
      <Row gap="s">
        <RoomCodeInput length={codeLength} value={code} onChange={setCode} />
        <Button variant="secondary" disabled={busy || code.length < codeLength} onClick={() => onJoin(code)}>{w.join}</Button>
      </Row>
      {error && <Text kind="caption"><span className="kit-error">{error}</span></Text>}
    </>
  )
}

function Room({ w, roomCode, players = [], meId, hostId, minPlayers = 2, onReady, onStart, onLeave }: LobbyProps & { w: typeof lobbyWords; roomCode: string }) {
  const me = players.find((p) => p.id === meId)
  const iAmHost = meId !== undefined && meId === hostId
  const enough = players.length >= minPlayers
  const allReady = players.every((p) => p.ready || p.id === hostId) // the host starts, so needn't press Ready
  const waiting = !enough ? fill(w.needPlayers, { n: minPlayers }) : !allReady ? w.waitingReady : !iAmHost ? w.waitingHost : ''
  return (
    <>
      <Stack gap="xs">
        <Text kind="title">{fill(w.room, { code: roomCode })}</Text>
        <Text kind="caption">{w.share}</Text>
      </Stack>
      <ScrollArea label={w.title} max="m">
        {players.map((p) => (
          <ListRow key={p.id} label={
            <Row gap="s" className="kit-nowrap">
              <Avatar name={p.name} src={p.avatar} active={p.id === meId} />
              <Row gap="xs" className="kit-result-name"><Text kind="label">{p.name}</Text>{p.id === hostId && <Badge>{w.host}</Badge>}</Row>
            </Row>
          }>
            {p.id !== hostId && <Badge variant={p.ready ? 'primary' : 'neutral'}>{p.ready ? `✓ ${w.ready}` : w.notReady}</Badge>}
          </ListRow>
        ))}
      </ScrollArea>
      {waiting && <Text kind="caption">{waiting}</Text>}
      <Row gap="s" justify="between">
        <Button variant="ghost" onClick={onLeave}>{w.leave}</Button>
        {iAmHost
          ? <Button disabled={!enough || !allReady} onClick={onStart}>{w.start}</Button>
          : <Button variant={me?.ready ? 'secondary' : 'primary'} onClick={() => onReady(!me?.ready)}>{me?.ready ? w.notYet : w.imReady}</Button>}
      </Row>
    </>
  )
}

// RECONNECTING — a dialog while the connection comes back; with failed, an error and what to do.
export const reconnectWords = {
  title: 'Reconnecting…', message: 'Hold on, getting you back into the game.',
  failedTitle: 'Can’t connect', failedMessage: 'Check your internet connection and try again.', retry: 'Try again', quit: 'Quit',
}
type ReconnectProps = { failed?: boolean; message?: string; onRetry?: () => void; onQuit?: () => void; words?: Partial<typeof reconnectWords> }
export function Reconnecting({ failed, message, onRetry, onQuit, words }: ReconnectProps) {
  const w = { ...reconnectWords, ...words }
  return (
    <Modal title={failed ? w.failedTitle : w.title} actions={<>
      {onQuit && <Button variant="secondary" onClick={onQuit}>{w.quit}</Button>}
      {failed && onRetry && <Button onClick={onRetry}>{w.retry}</Button>}
    </>}>
      <Row gap="m" className="kit-nowrap">
        {!failed && <Spinner label={w.title} />}
        <Text>{message ?? (failed ? w.failedMessage : w.message)}</Text>
      </Row>
    </Modal>
  )
}
