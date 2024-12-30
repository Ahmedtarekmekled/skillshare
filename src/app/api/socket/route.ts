import { NextRequest } from 'next/server'
import { Server as ServerIO } from 'socket.io'
import { createServer } from 'http'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

let io: ServerIO | null = null

if (!io) {
  const httpServer = createServer()
  io = new ServerIO(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['polling'],
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectTimeout: 45000,
    pingTimeout: 30000,
  })

  io.on('connection', (socket) => {
    console.log('Client connected')

    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })

    socket.on('message', (data) => {
      io.emit('message', data)
    })

    socket.on('postLiked', (data) => {
      io.emit('postLiked', data)
    })

    socket.on('postDeleted', (data) => {
      io.emit('postDeleted', data)
    })

    socket.on('postUpdated', (data) => {
      io.emit('postUpdated', data)
    })
  })
}

export async function GET(req: NextRequest) {
  if (!io) {
    return new Response('Socket.io server not initialized', { status: 500 })
  }

  if (req.headers.get('upgrade') === 'websocket') {
    return new Response(null, { status: 101 })
  }

  return new Response(null, { status: 200 })
}
