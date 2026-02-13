import { io, type Socket } from 'socket.io-client'

const socket: Socket = io(
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001',
  {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'], // fallback to polling if websocket fails
  },
)

export const useSocket = () => socket

export const disconnectSocket = () => socket.disconnect()
