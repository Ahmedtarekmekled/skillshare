'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement settings update
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Account Settings</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={4}
              placeholder="Tell us about yourself"
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
              Skills (comma separated)
            </label>
            <input
              type="text"
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="React, Node.js, Python"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">Account</h2>
            <div className="flex flex-col space-y-4">
              <button
                type="button"
                className="text-left text-blue-600 hover:text-blue-700"
              >
                Change Password
              </button>
              <button
                type="button"
                className="text-left text-blue-600 hover:text-blue-700"
              >
                Email Preferences
              </button>
              <button
                type="button"
                className="text-left text-red-600 hover:text-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
