'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User } from 'next-auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from '@/app/profile/actions'

type ExtendedUser = User & {
  role?: string
  isVerified?: boolean
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user) {
      const user = session.user as ExtendedUser
      setName(user.name || '')
      setEmail(user.email || '')
      setImage(user.image || '')
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await updateProfile({ name, email, image })
      if (result.success) {
        setMessage('Profile updated successfully')
        await update({ name, email, image })
      } else {
        setMessage(result.error || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile')
    }
  }

  if (!session) {
    return <div className="text-center mt-8">Please sign in to view your profile.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Your Atracure Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback>{name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                name="image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Update Profile
            </Button>
          </form>
          {message && (
            <p className={`mt-4 text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
