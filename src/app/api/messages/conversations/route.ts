import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Message from '@/models/Message'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get all conversations where the user is either sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: session.user.id },
            { receiver: session.user.id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', session.user.id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessage.sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'lastMessage.receiver'
        }
      },
      {
        $unwind: '$lastMessage.sender'
      },
      {
        $unwind: '$lastMessage.receiver'
      },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          image: '$user.image',
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            read: '$lastMessage.read',
            createdAt: '$lastMessage.createdAt',
            sender: {
              _id: '$lastMessage.sender._id',
              name: '$lastMessage.sender.name',
              image: '$lastMessage.sender.image'
            },
            receiver: {
              _id: '$lastMessage.receiver._id',
              name: '$lastMessage.receiver.name',
              image: '$lastMessage.receiver.image'
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ])

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
