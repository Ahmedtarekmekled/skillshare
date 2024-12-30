import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    await connectToDatabase()
    
    const users = await User.find({})
      .select('-password')
      .populate('skillsToShare')
      .populate('skillsToLearn')
      .lean()
      .exec()

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const user = await User.create(body)
    
    const userWithoutPassword = user.toObject()
    delete userWithoutPassword.password
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
