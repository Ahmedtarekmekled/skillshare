import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Post from '@/models/Post'
import { connectToDatabase } from '@/lib/mongodb'

export async function DELETE(
  req: NextRequest,
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

    // Check if the user is the author of the post
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
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

export async function PATCH(
  req: NextRequest,
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

    // Check if the user is the author of the post
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this post' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const skillId = formData.get('skillId') as string
    const image = formData.get('image') as File | null

    // TODO: Handle image upload to cloud storage
    const imageUrl = image ? '/placeholder-image.jpg' : undefined

    const updatedPost = await Post.findByIdAndUpdate(
      params.id,
      {
        title: title || post.title,
        content: content || post.content,
        skill: skillId || post.skill,
        ...(imageUrl && { $push: { images: imageUrl } }),
      },
      { new: true }
    )
      .populate('author', 'name image')
      .populate('skill', 'name')
      .exec()

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
