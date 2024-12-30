'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Chat from '@/components/chat'

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
  read: boolean
  createdAt: string
}

interface User {
  _id: string
  name: string
  image: string
  lastMessage?: Message
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/messages/conversations')
        if (!response.ok) throw new Error('Failed to fetch conversations')
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchUsers()
    }
  }, [session])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-md animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user._id)}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <Image
                src={user.image || `/api/avatar/${user._id}`}
                alt={user.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{user.name}</h3>
                {user.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {user.lastMessage.content}
                  </p>
                )}
              </div>
              {user.lastMessage && !user.lastMessage.read && user.lastMessage.receiver._id === session?.user?.id && (
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No conversations yet. Start chatting with someone!
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-xl overflow-hidden">
            <Chat
              recipientId={selectedUser}
              onClose={() => setSelectedUser(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
