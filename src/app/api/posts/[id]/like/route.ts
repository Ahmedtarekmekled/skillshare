import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Post from '@/models/Post'
import { connectToDatabase } from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Convert IDs to ObjectId
    const postId = new mongoose.Types.ObjectId(params.id)
    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Find the post
    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Initialize likes array if undefined
    if (!post.likes) {
      post.likes = []
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString())

    if (!alreadyLiked) {
      // Add the like
      post.likes.push(userId)
    } else {
      // Remove the like
      post.likes = post.likes.filter(id => id.toString() !== userId.toString())
    }

    // Save the post
    await post.save()

    // Get updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('author')
      .populate('skill')

    return NextResponse.json({
      success: true,
      postId: updatedPost._id,
      likes: updatedPost.likes
    })

  } catch (error) {
    console.error('Error updating likes:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update post likes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
