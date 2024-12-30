'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Edit2, Trash2, PlusCircle } from 'lucide-react'
import Image from 'next/image'
import Chat from '@/components/chat'

interface Skill {
  _id: string
  name: string
}

interface Post {
  _id: string
  title: string
  content: string
  images: string[]
  author: {
    _id: string
    name: string
    image: string
  }
  skill: {
    _id: string
    name: string
  }
  likes: number
  createdAt: string
}

export default function PostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  // Create post form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch('/api/skills')
        if (!response.ok) throw new Error('Failed to fetch skills')
        const data = await response.json()
        setSkills(data)
      } catch (err) {
        console.error('Error fetching skills:', err)
        setError('Failed to load skills')
      }
    }

    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts')
        if (!response.ok) throw new Error('Failed to fetch posts')
        const data = await response.json()
        setPosts(data)
      } catch (err) {
        console.error('Error fetching posts:', err)
        setError('Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
    fetchPosts()
  }, [])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('skillId', selectedSkill)
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to create post')
      }

      const newPost = await response.json()
      setPosts(prev => [newPost, ...prev])
      setShowCreateModal(false)
      
      // Reset form
      setTitle('')
      setContent('')
      setSelectedSkill('')
      setSelectedImage(null)
    } catch (err: any) {
      console.error('Error creating post:', err)
      setError(err.message || 'Failed to create post. Please try again.')
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setPosts(prev => prev.filter(post => post._id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      setError('Failed to delete post. Please try again.')
    }
  }

  const handleMessageAuthor = (authorId: string) => {
    setSelectedUser(authorId)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Community Posts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label htmlFor="skill" className="block text-sm font-medium text-gray-700">
                  Related Skill
                </label>
                <select
                  id="skill"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Image (optional)
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="mt-1 block w-full"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <Image
                  src={post.author.image || `/api/avatar/${post.author._id}`}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{post.author.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {session?.user?.email === post.author._id ? (
                  <>
                    <button
                      onClick={() => {/* TODO: Implement edit */}}
                      className="text-gray-400 hover:text-blue-500"
                      title="Edit post"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete post"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMessageAuthor(post.author._id)}
                    className="text-gray-400 hover:text-blue-500"
                    title="Message author"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.content}</p>
            
            {post.images.length > 0 && (
              <div className="mb-4">
                <Image
                  src={post.images[0]}
                  alt="Post image"
                  width={400}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {post.skill.name}
              </span>
              <span className="text-gray-500 text-sm">{post.likes} likes</span>
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
    </div>
  )
}
