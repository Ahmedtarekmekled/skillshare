'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Compass, PlusCircle, MessageCircle, Settings, LogOut } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[60%] bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-4">
      <div className="flex justify-around items-center">
        {session ? (
          // Authenticated navigation
          <>
            <Link href="/explore" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Compass className="w-6 h-6" />
              <span className="text-sm">Explore</span>
            </Link>

            <Link href="/posts" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <PlusCircle className="w-6 h-6" />
              <span className="text-sm">Posts</span>
            </Link>

            <Link href="/messages" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">Messages</span>
            </Link>

            <Link href="/settings" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Settings className="w-6 h-6" />
              <span className="text-sm">Settings</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-sm">Sign Out</span>
            </button>
          </>
        ) : (
          // Unauthenticated navigation
          <Link href="/auth/signin" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
            <PlusCircle className="w-6 h-6" />
            <span className="text-sm">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
