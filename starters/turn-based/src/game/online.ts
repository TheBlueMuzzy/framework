// ONLINE OR NOT — set by the online screen while a room is open. The Dev Kit's restore and pause are off online
// (the room's server owns the truth), and Pause → Leave game leaves the room instead of the local match.
let online = false
let leave: () => void = () => {}

export const isOnline = () => online
/** The online screen opens (with how to leave its room) or closes (null). */
export function setOnline(leaveRoom: (() => void) | null) {
  online = leaveRoom !== null
  leave = leaveRoom ?? (() => {})
}
export const leaveOnline = () => leave()
