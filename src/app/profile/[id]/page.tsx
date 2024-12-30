'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import Chat from '@/components/chat'

interface User {
  _id: string
  name: string
  email: string
  image: string
  bio?: string
  skills: Array<{
    _id: string
    name: string
  }>
}

interface Post {
  _id: string
  title: string
  description: string
  createdAt: string
  author: {
    _id: string
    name: string
    image: string
  }
  skill: {
    _id: string
    name: string
  }
  likes: string[]
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [userRes, postsRes] = await Promise.all([
          fetch(`/api/users/${params.id}`),
          fetch(`/api/users/${params.id}/posts`)
        ])

        if (!userRes.ok || !postsRes.ok) {
          throw new Error('Failed to fetch user data')
        }

        const [userData, postsData] = await Promise.all([
          userRes.json(),
          postsRes.json()
        ])

        setUser(userData)
        setPosts(postsData)
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'User not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src={user.image || `/api/avatar/${user._id}`}
              alt={user.name}
              width={100}
              height={100}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.bio && <p className="mt-2 text-gray-700">{user.bio}</p>}
            </div>
          </div>
          {session?.user?.id !== user._id && (
            <button
              onClick={() => setShowChat(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Message
            </button>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span
                key={skill._id}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Posts</h2>
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-700 mb-4">{post.description}</p>
              <div className="flex justify-between items-center">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {post.skill.name}
                </span>
                <span className="text-gray-500 text-sm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
            <Chat
              recipientId={user._id}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
