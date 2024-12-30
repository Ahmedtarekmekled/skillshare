'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { io } from 'socket.io-client'
import { MessageCircle, Heart, Edit, Trash, Plus } from 'lucide-react'

interface Skill {
  _id: string
  name: string
}

interface Post {
  _id: string
  title: string
  description: string
  author: {
    _id: string
    name: string
    image: string
  }
  skill: Skill
  likes: string[]
  createdAt: string
}

export default function PostsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSkill, setEditSkill] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      path: '/api/socket',
      transports: ['polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    })

    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to socket server')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    newSocket.on('postLiked', ({ postId, userId, likes }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, likes } : post
        )
      )
    })

    newSocket.on('postDeleted', (postId) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId))
    })

    newSocket.on('postUpdated', (updatedPost) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === updatedPost._id ? updatedPost : post
        )
      )
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, skillsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/skills')
        ])
        
        if (!postsRes.ok || !skillsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [postsData, skillsData] = await Promise.all([
          postsRes.json(),
          skillsRes.json()
        ])

        setPosts(postsData)
        setSkills(skillsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const formData = new FormData()
      formData.append('title', newTitle)
      formData.append('description', newDescription)
      formData.append('skillId', selectedSkill)

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const newPost = await response.json()
      setPosts(prev => [newPost, ...prev])
      setShowCreateModal(false)
      setNewTitle('')
      setNewDescription('')
      setSelectedSkill('')
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Failed to create post')
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) throw new Error('Failed to like post')
      
      const data = await response.json()
      if (socket) {
        socket.emit('postLiked', data)
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete post')
    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Failed to delete post')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          skillId: editSkill,
        }),
      })

      if (!response.ok) throw new Error('Failed to update post')
      
      setEditingPost(null)
    } catch (error) {
      console.error('Error updating post:', error)
      setError('Failed to update post')
    }
  }

  const handleMessageClick = (userId: string) => {
    router.push(`/chat`)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Post
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post._id} className="bg-white p-6 rounded-lg shadow-md mb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Image
                  src={post.author.image || '/images/unknown.png'}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{post.author.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {session?.user?.id === post.author._id && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingPost(post)
                      setEditTitle(post.title)
                      setEditDescription(post.description)
                      setEditSkill(post.skill._id)
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              )}
              {session?.user?.id !== post.author._id && (
                <button
                  onClick={() => handleMessageClick(post.author._id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.description}</p>
            <div className="flex justify-between items-center">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {post.skill.name}
              </span>
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center space-x-1 ${
                  Array.isArray(post.likes) && post.likes.includes(session?.user?.id || '') 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}
              >
                <Heart className={`h-5 w-5 ${
                  Array.isArray(post.likes) && post.likes.includes(session?.user?.id || '') 
                    ? 'fill-current' 
                    : ''
                }`} />
                <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Skill</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a skill</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Post</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Skill</label>
                <select
                  value={editSkill}
                  onChange={(e) => setEditSkill(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg h-[80vh] flex flex-col">
            {/* <Chat
              recipientId={selectedUser}
              onClose={() => setSelectedUser(null)}
            /> */}
          </div>
        </div>
      )}
    </div>
  )
}
