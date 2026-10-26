// ONLINE OR NOT — set by the online screen while a room is open. The Dev Kit's restore and pause are off online
// (the room's server owns the truth), and emotes then go through the room.
let online = false

export const isOnline = () => online
export const setOnline = (on: boolean) => { online = on }
