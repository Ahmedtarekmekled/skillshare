import { NextRequest } from 'next/server'
import { Server as ServerIO } from 'socket.io'
import { createServer } from 'http'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

let io: ServerIO | null = null
let httpServer: any = null

if (!io) {
  httpServer = createServer()
  io = new ServerIO(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling'],
    connectTimeout: 45000,
    pingTimeout: 30000,
  })

  io.on('connection', (socket) => {
    console.log('Client connected')

    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socket.on('postCreated', (data) => {
      io.emit('postCreated', data)
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

    socket.on('message', (data) => {
      io.emit('message', data)
    })
  })

  const port = parseInt(process.env.SOCKET_PORT || '3001', 10)
  httpServer.listen(port, () => {
    console.log(`Socket.IO server running on port ${port}`)
  })
}

export async function GET(req: NextRequest) {
  if (!io) {
    return new Response('Socket.io server not initialized', { status: 500 })
  }

  return new Response(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  if (!io) {
    return new Response('Socket.io server not initialized', { status: 500 })
  }

  try {
    const data = await req.json()
    io.emit(data.event, data.payload)
    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Socket emit error:', error)
    return new Response('Failed to emit event', { status: 500 })
  }
}
