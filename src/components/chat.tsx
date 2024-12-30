'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { io, Socket } from 'socket.io-client'
import { Send, X } from 'lucide-react'

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    image: string
  }
  receiver: {
    _id: string
    name: string
    image: string
  }
  content: string
  createdAt: string
}

interface ChatProps {
  recipientId: string
  onClose: () => void
}

export default function Chat({ recipientId, onClose }: ChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [recipient, setRecipient] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
    setSocket(socketInstance)

    // Join private room
    if (session?.user?.id) {
      socketInstance.emit('join', session.user.id)
    }

    // Listen for new messages
    socketInstance.on('private message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Fetch recipient details
    const fetchRecipient = async () => {
      try {
        const response = await fetch(`/api/users/${recipientId}`)
        if (!response.ok) throw new Error('Failed to fetch recipient')
        const data = await response.json()
        setRecipient(data)
      } catch (error) {
        console.error('Error fetching recipient:', error)
      }
    }

    // Fetch chat history
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?recipientId=${recipientId}`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    if (recipientId) {
      fetchRecipient()
      fetchMessages()
    }
  }, [recipientId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !session?.user?.id) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: recipientId,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const message = await response.json()
      
      // Emit message to recipient
      socket.emit('private message', {
        ...message,
        recipientId,
      })

      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (!recipient) return null

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col">
      {/* Chat header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src={recipient.image || `/api/avatar/${recipient._id}`}
            alt={recipient.name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-semibold">{recipient.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender._id === session?.user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender._id === session?.user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
