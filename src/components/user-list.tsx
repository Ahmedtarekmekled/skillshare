'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

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
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        // Filter out the current user
        const filteredUsers = data.filter(user => user._id !== session?.user?.id)
        setUsers(filteredUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading users')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [session?.user?.id])

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

  const handleMessageClick = (userId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      // Redirect to sign in if not authenticated
      router.push('/auth/signin')
      return
    }
    router.push(`/messages?userId=${userId}`)
  }

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-gray-500 text-center">No users found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Image
                  src={user.image || '/images/unknown.png'}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
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
              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => handleMessageClick(user._id, e)}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
