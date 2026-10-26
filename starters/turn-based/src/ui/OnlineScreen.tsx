// ONLINE PLAY — the rooms module (src/rooms): make a room, share its 4-letter code, a friend joins, the host starts.
// The server (party/) owns the game; this screen only shows the view it sends and sends your taps. Emotes go through
// the room. Leave always goes through online.leave() (a closed tab keeps the seat: "Rejoin match" on the main menu).
import { useEffect, useState } from 'react'
import text from '../../content/text/en.json'
import { Hud, HudText, Lobby, Reconnecting, Results, fill, rejoinWords, screens, toast, welcomeBackLine } from './kit'
import { useRoom } from '../rooms/useRoom'
import { cleanRoomCode, makeRoomCode } from '../rooms/roomCodes'
import { getPlayerName, setPlayerName } from '../rooms/identity'
import { EmoteSeats } from '../emotes/ui/EmoteLayer'
import { playSound } from '../audio'
import { emotes } from '../game/table'
import { setOnline } from '../game/online'
import type { Action, Event, Options, View } from '../../party/rules'
import { Board } from './Board'

/** Where the online screen starts: a fresh lobby, or straight back into a room (Rejoin match / a reload). */
export type OnlineStart = { code: string | null; rejoin: boolean }

export function OnlineScreen({ start, onClose }: { start: OnlineStart; onClose: () => void }) {
  const [code, setCode] = useState<string | null>(start.code)
  const [creating, setCreating] = useState(false)
  const [rejoining] = useState(start.rejoin)
  const [name, setName] = useState(() => getPlayerName() || text.online.defaultName)
  const [joinError, setJoinError] = useState('')
  const online = useRoom<View, Action, Options, Event>(code, { name, create: creating, rejoin: rejoining }, {
    onEvent: playEventSound,
    onEmote: (message) => emotes.receive(message),
  })

  const leave = () => { online.leave(); setCode(null); onClose() }

  // While this screen is up the game is online: emotes go through the room, the Dev Kit's restore + pause are off
  const mySeatId = online.mySeat?.id ?? null
  useEffect(() => {
    setOnline(() => { online.leave(); onClose() })
    emotes.setSend((_seat, id) => online.sendEmote(id))
    return () => { setOnline(null); emotes.setSend(undefined) }
  }, [online, onClose])
  useEffect(() => {
    emotes.setMine(mySeatId ? [mySeatId] : [])
    emotes.setMatch(code ?? '')
  }, [mySeatId, code])

  // Joined a friend's room: say we're ready (this game has no Ready button — Start only waits for two players)
  const phase = online.room?.phase
  const isHost = online.isHost
  const ready = online.mySeat?.ready
  useEffect(() => {
    if (phase === 'lobby' && !isHost && mySeatId && ready === false) online.setReady(true)
  }, [phase, isHost, mySeatId, ready, online])

  // A new room's code already in use (rare) → try another; a match that ended while away → back to the menu
  const [retried, setRetried] = useState<string | null>(null)
  if (online.closedReason === 'code_taken' && code && retried !== code) {
    setRetried(code)
    setCode(makeRoomCode())
  }
  useEffect(() => {
    if (online.matchEnded) { toast(rejoinWords.ended); onClose() }
  }, [online.matchEnded, onClose])
  useEffect(() => {
    if (online.cameBack) { toast(welcomeBackLine(online.cameBack.botTurns)); online.clearCameBack() }
  }, [online])
  useEffect(() => {
    if (online.error) { toast(online.error.message); online.clearError() }
  }, [online])

  if (code && online.status === 'connecting' && rejoining) {
    return <Reconnecting words={{ title: rejoinWords.joiningTitle }} message={rejoinWords.joining} onQuit={leave} />
  }

  const view = online.view
  if (!code || phase === 'lobby' || !view || !online.room) {
    return (
      <Lobby
        roomCode={online.room?.code}
        players={(online.room?.seats ?? []).map((seat) => ({ id: seat.id, name: seat.name, ready: seat.ready }))}
        meId={mySeatId ?? undefined}
        hostId={online.room?.seats.find((seat) => seat.isHost)?.id}
        minPlayers={online.room?.minSeats ?? 2}
        busy={!!code && !online.room && online.status !== 'closed'}
        error={joinError || (online.status === 'closed' && online.closedReason ? closedWords(online.closedReason) : undefined)}
        name={name}
        onNameChange={(next) => { setName(next); setPlayerName(next) }}
        onCreate={() => { setJoinError(''); setCreating(true); setCode(makeRoomCode()) }}
        onJoin={(typed) => {
          const clean = cleanRoomCode(typed)
          if (!clean) return setJoinError(text.online.badCode)
          setJoinError('')
          setCreating(false)
          setCode(clean)
        }}
        onStart={() => online.start({})}
        onLeave={leave}
        onBack={onClose}
      />
    )
  }

  const { game, order, mySeat } = view
  const seats = order.map((seatId) => {
    const seat = online.room!.seats.find((s) => s.id === seatId)
    return { id: seatId, name: seatId === mySeatId ? text.table.you : seat?.name ?? text.online.opponent }
  })
  const theirName = seats.find((s) => s.id !== mySeatId)?.name ?? text.online.opponent
  const myTurn = !game.over && mySeat === game.turn
  const status = game.over ? text.table.over : myTurn ? text.table.yourTurn : fill(text.table.waiting, { name: theirName })
  const resultTitle = game.winner === null ? text.results.draw : game.winner === mySeat ? text.results.win : fill(text.results.lose, { name: theirName })

  return (
    <>
      <Hud
        status={<HudText pop>{status}</HudText>}
        onPause={() => screens.push('pause')}
        words={{ pause: text.table.pause }}
        banner={<Board board={game.board} winLine={game.winLine} canPlay={myTurn} onPlay={(cell) => { online.active(); online.send({ cell }) }} />}
        actions={<EmoteSeats emotes={emotes} seats={seats} mine={mySeatId ?? []} activeId={game.over ? undefined : order[game.turn]} avoid=".kit-hud-slot" />}
      />
      {phase === 'over' && (
        <Results
          dim
          title={resultTitle}
          meId={mySeatId ?? undefined}
          players={seats.map((s, mark) => ({ id: s.id, name: s.name, score: game.winner === mark ? 1 : 0 }))}
          words={{ rematch: text.online.rematch, quit: text.online.leave, points: text.results.points, winner: text.results.winner, you: text.results.you }}
          onRematch={online.isHost ? () => online.start({}) : undefined}
          onQuit={leave}
        />
      )}
    </>
  )
}

/** Why the room shut you out, in the game's words (content/text/en.json online.closed). */
function closedWords(reason: string): string {
  const words = text.online.closed as Record<string, string | undefined>
  return words[reason] ?? words.other ?? ''
}

function playEventSound(event: Event) {
  if (event.type === 'placed') playSound(event.seat === 0 ? 'mark.x' : 'mark.o')
  if (event.type === 'draw') playSound('game.draw')
}
