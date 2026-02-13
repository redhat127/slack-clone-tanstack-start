import { auth } from '@/lib/auth'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
app.use(express.json())

const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})

io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie
    if (!cookie) return next(new Error('Unauthorized'))

    const result = await auth.api.getSession({
      headers: new Headers({ cookie }),
    })

    if (!result?.user) return next(new Error('Unauthorized'))

    socket.data.userId = result.user.id
    socket.data.user = result.user
    next()
  } catch (e) {
    console.error('❌ middleware error:', e)
    next(new Error('Unauthorized'))
  }
})

const userSockets = new Map<string, string>() // userId -> socketId

io.on('connection', (socket) => {
  console.log(`✅ connected: ${socket.data.user.name} (${socket.id})`)

  userSockets.set(socket.data.userId, socket.id)

  socket.on('channel:join', (channelId: string) => {
    socket.join(`channel:${channelId}`)
    console.log(`${socket.data.user.name} joined channel:${channelId}`)
    console.log(
      `👥 room size:`,
      io.sockets.adapter.rooms.get(`channel:${channelId}`)?.size,
    )
  })

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`)
  })

  socket.on('disconnect', () => {
    userSockets.delete(socket.data.userId)
    console.log(`❌ disconnected: ${socket.data.user.name}`)
  })
})

app.post('/emit', (req, res) => {
  const secret = req.headers['x-internal-secret']
  if (secret !== (process.env.SOCKET_SECRET ?? 'secret')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { channelId, event, data, excludeUserId } = req.body

  const excludeSocketId = excludeUserId
    ? userSockets.get(excludeUserId)
    : undefined

  if (excludeSocketId) {
    io.to(`channel:${channelId}`).except(excludeSocketId).emit(event, data)
  } else {
    io.to(`channel:${channelId}`).emit(event, data)
  }

  res.json({ ok: true })
})

const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? 3001)
httpServer.listen(SOCKET_PORT, () => {
  console.log(`🚀 socket server running on port ${SOCKET_PORT}`)
})
