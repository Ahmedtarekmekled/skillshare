'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import Chat from './chat'

interface Skill {
  _id: string
  name: string
}

interface User {
  _id: string
  name: string
  email: string
  image?: string
  bio?: string
  skillsToShare: Skill[]
  skillsToLearn: Skill[]
}

interface UserListProps {
  searchQuery?: string
}

export function UserList({ searchQuery = '' }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users')
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received')
        }
        setUsers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading users')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    const nameMatch = user.name.toLowerCase().includes(query)
    const skillsMatch = [
      ...(user.skillsToShare || []),
      ...(user.skillsToLearn || [])
    ].some(skill => skill.name.toLowerCase().includes(query))
    
    return nameMatch || skillsMatch
  })

  const handleMessageClick = (userId: string) => {
    console.log('Opening chat with user:', userId)
    setSelectedUser(userId)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No users found matching your search criteria.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Image
                  src={user.image || `/api/avatar/${user._id}`}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <Link 
                    href={`/profile/${user._id}`}
                    className="text-lg font-semibold hover:text-blue-600"
                  >
                    {user.name}
                  </Link>
                  <p className="text-sm text-gray-500">{user.bio ? user.bio.slice(0, 60) + '...' : 'No bio available'}</p>
                </div>
              </div>
              <button
                onClick={() => handleMessageClick(user._id)}
                className="text-gray-400 hover:text-blue-500 transition-colors"
                title="Send message"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Skills to Share</h4>
                <div className="flex flex-wrap gap-2">
                  {(user.skillsToShare || []).map((skill) => (
                    <span
                      key={`${user._id}-share-${skill._id}`}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Looking to Learn</h4>
                <div className="flex flex-wrap gap-2">
                  {(user.skillsToLearn || []).map((skill) => (
                    <span
                      key={`${user._id}-learn-${skill._id}`}
                      className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedUser && (
        <Chat
          recipientId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  )
}
