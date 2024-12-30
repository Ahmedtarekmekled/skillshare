import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Post from '@/models/Post'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    await connectToDatabase()
    const posts = await Post.find()
      .populate('author', 'name image')
      .populate('skill', 'name')
      .sort({ createdAt: -1 })
      .exec()

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const formData = await req.formData()
    
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const skillId = formData.get('skillId') as string
    const image = formData.get('image') as File | null

    if (!title || !content || !skillId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Handle image upload to cloud storage
    const imageUrl = image ? '/placeholder-image.jpg' : undefined

    const post = await Post.create({
      title,
      content,
      author: session.user.id,
      skill: skillId,
      images: imageUrl ? [imageUrl] : [],
    })

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name image')
      .populate('skill', 'name')
      .exec()

    return NextResponse.json(populatedPost)
  } catch (error: any) {
    console.error('Error creating post:', error)
    
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    )
  }
}
