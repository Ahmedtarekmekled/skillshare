import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Post from '@/models/Post'
import { connectToDatabase } from '@/lib/mongodb'
import { Server } from 'socket.io'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const post = await Post.findById(params.id)
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await post.deleteOne()

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await request.json()
    const post = await Post.findById(params.id)

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updatedPost = await Post.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    )
      .populate('author', 'name image')
      .populate('skill', 'name')

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const post = await Post.findById(params.id)
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const userId = session.user.id
    const likeIndex = post.likes.indexOf(userId)

    if (likeIndex === -1) {
      post.likes.push(userId)
    } else {
      post.likes.splice(likeIndex, 1)
    }

    await post.save()

    // Emit socket event
    const io = new Server()
    io.emit('postLiked', {
      postId: params.id,
      userId,
      likes: post.likes
    })

    return NextResponse.json({ likes: post.likes })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    )
  }
}
